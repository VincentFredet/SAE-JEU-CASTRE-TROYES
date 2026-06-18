import {
  MATCH_STATUS,
  type CreateMatchPayload,
  type GamePlayer,
  type ReliquesView,
  type MatchState,
  type MatchSummary,
} from "@jeux/shared";
import { applyAction, createGame, reliquesActionSchema, type GameState } from "@jeux/shared/reliques";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function viewFor(matchId: string, g: GameState, seat: number, players: GamePlayer[]): ReliquesView {
  const me = g.players[seat]!;
  return {
    matchId,
    you: seat,
    team: me.team,
    tile: me.tile,
    notes: me.notes,
    players: g.players.map((p, i) => {
      const meta = players.find((pl) => pl.seat === i);
      return { seat: i, tile: p.tile, name: meta?.username ?? `Joueur ${i + 1}`, connected: meta?.connected ?? false };
    }),
    turn: g.turn,
    current: g.current,
    phase: g.phase,
    claimBy: g.claim?.by ?? null,
    youSubmitted: g.claim ? g.claim.subs[seat] !== undefined : false,
    pendingTrade: g.pendingTrade ? { from: g.pendingTrade.from, to: g.pendingTrade.to } : null,
    teamBlocked: g.teamBlockedUntil[me.team] >= g.turn,
    lastClaim: g.lastClaim
      ? { by: g.lastClaim.by, turn: g.lastClaim.turn, someRight: g.players[g.lastClaim.by]!.team === me.team ? g.lastClaim.someRight : null }
      : null,
    winner: g.winner,
    reveal: g.finished ? g.relicLieu : null,
    lies: g.finished ? g.lieLog : null,
  };
}

// Héberge les parties RELIQUES (équipes cachées Soleil/Lune). Le jeu complet (avec
// les secrets) vit côté serveur ; chaque joueur reçoit SA vue privée.
export class ReliquesManager {
  private matches = new Map<string, MatchState>();
  private games = new Map<string, GameState>();

  private newCode(): string {
    let code = "";
    do {
      code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
    } while (this.matches.has(code));
    return code;
  }

  list(): MatchSummary[] {
    return [...this.matches.values()]
      .filter((m) => m.status === MATCH_STATUS.Lobby)
      .map((m) => ({ id: m.id, name: m.name, status: m.status, playerCount: m.players.length, maxPlayers: m.maxPlayers }));
  }

  get(id: string): MatchState | undefined {
    return this.matches.get(id);
  }

  create(host: { userId: string; username: string }, payload: CreateMatchPayload): MatchState {
    const id = this.newCode();
    const state: MatchState = {
      id,
      name: payload.name,
      status: MATCH_STATUS.Lobby,
      players: [{ userId: host.userId, username: host.username, seat: 0, isHost: true, connected: true }],
      maxPlayers: 6,
      currentTurnSeat: null,
      turn: 0,
      winnerSeat: null,
      updatedAt: Date.now(),
    };
    this.matches.set(id, state);
    return state;
  }

  join(id: string, user: { userId: string; username: string }): MatchState {
    const m = this.require(id);
    const existing = m.players.find((p) => p.userId === user.userId);
    if (existing) {
      existing.connected = true;
      return this.touch(m);
    }
    if (m.status !== MATCH_STATUS.Lobby) throw new Error("La partie a déjà commencé");
    if (m.players.length >= m.maxPlayers) throw new Error("Salon complet (6 max)");
    const taken = new Set(m.players.map((p) => p.seat));
    let seat = 0;
    while (taken.has(seat)) seat += 1;
    m.players.push({ userId: user.userId, username: user.username, seat, isHost: false, connected: true });
    return this.touch(m);
  }

  leave(id: string, userId: string): MatchState | null {
    const m = this.matches.get(id);
    if (!m) return null;
    m.players = m.players.filter((p) => p.userId !== userId);
    if (m.players.length === 0) {
      this.matches.delete(id);
      this.games.delete(id);
      return null;
    }
    if (!m.players.some((p) => p.isHost)) m.players.reduce((a, b) => (a.seat < b.seat ? a : b)).isHost = true;
    return this.touch(m);
  }

  start(id: string, userId: string): MatchState {
    const m = this.require(id);
    if (!m.players.some((p) => p.userId === userId && p.isHost)) throw new Error("Seul l'hôte peut lancer");
    if (m.players.length < 4 || m.players.length % 2 !== 0) throw new Error("Il faut un nombre PAIR de joueurs (4 ou 6)");

    m.players.sort((a, b) => a.seat - b.seat).forEach((p, i) => (p.seat = i));
    const game = createGame({ players: m.players.map((p) => p.userId) });
    this.games.set(id, game);
    m.status = MATCH_STATUS.InProgress;
    m.turn = game.turn;
    m.currentTurnSeat = game.current;
    m.winnerSeat = null;
    return this.touch(m);
  }

  submit(id: string, userId: string, action: unknown): MatchState {
    const m = this.require(id);
    const game = this.games.get(id);
    if (m.status !== MATCH_STATUS.InProgress || !game) throw new Error("La partie n'est pas en cours");
    const player = m.players.find((p) => p.userId === userId);
    if (!player) throw new Error("Vous ne participez pas à cette partie");
    const parsed = reliquesActionSchema.safeParse(action);
    if (!parsed.success) throw new Error("Action invalide");

    const res = applyAction(game, player.seat, parsed.data);
    if (res.state === game && res.events.some((e) => e.type === "blocked")) {
      const reason = res.events.find((e) => e.type === "blocked");
      throw new Error(reason && reason.type === "blocked" ? this.reasonText(reason.reason) : "Coup impossible");
    }
    this.games.set(id, res.state);
    m.turn = res.state.turn;
    m.currentTurnSeat = res.state.current;
    if (res.state.finished) {
      m.status = MATCH_STATUS.Finished;
    }
    return this.touch(m);
  }

  // Vues privées par utilisateur (à émettre à chacun individuellement).
  views(id: string): { userId: string; view: ReliquesView }[] {
    const m = this.matches.get(id);
    const game = this.games.get(id);
    if (!m || !game) return [];
    return m.players.map((p) => ({ userId: p.userId, view: viewFor(id, game, p.seat, m.players) }));
  }

  winner(id: string): "soleil" | "lune" | null {
    return this.games.get(id)?.winner ?? null;
  }

  // userIds des joueurs du camp gagnant (pour le classement). Vide si pas de gagnant.
  winningUserIds(id: string): string[] {
    const g = this.games.get(id);
    if (!g || !g.winner) return [];
    return g.players.filter((p) => p.team === g.winner).map((p) => p.id);
  }

  // Tous les userIds ayant pris part à la partie (parties jouées au classement).
  participantUserIds(id: string): string[] {
    const g = this.games.get(id);
    return g ? g.players.map((p) => p.id) : [];
  }

  setConnected(userId: string, connected: boolean): MatchState[] {
    const affected: MatchState[] = [];
    for (const m of this.matches.values()) {
      const p = m.players.find((pl) => pl.userId === userId);
      if (p && p.connected !== connected) {
        p.connected = connected;
        affected.push(this.touch(m));
      }
    }
    return affected;
  }

  sweep(maxIdleMs: number, now = Date.now()): string[] {
    const removed: string[] = [];
    for (const [id, m] of this.matches) {
      if (m.players.every((p) => !p.connected) && now - m.updatedAt > maxIdleMs) {
        this.matches.delete(id);
        this.games.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  private reasonText(reason: string): string {
    const map: Record<string, string> = {
      "not your turn": "Ce n'est pas votre tour",
      "not adjacent": "Lieu trop loin",
      "ancien not here": "Cet ancien n'est pas ici",
      "no such clue": "Indice introuvable",
      "no one here to trade": "Personne ici avec qui échanger",
      "team blocked from claiming": "Ton camp ne peut pas réclamer ce tour",
      "claim in progress": "Réclamation en cours",
      "trade pending": "Échange en cours",
      "only target accepts": "Seul le destinataire peut accepter",
    };
    return map[reason] ?? "Coup impossible";
  }

  private require(id: string): MatchState {
    const m = this.matches.get(id);
    if (!m) throw new Error("Salon introuvable");
    return m;
  }

  private touch(m: MatchState): MatchState {
    m.updatedAt = Date.now();
    return m;
  }
}

import { randomUUID } from "node:crypto";
import {
  MATCH_STATUS,
  type CreateMatchPayload,
  type GameAction,
  type GamePlayer,
  type MatchState,
  type MatchSummary,
} from "@jeux/shared";

// Moteur générique tour par tour, en attendant les vraies règles.
// "end_turn" passe la main, "resign" abandonne.
export class MatchManager {
  private matches = new Map<string, MatchState>();

  list(): MatchSummary[] {
    return [...this.matches.values()]
      .filter((m) => m.status === MATCH_STATUS.Lobby)
      .map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        playerCount: m.players.length,
        maxPlayers: m.maxPlayers,
      }));
  }

  get(id: string): MatchState | undefined {
    return this.matches.get(id);
  }

  create(host: { userId: string; username: string }, payload: CreateMatchPayload): MatchState {
    const id = randomUUID();
    const player: GamePlayer = {
      userId: host.userId,
      username: host.username,
      seat: 0,
      isHost: true,
      connected: true,
    };
    const state: MatchState = {
      id,
      name: payload.name,
      status: MATCH_STATUS.Lobby,
      players: [player],
      maxPlayers: payload.maxPlayers,
      currentTurnSeat: null,
      turn: 0,
      winnerSeat: null,
      board: null,
      updatedAt: Date.now(),
    };
    this.matches.set(id, state);
    return state;
  }

  join(id: string, user: { userId: string; username: string }): MatchState {
    const m = this.require(id);
    if (m.status !== MATCH_STATUS.Lobby) throw new Error("La partie a déjà commencé");

    const existing = m.players.find((p) => p.userId === user.userId);
    if (existing) {
      existing.connected = true;
      return this.touch(m);
    }
    if (m.players.length >= m.maxPlayers) throw new Error("La partie est complète");

    m.players.push({
      userId: user.userId,
      username: user.username,
      seat: this.nextFreeSeat(m),
      isHost: false,
      connected: true,
    });
    return this.touch(m);
  }

  leave(id: string, userId: string): { state: MatchState | null; removed: boolean } {
    const m = this.matches.get(id);
    if (!m) return { state: null, removed: false };

    const leaving = m.players.find((p) => p.userId === userId);
    if (!leaving) return { state: this.touch(m), removed: false };

    m.players = m.players.filter((p) => p.userId !== userId);
    if (m.players.length === 0) {
      this.matches.delete(id);
      return { state: null, removed: true };
    }
    this.ensureHost(m);
    if (m.status === MATCH_STATUS.InProgress) this.handleDropout(m, leaving.seat);
    return { state: this.touch(m), removed: false };
  }

  start(id: string, userId: string): MatchState {
    const m = this.require(id);
    if (!m.players.some((p) => p.userId === userId && p.isHost)) {
      throw new Error("Seul l'hôte peut lancer la partie");
    }
    if (m.players.length < 2) throw new Error("Il faut au moins 2 joueurs");

    m.status = MATCH_STATUS.InProgress;
    m.currentTurnSeat = Math.min(...m.players.map((p) => p.seat));
    m.turn = 1;
    return this.touch(m);
  }

  applyAction(id: string, userId: string, action: GameAction): MatchState {
    const m = this.require(id);
    if (m.status !== MATCH_STATUS.InProgress) throw new Error("La partie n'est pas en cours");

    const player = m.players.find((p) => p.userId === userId);
    if (!player) throw new Error("Vous ne participez pas à cette partie");

    switch (action.type) {
      case "end_turn":
        if (player.seat !== m.currentTurnSeat) throw new Error("Ce n'est pas votre tour");
        m.currentTurnSeat = this.nextSeat(m, player.seat);
        m.turn += 1;
        break;
      case "resign":
        m.players = m.players.filter((p) => p.userId !== userId);
        this.ensureHost(m);
        this.handleDropout(m, player.seat);
        break;
      default:
        throw new Error(`Action inconnue : ${action.type}`);
    }
    return this.touch(m);
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

  // Supprime les lobbies dont tous les joueurs sont déconnectés depuis trop longtemps.
  sweep(maxIdleMs: number, now = Date.now()): string[] {
    const removed: string[] = [];
    for (const [id, m] of this.matches) {
      const allGone = m.players.every((p) => !p.connected);
      if (allGone && now - m.updatedAt > maxIdleMs) {
        this.matches.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  private handleDropout(m: MatchState, leftSeat: number) {
    if (m.players.length === 1) {
      m.status = MATCH_STATUS.Finished;
      m.winnerSeat = m.players[0]!.seat;
      m.currentTurnSeat = null;
      return;
    }
    const seatStillThere = m.players.some((p) => p.seat === m.currentTurnSeat);
    if (m.currentTurnSeat === leftSeat || !seatStillThere) {
      m.currentTurnSeat = this.nextSeat(m, leftSeat);
    }
  }

  private ensureHost(m: MatchState) {
    if (m.players.length > 0 && !m.players.some((p) => p.isHost)) {
      const next = m.players.reduce((a, b) => (a.seat < b.seat ? a : b));
      next.isHost = true;
    }
  }

  private require(id: string): MatchState {
    const m = this.matches.get(id);
    if (!m) throw new Error("Partie introuvable");
    return m;
  }

  private touch(m: MatchState): MatchState {
    m.updatedAt = Date.now();
    return m;
  }

  private nextFreeSeat(m: MatchState): number {
    const taken = new Set(m.players.map((p) => p.seat));
    let seat = 0;
    while (taken.has(seat)) seat += 1;
    return seat;
  }

  private nextSeat(m: MatchState, fromSeat: number): number {
    const seats = m.players.map((p) => p.seat).sort((a, b) => a - b);
    return seats.find((s) => s > fromSeat) ?? seats[0]!;
  }
}

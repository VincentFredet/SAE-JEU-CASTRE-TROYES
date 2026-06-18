// Moteur "RELIQUES" : deux ÉQUIPES CACHÉES (Soleil / Lune) se disputent chacune SA
// relique, cachée dans un des 12 lieux. ~10 ANCIENS dispersés parlent en énigmes : ils
// ne mentent JAMAIS, mais ne révèlent pas de quel camp ils parlent. Trois familles
// d'infos :
//   (1) LIEU        — « la relique dont JE parle n'est PAS dans <lieu> » (rattaché à l'ancien)
//   (2) AFFILIATION — « l'ancien <X> parle de la relique <Soleil/Lune> » (la clé de lecture)
//   (3) IDENTITÉ    — « <joueur A> et <joueur B> sont du même camp / pas »
// Seuls les JOUEURS mentent, en relayant une info de lieu (troc vrai/faux). On gagne par
// une RÉCLAMATION collective à double tranchant. Machine à états pure.

import { z } from "zod";
import {
  LIEUX,
  ANCIENS,
  ANCIEN_TILE,
  START_TILES,
  TERRAINS,
  TYPES,
  LIEU_ATTR,
  attrValue,
  isLieu,
  ancienAtTile,
  areAdjacent,
  type Attr,
  type LieuId,
  type AncienId,
  type TileId,
} from "./map";

export type Team = "soleil" | "lune";
export const TEAMS: Team[] = ["soleil", "lune"];
// Pas de limite de tours : la partie ne se termine que par une réclamation gagnante.
// `turn` reste un simple compteur de manches (pour l'affichage).

// --- Infos (3 familles) ---
// Info de LIEU = un ATTRIBUT vague (jamais le lieu directement) : « la relique dont
// JE parle est / n'est PAS <axis>=<value> » (axis = terrain | type | gardien).
export interface LocFact {
  kind: "loc";
  ancien: AncienId; // de quel ancien vient cette vérité (camp caché derrière lui)
  axis: Attr;
  value: string; // valeur de l'attribut (un terrain / un type / un gardien)
  neg: boolean; // true = « PAS », false = « EST » (rare)
}
export interface AffFact {
  kind: "aff";
  ancien: AncienId;
  relic: Team; // cet ancien parle de cette relique
}
export interface IdFact {
  kind: "id";
  a: number;
  b: number;
  same: boolean; // même équipe ?
}
export type Fact = LocFact | AffFact | IdFact;

export interface Note {
  fact: Fact;
  from: number | AncienId; // siège d'un joueur, ou un ancien
  turn: number;
  debunked?: boolean; // démasqué : une vérité d'ancien l'a contredit → ignoré en déduction
}

export interface LieEntry {
  from: number;
  to: number;
  fact: Fact; // la version FAUSSE transmise (lieu, affiliation ou identité)
  turn: number;
}

// Rôle SECRET d'un ancien pour la partie en cours.
export type AncienRole = "loc" | "aff" | "id";
export interface AncienState {
  id: AncienId;
  role: AncienRole;
  relic?: Team; // pour role "loc" : la relique dont il parle (caché)
  stock: Fact[]; // 1-2 infos en poche (le joueur les récolte en le visitant)
}

export interface PlayerState {
  id: string;
  team: Team;
  tile: TileId;
  notes: Note[]; // infos récoltées (à recouper, et à relayer en troc — vraies ou retournées)
}

export interface GameState {
  players: PlayerState[];
  anciens: AncienState[]; // SECRET (savoir des anciens)
  relicLieu: Record<Team, LieuId>; // SECRET
  lieLog: LieEntry[];
  turn: number;
  current: number;
  phase: "play" | "claim" | "over";
  claim: { by: number; subs: Record<number, LieuId> } | null;
  // Échange réciproque en attente : le proposeur a choisi sa carte (+ vrai/mensonge caché),
  // on attend que le destinataire accepte et donne une carte en retour.
  pendingTrade: { from: number; to: number; fromClue: number; fromLie: boolean } | null;
  teamBlockedUntil: Record<Team, number>;
  // Dernière réclamation RATÉE (pour le retour au joueur) : qui a déclenché, et si quelqu'un
  // de son camp avait juste (« divisé ») ou personne.
  lastClaim: { by: number; someRight: boolean; turn: number } | null;
  winner: Team | null;
  finished: boolean;
}

// --- Génération ---
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function allPairs(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) out.push([a, b]);
  return out;
}

export interface NewGameOptions {
  players: string[]; // ids, nombre PAIR (4 ou 6)
  teams?: Record<string, Team>;
  relicLieu?: Record<Team, LieuId>;
  rng?: () => number;
}

export function createGame(opts: NewGameOptions): GameState {
  const rng = opts.rng ?? Math.random;
  const ids = opts.players;
  const n = ids.length;

  // Équipes moitié/moitié.
  let teamOf: Record<string, Team>;
  if (opts.teams) {
    teamOf = opts.teams;
  } else {
    const order = shuffle(ids, rng);
    teamOf = {};
    order.forEach((id, i) => (teamOf[id] = i < n / 2 ? "soleil" : "lune"));
  }
  const seatTeam = ids.map((id) => teamOf[id]!);

  const relicLieu =
    opts.relicLieu ??
    (() => {
      const s = shuffle([...LIEUX], rng);
      return { soleil: s[0]!, lune: s[1]! };
    })();

  // Rôles des anciens (parmi 15) : 8 lieu / 4 affiliation / 3 identité, tirés au sort.
  // Chaque ancien ne porte que 1-2 infos → l'info est répartie, il faut bouger et troquer.
  const order = shuffle([...ANCIENS], rng);
  const locAnc = order.slice(0, 8);
  const affAnc = order.slice(8, 12);
  const idAnc = order.slice(12, 15);
  const groups: Record<Team, AncienId[]> = { soleil: locAnc.slice(0, 4), lune: locAnc.slice(4, 8) };

  const byId: Record<AncienId, AncienState> = {} as Record<AncienId, AncienState>;
  for (const id of ANCIENS) byId[id] = { id, role: "id", stock: [] };

  // Anciens de LIEU : par relique, 6 infos d'attribut VRAIES (1 terrain positif + 3 terrains
  // éliminés + 2 types éliminés), réparties sur 4 anciens (2,2,1,1). Chacun parle d'UNE
  // relique (caché derrière son affiliation).
  for (const relic of TEAMS) {
    const g = groups[relic];
    const attr = LIEU_ATTR[relicLieu[relic]];
    const facts: LocFact[] = shuffle(
      [
        { kind: "loc" as const, ancien: g[0]!, axis: "terrain" as const, value: attr.terrain, neg: false },
        ...TERRAINS.filter((v) => v !== attr.terrain).map((v) => ({ kind: "loc" as const, ancien: g[0]!, axis: "terrain" as const, value: v, neg: true })),
        ...TYPES.filter((v) => v !== attr.type).map((v) => ({ kind: "loc" as const, ancien: g[0]!, axis: "type" as const, value: v, neg: true })),
      ],
      rng,
    );
    const split: LocFact[][] = [[facts[0]!, facts[1]!], [facts[2]!, facts[3]!], [facts[4]!], [facts[5]!]];
    g.forEach((anc, i) => {
      byId[anc] = { id: anc, role: "loc", relic, stock: split[i]!.map((f) => ({ ...f, ancien: anc })) };
    });
  }

  // Anciens AFFILIATION : révèlent quel ancien-lieu parle de quelle relique. Les 8 sont
  // révélés (les 2 reliques restent solubles), 2 révélations par ancien.
  const reveals: AffFact[] = shuffle(
    locAnc.map((a) => ({ kind: "aff" as const, ancien: a, relic: byId[a].relic! })),
    rng,
  );
  affAnc.forEach((anc, i) => {
    byId[anc] = { id: anc, role: "aff", stock: reveals.slice(i * 2, i * 2 + 2) };
  });

  // Anciens IDENTITÉ : liens vrais entre joueurs. À 4 (2v2), QUE des « pas ensemble » ; à 6,
  // les deux. 4 liens répartis sur 3 anciens (2,1,1).
  const idPairs = allPairs(n).filter(([a, b]) => n > 4 || seatTeam[a] !== seatTeam[b]);
  const idFacts: IdFact[] = shuffle(idPairs, rng)
    .slice(0, 4)
    .map(([a, b]) => ({ kind: "id" as const, a, b, same: seatTeam[a] === seatTeam[b] }));
  const idSplit: IdFact[][] = [idFacts.slice(0, 2), idFacts.slice(2, 3), idFacts.slice(3, 4)];
  idAnc.forEach((anc, i) => {
    byId[anc] = { id: anc, role: "id", stock: idSplit[i] ?? [] };
  });

  const anciens: AncienState[] = ANCIENS.map((id) => byId[id]);

  // Pas de "main" pré-distribuée : on ne troque que ce qu'on a APPRIS (une info de lieu
  // de son carnet, relayée vraie ou retournée).
  const players: PlayerState[] = ids.map((id, i) => ({ id, team: teamOf[id]!, tile: START_TILES[i % START_TILES.length]!, notes: [] }));

  // Départ : chaque joueur connaît déjà UNE affiliation — un ancien de SON camp. Un fil à
  // tirer dès le 1er tour (sinon les infos de lieu restent illisibles tant qu'on n'a pas
  // croisé un ancien d'affiliation).
  for (let i = 0; i < players.length; i++) {
    const relic = players[i]!.team;
    const anc = shuffle([...groups[relic]], rng)[0]!;
    players[i]!.notes.push({ fact: { kind: "aff", ancien: anc, relic }, from: anc, turn: 0 });
  }

  return {
    players,
    anciens,
    relicLieu,
    lieLog: [],
    turn: 1,
    current: 0,
    phase: "play",
    claim: null,
    pendingTrade: null,
    teamBlockedUntil: { soleil: 0, lune: 0 },
    lastClaim: null,
    winner: null,
    finished: false,
  };
}

// --- Déduction ---
// Liaisons connues ancien -> relique (les infos d'affiliation viennent d'anciens : toujours vraies).
export function bindings(notes: Note[]): Partial<Record<AncienId, Team>> {
  const out: Partial<Record<AncienId, Team>> = {};
  for (const nt of notes) if (!nt.debunked && nt.fact.kind === "aff") out[nt.fact.ancien] = nt.fact.relic;
  return out;
}

// Lieux encore possibles pour la relique d'une équipe, vu les infos d'attribut DÉJÀ liées.
export function consistentLieux(notes: Note[], relic: Team): LieuId[] {
  const bind = bindings(notes);
  const facts = notes
    .filter((nt) => !nt.debunked)
    .map((nt) => nt.fact)
    .filter((f): f is LocFact => f.kind === "loc" && bind[f.ancien] === relic);
  return (LIEUX as readonly LieuId[]).filter((L) =>
    facts.every((f) => (f.neg ? attrValue(L, f.axis) !== f.value : attrValue(L, f.axis) === f.value)),
  );
}

// --- Actions ---
const LIEU_ENUM = [...LIEUX] as [LieuId, ...LieuId[]];
const ANCIEN_ENUM = [...ANCIENS] as [AncienId, ...AncienId[]];

export const reliquesActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), to: z.string() }),
  z.object({ type: z.literal("interroger"), ancien: z.enum(ANCIEN_ENUM) }),
  // Échange réciproque : le proposeur offre une carte (vraie ou retournée) ; le destinataire
  // répond (accepte + rend une carte vraie/retournée, ou refuse).
  z.object({ type: z.literal("proposerTroc"), to: z.number(), clue: z.number(), lie: z.boolean() }),
  z.object({ type: z.literal("repondreTroc"), accept: z.boolean(), clue: z.number().optional(), lie: z.boolean().optional() }),
  z.object({ type: z.literal("reclamer") }),
  z.object({ type: z.literal("claim"), lieu: z.enum(LIEU_ENUM) }),
  z.object({ type: z.literal("wait") }),
]);
export type ReliquesAction = z.infer<typeof reliquesActionSchema>;

export type ReliquesEvent =
  | { type: "moved"; seat: number; to: TileId }
  | { type: "noteReceived"; seat: number; note: Note }
  | { type: "tradeProposed"; from: number; to: number }
  | { type: "tradeResolved"; from: number; to: number; accepted: boolean }
  | { type: "nothingNew"; seat: number }
  | { type: "claimOpened"; by: number }
  | { type: "claimSubmitted"; seat: number }
  | { type: "claimFailed"; by: number; someRight: boolean }
  | { type: "won"; team: Team }
  | { type: "finished"; team: Team | null }
  | { type: "lieRevealed"; seat: number; liar: number; fact: Fact; turn: number }
  | { type: "blocked"; seat: number; reason: string };

export interface TurnResult {
  state: GameState;
  events: ReliquesEvent[];
}

// Retourne une info (le mensonge) : lieu → inverse la négation ; affiliation → change le
// camp ; identité → inverse ensemble/pas-ensemble.
function flip(f: Fact): Fact {
  if (f.kind === "loc") return { ...f, neg: !f.neg };
  if (f.kind === "aff") return { ...f, relic: f.relic === "soleil" ? "lune" : "soleil" };
  return { ...f, same: !f.same };
}
// Tout ce qu'un joueur peut relayer en troc (ce qu'il a appris, hors infos démenties).
function tradableFacts(p: PlayerState): Fact[] {
  return p.notes.filter((nt) => !nt.debunked).map((nt) => nt.fact);
}
// Une note vient-elle d'une source SÛRE ? (un ancien ne ment jamais ; un joueur peut mentir)
function isTruth(from: number | AncienId): boolean {
  return typeof from === "string";
}
// Contradiction frontale entre deux infos (même objet, valeur opposée).
function contradicts(a: Fact, b: Fact): boolean {
  if (a.kind === "loc" && b.kind === "loc") return a.ancien === b.ancien && a.axis === b.axis && a.value === b.value && a.neg !== b.neg;
  if (a.kind === "aff" && b.kind === "aff") return a.ancien === b.ancien && a.relic !== b.relic;
  if (a.kind === "id" && b.kind === "id") return ((a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a)) && a.same !== b.same;
  return false;
}
// Démasquage par recoupement : une info reçue d'un JOUEUR contredite par une vérité d'ancien
// déjà au carnet est marquée « démentie » (ignorée en déduction) et le menteur est signalé.
function reconcile(p: PlayerState, seat: number, events: ReliquesEvent[]): void {
  const truths = p.notes.filter((nt) => isTruth(nt.from) && !nt.debunked).map((nt) => nt.fact);
  for (const nt of p.notes) {
    if (nt.debunked || typeof nt.from !== "number") continue;
    if (truths.some((t) => contradicts(nt.fact, t))) {
      nt.debunked = true;
      events.push({ type: "lieRevealed", seat, liar: nt.from, fact: nt.fact, turn: nt.turn });
    }
  }
}
function factKey(f: Fact): string {
  if (f.kind === "loc") return `loc|${f.ancien}|${f.axis}|${f.value}|${f.neg}`;
  if (f.kind === "aff") return `aff|${f.ancien}|${f.relic}`;
  return `id|${f.a}|${f.b}|${f.same}`;
}

function advance(state: GameState): void {
  const n = state.players.length;
  state.current = (state.current + 1) % n;
  if (state.current === 0) state.turn += 1; // compteur de manches, sans plafond
}

function teamOf(state: GameState, seat: number): Team {
  return state.players[seat]!.team;
}

function pushNote(p: PlayerState, note: Note, events: ReliquesEvent[], seat: number): void {
  p.notes.push(note);
  events.push({ type: "noteReceived", seat, note });
}

export function applyAction(prev: GameState, seat: number, action: ReliquesAction): TurnResult {
  const events: ReliquesEvent[] = [];
  if (prev.finished) return { state: prev, events };
  const state: GameState = structuredClone(prev);

  // Phase de réclamation : seul "claim" passe, de n'importe quel joueur.
  if (state.phase === "claim") {
    if (action.type !== "claim") {
      events.push({ type: "blocked", seat, reason: "claim in progress" });
      return { state: prev, events };
    }
    state.claim!.subs[seat] = action.lieu;
    events.push({ type: "claimSubmitted", seat });
    if (Object.keys(state.claim!.subs).length === state.players.length) resolveClaim(state, events);
    return { state, events };
  }

  // Échange en attente : seul "repondreTroc" passe — du destinataire (accepte/refuse) ou du
  // proposeur (annule). Tant qu'il est en cours, le proposeur ne peut rien faire d'autre.
  if (state.pendingTrade) {
    const pt = state.pendingTrade;
    if (action.type !== "repondreTroc" || (seat !== pt.to && seat !== pt.from)) {
      events.push({ type: "blocked", seat, reason: "trade pending" });
      return { state: prev, events };
    }
    if (!action.accept) {
      // refus (destinataire) ou annulation (proposeur) : le proposeur reprend la main.
      state.pendingTrade = null;
      events.push({ type: "tradeResolved", from: pt.from, to: pt.to, accepted: false });
      return { state, events };
    }
    if (seat !== pt.to) {
      events.push({ type: "blocked", seat, reason: "only target accepts" });
      return { state: prev, events };
    }
    const responder = state.players[pt.to]!;
    const proposer = state.players[pt.from]!;
    const rClue = tradableFacts(responder)[action.clue ?? -1];
    if (!rClue) {
      events.push({ type: "blocked", seat, reason: "no such clue" });
      return { state: prev, events };
    }
    const rLie = action.lie ?? false;
    // proposeur -> destinataire
    const aClue = tradableFacts(proposer)[pt.fromClue]!;
    const aRelayed = pt.fromLie ? flip(aClue) : aClue;
    pushNote(responder, { fact: aRelayed, from: pt.from, turn: state.turn }, events, pt.to);
    if (pt.fromLie) state.lieLog.push({ from: pt.from, to: pt.to, fact: aRelayed, turn: state.turn });
    // destinataire -> proposeur
    const bRelayed = rLie ? flip(rClue) : rClue;
    pushNote(proposer, { fact: bRelayed, from: pt.to, turn: state.turn }, events, pt.from);
    if (rLie) state.lieLog.push({ from: pt.to, to: pt.from, fact: bRelayed, turn: state.turn });
    // une info reçue qui contredit une vérité déjà connue est démasquée sur-le-champ.
    reconcile(responder, pt.to, events);
    reconcile(proposer, pt.from, events);
    state.pendingTrade = null;
    events.push({ type: "tradeResolved", from: pt.from, to: pt.to, accepted: true });
    advance(state); // le tour du proposeur est consommé
    if (state.finished) events.push({ type: "finished", team: state.winner });
    return { state, events };
  }

  if (seat !== state.current) {
    events.push({ type: "blocked", seat, reason: "not your turn" });
    return { state: prev, events };
  }
  const me = state.players[seat]!;

  if (action.type === "move") {
    if (!areAdjacent(me.tile, action.to as TileId)) {
      events.push({ type: "blocked", seat, reason: "not adjacent" });
      return { state: prev, events };
    }
    me.tile = action.to as TileId;
    events.push({ type: "moved", seat, to: me.tile });
    advance(state);
  } else if (action.type === "interroger") {
    if (ancienAtTile(me.tile) !== action.ancien) {
      events.push({ type: "blocked", seat, reason: "ancien not here" });
      return { state: prev, events };
    }
    const anc = state.anciens.find((a) => a.id === action.ancien)!;
    const have = new Set(me.notes.map((nt) => factKey(nt.fact)));
    const fresh = anc.stock.find((f) => !have.has(factKey(f)));
    if (!fresh) events.push({ type: "nothingNew", seat });
    else {
      pushNote(me, { fact: fresh, from: action.ancien, turn: state.turn }, events, seat);
      reconcile(me, seat, events); // cette vérité d'ancien démasque-t-elle un mensonge reçu ?
    }
    advance(state);
  } else if (action.type === "proposerTroc") {
    const other = state.players[action.to];
    if (!other || other.tile !== me.tile || action.to === seat) {
      events.push({ type: "blocked", seat, reason: "no one here to trade" });
      return { state: prev, events };
    }
    if (!tradableFacts(me)[action.clue]) {
      events.push({ type: "blocked", seat, reason: "no such clue" });
      return { state: prev, events };
    }
    // On ouvre l'échange et on attend la réponse (pas d'avance de tour).
    state.pendingTrade = { from: seat, to: action.to, fromClue: action.clue, fromLie: action.lie };
    events.push({ type: "tradeProposed", from: seat, to: action.to });
  } else if (action.type === "reclamer") {
    if (state.teamBlockedUntil[teamOf(state, seat)] >= state.turn) {
      events.push({ type: "blocked", seat, reason: "team blocked from claiming" });
      return { state: prev, events };
    }
    state.phase = "claim";
    state.claim = { by: seat, subs: {} };
    events.push({ type: "claimOpened", by: seat });
  } else {
    advance(state); // wait
  }

  if (state.finished) events.push({ type: "finished", team: state.winner });
  return { state, events };
}

function resolveClaim(state: GameState, events: ReliquesEvent[]): void {
  const claim = state.claim!;
  const correct = (team: Team): boolean => {
    const members = state.players.map((p, i) => ({ p, i })).filter(({ p }) => p.team === team);
    const ok = members.filter(({ i }) => claim.subs[i] === state.relicLieu[team]).length;
    return ok > members.length / 2;
  };
  const triggerer = teamOf(state, claim.by);
  // COURSE : le 1er camp qui réclame juste gagne (plus de double tranchant).
  if (correct(triggerer)) {
    win(state, triggerer, events);
    return;
  }
  // Échec : le camp était-il DIVISÉ (au moins un juste) ou PERSONNE n'avait le bon lieu ?
  const someRight = state.players.some((p, i) => p.team === triggerer && claim.subs[i] === state.relicLieu[triggerer]);
  state.teamBlockedUntil[triggerer] = state.turn + 1;
  state.phase = "play";
  state.claim = null;
  state.lastClaim = { by: claim.by, someRight, turn: state.turn };
  events.push({ type: "claimFailed", by: claim.by, someRight });
  advance(state);
}

function win(state: GameState, team: Team, events: ReliquesEvent[]): void {
  state.winner = team;
  state.phase = "over";
  state.finished = true;
  events.push({ type: "won", team });
  events.push({ type: "finished", team });
}

export { isLieu, ancienAtTile, ANCIEN_TILE };

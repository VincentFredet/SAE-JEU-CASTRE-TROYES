import { z } from "zod";
import type { Note, Team, LieEntry } from "../reliques/index";

export type MatchId = string;
export type UserId = string;

export const MATCH_STATUS = {
  Lobby: "lobby",
  InProgress: "in_progress",
  Finished: "finished",
} as const;
export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export interface GamePlayer {
  userId: UserId;
  username: string;
  seat: number;
  isHost: boolean;
  connected: boolean;
}

// État commun d'un salon/partie (sans secrets). Le détail du jeu (camps, indices,
// vraies ruines) ne transite jamais par là : il part dans la vue privée de chacun.
export interface MatchState {
  id: MatchId;
  name: string;
  status: MatchStatus;
  players: GamePlayer[];
  maxPlayers: number;
  currentTurnSeat: number | null;
  turn: number;
  winnerSeat: number | null;
  updatedAt: number;
}

export interface MatchSummary {
  id: MatchId;
  name: string;
  status: MatchStatus;
  playerCount: number;
  maxPlayers: number;
}

export const createMatchSchema = z.object({
  name: z.string().min(1).max(60),
  maxPlayers: z.number().int().min(2).max(8).default(2),
});
export type CreateMatchPayload = z.infer<typeof createMatchSchema>;

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

// Vue PRIVÉE d'un joueur (sans secrets : ni les camps des autres, ni les vraies
// ruines tant que la partie n'est pas finie). Une par joueur.
export interface ReliquesPlayerView {
  seat: number;
  tile: string;
  name: string;
  connected: boolean;
}
export interface ReliquesView {
  matchId: MatchId;
  you: number;
  team: Team;
  tile: string;
  notes: Note[];
  players: ReliquesPlayerView[];
  turn: number;
  current: number;
  phase: "play" | "claim" | "over";
  claimBy: number | null;
  youSubmitted: boolean;
  pendingTrade: { from: number; to: number } | null;
  teamBlocked: boolean;
  // Dernière réclamation ratée : résultat public (qui), raison (divisé/personne) seulement pour son camp.
  lastClaim: { by: number; someRight: boolean | null; turn: number } | null;
  winner: Team | null;
  reveal: { soleil: string; lune: string } | null;
  lies: LieEntry[] | null; // dévoilé en fin de partie : qui a menti à qui, et quoi
}

export interface ClientToServerEvents {
  // Salons par code, vues privées par joueur.
  "reliques:create": (payload: CreateMatchPayload, cb: (res: Ack<MatchState>) => void) => void;
  "reliques:join": (payload: { matchId: MatchId }, cb: (res: Ack<MatchState>) => void) => void;
  "reliques:leave": (payload: { matchId: MatchId }) => void;
  "reliques:start": (payload: { matchId: MatchId }, cb: (res: Ack<MatchState>) => void) => void;
  "reliques:action": (payload: { matchId: MatchId; action: unknown }, cb: (res: Ack<null>) => void) => void;
}

export interface ServerToClientEvents {
  // L'état du salon (commun) + ta vue privée du jeu.
  "reliques:state": (state: MatchState) => void;
  "reliques:view": (view: ReliquesView) => void;
  "reliques:ended": (payload: { winner: Team | null }) => void;
}

export interface SocketData {
  userId: UserId;
  username: string;
}

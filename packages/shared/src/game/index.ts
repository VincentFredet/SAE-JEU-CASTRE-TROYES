import { z } from "zod";

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

export interface MatchState {
  id: MatchId;
  name: string;
  status: MatchStatus;
  players: GamePlayer[];
  maxPlayers: number;
  currentTurnSeat: number | null;
  turn: number;
  winnerSeat: number | null;
  // État spécifique aux règles, à définir quand elles existeront.
  board: unknown;
  updatedAt: number;
}

export interface MatchSummary {
  id: MatchId;
  name: string;
  status: MatchStatus;
  playerCount: number;
  maxPlayers: number;
}

export const gameActionSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.unknown().optional(),
});
export type GameAction = z.infer<typeof gameActionSchema>;

export const createMatchSchema = z.object({
  name: z.string().min(1).max(60),
  maxPlayers: z.number().int().min(2).max(8).default(2),
});
export type CreateMatchPayload = z.infer<typeof createMatchSchema>;

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClientToServerEvents {
  "match:list": (cb: (res: Ack<MatchSummary[]>) => void) => void;
  "match:create": (payload: CreateMatchPayload, cb: (res: Ack<MatchState>) => void) => void;
  "match:join": (payload: { matchId: MatchId }, cb: (res: Ack<MatchState>) => void) => void;
  "match:leave": (payload: { matchId: MatchId }) => void;
  "match:start": (payload: { matchId: MatchId }, cb: (res: Ack<MatchState>) => void) => void;
  "match:action": (
    payload: { matchId: MatchId; action: GameAction },
    cb: (res: Ack<MatchState>) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "match:state": (state: MatchState) => void;
  "match:ended": (payload: { winnerSeat: number | null }) => void;
}

export interface SocketData {
  userId: UserId;
  username: string;
}

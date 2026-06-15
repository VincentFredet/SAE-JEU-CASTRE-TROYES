import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  createMatchSchema,
  gameActionSchema,
  MATCH_STATUS,
  type Ack,
  type ClientToServerEvents,
  type MatchState,
  type ServerToClientEvents,
  type SocketData,
} from "@jeux/shared";
import { verifySocketToken } from "@jeux/shared/server";
import { prisma } from "@jeux/db";
import { MatchManager } from "./matchManager.js";

type InterServerEvents = Record<string, never>;

const PORT = Number(process.env.REALTIME_PORT ?? 4000);
const CORS_ORIGIN = (process.env.REALTIME_CORS_ORIGIN ?? "http://localhost:3000").split(",");
const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
const ALLOW_DEV_AUTH =
  process.env.ALLOW_DEV_AUTH === "1" && process.env.NODE_ENV !== "production";
const WINNER_POINTS = 100;

if (!AUTH_SECRET && !ALLOW_DEV_AUTH) {
  throw new Error("AUTH_SECRET manquant (ou ALLOW_DEV_AUTH=1 pour le dev)");
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] } },
);

const manager = new MatchManager();
const persisted = new Set<string>();

const fail = (e: unknown): Ack<never> => ({
  ok: false,
  error: e instanceof Error ? e.message : "Erreur inconnue",
});

async function persistResult(state: MatchState) {
  if (state.winnerSeat === null || persisted.has(state.id)) return;
  const winner = state.players.find((p) => p.seat === state.winnerSeat);
  if (!winner) return;
  persisted.add(state.id);
  try {
    await prisma.score.create({
      data: { userId: winner.userId, game: "default", points: WINNER_POINTS, meta: { matchId: state.id } },
    });
  } catch (e) {
    console.error("persist score failed:", e instanceof Error ? e.message : e);
  }
}

function broadcast(state: MatchState) {
  io.to(state.id).emit("match:state", state);
  if (state.status === MATCH_STATUS.Finished) {
    io.to(state.id).emit("match:ended", { winnerSeat: state.winnerSeat });
    void persistResult(state);
  }
}

io.use((socket, next) => {
  const auth = socket.handshake.auth ?? {};
  const token = typeof auth.token === "string" ? auth.token : null;

  if (token && AUTH_SECRET) {
    const payload = verifySocketToken(token, AUTH_SECRET);
    if (payload) {
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      return next();
    }
  }

  if (ALLOW_DEV_AUTH && typeof auth.userId === "string" && typeof auth.username === "string") {
    socket.data.userId = auth.userId;
    socket.data.username = auth.username;
    return next();
  }

  next(new Error("unauthorized"));
});

io.on("connection", (socket) => {
  const { userId, username } = socket.data;

  for (const state of manager.setConnected(userId, true)) {
    void socket.join(state.id);
    broadcast(state);
  }

  socket.on("match:list", (cb) => cb({ ok: true, data: manager.list() }));

  socket.on("match:create", (payload, cb) => {
    const parsed = createMatchSchema.safeParse(payload);
    if (!parsed.success) return cb({ ok: false, error: "Données invalides" });
    const state = manager.create({ userId, username }, parsed.data);
    void socket.join(state.id);
    cb({ ok: true, data: state });
  });

  socket.on("match:join", ({ matchId }, cb) => {
    try {
      const state = manager.join(matchId, { userId, username });
      void socket.join(matchId);
      broadcast(state);
      cb({ ok: true, data: state });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("match:leave", ({ matchId }) => {
    const { state } = manager.leave(matchId, userId);
    void socket.leave(matchId);
    if (state) broadcast(state);
  });

  socket.on("match:start", ({ matchId }, cb) => {
    try {
      const state = manager.start(matchId, userId);
      broadcast(state);
      cb({ ok: true, data: state });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("match:action", ({ matchId, action }, cb) => {
    const parsed = gameActionSchema.safeParse(action);
    if (!parsed.success) return cb({ ok: false, error: "Action invalide" });
    try {
      const state = manager.applyAction(matchId, userId, parsed.data);
      broadcast(state);
      cb({ ok: true, data: state });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("disconnect", () => {
    for (const state of manager.setConnected(userId, false)) {
      broadcast(state);
    }
  });
});

setInterval(() => manager.sweep(30 * 60 * 1000), 5 * 60 * 1000).unref();

httpServer.listen(PORT, () => {
  console.log(`realtime: http://localhost:${PORT}`);
});

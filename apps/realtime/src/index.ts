import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  createMatchSchema,
  MATCH_STATUS,
  type Ack,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "@jeux/shared";
import { verifySocketToken } from "@jeux/shared/server";
import { prisma } from "@jeux/db";
import { ReliquesManager } from "./reliquesManager.js";

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

const reliques = new ReliquesManager();
const persisted = new Set<string>();

const fail = (e: unknown): Ack<never> => ({
  ok: false,
  error: e instanceof Error ? e.message : "Erreur inconnue",
});

// Fin de partie : on enregistre une ligne par participant (parties jouées), les
// gagnants reçoivent WINNER_POINTS, les autres 0. meta.won permet de compter les victoires.
async function persistResult(id: string) {
  if (persisted.has(id)) return;
  // Les invités (userId "guest:…") n'ont pas de compte : pas de score persisté
  // (ils casseraient la FK Score.userId -> User). Les vrais joueurs d'une même
  // partie restent enregistrés normalement.
  const players = reliques.participantUserIds(id).filter((uid) => !uid.startsWith("guest:"));
  if (players.length === 0) return;
  persisted.add(id);
  const winners = new Set(reliques.winningUserIds(id));
  try {
    await prisma.score.createMany({
      data: players.map((userId) => {
        const won = winners.has(userId);
        return { userId, game: "reliques", points: won ? WINNER_POINTS : 0, meta: { matchId: id, won } };
      }),
    });
  } catch (e) {
    console.error("persist score failed:", e instanceof Error ? e.message : e);
  }
}

function broadcast(id: string) {
  const state = reliques.get(id);
  if (!state) return;
  io.to(id).emit("reliques:state", state);
  for (const { userId, view } of reliques.views(id)) io.to(`u:${userId}`).emit("reliques:view", view);
  if (state.status === MATCH_STATUS.Finished) {
    io.to(id).emit("reliques:ended", { winner: reliques.winner(id) });
    void persistResult(id);
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
  void socket.join(`u:${userId}`); // salon perso, pour les vues privées

  for (const state of reliques.setConnected(userId, true)) {
    void socket.join(state.id);
    broadcast(state.id);
  }

  socket.on("reliques:create", (payload, cb) => {
    const parsed = createMatchSchema.safeParse(payload);
    if (!parsed.success) return cb({ ok: false, error: "Données invalides" });
    const state = reliques.create({ userId, username }, parsed.data);
    void socket.join(state.id);
    cb({ ok: true, data: state });
  });

  socket.on("reliques:join", ({ matchId }, cb) => {
    try {
      const state = reliques.join(matchId, { userId, username });
      void socket.join(matchId);
      broadcast(matchId);
      cb({ ok: true, data: state });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("reliques:leave", ({ matchId }) => {
    const state = reliques.leave(matchId, userId);
    void socket.leave(matchId);
    if (state) broadcast(matchId);
  });

  socket.on("reliques:start", ({ matchId }, cb) => {
    try {
      const state = reliques.start(matchId, userId);
      broadcast(matchId);
      cb({ ok: true, data: state });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("reliques:action", ({ matchId, action }, cb) => {
    try {
      reliques.submit(matchId, userId, action);
      broadcast(matchId);
      cb({ ok: true, data: null });
    } catch (e) {
      cb(fail(e));
    }
  });

  socket.on("disconnect", () => {
    for (const state of reliques.setConnected(userId, false)) {
      broadcast(state.id);
    }
  });
});

setInterval(() => {
  reliques.sweep(30 * 60 * 1000);
}, 5 * 60 * 1000).unref();

httpServer.listen(PORT, () => {
  console.log(`realtime: http://localhost:${PORT}`);
});

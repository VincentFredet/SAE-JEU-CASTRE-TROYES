"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Ack, ClientToServerEvents, ReliquesView, MatchState, ServerToClientEvents } from "@jeux/shared";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;
type RSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Identité invité stable par navigateur : permet de se reconnecter à sa partie
// après un rafraîchissement OU une fermeture d'onglet (le serveur retrouve le
// joueur par cet id). localStorage (et non sessionStorage) pour survivre à la
// fermeture de l'onglet, comme un compte connecté.
function guestId(): string {
  const KEY = "reliques:gid";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const gid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(
      /[^a-zA-Z0-9]/g,
      "",
    );
    localStorage.setItem(KEY, gid);
    return gid;
  } catch {
    return `${Date.now()}`.padStart(8, "0");
  }
}

async function fetchToken(guestName?: string): Promise<string> {
  const qs = guestName
    ? `?guest=${encodeURIComponent(guestName)}&gid=${encodeURIComponent(guestId())}`
    : "";
  const res = await fetch(`/api/socket-token${qs}`);
  if (!res.ok) throw new Error("token");
  return ((await res.json()) as { token: string }).token;
}

export interface UseReliquesRoom {
  configured: boolean;
  connected: boolean;
  lobby: MatchState | null;
  view: ReliquesView | null;
  winner: "soleil" | "lune" | null;
  error: string | null;
  create: (name: string) => void;
  join: (code: string) => void;
  start: () => void;
  leave: () => void;
  submit: (action: unknown) => void;
  clearError: () => void;
}

export function useReliquesRoom(guestName?: string): UseReliquesRoom {
  const ref = useRef<RSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<MatchState | null>(null);
  const [view, setView] = useState<ReliquesView | null>(null);
  const [winner, setWinner] = useState<"soleil" | "lune" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!REALTIME_URL) return;
    const socket: RSocket = io(REALTIME_URL, {
      auth: (cb) => {
        fetchToken(guestName)
          .then((token) => cb({ token }))
          .catch(() => cb({ token: "" }));
      },
    });
    ref.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      setError(null);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("reliques:state", (s) => setLobby(s));
    socket.on("reliques:view", (v) => setView(v));
    socket.on("reliques:ended", ({ winner: w }) => setWinner(w));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      ref.current = null;
    };
  }, [guestName]);

  const ack = useCallback((res: Ack<MatchState>) => {
    if (res.ok) {
      setLobby(res.data);
      setError(null);
    } else setError(res.error);
  }, []);

  const create = useCallback((name: string) => ref.current?.emit("reliques:create", { name, maxPlayers: 6 }, ack), [ack]);
  const join = useCallback((code: string) => ref.current?.emit("reliques:join", { matchId: code.trim().toUpperCase() }, ack), [ack]);
  const start = useCallback(() => {
    if (lobby) ref.current?.emit("reliques:start", { matchId: lobby.id }, ack);
  }, [lobby, ack]);
  const leave = useCallback(() => {
    if (lobby) ref.current?.emit("reliques:leave", { matchId: lobby.id });
    setLobby(null);
    setView(null);
    setWinner(null);
  }, [lobby]);
  const submit = useCallback(
    (action: unknown) => {
      if (lobby)
        ref.current?.emit("reliques:action", { matchId: lobby.id, action }, (res) => {
          if (!res.ok) setError(res.error);
        });
    },
    [lobby],
  );

  return { configured: !!REALTIME_URL, connected, lobby, view, winner, error, create, join, start, leave, submit, clearError: () => setError(null) };
}

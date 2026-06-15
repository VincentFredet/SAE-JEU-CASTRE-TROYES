"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  Ack,
  ClientToServerEvents,
  MatchState,
  MatchSummary,
  ServerToClientEvents,
} from "@jeux/shared";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;

export interface UseGameSocket {
  connected: boolean;
  matches: MatchSummary[];
  match: MatchState | null;
  error: string | null;
  createMatch: (name: string, maxPlayers: number) => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: () => void;
  startMatch: () => void;
  endTurn: () => void;
  resign: () => void;
  refreshMatches: () => void;
}

async function fetchToken(): Promise<string> {
  const res = await fetch("/api/socket-token");
  if (!res.ok) throw new Error("token");
  const data = (await res.json()) as { token: string };
  return data.token;
}

export function useGameSocket(): UseGameSocket {
  const socketRef = useRef<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!REALTIME_URL) return;

    // Le token expire au bout de 5 min : on le re-signe à chaque (re)connexion.
    const socket: GameSocket = io(REALTIME_URL, {
      auth: (cb) => {
        fetchToken()
          .then((token) => cb({ token }))
          .catch(() => cb({ token: "" }));
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("match:list", (res) => {
        if (res.ok) setMatches(res.data);
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("match:state", (state) => {
      setMatch((current) => (current && current.id !== state.id ? current : state));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleAck = useCallback((res: Ack<MatchState>) => {
    if (res.ok) {
      setMatch(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, []);

  const refreshMatches = useCallback(() => {
    socketRef.current?.emit("match:list", (res) => {
      if (res.ok) setMatches(res.data);
      else setError(res.error);
    });
  }, []);

  const createMatch = useCallback(
    (name: string, maxPlayers: number) => {
      socketRef.current?.emit("match:create", { name, maxPlayers }, handleAck);
    },
    [handleAck],
  );

  const joinMatch = useCallback(
    (matchId: string) => {
      socketRef.current?.emit("match:join", { matchId }, handleAck);
    },
    [handleAck],
  );

  const startMatch = useCallback(() => {
    if (!match) return;
    socketRef.current?.emit("match:start", { matchId: match.id }, handleAck);
  }, [match, handleAck]);

  const endTurn = useCallback(() => {
    if (!match) return;
    socketRef.current?.emit(
      "match:action",
      { matchId: match.id, action: { type: "end_turn" } },
      handleAck,
    );
  }, [match, handleAck]);

  const resign = useCallback(() => {
    if (!match) return;
    socketRef.current?.emit(
      "match:action",
      { matchId: match.id, action: { type: "resign" } },
      handleAck,
    );
  }, [match, handleAck]);

  const leaveMatch = useCallback(() => {
    if (!match) return;
    socketRef.current?.emit("match:leave", { matchId: match.id });
    setMatch(null);
    refreshMatches();
  }, [match, refreshMatches]);

  return {
    connected,
    matches,
    match,
    error,
    createMatch,
    joinMatch,
    leaveMatch,
    startMatch,
    endTurn,
    resign,
    refreshMatches,
  };
}

"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MATCH_STATUS, type GamePlayer, type MatchState } from "@jeux/shared";
import { useGameSocket } from "@/hooks/useGameSocket";
import { card, inputField as field, buttonPrimary as primaryBtn, buttonGhost as ghostBtn } from "@/lib/ui";

type Props = { userId: string };

export function PlayClient({ userId }: Props) {
  const game = useGameSocket();

  if (game.match) {
    return <MatchView userId={userId} game={game} match={game.match} />;
  }

  return <LobbyView game={game} />;
}

type GameApi = ReturnType<typeof useGameSocket>;

function LobbyView({ game }: { game: GameApi }) {
  const t = useTranslations("game");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    game.createMatch(trimmed, Math.min(8, Math.max(2, maxPlayers)));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">{t("comingSoon")}</p>

      {!game.connected && (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">{t("connecting")}</p>
      )}
      {game.error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {tc("error")}
        </p>
      )}

      <form onSubmit={onCreate} className={`${card} mt-10 flex flex-col gap-4`}>
        <h2 className="text-lg font-semibold">{t("createMatch")}</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("matchName")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("maxPlayers")}
          <input
            type="number"
            min={2}
            max={8}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value) || 2)}
            className={`${field} max-w-28`}
          />
        </label>
        <div>
          <button type="submit" disabled={!game.connected} className={primaryBtn}>
            {t("create")}
          </button>
        </div>
      </form>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("joinMatch")}</h2>
          <button
            type="button"
            onClick={game.refreshMatches}
            disabled={!game.connected}
            className={ghostBtn}
          >
            {t("refresh")}
          </button>
        </div>

        {game.matches.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">{t("noMatches")}</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {game.matches.map((m) => (
              <li
                key={m.id}
                className={`${card} flex items-center justify-between gap-4 py-4`}
              >
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {statusLabel(t, m.status)} - {t("players")}: {m.playerCount}/{m.maxPlayers}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => game.joinMatch(m.id)}
                  disabled={
                    m.status !== MATCH_STATUS.Lobby || m.playerCount >= m.maxPlayers
                  }
                  className={primaryBtn}
                >
                  {t("joinMatch")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MatchView({
  userId,
  game,
  match,
}: {
  userId: string;
  game: GameApi;
  match: MatchState;
}) {
  const t = useTranslations("game");
  const tc = useTranslations("common");

  const me = match.players.find((p) => p.userId === userId);
  const isHost = me?.isHost ?? false;
  const myTurn =
    match.status === MATCH_STATUS.InProgress &&
    me !== undefined &&
    me.seat === match.currentTurnSeat;

  const currentPlayer = match.players.find((p) => p.seat === match.currentTurnSeat);
  const winner = match.players.find((p) => p.seat === match.winnerSeat);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{match.name}</h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {statusLabel(t, match.status)}
        </span>
      </div>

      {match.status === MATCH_STATUS.InProgress && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{t("turn", { n: match.turn })}</p>
      )}

      {game.error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {tc("error")}
        </p>
      )}

      <section className={`${card} mt-8`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("players")}
        </h2>
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {[...match.players]
            .sort((a, b) => a.seat - b.seat)
            .map((p) => (
              <PlayerRow
                key={p.userId}
                player={p}
                isMe={p.userId === userId}
                isCurrent={
                  match.status === MATCH_STATUS.InProgress &&
                  p.seat === match.currentTurnSeat
                }
                t={t}
              />
            ))}
        </ul>
      </section>

      {match.status === MATCH_STATUS.Lobby && (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("waiting")}</p>
          <div className="flex flex-wrap gap-3">
            {isHost && (
              <button
                type="button"
                onClick={game.startMatch}
                disabled={match.players.length < 2}
                className={primaryBtn}
              >
                {t("start")}
              </button>
            )}
            <button type="button" onClick={game.leaveMatch} className={ghostBtn}>
              {t("leave")}
            </button>
          </div>
        </div>
      )}

      {match.status === MATCH_STATUS.InProgress && (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-base font-medium">
            {myTurn
              ? t("yourTurn")
              : currentPlayer
                ? t("turnOf", { name: currentPlayer.username })
                : t("waiting")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={game.endTurn}
              disabled={!myTurn}
              className={primaryBtn}
            >
              {t("endTurn")}
            </button>
            <button type="button" onClick={game.resign} className={ghostBtn}>
              {t("resign")}
            </button>
            <button type="button" onClick={game.leaveMatch} className={ghostBtn}>
              {t("leave")}
            </button>
          </div>
        </div>
      )}

      {match.status === MATCH_STATUS.Finished && (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-lg font-semibold">{t("finished")}</p>
          {winner && (
            <p className="text-base text-zinc-600 dark:text-zinc-300">
              {t("winnerIs", { name: winner.username })}
            </p>
          )}
          <div>
            <button type="button" onClick={game.leaveMatch} className={primaryBtn}>
              {t("leave")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  isMe,
  isCurrent,
  t,
}: {
  player: GamePlayer;
  isMe: boolean;
  isCurrent: boolean;
  t: ReturnType<typeof useTranslations<"game">>;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 font-mono text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {player.seat + 1}
        </span>
        <span className={isCurrent ? "font-semibold" : "font-medium"}>{player.username}</span>
        {player.isHost && (
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            {t("host")}
          </span>
        )}
        {isMe && (
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-medium dark:border-zinc-700">
            {t("you")}
          </span>
        )}
      </div>
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          player.connected ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
        aria-hidden
      />
    </li>
  );
}

function statusLabel(t: ReturnType<typeof useTranslations<"game">>, status: string) {
  switch (status) {
    case MATCH_STATUS.Lobby:
      return t("statusLobby");
    case MATCH_STATUS.InProgress:
      return t("statusInProgress");
    case MATCH_STATUS.Finished:
      return t("statusFinished");
    default:
      return status;
  }
}

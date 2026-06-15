"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MATCH_STATUS, type GamePlayer, type MatchState } from "@jeux/shared";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";
import { inputField as field, buttonPrimary as primaryBtn, buttonGhost as ghostBtn } from "@/lib/ui";

type Props = { userId: string };

const panel =
  "rounded-[2rem] border border-line bg-white/70 p-7 shadow-[0_30px_60px_-45px_rgba(33,26,19,0.4)]";

export function PlayClient({ userId }: Props) {
  const game = useGameSocket();

  if (game.match) {
    return <MatchView userId={userId} game={game} match={game.match} />;
  }

  return <LobbyView game={game} />;
}

type GameApi = ReturnType<typeof useGameSocket>;

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-clay" />
      {label}
    </span>
  );
}

function ErrorNote({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-clay/30 bg-clay/10 px-3.5 py-2.5 text-sm font-medium text-clay-deep">
      {children}
    </p>
  );
}

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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-clay/12 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-amber/12 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("title")}
          </span>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {t("createMatch")}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t("comingSoon")}</p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-3">
          {!game.connected && (
            <Reveal delay={210}>
              <p className="text-sm font-medium text-ink-soft">{t("connecting")}</p>
            </Reveal>
          )}
          {game.error && (
            <Reveal delay={210}>
              <ErrorNote>{tc("error")}</ErrorNote>
            </Reveal>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal dir="left">
            <Tilt className="h-full">
              <form onSubmit={onCreate} className={`${panel} flex h-full flex-col gap-5`}>
                <h2 className="font-display text-2xl font-semibold text-ink">{t("createMatch")}</h2>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                  {t("matchName")}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    required
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
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
                <div className="mt-auto pt-2">
                  <button
                    type="submit"
                    disabled={!game.connected}
                    className={`${primaryBtn} w-full py-3`}
                  >
                    {t("create")}
                  </button>
                </div>
              </form>
            </Tilt>
          </Reveal>

          <Reveal dir="right" delay={120}>
            <section className={`${panel} flex h-full flex-col`}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-ink">{t("joinMatch")}</h2>
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
                <div className="mt-8 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-cream/40 px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink-soft">{t("noMatches")}</p>
                </div>
              ) : (
                <ul className="mt-6 flex flex-col gap-3">
                  {game.matches.map((m) => (
                    <li
                      key={m.id}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-cream/50 p-4 transition hover:border-clay/40 hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-semibold text-ink">
                          {m.name}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-soft">
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
          </Reveal>
        </div>
      </div>
    </section>
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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-amber/12 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-pine/10 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {match.name}
            </h1>
            <StatusPill label={statusLabel(t, match.status)} />
          </div>
        </Reveal>

        {match.status === MATCH_STATUS.InProgress && (
          <Reveal delay={80}>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.14em] text-ink-soft">
              {t("turn", { n: match.turn })}
            </p>
          </Reveal>
        )}

        {game.error && (
          <Reveal delay={80}>
            <div className="mt-6">
              <ErrorNote>{tc("error")}</ErrorNote>
            </div>
          </Reveal>
        )}

        <Reveal dir="up" delay={120}>
          <section className={`${panel} mt-8`}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("players")}
            </h2>
            <ul className="mt-5 flex flex-col gap-2.5">
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
        </Reveal>

        {match.status === MATCH_STATUS.Lobby && (
          <Reveal dir="up" delay={180}>
            <div className={`${panel} mt-6 flex flex-col gap-5`}>
              <p className="text-base text-ink-soft">{t("waiting")}</p>
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
          </Reveal>
        )}

        {match.status === MATCH_STATUS.InProgress && (
          <Reveal dir="up" delay={180}>
            <div
              className={`mt-6 overflow-hidden rounded-[2rem] p-7 shadow-[0_30px_60px_-45px_rgba(33,26,19,0.5)] transition ${
                myTurn ? "bg-ink text-cream" : "border border-line bg-white/70 text-ink"
              }`}
            >
              <p className="font-display text-2xl font-semibold leading-tight">
                {myTurn
                  ? t("yourTurn")
                  : currentPlayer
                    ? t("turnOf", { name: currentPlayer.username })
                    : t("waiting")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={game.endTurn}
                  disabled={!myTurn}
                  className={
                    myTurn
                      ? "inline-flex items-center justify-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay hover:text-cream disabled:opacity-50"
                      : primaryBtn
                  }
                >
                  {t("endTurn")}
                </button>
                <button
                  type="button"
                  onClick={game.resign}
                  className={
                    myTurn
                      ? "inline-flex items-center justify-center gap-2 rounded-full border border-cream/30 px-4 py-2 text-sm font-medium text-cream/90 transition hover:border-cream hover:text-cream"
                      : ghostBtn
                  }
                >
                  {t("resign")}
                </button>
                <button
                  type="button"
                  onClick={game.leaveMatch}
                  className={
                    myTurn
                      ? "inline-flex items-center justify-center gap-2 rounded-full border border-cream/30 px-4 py-2 text-sm font-medium text-cream/90 transition hover:border-cream hover:text-cream"
                      : ghostBtn
                  }
                >
                  {t("leave")}
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {match.status === MATCH_STATUS.Finished && (
          <Reveal dir="scale" delay={180}>
            <div className="grain relative mt-6 overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-center text-cream shadow-[0_30px_60px_-35px_rgba(33,26,19,0.6)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber/30 blur-3xl animate-float"
              />
              <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-cream/60">
                {t("finished")}
              </p>
              {winner && (
                <p className="relative mt-4 font-display text-3xl font-semibold sm:text-4xl">
                  {t("winnerIs", { name: winner.username })}
                </p>
              )}
              <div className="relative mt-8">
                <button
                  type="button"
                  onClick={game.leaveMatch}
                  className="inline-flex items-center justify-center rounded-full bg-cream px-7 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay hover:text-cream"
                >
                  {t("leave")}
                </button>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
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
    <li
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
        isCurrent ? "border-clay/40 bg-clay/5" : "border-line bg-cream/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl font-display text-sm font-semibold ${
            isCurrent ? "bg-clay text-cream" : "bg-parchment text-ink-soft"
          }`}
        >
          {player.seat + 1}
        </span>
        <span className={`text-ink ${isCurrent ? "font-semibold" : "font-medium"}`}>
          {player.username}
        </span>
        {player.isHost && (
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-cream">
            {t("host")}
          </span>
        )}
        {isMe && (
          <span className="rounded-full border border-line bg-white/70 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
            {t("you")}
          </span>
        )}
      </div>
      <span
        className={`h-2.5 w-2.5 rounded-full ${player.connected ? "bg-pine" : "bg-sand"}`}
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

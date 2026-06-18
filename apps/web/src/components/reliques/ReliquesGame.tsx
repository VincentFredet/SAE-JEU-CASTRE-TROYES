"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  applyAction,
  createGame,
  LIEUX,
  ADJACENCY,
  ancienAtTile,
  type GameState,
  type ReliquesAction,
  type Fact,
  type Team,
  type LocationId,
} from "@jeux/shared/reliques";
import { ReliquesMap } from "./ReliquesMap";
import { PAWN_COLORS } from "@/components/reliques/positions";
import { buttonPrimary, buttonGhost, sectionLabel, pill } from "@/lib/ui";

type Phase = "setup" | "pass" | "play" | "claimPass" | "end";
// Version RETOURNÉE d'une info (ce que reçoit l'autre si on ment) - pour l'aperçu.
const flipFact = (f: Fact): Fact =>
  f.kind === "loc" ? { ...f, neg: !f.neg } : f.kind === "aff" ? { ...f, relic: f.relic === "soleil" ? "lune" : "soleil" } : { ...f, same: !f.same };

export function ReliquesGame() {
  const t = useTranslations("reliques");
  type Key = Parameters<typeof t>[0];
  const lieuName = (id: string) => t(`locations.${id}` as Key);
  const shortName = (id: string) => t(`locationsShort.${id}` as Key);
  const teamLabel = (tm: Team) => t(tm === "soleil" ? "teamSoleil" : "teamLune");
  const ancienName = (id: string) => t(`npc.${id}` as Key);
  const pname = (s: number) => t("player", { n: s + 1 });

  const [phase, setPhase] = useState<Phase>("setup");
  const [seats, setSeats] = useState(4);
  const [game, setGame] = useState<GameState | null>(null);
  const [claimSeat, setClaimSeat] = useState(0);
  const [trade, setTrade] = useState<{ to: number; clue: number } | null>(null);
  const [flash, setFlash] = useState("");
  const [solo, setSolo] = useState(false);
  const [reveal, setReveal] = useState<{ kind: "info"; fact: Fact; from: number | string } | { kind: "empty"; ancien: string } | null>(null); // ce qu'on rapporte d'un ancien, affiché en grand
  const [confirmClaim, setConfirmClaim] = useState(false); // garde-fou avant de réclamer
  const [ackedClaim, setAckedClaim] = useState(""); // retour de réclamation ratée déjà vu
  const [memos, setMemos] = useState<Record<number, string>>({}); // bloc-notes libre par siège

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(""), 2600);
    return () => clearTimeout(id);
  }, [flash]);

  // Mode solo : tu joues le siège 0, les autres sièges sont des bots - ils passent leur
  // tour, refusent les échanges, et soumettent un lieu au pif pendant une réclamation.
  useEffect(() => {
    if (!solo || !game || phase === "setup" || phase === "end") return;
    // Tout est différé (un seul timeout) pour ne jamais appeler setState en synchrone.
    const id = setTimeout(() => {
      if (game.finished) return setPhase("end");
      if (phase === "claimPass" && game.phase !== "claim") return setPhase("pass");
      if (game.pendingTrade) {
        if (game.pendingTrade.to === 0) return; // c'est à toi de répondre
        return setGame((g) => (g?.pendingTrade ? applyAction(g, g.pendingTrade.to, { type: "repondreTroc", accept: false }).state : g));
      }
      if (phase === "pass") {
        if (game.current === 0) return setPhase("play");
        return setGame((g) => (g && !g.pendingTrade && g.current !== 0 ? applyAction(g, g.current, { type: "wait" }).state : g));
      }
      if (phase === "claimPass") {
        setGame((g) => {
          if (!g?.claim) return g;
          const bot = g.players.findIndex((_, i) => i !== 0 && g.claim!.subs[i] === undefined);
          if (bot === -1) return g;
          const lieu = LIEUX[Math.floor(Math.random() * LIEUX.length)]!;
          return applyAction(g, bot, { type: "claim", lieu }).state;
        });
      }
    }, 320);
    return () => clearTimeout(id);
  }, [solo, game, phase]);

  function factText(f: Fact): string {
    if (f.kind === "loc") {
      const v = f.axis === "terrain" ? t(`terrains.${f.value}` as Key) : t(`types.${f.value}` as Key);
      const attr = t(f.axis === "terrain" ? "attrTerrain" : "attrType", { v });
      return t(f.neg ? "factLocNeg" : "factLocPos", { ancien: ancienName(f.ancien), attr });
    }
    if (f.kind === "aff") return t("factAff", { ancien: ancienName(f.ancien), team: teamLabel(f.relic) });
    return t(f.same ? "clueIdSame" : "clueIdDiff", { a: pname(f.a), b: pname(f.b) });
  }
  const sourceText = (from: number | string) => (typeof from === "number" ? pname(from) : ancienName(from));
  // Tout ce qu'on peut relayer en troc (ce qu'on a appris, hors infos démenties).
  const tradableOf = (p: GameState["players"][number]) => p.notes.filter((n) => !n.debunked).map((n) => n.fact);

  function start(soloMode = false) {
    const players = Array.from({ length: seats }, (_, i) => `p${i}`);
    setSolo(soloMode);
    setGame(createGame({ players }));
    setClaimSeat(0);
    setPhase(soloMode ? "play" : "pass"); // solo : le siège 0 (toi) joue d'entrée
  }

  // ---------- SETUP ----------
  if (phase === "setup" || !game) {
    return (
      <section className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("hotseatTag")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">{t("hotseatTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("hotseatIntro")}</p>
        <div className="mt-6">
          <p className={sectionLabel}>{t("playersEven")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[4, 6].map((n) => (
              <button key={n} type="button" data-testid={`setup-seats-${n}`} onClick={() => setSeats(n)} className={`rounded-xl border py-3 font-display text-xl font-semibold transition active:scale-[0.97] ${seats === n ? "border-clay bg-clay text-cream shadow-md shadow-clay/20" : "border-line bg-white/70 text-ink-soft"}`}>{n}</button>
            ))}
          </div>
        </div>
        <button type="button" data-testid="setup-start" onClick={() => start(false)} className={`${buttonPrimary} mt-6 w-full py-4 text-base`}>{t("launch")}</button>
        <button type="button" data-testid="setup-solo" onClick={() => start(true)} className={`${buttonGhost} mt-2 w-full py-3 text-sm`}>{t("soloTest")}</button>
        <p className="mt-3 text-center text-xs text-ink-soft/70">{t("hotseatHint")}</p>
      </section>
    );
  }

  // ---------- INFO REÇUE / RIEN DE NOUVEAU (affiché en grand avant de continuer) ----------
  if (reveal) {
    return (
      <div className="fixed inset-0 z-[65] grid h-[100dvh] place-items-center bg-ink/55 px-6">
        <div className="rq-pop w-full max-w-sm rounded-3xl border border-line bg-cream p-7 text-center shadow-2xl">
          {reveal.kind === "info" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("newInfo")}</p>
              <p className="mt-4 font-display text-2xl font-bold leading-snug text-ink">{factText(reveal.fact)}</p>
              <p className="mt-2.5 text-sm text-ink-soft">{t("fromSource", { source: sourceText(reveal.from) })}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">{ancienName(reveal.ancien)}</p>
              <p className="mt-4 font-display text-xl font-bold leading-snug text-ink-soft">{t("nothingMore")}</p>
            </>
          )}
          <button type="button" data-testid="reveal-ok" onClick={() => setReveal(null)} className={`${buttonPrimary} mt-6 w-full py-3.5`}>{t("gotIt")}</button>
        </div>
      </div>
    );
  }

  // ---------- RETOUR D'UNE RÉCLAMATION RATÉE ----------
  if (game.lastClaim && `${game.lastClaim.by}:${game.lastClaim.turn}` !== ackedClaim) {
    const key = `${game.lastClaim.by}:${game.lastClaim.turn}`;
    return (
      <div className="fixed inset-0 z-[64] grid h-[100dvh] place-items-center bg-ink/55 px-6">
        <div className="rq-pop w-full max-w-sm rounded-3xl border border-line bg-cream p-6 text-center shadow-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimFailedTitle")}</p>
          <p className="mt-3 text-sm text-ink">{t("claimFailedBlocked", { name: pname(game.lastClaim.by) })}</p>
          <p className="mt-2 text-sm font-medium text-clay-deep">{game.lastClaim.someRight ? t("claimFailedDivided") : t("claimFailedNobody")}</p>
          <button type="button" data-testid="claim-result-ok" onClick={() => setAckedClaim(key)} className={`${buttonPrimary} mt-5 w-full py-3.5`}>{t("gotIt")}</button>
        </div>
      </div>
    );
  }

  const seat = phase === "claimPass" ? claimSeat : game.current;
  const me = game.players[seat]!;
  const color = PAWN_COLORS[seat % PAWN_COLORS.length]!;
  const reachable = new Set<LocationId>(ADJACENCY[me.tile] ?? []);
  const ancienHere = ancienAtTile(me.tile);
  const rivalsHere = game.players.map((p, i) => ({ p, i })).filter(({ p, i }) => i !== seat && p.tile === me.tile);
  const blocked = game.teamBlockedUntil[me.team] >= game.turn;

  function act(action: ReliquesAction) {
    if (!game) return;
    const res = applyAction(game, seat, action);
    const blk = res.events.find((e) => e.type === "blocked");
    if (blk && res.state === game) {
      setFlash(t("impossibleHere"));
      return;
    }
    setGame(res.state);
    setTrade(null);
    const lie = res.events.find((e) => e.type === "lieRevealed");
    setFlash(lie && lie.type === "lieRevealed" ? t("caughtLie", { name: pname(lie.liar) }) : "");
    if (action.type === "interroger") {
      const got = res.events.find((e) => e.type === "noteReceived" && e.seat === seat);
      if (got && got.type === "noteReceived") setReveal({ kind: "info", fact: got.note.fact, from: got.note.from });
      else if (res.events.some((e) => e.type === "nothingNew")) setReveal({ kind: "empty", ancien: action.ancien });
    }
    if (res.state.pendingTrade) { setPhase("play"); return; } // on attend la réponse à l'échange
    if (res.state.phase === "claim") {
      setClaimSeat(0);
      setPhase("claimPass");
      return;
    }
    setPhase("pass");
  }

  function respondTrade(action: ReliquesAction) {
    if (!game?.pendingTrade) return;
    const to = game.pendingTrade.to;
    const res = applyAction(game, to, action);
    setGame(res.state);
    const lie = res.events.find((e) => e.type === "lieRevealed");
    setFlash(lie && lie.type === "lieRevealed" ? t("caughtLie", { name: pname(lie.liar) }) : "");
    const got = res.events.find((e) => e.type === "noteReceived" && e.seat === to);
    if (got && got.type === "noteReceived") setReveal({ kind: "info", fact: got.note.fact, from: got.note.from });
    if (res.state.finished) { setPhase("end"); return; }
    // accepté → le tour a avancé (on passe au suivant) ; refusé → le proposeur reprend la main
    setPhase(res.state.current === game.current ? "play" : "pass");
  }

  // ---------- PASS ----------
  if (phase === "pass") {
    if (solo) return null; // en solo, l'effet fait jouer les bots (pas d'écran de passage)
    return <PassScreen seat={seat} color={color} onReady={() => setPhase("play")} label={t("passLabel", { name: pname(seat) })} sub={t("passSub")} readyLabel={t("passReveal")} />;
  }

  // ---------- CLAIM (chacun soumet en secret) ----------
  if (phase === "claimPass") {
    if (!game.claim) return null; // réclamation déjà résolue : l'effet/handler change de phase
    const subs = game.claim.subs;
    const picker = solo ? 0 : claimSeat; // en solo, tu ne soumets que pour toi ; les bots via l'effet
    if (subs[picker] !== undefined) {
      if (solo) return null; // tu as soumis : bots + résolution gérés par l'effet
      const next = game.players.findIndex((_, i) => subs[i] === undefined);
      if (next === -1) return null;
      if (next !== claimSeat) {
        setClaimSeat(next);
        return null;
      }
    }
    const cm = game.players[picker]!;
    const submitClaim = (r: (typeof LIEUX)[number]) => {
      const res = applyAction(game, picker, { type: "claim", lieu: r });
      setGame(res.state);
      if (res.state.finished) { setPhase("end"); return; }
      if (res.state.phase === "play") { setPhase("pass"); return; }
      if (!solo) {
        const next = res.state.players.findIndex((_, i) => res.state.claim!.subs[i] === undefined);
        setClaimSeat(next === -1 ? 0 : next);
      }
    };
    return (
      <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-cream">
        <header className="shrink-0 border-b border-line/70 bg-cream/90 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimTriggered", { name: pname(game.claim!.by) })}</p>
          <h1 className="mt-1 font-display text-xl font-bold leading-tight text-ink">{t("claimQuestionNamed", { name: pname(picker), team: teamLabel(cm.team) })}</h1>
          <p className="mt-1 text-xs text-ink-soft">{t("claimHint")}</p>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-3">
          <div className="overflow-hidden rounded-[1.4rem] border border-line bg-parchment/60 p-2">
            <ReliquesMap players={game.players} seat={picker} reachable={new Set<LocationId>()} shortName={shortName} onPick={() => {}} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 pb-4">
            {LIEUX.map((r) => (
              <button key={r} type="button" onClick={() => submitClaim(r)} className={`${pill} bg-amber/15 px-2 py-3 text-center text-sm leading-tight text-clay-deep`}>{lieuName(r)}</button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ---------- END ----------
  if (phase === "end") {
    const w = game.winner;
    return (
      <section className="mx-auto min-h-[100dvh] max-w-md px-6 py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("endTag")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">{w ? t("cultWins", { team: teamLabel(w) }) : t("nobodyWins")}</h1>
        <div className="mt-6 rounded-2xl border border-line bg-parchment/50 p-4 text-left text-sm text-ink-soft">
          <p>{t("revealHotseat", { soleil: lieuName(game.relicLieu.soleil), lune: lieuName(game.relicLieu.lune) })}</p>
        </div>
        <ul className="mt-4 space-y-1 text-left text-sm">
          {game.players.map((p, i) => (
            <li key={i} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-cream" style={{ background: PAWN_COLORS[i % PAWN_COLORS.length] }}>{i + 1}</span>{teamLabel(p.team)}</li>
          ))}
        </ul>
        {game.lieLog.length > 0 && (
          <div className="mt-5 rounded-2xl border border-clay/30 bg-clay/5 p-4 text-left">
            <p className={sectionLabel}>{t("liesTitle")}</p>
            <ul className="mt-2 space-y-1.5">
              {game.lieLog.map((l, i) => (
                <li key={i} className="text-xs"><span className="font-semibold text-ink">{factText(l.fact)}</span><span className="ml-1 text-ink-soft">{t("lieMeta", { from: pname(l.from), to: pname(l.to), turn: l.turn })}</span></li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" data-testid="new-game" onClick={() => setPhase("setup")} className={`${buttonPrimary} mt-8 w-full py-3.5`}>{t("newGame")}</button>
      </section>
    );
  }

  // ---------- RÉPONSE À UN ÉCHANGE (réciproque) ----------
  if (game.pendingTrade) {
    if (solo && game.pendingTrade.to !== 0) return null; // un bot répond (refuse) via l'effet
    const rseat = game.pendingTrade.to;
    const r = game.players[rseat]!;
    const rcolor = PAWN_COLORS[rseat % PAWN_COLORS.length]!;
    return (
      <div className="fixed inset-0 z-[60] grid h-[100dvh] place-items-center px-6" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${rcolor}22, var(--color-cream) 60%)` }}>
        <div className="rq-pop max-h-[88dvh] w-full max-w-sm overflow-y-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("tradeIncomingTitle", { name: pname(game.pendingTrade.from) })}</p>
          <h1 className="mt-2 text-center font-display text-2xl font-bold text-ink">{pname(rseat)}</h1>
          <p className="mt-1 text-center text-sm text-ink-soft">{t("tradeGiveBack")}</p>
          <div className="mt-4 space-y-2">
            {tradableOf(r).length === 0 && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-soft">{t("nothingToGive")}</p>}
            {tradableOf(r).map((c, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-line bg-white/70">
                <p className="px-3 py-2 text-sm font-medium text-ink">{factText(c)}</p>
                <div className="border-t border-line/60 p-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => respondTrade({ type: "repondreTroc", accept: true, clue: i, lie: false })} className={`${pill} flex-1 bg-pine text-cream`}>{t("giveTrue")}</button>
                    <button type="button" onClick={() => respondTrade({ type: "repondreTroc", accept: true, clue: i, lie: true })} className={`${pill} flex-1 bg-clay text-cream`}>{t("lie")}</button>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] text-clay-deep/80">{t("liePreview", { fact: factText(flipFact(c)) })}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => respondTrade({ type: "repondreTroc", accept: false })} className={`${buttonGhost} mt-3 w-full py-2.5`}>{t("refuse")}</button>
        </div>
      </div>
    );
  }

  // ---------- PLAY ----------
  return (
    <div className="fixed inset-0 z-[55] flex h-[100dvh] flex-col bg-cream">
      <header className="z-10 shrink-0 border-b border-line/70 bg-cream/85 px-4 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <span data-testid="round-badge" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream">{t("round", { turn: game.turn })}</span>
          <span className="rounded-full bg-amber/20 px-3 py-1.5 text-sm font-bold text-clay-deep">{teamLabel(me.team)}</span>
          <div className="flex-1" />
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-cream ring-2 ring-cream" style={{ background: color }}>{seat + 1}</span>
        </div>
      </header>

      {flash && <div className="rq-pop pointer-events-none fixed inset-x-0 top-[60px] z-30 mx-auto w-fit max-w-[90%] rounded-full bg-ink/90 px-4 py-2 text-sm font-semibold text-cream shadow-lg">{flash}</div>}

      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pb-32 lg:grid lg:max-w-6xl lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-5 lg:pb-5">
        <section className="mt-3 lg:sticky lg:top-3">
          <div className="overflow-hidden rounded-[1.4rem] border border-line bg-parchment/60 p-2">
            <ReliquesMap players={game.players} seat={seat} reachable={reachable} shortName={shortName} onPick={(id) => act({ type: "move", to: id })} />
          </div>
        </section>

        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-line bg-white/70 p-3">
            <p className={sectionLabel}>{t("playersTitle")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {game.players.map((p, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${i === seat ? "border-clay bg-amber/10" : "border-line bg-white/70"}`}>
                  <span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-cream" style={{ background: PAWN_COLORS[i % PAWN_COLORS.length] }}>{i + 1}</span>
                  <span className="font-medium text-ink">{pname(i)}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white/70 p-3">
            <p className={sectionLabel}>{t("notebook", { n: me.notes.length })}</p>
            {me.notes.length === 0 ? (
              <p className="mt-1 text-xs text-ink-soft">{t("notebookEmpty")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {me.notes.map((n, i) => {
                  const fromAncien = typeof n.from === "string";
                  const cls = n.debunked ? "border-clay/60 bg-clay/10" : fromAncien ? "border-pine/40 bg-pine/5" : "border-amber/50 bg-amber/10";
                  return (
                    <li key={i} className={`rounded-lg border-l-[3px] px-2.5 py-1.5 text-xs ${cls}`}>
                      <span className={`font-semibold ${n.debunked ? "text-ink-soft line-through" : "text-ink"}`}>{factText(n.fact)}</span>
                      <span className="ml-1 text-ink-soft">{t("fromSource", { source: sourceText(n.from) })}</span>
                      {n.debunked && <span className="ml-1 rounded bg-clay px-1 py-px text-[9px] font-bold uppercase text-cream">{t("debunked")}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-parchment/40 p-3">
            <p className={sectionLabel}>{t("scratchpad")}</p>
            <textarea
              value={memos[seat] ?? ""}
              onChange={(e) => setMemos((m) => ({ ...m, [seat]: e.target.value }))}
              placeholder={t("scratchpadPlaceholder")}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-line bg-white/70 px-2.5 py-2 text-xs text-ink outline-none focus:border-clay"
            />
          </div>
        </section>
      </main>

      {trade && (
        <div className="rq-pop fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-10px_rgba(33,26,19,0.3)]">
          <p className={sectionLabel}>{t("tradeProposeTitle", { name: pname(trade.to) })}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{t("tradeHint")}</p>
          <div className="mt-3 space-y-1.5">
            {tradableOf(me).map((c, i) => {
              const sel = trade.clue === i;
              return (
                <div key={i} className={`overflow-hidden rounded-xl border ${sel ? "border-clay bg-amber/5" : "border-line bg-white/70"}`}>
                  <button type="button" onClick={() => setTrade({ ...trade, clue: i })} className="block w-full px-3 py-2 text-left text-sm font-medium text-ink">{factText(c)}</button>
                  {sel && (
                    <div className="border-t border-line/60 p-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => act({ type: "proposerTroc", to: trade.to, clue: i, lie: false })} className={`${pill} flex-1 bg-pine text-cream`}>{t("giveTrue")}</button>
                        <button type="button" onClick={() => act({ type: "proposerTroc", to: trade.to, clue: i, lie: true })} className={`${pill} flex-1 bg-clay text-cream`}>{t("lie")}</button>
                      </div>
                      <p className="mt-1.5 text-center text-[11px] text-clay-deep/80">{t("liePreview", { fact: factText(flipFact(c)) })}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {tradableOf(me).length === 0 && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-soft">{t("nothingToGive")}</p>}
          </div>
          <button type="button" onClick={() => setTrade(null)} className={`${buttonGhost} mt-3 w-full py-2.5`}>{t("cancel")}</button>
        </div>
      )}

      {confirmClaim && (
        <div className="fixed inset-0 z-[60] grid h-[100dvh] place-items-center bg-ink/55 px-6" onClick={() => setConfirmClaim(false)}>
          <div className="rq-pop w-full max-w-sm rounded-3xl border border-line bg-cream p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimConfirmTitle")}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t("claimConfirmBody")}</p>
            <button type="button" onClick={() => { setConfirmClaim(false); act({ type: "reclamer" }); }} className={`${buttonPrimary} mt-5 w-full bg-clay py-3.5 hover:bg-clay-deep`}>{t("claimConfirmGo")}</button>
            <button type="button" onClick={() => setConfirmClaim(false)} className={`${buttonGhost} mt-2 w-full py-2.5`}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <footer className="z-20 shrink-0 border-t border-line/70 bg-cream/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-[11px] text-ink-soft">{t("footerHotseat")}</p>
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
            {ancienHere && (
              <button type="button" onClick={() => act({ type: "interroger", ancien: ancienHere })} className={`${pill} shrink-0 border border-line bg-white text-ink`}>{t("askNpc", { npc: ancienName(ancienHere) })}</button>
            )}
            {rivalsHere.map(({ i }) => (
              <button key={i} type="button" onClick={() => setTrade({ to: i, clue: -1 })} className={`${pill} shrink-0 bg-pine text-cream`}>{t("tradeWith", { name: pname(i) })}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => act({ type: "wait" })} className={`${buttonGhost} flex-1 py-3`}>{t("pass")}</button>
            <button type="button" disabled={blocked} onClick={() => setConfirmClaim(true)} className="shrink-0 rounded-full border-2 border-clay px-5 py-3 text-sm font-semibold text-clay-deep transition hover:bg-clay/10 disabled:opacity-40">{blocked ? t("teamBlocked") : t("claim")}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PassScreen({ seat, color, onReady, label, sub, readyLabel }: { seat: number; color: string; onReady?: () => void; label: string; sub: string; readyLabel: string }) {
  return (
    <div className="fixed inset-0 z-[60] grid h-[100dvh] place-items-center px-6 text-center" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${color}22, var(--color-cream) 60%)` }}>
      <div className="rq-pop w-full max-w-sm">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full font-display text-4xl font-bold text-cream shadow-xl ring-4 ring-cream" style={{ background: color }}>{seat + 1}</span>
        <h1 className="mt-7 font-display text-3xl font-bold leading-tight text-ink">{label}</h1>
        <p className="mt-3 text-sm font-medium text-ink-soft">{sub}</p>
        <button type="button" data-testid="pass-ready" onClick={onReady} className="mt-8 w-full rounded-full py-4 text-base font-bold text-cream shadow-lg transition hover:brightness-105 active:scale-[0.98]" style={{ background: color }}>{readyLabel}</button>
      </div>
    </div>
  );
}

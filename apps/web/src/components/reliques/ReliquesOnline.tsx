"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  LIEUX,
  ADJACENCY,
  ancienAtTile,
  type Fact,
  type Team,
  type LocationId,
} from "@jeux/shared/reliques";
import { Link } from "@/i18n/navigation";
import { useReliquesRoom } from "@/hooks/useReliquesRoom";
import { ReliquesMap } from "./ReliquesMap";
import { ReliquesGame } from "./ReliquesGame";
import { PAWN_COLORS } from "@/components/reliques/positions";
import { buttonPrimary, buttonGhost, sectionLabel, pill } from "@/lib/ui";

const TutorialPlayer = dynamic(
  () => import("@/components/reliques/video/TutorialPlayer").then((m) => m.TutorialPlayer),
  { ssr: false },
);

// Version RETOURNÉE d'une info (ce que reçoit l'autre si on ment) - pour l'aperçu.
const flipFact = (f: Fact): Fact =>
  f.kind === "loc" ? { ...f, neg: !f.neg } : f.kind === "aff" ? { ...f, relic: f.relic === "soleil" ? "lune" : "soleil" } : { ...f, same: !f.same };

export function ReliquesOnline({ guestName }: { guestName?: string } = {}) {
  const t = useTranslations("reliques");
  type Key = Parameters<typeof t>[0];
  const lieuName = (id: string) => t(`locations.${id}` as Key);
  const shortName = (id: string) => t(`locationsShort.${id}` as Key);
  const teamLabel = (tm: Team) => t(tm === "soleil" ? "teamSoleil" : "teamLune");
  const ancienName = (id: string) => t(`npc.${id}` as Key);
  const room = useReliquesRoom(guestName);
  const [code, setCode] = useState("");
  const [trade, setTrade] = useState<number | null>(null);
  const [memo, setMemo] = useState(""); // bloc-notes libre
  const [flash, setFlash] = useState("");
  const [reveal, setReveal] = useState<{ kind: "info"; fact: Fact; from: number | string } | { kind: "empty"; ancien: string } | null>(null);
  const [confirmClaim, setConfirmClaim] = useState(false); // garde-fou avant de réclamer
  const [claimAck, setClaimAck] = useState(""); // retour de réclamation ratée déjà vu

  // Démasquage : quand une note reçue d'un joueur devient « démentie » (recoupée par un
  // ancien), on signale le menteur une seule fois.
  const seenLies = useRef(new Set<string>());
  useEffect(() => {
    const v = room.view;
    if (!v) return;
    for (const n of v.notes) {
      if (!n.debunked || typeof n.from !== "number") continue;
      const k = `${n.turn}|${n.from}|${JSON.stringify(n.fact)}`;
      if (seenLies.current.has(k)) continue;
      seenLies.current.add(k);
      const liar = v.players.find((p) => p.seat === n.from)?.name ?? t("player", { n: n.from + 1 });
      setFlash(t("caughtLie", { name: liar }));
    }
  }, [room.view, t]);
  // Affichage en grand de chaque NOUVELLE info reçue (on n'annonce pas l'existant au 1er rendu).
  const seenNotes = useRef<Set<string> | null>(null);
  const askRef = useRef<string | null>(null); // ancien qu'on vient d'interroger (pour détecter « rien de nouveau »)
  useEffect(() => {
    const v = room.view;
    if (!v) return;
    const keys = v.notes.map((n) => `${n.turn}|${typeof n.from === "number" ? "p" + n.from : n.from}|${JSON.stringify(n.fact)}`);
    if (seenNotes.current === null) { seenNotes.current = new Set(keys); return; }
    let gotNew = false;
    v.notes.forEach((n, i) => {
      if (seenNotes.current!.has(keys[i]!)) return;
      seenNotes.current!.add(keys[i]!);
      gotNew = true;
      if (!n.debunked) setReveal({ kind: "info", fact: n.fact, from: n.from });
    });
    // mon interrogation traitée sans nouvelle note → l'ancien n'avait plus rien.
    if (askRef.current && !gotNew && v.current !== v.you) {
      setReveal({ kind: "empty", ancien: askRef.current });
      askRef.current = null;
    } else if (gotNew) {
      askRef.current = null;
    }
  }, [room.view]);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(""), 3200);
    return () => clearTimeout(id);
  }, [flash]);

  // Pas de serveur configuré → repli hotseat (un seul écran).
  if (!room.configured) return <ReliquesGame />;

  const { lobby, view } = room;

  const pname = (s: number) => view?.players.find((p) => p.seat === s)?.name ?? t("player", { n: s + 1 });
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

  // ---------- Accueil : créer ou rejoindre ----------
  if (!lobby && !view) {
    return (
      <section className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("onlineTag")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink">{t("onlineTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("onlineIntro")}</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-parchment p-2">
          <TutorialPlayer />
        </div>
        <p className="mt-1 text-center text-xs text-ink-soft/70">{t("tutorialCaption")}</p>
        {!room.connected && <p className="mt-3 rounded-lg bg-amber/10 px-3 py-2 text-sm text-clay-deep">{t("connecting")}</p>}
        {room.error && <p className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay-deep">{room.error}</p>}
        <button type="button" disabled={!room.connected} onClick={() => room.create(t("matchName"))} className={`${buttonPrimary} mt-6 w-full py-4 text-base disabled:opacity-40`}>{t("createRoom")}</button>
        <div className="mt-5 flex items-center gap-3">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={4} placeholder={t("codePlaceholder")} className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-center font-display text-2xl font-bold uppercase tracking-[0.3em] text-ink outline-none focus:border-clay" />
          <button type="button" disabled={!room.connected || code.length < 4} onClick={() => room.join(code)} className={`${buttonGhost} shrink-0 px-6 py-3 disabled:opacity-40`}>{t("join")}</button>
        </div>
        <div className="mt-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft/50">
          <span className="h-px flex-1 bg-line" />{t("orSeparator")}<span className="h-px flex-1 bg-line" />
        </div>
        <Link href="/play/table" className={`${buttonGhost} mt-5 w-full py-4 text-center text-base`}>{t("oneScreenCta")}</Link>
        <p className="mt-1 text-center text-xs text-ink-soft/70">{t("oneScreenHint")}</p>
      </section>
    );
  }

  // ---------- Lobby ----------
  if (lobby && (!view || lobby.status === "lobby")) {
    const meHost = lobby.players.find((p) => p.isHost);
    const canStart = lobby.players.length >= 4 && lobby.players.length % 2 === 0;
    if (lobby.status === "in_progress" && !view) {
      return <section className="grid min-h-[100dvh] place-items-center text-ink-soft">{t("joiningGame")}</section>;
    }
    return (
      <section className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-12">
        <p className={sectionLabel}>{t("lobbyShareLabel")}</p>
        <div className="mt-2 rounded-2xl border border-clay/40 bg-amber/10 py-6 text-center font-display text-5xl font-bold uppercase tracking-[0.4em] text-clay-deep">{lobby.id}</div>
        <p className="mt-5 text-sm text-ink-soft">{t("lobbyCount", { n: lobby.players.length })}</p>
        <ul className="mt-3 space-y-2">
          {lobby.players.map((p) => (
            <li key={p.userId} className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-4 py-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-cream" style={{ background: PAWN_COLORS[p.seat % PAWN_COLORS.length] }}>{p.seat + 1}</span>
              <span className="flex-1 font-medium text-ink">{p.username}{p.isHost ? t("hostSuffix") : ""}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${p.connected ? "bg-pine" : "bg-line"}`} />
            </li>
          ))}
        </ul>
        {room.error && <p className="mt-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay-deep">{room.error}</p>}
        <div className="mt-6 flex gap-3">
          {meHost && <button type="button" disabled={!canStart} onClick={room.start} className={`${buttonPrimary} flex-1 py-3.5 disabled:opacity-40`}>{canStart ? t("startGame") : t("needEven")}</button>}
          <button type="button" onClick={room.leave} className={`${buttonGhost} px-6 py-3.5`}>{t("leave")}</button>
        </div>
        {!meHost && <p className="mt-3 text-center text-xs text-ink-soft">{t("waitingHost")}</p>}
      </section>
    );
  }

  if (!view) return null;

  // ---------- Info reçue / rien de nouveau (affiché en grand) ----------
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
          <button type="button" onClick={() => setReveal(null)} className={`${buttonPrimary} mt-6 w-full py-3.5`}>{t("gotIt")}</button>
        </div>
      </div>
    );
  }

  // ---------- Retour d'une réclamation ratée ----------
  if (view.lastClaim && `${view.lastClaim.by}:${view.lastClaim.turn}` !== claimAck && view.phase === "play") {
    const key = `${view.lastClaim.by}:${view.lastClaim.turn}`;
    const sr = view.lastClaim.someRight;
    return (
      <div className="fixed inset-0 z-[64] grid h-[100dvh] place-items-center bg-ink/55 px-6">
        <div className="rq-pop w-full max-w-sm rounded-3xl border border-line bg-cream p-6 text-center shadow-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimFailedTitle")}</p>
          <p className="mt-3 text-sm text-ink">{t("claimFailedBlocked", { name: pname(view.lastClaim.by) })}</p>
          {sr !== null && <p className="mt-2 text-sm font-medium text-clay-deep">{sr ? t("claimFailedDivided") : t("claimFailedNobody")}</p>}
          <button type="button" onClick={() => setClaimAck(key)} className={`${buttonPrimary} mt-5 w-full py-3.5`}>{t("gotIt")}</button>
        </div>
      </div>
    );
  }

  // ---------- Fin ----------
  if (view.phase === "over" || room.winner) {
    const w = view.winner ?? room.winner;
    return (
      <section className="mx-auto min-h-[100dvh] max-w-md px-6 py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("endTag")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">{w ? t("cultWins", { team: teamLabel(w) }) : t("nobodyWins")}</h1>
        <p className={`mt-3 font-display text-lg ${w === view.team ? "text-pine" : "text-clay-deep"}`}>{w === view.team ? t("yourSideWon") : t("yourSideLost")}</p>
        {view.reveal && (
          <div className="mt-6 rounded-2xl border border-line bg-parchment/50 p-4 text-left text-sm text-ink-soft">
            <p>{t("reveal", { soleil: lieuName(view.reveal.soleil), lune: lieuName(view.reveal.lune) })}</p>
          </div>
        )}
        {view.lies && view.lies.length > 0 && (
          <div className="mt-5 rounded-2xl border border-clay/30 bg-clay/5 p-4 text-left">
            <p className={sectionLabel}>{t("liesTitle")}</p>
            <ul className="mt-2 space-y-1.5">
              {view.lies.map((l, i) => (
                <li key={i} className="text-xs"><span className="font-semibold text-ink">{factText(l.fact)}</span><span className="ml-1 text-ink-soft">{t("lieMeta", { from: pname(l.from), to: pname(l.to), turn: l.turn })}</span></li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" onClick={room.leave} className={`${buttonPrimary} mt-8 w-full py-3.5`}>{t("leave")}</button>
      </section>
    );
  }

  // ---------- Réclamation ----------
  if (view.phase === "claim") {
    if (view.youSubmitted) {
      return (
        <div className="fixed inset-0 z-[60] grid h-[100dvh] place-items-center px-6 text-center" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${PAWN_COLORS[view.you % PAWN_COLORS.length]}22, var(--color-cream) 60%)` }}>
          <div className="w-full max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimTriggered", { name: pname(view.claimBy ?? 0) })}</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink">{t("claimWaiting")}</h1>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-cream">
        <header className="shrink-0 border-b border-line/70 bg-cream/90 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimTriggered", { name: pname(view.claimBy ?? 0) })}</p>
          <h1 className="mt-1 font-display text-xl font-bold leading-tight text-ink">{t("claimQuestion", { team: teamLabel(view.team) })}</h1>
          <p className="mt-1 text-xs text-ink-soft">{t("claimHint")}</p>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-3">
          <div className="overflow-hidden rounded-[1.4rem] border border-line bg-parchment/60 p-2">
            <ReliquesMap players={view.players} seat={view.you} reachable={new Set<LocationId>()} shortName={shortName} onPick={() => {}} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 pb-4">
            {LIEUX.map((r) => (
              <button key={r} type="button" onClick={() => room.submit({ type: "claim", lieu: r })} className={`${pill} bg-amber/15 px-2 py-3 text-center text-sm leading-tight text-clay-deep`}>{lieuName(r)}</button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ---------- Jeu ----------
  const me = view;
  // Tout ce qu'on peut relayer en troc (ce qu'on a appris, hors infos démenties).
  const myTradable = me.notes.filter((n) => !n.debunked).map((n) => n.fact);
  const isMyTurn = view.current === view.you;
  const myTile = me.tile as LocationId;
  const reachable = new Set<LocationId>(ADJACENCY[myTile] ?? []);
  const ancienHere = ancienAtTile(myTile);
  const rivalsHere = me.players.filter((p) => p.seat !== me.you && p.tile === myTile);
  const color = PAWN_COLORS[me.you % PAWN_COLORS.length]!;

  const send = (action: unknown) => {
    room.submit(action);
    setTrade(null);
  };

  return (
    <div className="fixed inset-0 z-[55] flex h-[100dvh] flex-col bg-cream">
      <header className="z-10 shrink-0 border-b border-line/70 bg-cream/85 px-4 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream">{t("round", { turn: me.turn })}</span>
          <span className="rounded-full bg-amber/20 px-3 py-1.5 text-sm font-bold text-clay-deep">{teamLabel(me.team)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isMyTurn ? "bg-pine text-cream" : "bg-line text-ink-soft"}`}>{isMyTurn ? t("yourTurn") : t("turnOf", { name: pname(me.current) })}</span>
          <div className="flex-1" />
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="grid h-8 w-8 place-items-center rounded-full font-display text-sm font-bold text-cream ring-2 ring-cream" style={{ background: color }}>{me.you + 1}</span>
            <span className="max-w-[7rem] truncate text-sm font-semibold text-ink">{pname(me.you)}</span>
          </span>
        </div>
      </header>

      {flash && <div className="rq-pop pointer-events-none fixed inset-x-0 top-[60px] z-30 mx-auto w-fit max-w-[90%] rounded-full bg-ink/90 px-4 py-2 text-center text-sm font-semibold text-cream shadow-lg">{flash}</div>}

      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pb-32 lg:grid lg:max-w-6xl lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-5 lg:pb-5">
        <section className="mt-3 lg:sticky lg:top-3">
          <div className="overflow-hidden rounded-[1.4rem] border border-line bg-parchment/60 p-2">
            <ReliquesMap players={me.players} seat={me.you} reachable={isMyTurn ? reachable : new Set()} shortName={shortName} onPick={(id) => send({ type: "move", to: id })} />
          </div>
        </section>

        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-line bg-white/70 p-3">
            <p className={sectionLabel}>{t("playersTitle")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {me.players.map((p) => (
                <span key={p.seat} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${p.seat === me.you ? "border-clay bg-amber/10" : "border-line bg-white/70"}`}>
                  <span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-cream" style={{ background: PAWN_COLORS[p.seat % PAWN_COLORS.length] }}>{p.seat + 1}</span>
                  <span className="font-medium text-ink">{pname(p.seat)}</span>
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
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={t("scratchpadPlaceholder")} rows={4} className="mt-2 w-full resize-none rounded-lg border border-line bg-white/70 px-2.5 py-2 text-xs text-ink outline-none focus:border-clay" />
          </div>
        </section>
      </main>

      {/* Je propose un échange à un voisin : je choisis ma carte, vraie ou retournée. */}
      {trade !== null && !me.pendingTrade && (
        <div className="rq-pop fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-10px_rgba(33,26,19,0.3)]">
          <p className={sectionLabel}>{t("tradeProposeTitle", { name: pname(trade) })}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{t("tradeHint")}</p>
          <div className="mt-3 space-y-2">
            {myTradable.map((c, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-line bg-white/70">
                <p className="px-3 py-2 text-sm font-medium text-ink">{factText(c)}</p>
                <div className="border-t border-line/60 p-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => send({ type: "proposerTroc", to: trade, clue: i, lie: false })} className={`${pill} flex-1 bg-pine text-cream`}>{t("giveTrue")}</button>
                    <button type="button" onClick={() => send({ type: "proposerTroc", to: trade, clue: i, lie: true })} className={`${pill} flex-1 bg-clay text-cream`}>{t("lie")}</button>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] text-clay-deep/80">{t("liePreview", { fact: factText(flipFact(c)) })}</p>
                </div>
              </div>
            ))}
            {myTradable.length === 0 && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-soft">{t("nothingToGive")}</p>}
          </div>
          <button type="button" onClick={() => setTrade(null)} className={`${buttonGhost} mt-3 w-full py-2.5`}>{t("cancel")}</button>
        </div>
      )}

      {/* On me propose un échange : j'accepte en rendant une carte (vraie ou retournée), ou je refuse. */}
      {me.pendingTrade && me.pendingTrade.to === me.you && (
        <div className="rq-pop fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-clay/40 bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-10px_rgba(33,26,19,0.3)]">
          <p className={sectionLabel}>{t("tradeIncomingTitle", { name: pname(me.pendingTrade.from) })}</p>
          <p className="mt-1 text-xs text-ink-soft">{t("tradeGiveBack")}</p>
          <div className="mt-3 space-y-2">
            {myTradable.length === 0 && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-soft">{t("nothingToGive")}</p>}
            {myTradable.map((c, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-line bg-white/70">
                <p className="px-3 py-2 text-sm font-medium text-ink">{factText(c)}</p>
                <div className="border-t border-line/60 p-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => room.submit({ type: "repondreTroc", accept: true, clue: i, lie: false })} className={`${pill} flex-1 bg-pine text-cream`}>{t("giveTrue")}</button>
                    <button type="button" onClick={() => room.submit({ type: "repondreTroc", accept: true, clue: i, lie: true })} className={`${pill} flex-1 bg-clay text-cream`}>{t("lie")}</button>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] text-clay-deep/80">{t("liePreview", { fact: factText(flipFact(c)) })}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => room.submit({ type: "repondreTroc", accept: false })} className={`${buttonGhost} mt-3 w-full py-2.5`}>{t("refuse")}</button>
        </div>
      )}

      {/* J'ai proposé, j'attends la réponse. */}
      {me.pendingTrade && me.pendingTrade.from === me.you && (
        <div className="rq-pop fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center shadow-[0_-10px_40px_-10px_rgba(33,26,19,0.3)]">
          <p className="text-sm font-semibold text-ink">{t("tradeWaiting", { name: pname(me.pendingTrade.to) })}</p>
          <button type="button" onClick={() => room.submit({ type: "repondreTroc", accept: false })} className={`${buttonGhost} mt-2 px-6 py-2.5`}>{t("cancel")}</button>
        </div>
      )}

      {confirmClaim && (
        <div className="fixed inset-0 z-[60] grid h-[100dvh] place-items-center bg-ink/55 px-6" onClick={() => setConfirmClaim(false)}>
          <div className="rq-pop w-full max-w-sm rounded-3xl border border-line bg-cream p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{t("claimConfirmTitle")}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t("claimConfirmBody")}</p>
            <button type="button" onClick={() => { setConfirmClaim(false); send({ type: "reclamer" }); }} className={`${buttonPrimary} mt-5 w-full bg-clay py-3.5 hover:bg-clay-deep`}>{t("claimConfirmGo")}</button>
            <button type="button" onClick={() => setConfirmClaim(false)} className={`${buttonGhost} mt-2 w-full py-2.5`}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <footer className="z-20 shrink-0 border-t border-line/70 bg-cream/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-[11px] text-ink-soft">{isMyTurn ? t("footerYourTurn") : t("footerWaiting", { name: pname(me.current) })}</p>
          {isMyTurn && !me.pendingTrade && (
            <>
              <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
                {ancienHere && (
                  <button type="button" onClick={() => { askRef.current = ancienHere; send({ type: "interroger", ancien: ancienHere }); }} className={`${pill} shrink-0 border border-line bg-white text-ink`}>{t("askNpc", { npc: ancienName(ancienHere) })}</button>
                )}
                {rivalsHere.map((p) => (
                  <button key={p.seat} type="button" onClick={() => setTrade(p.seat)} className={`${pill} shrink-0 bg-pine text-cream`}>{t("tradeWith", { name: pname(p.seat) })}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => send({ type: "wait" })} className={`${buttonGhost} flex-1 py-3`}>{t("pass")}</button>
                <button type="button" disabled={me.teamBlocked} onClick={() => setConfirmClaim(true)} className="shrink-0 rounded-full border-2 border-clay px-5 py-3 text-sm font-semibold text-clay-deep transition hover:bg-clay/10 disabled:opacity-40">{me.teamBlocked ? t("teamBlocked") : t("claim")}</button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

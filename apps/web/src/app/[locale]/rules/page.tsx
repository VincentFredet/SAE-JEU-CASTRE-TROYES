import { getTranslations } from "next-intl/server";
import { LOCATION_IDS } from "@jeux/shared/reliques";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { buttonPrimary } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";
import { BoardMap } from "@/components/game/BoardMap";

type Props = { params: Promise<{ locale: string }> };
type Lever = { name: string; text: string };

export default async function RulesPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("rules");
  const rt = await getTranslations("reliques");

  const turnOptions = t.raw("turnOptions") as string[];
  const npcLevers = t.raw("npcLevers") as Lever[];
  const exDedClues = t.raw("exDedClues") as string[];
  const exDedClues2 = t.raw("exDedClues2") as string[];
  const recapSteps = t.raw("recapSteps") as string[];
  const locations = Object.fromEntries(LOCATION_IDS.map((id) => [id, rt(`locations.${id}`)]));
  const locationsShort = Object.fromEntries(LOCATION_IDS.map((id) => [id, rt(`locationsShort.${id}`)]));

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-32 h-[30rem] w-[30rem] rounded-full bg-amber/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[44rem] h-96 w-96 rounded-full bg-pine/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        {/* Header */}
        <header>
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              {t("workingTitle")}
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-7xl font-semibold leading-[0.95] tracking-tight text-gradient sm:text-8xl">
              {t("title")}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink sm:text-2xl">
              {t("tagline")}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("meta")}
            </p>
          </Reveal>
        </header>

        {/* L'histoire */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <Reveal dir="left">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              {t("storyTag")}
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {t("storyTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("storyBody1")}</p>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{t("storyBody2")}</p>
          </Reveal>
          <Reveal dir="right" delay={120}>
            <Tilt max={5}>
              <div className="grain overflow-hidden rounded-[2rem] border border-line bg-cream p-3 shadow-[0_40px_80px_-45px_rgba(33,26,19,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/hero.png" alt="" aria-hidden className="aspect-[3/2] w-full rounded-[1.4rem] object-cover" />
              </div>
            </Tilt>
          </Reveal>
        </div>

        {/* Le but */}
        <Reveal dir="up" className="mt-16">
          <div className="rounded-[2rem] border border-amber/40 bg-amber/10 p-8 sm:p-10">
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{t("goalTitle")}</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-clay-deep">{t("goalBody")}</p>
          </div>
        </Reveal>

        {/* Un tour de jeu */}
        <div className="mt-16">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("turnTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("turnIntro")}</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {turnOptions.map((opt, i) => (
              <Reveal key={opt} dir="up" delay={i * 100}>
                <div className="flex items-center gap-4 rounded-2xl border border-line bg-white/70 p-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/10 font-display text-lg font-semibold text-clay">
                    {i + 1}
                  </span>
                  <span className="font-medium leading-relaxed text-ink">{opt}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Parler à un PNJ */}
        <div className="mt-20 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal dir="left">
            <Tilt max={5}>
              <div className="grain overflow-hidden rounded-[2rem] border border-line bg-cream p-3 shadow-[0_40px_80px_-45px_rgba(33,26,19,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/rules-npc.png" alt="" aria-hidden className="aspect-square w-full rounded-[1.4rem] object-cover" />
              </div>
            </Tilt>
          </Reveal>
          <Reveal dir="right" delay={100}>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("npcTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("npcIntro")}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-pine/30 bg-pine/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
                  {t("npcPublicLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("npcPublicText")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-ink p-5 text-cream">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
                  {t("npcPrivateLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream/80">{t("npcPrivateText")}</p>
              </div>
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {t("npcPayIntro")}
            </p>
            <div className="mt-3 space-y-3">
              {npcLevers.map((lever) => (
                <div key={lever.name} className="rounded-2xl border border-line bg-white/70 p-5">
                  <h3 className="font-display text-lg font-semibold text-ink">{lever.name}</h3>
                  <p className="mt-1 leading-relaxed text-ink-soft">{lever.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Concret : deux exemples travaillés */}
        <div className="mt-20">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">{t("exTag")}</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{t("exTitle")}</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            <Reveal dir="up">
              <article className="rounded-[2rem] border border-line bg-white/70 p-7">
                <h3 className="font-display text-2xl font-semibold text-ink">{t("exDedTitle")}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{t("exDedIntro")}</p>
                <ul className="mt-4 space-y-1.5">
                  {exDedClues.map((c, i) => (
                    <li key={i} className="rounded-lg border-l-[3px] border-pine/50 bg-pine/5 px-3 py-1.5 text-sm font-medium text-ink">{c}</li>
                  ))}
                </ul>
                <p className="mt-3 font-semibold text-clay-deep">{t("exDedMid")}</p>
                <ul className="mt-3 space-y-1.5">
                  {exDedClues2.map((c, i) => (
                    <li key={i} className="rounded-lg border-l-[3px] border-pine/50 bg-pine/5 px-3 py-1.5 text-sm font-medium text-ink">{c}</li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-amber/10 px-4 py-3 font-semibold text-clay-deep">{t("exDedDone")}</p>
              </article>
            </Reveal>
            <Reveal dir="up" delay={100}>
              <article className="rounded-[2rem] border border-line bg-white/70 p-7">
                <h3 className="font-display text-2xl font-semibold text-ink">{t("exLieTitle")}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{t("exLieIntro")}</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border-l-[3px] border-amber/60 bg-amber/10 px-3 py-1.5 text-sm font-medium text-ink">{t("exLiePlayer")}</div>
                  <p className="text-sm leading-relaxed text-ink-soft">{t("exLieTrap")}</p>
                  <div className="rounded-lg border-l-[3px] border-pine/50 bg-pine/5 px-3 py-1.5 text-sm font-medium text-ink">{t("exLieAncien")}</div>
                  <div className="rounded-lg border-l-[3px] border-clay/60 bg-clay/10 px-3 py-1.5 text-sm font-medium text-ink-soft line-through">{t("exLiePlayer")}</div>
                  <p className="text-sm font-semibold text-clay-deep">{t("exLieCaught")}</p>
                </div>
                <p className="mt-4 rounded-xl bg-pine/10 px-4 py-3 text-sm font-semibold text-pine">{t("exLieMoral")}</p>
              </article>
            </Reveal>
          </div>
        </div>

        {/* Démêler + Gagner */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <Reveal dir="left">
            <Tilt className="h-full">
              <article className="grain flex h-full flex-col rounded-[2rem] border border-line bg-white/70 p-9">
                <h2 className="font-display text-3xl font-semibold leading-tight text-ink">
                  {t("deduceTitle")}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-soft">{t("deduceBody")}</p>
              </article>
            </Tilt>
          </Reveal>
          <Reveal dir="right" delay={100}>
            <Tilt className="h-full">
              <article className="grain flex h-full flex-col rounded-[2rem] bg-ink p-9 text-cream shadow-[0_30px_60px_-35px_rgba(33,26,19,0.6)]">
                <span className="font-display text-6xl font-semibold leading-none text-amber">*</span>
                <h2 className="mt-6 font-display text-3xl font-semibold leading-tight">{t("winTitle")}</h2>
                <p className="mt-3 leading-relaxed text-cream/80">{t("winBody")}</p>
              </article>
            </Tilt>
          </Reveal>
        </div>

        {/* En résumé */}
        <div className="mt-20">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("recapTitle")}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {recapSteps.map((step, i) => (
              <Reveal key={i} dir="up" delay={(i % 2) * 90}>
                <div className="flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clay font-display text-base font-semibold text-cream">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-ink">{step}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* L'app */}
        <Reveal dir="up" className="mt-12">
          <div className="flex items-start gap-4 rounded-2xl border border-line bg-parchment/60 px-6 py-5">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber/15 font-display text-base font-semibold text-clay-deep">
              ?
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">{t("appTitle")}</h3>
              <p className="mt-1 leading-relaxed text-ink-soft">{t("appBody")}</p>
            </div>
          </div>
        </Reveal>

        {/* La carte (en bas) + overlay non contractuel */}
        <div className="mt-20">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t("mapTitle")}
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("mapBody")}</p>
          </Reveal>
          <Reveal dir="scale" delay={80}>
            <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-line bg-parchment p-3 shadow-[0_40px_80px_-45px_rgba(33,26,19,0.5)] sm:p-4">
              <BoardMap locations={locations} short={locationsShort} />
              <div className="pointer-events-none absolute inset-x-0 bottom-5 grid place-items-center">
                <span className="-rotate-3 rounded-xl border border-cream/40 bg-ink/70 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                  {t("mapDisclaimer")}
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal dir="scale" className="mt-20">
          <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-20 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-clay/40 blur-3xl animate-float"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-amber/30 blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            />
            <h2 className="relative font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
              {t("title")}
            </h2>
            <div className="relative mt-10">
              <Link
                href="/play"
                className={`${buttonPrimary} bg-cream px-9 py-4 text-base text-ink hover:bg-clay hover:text-cream`}
              >
                {t("ctaPlay")}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

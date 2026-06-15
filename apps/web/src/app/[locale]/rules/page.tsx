import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { buttonPrimary } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";
import { BoardMap } from "@/components/game/BoardMap";

type Props = { params: Promise<{ locale: string }> };

type ActionRow = { name: string; public: string; trace: string };
type Mission = { name: string; steps: string };
type Locations = {
  temple: string;
  tomb: string;
  sanctuary: string;
  camp: string;
  bazaar: string;
  jungle: string;
  docks: string;
};

const MISSION_TONES = [
  "bg-clay/10 text-clay",
  "bg-pine/10 text-pine",
  "bg-amber/15 text-clay-deep",
  "bg-ink/10 text-ink",
] as const;

export default async function RulesPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("rules");

  const tableItems = t.raw("tableItems") as string[];
  const appItems = t.raw("appItems") as string[];
  const actions = t.raw("actions") as ActionRow[];
  const missions = t.raw("missions") as Mission[];
  const locations = t.raw("locations") as Locations;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-32 h-[30rem] w-[30rem] rounded-full bg-amber/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[40rem] h-96 w-96 rounded-full bg-pine/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-[90rem] h-96 w-96 rounded-full bg-clay/15 blur-3xl animate-float-slow"
        style={{ animationDelay: "1s" }}
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

        {/* Pitch */}
        <Reveal dir="left" className="mt-20">
          <article className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-12">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] bg-clay/10 font-display text-3xl font-semibold text-clay">
              01
            </span>
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {t("pitchTitle")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("pitchBody")}</p>
            </div>
          </article>
        </Reveal>

        {/* Coeur hybride : deux panneaux */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("hybridTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {t("hybridIntro")}
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal dir="left" delay={60}>
              <Tilt className="h-full">
                <div className="grain flex h-full flex-col rounded-[2rem] border border-line bg-white/70 p-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                    {t("tableLabel")}
                  </span>
                  <ul className="mt-6 space-y-4">
                    {tableItems.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pine" />
                        <span className="leading-relaxed text-ink">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Tilt>
            </Reveal>

            <Reveal dir="right" delay={140}>
              <Tilt className="h-full">
                <div className="grain flex h-full flex-col rounded-[2rem] bg-ink p-8 text-cream shadow-[0_30px_60px_-35px_rgba(33,26,19,0.6)]">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                    {t("appLabel")}
                  </span>
                  <ul className="mt-6 space-y-4">
                    {appItems.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber" />
                        <span className="leading-relaxed text-cream/85">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Tilt>
            </Reveal>
          </div>
        </div>

        {/* La carte */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("mapTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("mapIntro")}</p>
          </Reveal>

          <Reveal dir="scale" delay={120}>
            <Tilt max={4}>
              <div className="grain relative mt-10 overflow-hidden rounded-[2rem] border border-line bg-parchment p-6 shadow-[0_40px_80px_-45px_rgba(33,26,19,0.45)] sm:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber/25 blur-2xl animate-float"
                />
                <div className="relative mx-auto max-w-2xl">
                  <BoardMap
                    locations={locations}
                    hubLabel={t("mapHub")}
                    extractLabel={t("mapExtract")}
                  />
                </div>
              </div>
            </Tilt>
          </Reveal>

          <Reveal dir="up" delay={80}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">{t("mapNote")}</p>
          </Reveal>
        </div>

        {/* Les 5 actions */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("actionsTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {t("actionsIntro")}
            </p>
          </Reveal>

          <div className="mt-12 space-y-4">
            <Reveal dir="up">
              <div className="hidden grid-cols-[2.5rem_1fr_1.1fr_1fr] gap-4 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft sm:grid">
                <span />
                <span>{t("colAction")}</span>
                <span>{t("colPublic")}</span>
                <span>{t("colTrace")}</span>
              </div>
            </Reveal>
            {actions.map((a, i) => (
              <Reveal key={a.name} dir="left" delay={i * 60}>
                <Tilt max={4}>
                  <article className="grain grid grid-cols-1 gap-3 rounded-[1.5rem] border border-line bg-white/70 p-6 transition hover:border-clay/40 hover:shadow-[0_20px_50px_-30px_rgba(162,74,31,0.4)] sm:grid-cols-[2.5rem_1fr_1.1fr_1fr] sm:items-center sm:gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-clay/10 font-display text-lg font-semibold text-clay">
                      {i + 1}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-ink">{a.name}</h3>
                    <p className="leading-relaxed text-ink-soft">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft/70 sm:hidden">
                        {t("colPublic")}:{" "}
                      </span>
                      {a.public}
                    </p>
                    <p className="leading-relaxed text-ink-soft">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft/70 sm:hidden">
                        {t("colTrace")}:{" "}
                      </span>
                      {a.trace}
                    </p>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>

          <Reveal dir="right" delay={80}>
            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-amber/40 bg-amber/10 px-5 py-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber font-display text-sm font-semibold text-ink">
                !
              </span>
              <p className="text-sm font-medium leading-relaxed text-clay-deep">
                {t("constraintsNote")}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Les missions */}
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("missionsTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {t("missionsBody")}
            </p>
          </Reveal>

          <Reveal dir="left" delay={120}>
            <p className="mt-12 font-display text-2xl font-semibold text-ink">
              {t("missionsExamplesTitle")}
            </p>
          </Reveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {missions.map((m, i) => (
              <Reveal key={m.name} dir={i % 2 === 0 ? "left" : "right"} delay={(i % 2) * 80}>
                <Tilt className="h-full">
                  <article className="grain flex h-full flex-col rounded-[2rem] border border-line bg-white/70 p-8 transition hover:border-clay/40 hover:shadow-[0_25px_55px_-30px_rgba(162,74,31,0.4)]">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-semibold ${MISSION_TONES[i % MISSION_TONES.length]}`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-semibold text-ink">{m.name}</h3>
                    <p className="mt-3 leading-relaxed text-ink-soft">{m.steps}</p>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Tour de jeu + extraction finale */}
        <div className="mt-24 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <Reveal dir="left">
            <Tilt className="h-full">
              <article className="grain flex h-full flex-col rounded-[2rem] border border-line bg-white/70 p-9">
                <span className="font-display text-6xl font-semibold leading-none text-gradient">
                  {"->"}
                </span>
                <h2 className="mt-6 font-display text-3xl font-semibold leading-tight text-ink">
                  {t("turnTitle")}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-soft">{t("turnBody")}</p>
              </article>
            </Tilt>
          </Reveal>

          <Reveal dir="right" delay={100}>
            <Tilt className="h-full">
              <article className="grain relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink p-9 text-cream shadow-[0_30px_60px_-35px_rgba(33,26,19,0.65)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-clay/40 blur-3xl animate-float"
                />
                <span className="relative font-display text-6xl font-semibold leading-none text-amber">
                  *
                </span>
                <h2 className="relative mt-6 font-display text-3xl font-semibold leading-tight">
                  {t("climaxTitle")}
                </h2>
                <p className="relative mt-3 leading-relaxed text-cream/75">{t("climaxBody")}</p>
              </article>
            </Tilt>
          </Reveal>
        </div>

        {/* Se renseigner + accuser */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2">
          <Reveal dir="left">
            <Tilt className="h-full">
              <article className="grain flex h-full flex-col rounded-[2rem] border border-line bg-parchment/60 p-8">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                  {t("infoTitle")}
                </span>
                <p className="mt-4 leading-relaxed text-ink-soft">{t("infoBody")}</p>
              </article>
            </Tilt>
          </Reveal>
          <Reveal dir="right" delay={100}>
            <Tilt className="h-full">
              <article className="grain flex h-full flex-col rounded-[2rem] border border-line bg-parchment/60 p-8">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                  {t("accuseTitle")}
                </span>
                <p className="mt-4 leading-relaxed text-ink-soft">{t("accuseBody")}</p>
              </article>
            </Tilt>
          </Reveal>
        </div>

        {/* Fin de partie */}
        <Reveal dir="up" className="mt-20">
          <article className="flex flex-col gap-6 sm:ml-16 sm:flex-row sm:items-start sm:gap-12 sm:text-right">
            <div className="order-2 max-w-2xl sm:order-1">
              <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {t("endTitle")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("endBody")}</p>
            </div>
            <span className="order-1 grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] bg-pine/10 font-display text-3xl font-semibold text-pine sm:order-2">
              {String(actions.length + 1).padStart(2, "0")}
            </span>
          </article>
        </Reveal>

        {/* CTA */}
        <Reveal dir="scale" className="mt-24">
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

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { buttonPrimary } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";

type Props = { params: Promise<{ locale: string }> };

const TONES = [
  "bg-clay/10 text-clay",
  "bg-pine/10 text-pine",
  "bg-amber/15 text-clay-deep",
  "bg-ink/10 text-ink",
] as const;

export default async function RulesPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("rules");

  const facts = [
    { label: t("players"), value: t("playersValue") },
    { label: t("duration"), value: t("durationValue") },
    { label: t("age"), value: t("ageValue") },
  ];

  const sections = [
    { title: t("objectiveTitle"), body: t("objectiveBody") },
    { title: t("setupTitle"), body: t("setupBody") },
    { title: t("turnTitle"), body: t("turnBody") },
    { title: t("endTitle"), body: t("endBody") },
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-32 h-[28rem] w-[28rem] rounded-full bg-amber/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-80 h-96 w-96 rounded-full bg-pine/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        {/* Bandeau magazine */}
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("title")}
          </span>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {t("title")}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t("subtitle")}</p>
        </Reveal>

        {/* Bandeau draft */}
        <Reveal dir="left" delay={220}>
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-amber/40 bg-amber/10 px-5 py-4">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber font-display text-sm font-semibold text-ink">
              !
            </span>
            <p className="text-sm font-medium leading-relaxed text-clay-deep">{t("draft")}</p>
          </div>
        </Reveal>

        {/* Quick facts strip */}
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal key={f.label} dir="up" delay={i * 110}>
              <Tilt>
                <div className="grain group flex h-full flex-col justify-between rounded-[1.75rem] border border-line bg-white/70 p-7 transition hover:border-clay/40 hover:shadow-[0_25px_55px_-30px_rgba(162,74,31,0.4)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                    {f.label}
                  </p>
                  <p className="mt-4 font-display text-3xl font-semibold leading-none text-gradient">
                    {f.value}
                  </p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>

        {/* Sections asymétriques alternées */}
        <div className="mt-20 space-y-16">
          {sections.map((s, i) => {
            const flipped = i % 2 === 1;
            const n = String(i + 1).padStart(2, "0");
            return (
              <Reveal key={s.title} dir={flipped ? "right" : "left"} delay={60}>
                <article
                  className={`flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-12 ${
                    flipped ? "sm:flex-row-reverse sm:text-right" : ""
                  } ${flipped ? "sm:ml-16" : ""}`}
                >
                  <span
                    className={`grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] font-display text-3xl font-semibold ${TONES[i % TONES.length]}`}
                  >
                    {n}
                  </span>
                  <div className="max-w-xl">
                    <h2 className="font-display text-3xl font-semibold leading-tight text-ink">
                      {s.title}
                    </h2>
                    <p className="mt-3 text-lg leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal dir="scale" className="mt-20">
          <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-clay/40 blur-3xl animate-float"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-amber/30 blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            />
            <Link href="/play" className={`relative ${buttonPrimary} bg-cream px-9 py-4 text-base text-ink hover:bg-clay hover:text-cream`}>
              {t("ctaPlay")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";
import { buttonPrimary, buttonGhost } from "@/lib/ui";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  await initLocale(params);
  const t = await getTranslations("home");

  const features = [
    { title: t("feature1Title"), text: t("feature1Text") },
    { title: t("feature2Title"), text: t("feature2Text") },
    { title: t("feature3Title"), text: t("feature3Text") },
  ];

  const steps = [
    { n: "01", title: t("step1Title"), text: t("step1Text") },
    { n: "02", title: t("step2Title"), text: t("step2Text") },
    { n: "03", title: t("step3Title"), text: t("step3Text") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-clay/25 blur-3xl animate-float"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-amber/25 blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pine/15 blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center sm:py-40">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {t("badge")}
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-7xl">
              {t("heroTitle")}
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              {t("heroSubtitle")}
            </p>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/play" className={`${buttonPrimary} px-7 py-3 text-base`}>
                {t("ctaPlay")}
              </Link>
              <Link href="/shop" className={`${buttonGhost} px-6 py-3 text-base`}>
                {t("ctaShop")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 110}>
              <article className="group h-full rounded-3xl border border-line bg-white/70 p-8 transition duration-300 hover:-translate-y-1 hover:border-clay/40 hover:shadow-[0_16px_40px_-20px_rgba(162,74,31,0.35)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-parchment font-display text-lg font-semibold text-clay transition group-hover:bg-clay group-hover:text-cream">
                  {i + 1}
                </span>
                <h2 className="mt-6 font-display text-xl font-semibold text-ink">{f.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("stepsTitle")}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative">
                <span className="font-display text-6xl font-semibold text-sand">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-20 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-clay/40 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-amber/30 blur-3xl"
            />
            <h2 className="relative font-display text-3xl font-semibold tracking-tight text-cream sm:text-5xl">
              {t("finalTitle")}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-cream/70">{t("finalText")}</p>
            <div className="relative mt-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-cream px-8 py-3.5 text-base font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay hover:text-cream"
              >
                {t("ctaPlay")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

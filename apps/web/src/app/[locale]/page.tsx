import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";
import { Marquee } from "@/components/Marquee";
import { buttonPrimary, buttonGhost } from "@/lib/ui";

function BoardArt() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-2xl bg-amber/80 shadow-lg animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-6 h-12 w-12 rounded-full bg-pine shadow-lg animate-float"
        style={{ animationDelay: "1.2s" }}
      />
      <div className="grain overflow-hidden rounded-[2rem] border border-line bg-parchment p-3 shadow-[0_40px_80px_-40px_rgba(33,26,19,0.5)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/rumeur/cover-velonde.png"
          alt=""
          aria-hidden
          className="aspect-[3/2] w-full rounded-[1.4rem] object-cover"
        />
      </div>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  await initLocale(params);
  const t = await getTranslations("home");

  const features = [
    { title: t("feature1Title"), text: t("feature1Text"), tone: "bg-clay/10 text-clay" },
    { title: t("feature2Title"), text: t("feature2Text"), tone: "bg-pine/10 text-pine" },
    { title: t("feature3Title"), text: t("feature3Text"), tone: "bg-amber/15 text-clay-deep" },
  ];
  const steps = [
    { n: "01", title: t("step1Title"), text: t("step1Text") },
    { n: "02", title: t("step2Title"), text: t("step2Text") },
    { n: "03", title: t("step3Title"), text: t("step3Text") },
  ];
  const gallery = [
    { img: "/products/jeu-base.png", title: t("galleryBoxTitle"), text: t("galleryBoxText") },
    {
      img: "/products/goodies.png",
      title: t("galleryComponentsTitle"),
      text: t("galleryComponentsText"),
    },
    {
      img: "/products/extension-1.png",
      title: t("galleryExtensionTitle"),
      text: t("galleryExtensionText"),
    },
  ];

  return (
    <>
      {/* Hero asymétrique */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-clay/20 blur-3xl animate-float-slow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-amber/20 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {t("badge")}
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
                {t("heroTitle")}
              </h1>
            </Reveal>
            <Reveal delay={170}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                {t("heroSubtitle")}
              </p>
            </Reveal>
            <Reveal delay={250}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/play" className={`${buttonPrimary} px-7 py-3 text-base`}>
                  {t("ctaPlay")}
                </Link>
                <Link href="/shop" className={`${buttonGhost} px-6 py-3 text-base`}>
                  {t("ctaShop")}
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal dir="scale" delay={150}>
            <Tilt>
              <BoardArt />
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* Bande défilante */}
      <section className="border-y border-line bg-parchment/40 py-6">
        <Marquee
          items={[
            t("feature1Title"),
            t("feature2Title"),
            t("feature3Title"),
            t("badge"),
            t("stepsTitle"),
          ]}
        />
      </section>

      {/* Features asymétriques */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal dir="left" className="lg:row-span-2">
            <Tilt className="h-full">
              <article className="flex h-full flex-col justify-between rounded-[2rem] bg-ink p-9 text-cream shadow-[0_30px_60px_-35px_rgba(33,26,19,0.6)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-clay font-display text-lg font-semibold">
                  1
                </span>
                <div className="mt-16">
                  <h2 className="font-display text-3xl font-semibold leading-tight">
                    {features[0].title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-cream/70">{features[0].text}</p>
                </div>
              </article>
            </Tilt>
          </Reveal>

          {features.slice(1).map((f, i) => (
            <Reveal key={f.title} dir="up" delay={i * 120} className="lg:col-span-2">
              <Tilt>
                <article className="group flex items-start gap-6 rounded-[2rem] border border-line bg-white/70 p-8 transition hover:border-clay/40 hover:shadow-[0_20px_50px_-25px_rgba(162,74,31,0.4)]">
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-semibold ${f.tone}`}
                  >
                    {i + 2}
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink">{f.title}</h2>
                    <p className="mt-2 leading-relaxed text-ink-soft">{f.text}</p>
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Découvre le jeu - le plateau */}
      <section className="border-y border-line bg-parchment/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <Reveal dir="left">
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("discoverTag")}
            </span>
            <h2 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              {t("discoverTitle")}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              {t("discoverText")}
            </p>
            <Link href="/rules" className={`${buttonGhost} mt-8 px-6 py-3 text-base`}>
              {t("ctaRules")}
            </Link>
          </Reveal>

          <Reveal dir="right" delay={120}>
            <Tilt max={5}>
              <figure className="grain overflow-hidden rounded-[2rem] border border-line bg-cream p-3 shadow-[0_40px_80px_-45px_rgba(33,26,19,0.5)]">
                <div className="overflow-hidden rounded-[1.4rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/rumeur/map-velonde.png" alt={t("discoverBoardCaption")} className="aspect-[3/2] w-full object-cover" />
                </div>
                <figcaption className="px-2 py-3 text-center text-sm text-ink-soft">
                  {t("discoverBoardCaption")}
                </figcaption>
              </figure>
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* Galerie - dans la boîte */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("galleryTag")}
          </span>
          <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t("galleryTitle")}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((g, i) => (
            <Reveal key={g.img} dir="up" delay={i * 110}>
              <Tilt>
                <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-white/70 transition hover:border-clay/40 hover:shadow-[0_28px_60px_-32px_rgba(162,74,31,0.4)]">
                  <div className="bg-gradient-to-br from-parchment to-cream p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.img}
                      alt={g.title}
                      className="aspect-square w-full rounded-[1.4rem] object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-semibold leading-snug text-ink">
                      {g.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{g.text}</p>
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
        <Reveal delay={80}>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/shop" className={`${buttonPrimary} px-7 py-3 text-base`}>
              {t("ctaShop")}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Étapes décalées */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t("stepsTitle")}
          </h2>
        </Reveal>
        <div className="mt-16 space-y-12">
          {steps.map((s, i) => (
            <Reveal key={s.n} dir={i % 2 === 0 ? "left" : "right"} delay={60}>
              <div
                className={`flex flex-col gap-4 border-l-2 border-line pl-8 sm:flex-row sm:items-baseline sm:gap-10 ${
                  i % 2 === 1 ? "sm:ml-24" : ""
                }`}
              >
                <span className="font-display text-7xl font-semibold leading-none text-gradient">
                  {s.n}
                </span>
                <div className="max-w-md">
                  <h3 className="font-display text-2xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal dir="scale">
          <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-24 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-clay/40 blur-3xl animate-float"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-amber/30 blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            />
            <h2 className="relative font-display text-4xl font-semibold tracking-tight text-cream sm:text-6xl">
              {t("finalTitle")}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-cream/70">{t("finalText")}</p>
            <div className="relative mt-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-cream px-9 py-4 text-base font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay hover:text-cream"
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

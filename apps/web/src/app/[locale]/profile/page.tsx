import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@jeux/db";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const locale = await initLocale(params);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const [aggregate, gamesPlayed] = await Promise.all([
    prisma.score.aggregate({
      where: { userId: session.user.id },
      _max: { points: true },
    }),
    prisma.score.count({ where: { userId: session.user.id } }),
  ]);

  const bestScore = aggregate._max.points;
  const memberSince = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    user.createdAt,
  );

  const stats = [
    {
      label: t("bestScore"),
      value: bestScore === null ? t("noScores") : String(bestScore),
      tone: "text-gradient",
    },
    { label: t("gamesPlayed"), value: String(gamesPlayed), tone: "text-ink" },
  ];

  const details = [
    { label: t("email"), value: user.email },
    { label: t("memberSince"), value: memberSince },
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-44 -top-32 h-[28rem] w-[28rem] rounded-full bg-clay/15 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-60 h-96 w-96 rounded-full bg-pine/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("title")}
          </span>
        </Reveal>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Carte identité */}
          <Reveal dir="left" delay={80}>
            <Tilt>
              <article className="grain relative overflow-hidden rounded-[2.5rem] bg-ink p-10 text-cream shadow-[0_40px_80px_-40px_rgba(33,26,19,0.6)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-clay/40 blur-3xl animate-float"
                />
                <div className="relative">
                  <span className="grid h-20 w-20 place-items-center rounded-3xl bg-clay font-display text-4xl font-semibold text-cream">
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                      {user.username}
                    </h1>
                    <span className="rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cream">
                      {user.role}
                    </span>
                  </div>

                  <dl className="mt-9 space-y-4 border-t border-cream/15 pt-7">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-baseline justify-between gap-6">
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/50">
                          {d.label}
                        </dt>
                        <dd className="truncate text-right font-medium text-cream/90">
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Tilt>
          </Reveal>

          {/* Stats en gros chiffres */}
          <div className="grid gap-6">
            {stats.map((s, i) => (
              <Reveal key={s.label} dir="right" delay={120 + i * 110}>
                <Tilt>
                  <article className="group rounded-[2rem] border border-line bg-white/70 p-8 transition hover:border-clay/40 hover:shadow-[0_25px_55px_-30px_rgba(162,74,31,0.4)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                      {s.label}
                    </p>
                    <p
                      className={`mt-3 font-display text-6xl font-semibold leading-none tabular-nums ${s.tone}`}
                    >
                      {s.value}
                    </p>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

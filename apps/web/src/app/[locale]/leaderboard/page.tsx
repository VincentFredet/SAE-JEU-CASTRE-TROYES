import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@jeux/db";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";

type Props = { params: Promise<{ locale: string }> };

type Row = { userId: string; username: string; points: number };

const PODIUM = [
  {
    medal: "bg-amber text-ink",
    ring: "ring-amber/40",
    glow: "shadow-[0_40px_80px_-40px_rgba(217,154,58,0.6)]",
    lift: "lg:-translate-y-6",
    order: "lg:order-2",
  },
  {
    medal: "bg-clay text-cream",
    ring: "ring-clay/30",
    glow: "shadow-[0_30px_60px_-40px_rgba(194,96,46,0.55)]",
    lift: "",
    order: "lg:order-1",
  },
  {
    medal: "bg-pine text-cream",
    ring: "ring-pine/30",
    glow: "shadow-[0_30px_60px_-40px_rgba(47,93,79,0.5)]",
    lift: "",
    order: "lg:order-3",
  },
] as const;

export default async function LeaderboardPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("leaderboard");
  const session = await auth();
  const currentUserId = session?.user?.id;

  const totals = await prisma.score.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 50,
  });

  const userIds = totals.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true },
  });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  const rows: Row[] = totals.map((row) => ({
    userId: row.userId,
    username: usernameById.get(row.userId) ?? "",
    points: row._sum.points ?? 0,
  }));

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-32 h-[30rem] w-[30rem] rounded-full bg-amber/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-72 h-96 w-96 rounded-full bg-clay/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("title")}
          </span>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {t("title")}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t("subtitle")}</p>
        </Reveal>

        {rows.length === 0 ? (
          <Reveal dir="scale" delay={120}>
            <div className="grain mt-16 rounded-[2rem] border border-line bg-parchment p-16 text-center">
              <p className="mx-auto max-w-sm text-lg text-ink-soft">{t("empty")}</p>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Podium top 3 */}
            <div className="mt-16 grid items-end gap-6 lg:grid-cols-3">
              {podium.map((row, i) => {
                const p = PODIUM[i];
                const isCurrentUser = row.userId === currentUserId;
                return (
                  <Reveal
                    key={row.userId}
                    dir="up"
                    delay={i * 130}
                    className={`${p.order} ${p.lift}`}
                  >
                    <Tilt>
                      <article
                        className={`grain relative flex flex-col items-center rounded-[2rem] border bg-white/80 px-6 pb-8 pt-12 text-center ${p.glow} ${
                          isCurrentUser ? "border-clay/50 ring-2 ring-clay/30" : "border-line"
                        }`}
                      >
                        <span
                          className={`absolute -top-7 grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-semibold ring-4 ring-cream ${p.medal}`}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={`grid h-16 w-16 place-items-center rounded-full bg-parchment font-display text-2xl font-semibold text-ink ring-1 ${p.ring}`}
                        >
                          {row.username.slice(0, 1).toUpperCase()}
                        </span>
                        <h2 className="mt-4 truncate font-display text-xl font-semibold text-ink">
                          {row.username}
                          {isCurrentUser ? (
                            <span className="ml-2 align-middle rounded-full bg-clay px-2 py-0.5 text-xs font-semibold text-cream">
                              {t("you")}
                            </span>
                          ) : null}
                        </h2>
                        <p className="mt-5 font-display text-5xl font-semibold leading-none text-gradient tabular-nums">
                          {row.points}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                          {t("points")}
                        </p>
                      </article>
                    </Tilt>
                  </Reveal>
                );
              })}
            </div>

            {/* Reste du classement */}
            {rest.length > 0 ? (
              <div className="mt-16">
                <Reveal>
                  <div className="flex items-baseline justify-between border-b border-line pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                    <span>{t("rank")}</span>
                    <div className="flex gap-10">
                      <span>{t("player")}</span>
                      <span>{t("points")}</span>
                    </div>
                  </div>
                </Reveal>
                <ul className="mt-2 space-y-3">
                  {rest.map((row, i) => {
                    const isCurrentUser = row.userId === currentUserId;
                    return (
                      <Reveal key={row.userId} dir="left" delay={Math.min(i, 8) * 60}>
                        <li
                          className={`group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(33,26,19,0.45)] ${
                            isCurrentUser
                              ? "border-clay/50 bg-clay/5 ring-1 ring-clay/20"
                              : "border-line bg-white/70 hover:border-clay/40"
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <span className="w-12 shrink-0 font-display text-3xl font-semibold leading-none text-gradient tabular-nums">
                              {i + 4}
                            </span>
                            <span className="font-display text-lg font-semibold text-ink">
                              {row.username}
                              {isCurrentUser ? (
                                <span className="ml-2 align-middle rounded-full bg-clay px-2 py-0.5 text-xs font-semibold text-cream">
                                  {t("you")}
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                            {row.points}
                          </span>
                        </li>
                      </Reveal>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

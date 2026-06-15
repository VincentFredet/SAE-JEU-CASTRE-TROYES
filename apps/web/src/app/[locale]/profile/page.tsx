import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@jeux/db";
import { initLocale } from "@/lib/locale";

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

  const rows = [
    { label: t("username"), value: user.username },
    { label: t("email"), value: user.email },
    { label: t("role"), value: user.role },
    { label: t("memberSince"), value: memberSince },
    { label: t("bestScore"), value: bestScore === null ? t("noScores") : String(bestScore) },
    { label: t("gamesPlayed"), value: String(gamesPlayed) },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>

      <dl className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={
              index === 0
                ? "flex items-center justify-between gap-4 px-6 py-5"
                : "flex items-center justify-between gap-4 border-t border-zinc-200 px-6 py-5 dark:border-zinc-800"
            }
          >
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {row.label}
            </dt>
            <dd className="text-sm font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

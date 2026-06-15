import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@jeux/db";
import { initLocale } from "@/lib/locale";

type Props = { params: Promise<{ locale: string }> };

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

  const rows = totals.map((row) => ({
    userId: row.userId,
    username: usernameById.get(row.userId) ?? "",
    points: row._sum.points ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>

      {rows.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("rank")}</th>
                <th className="px-6 py-4 font-semibold">{t("player")}</th>
                <th className="px-6 py-4 text-right font-semibold">{t("points")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row, index) => {
                const isCurrentUser = row.userId === currentUserId;
                return (
                  <tr
                    key={row.userId}
                    className={
                      isCurrentUser
                        ? "bg-zinc-100 dark:bg-zinc-900"
                        : "bg-white dark:bg-zinc-950"
                    }
                  >
                    <td className="px-6 py-4 font-mono text-zinc-500 dark:text-zinc-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {row.username}
                      {isCurrentUser ? (
                        <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                          {t("you")}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

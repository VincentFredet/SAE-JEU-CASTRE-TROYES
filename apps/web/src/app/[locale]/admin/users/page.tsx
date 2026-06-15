import { getTranslations } from "next-intl/server";
import { prisma, Role } from "@jeux/db";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { setUserRole } from "@/lib/admin-actions";
import { Reveal } from "@/components/Reveal";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
  const locale = await initLocale(params);
  const session = await auth();
  const t = await getTranslations("admin");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  });

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t("usersTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{t("usersSubtitle")}</p>
      </Reveal>

      <Reveal dir="up" delay={80}>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white/70 shadow-[0_1px_2px_rgba(33,26,19,0.04)]">
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr] gap-4 border-b border-line px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft lg:grid">
            <span>{t("colUser")}</span>
            <span>{t("colRole")}</span>
            <span>{t("colDate")}</span>
            <span className="text-right">{t("colActions")}</span>
          </div>

          <ul className="divide-y divide-line">
            {users.map((user) => {
              const isAdmin = user.role === "ADMIN";
              const isSelf = user.id === session?.user?.id;
              const nextRole: Role = isAdmin ? "USER" : "ADMIN";

              return (
                <li
                  key={user.id}
                  className="grid items-center gap-4 px-6 py-4 lg:grid-cols-[1.6fr_1fr_0.8fr_1fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{user.username}</p>
                    <p className="truncate text-xs text-ink-soft">{user.email}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isAdmin ? "bg-clay/10 text-clay" : "bg-line text-ink-soft"
                      }`}
                    >
                      {isAdmin ? t("roleAdmin") : t("roleUser")}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">{dateFmt.format(user.createdAt)}</p>
                  <div className="flex justify-end">
                    {isSelf ? (
                      <span className="text-xs text-ink-soft/70">{t("youLabel")}</span>
                    ) : (
                      <form action={setUserRole}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="role" value={nextRole} />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
                        >
                          {isAdmin ? t("makeUser") : t("makeAdmin")}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

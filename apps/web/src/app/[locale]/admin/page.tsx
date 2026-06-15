import { getTranslations } from "next-intl/server";
import { prisma, OrderStatus } from "@jeux/db";
import { initLocale } from "@/lib/locale";
import { formatPrice } from "@/lib/money";
import { Reveal } from "@/components/Reveal";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminDashboardPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("admin");

  const [products, orders, users, scores, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.score.count(),
    prisma.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { totalCents: true },
    }),
  ]);

  const revenueCents = revenue._sum.totalCents ?? 0;

  const stats = [
    { label: t("statRevenue"), value: formatPrice(revenueCents, "EUR", locale), accent: true },
    { label: t("statProducts"), value: String(products) },
    { label: t("statOrders"), value: String(orders) },
    { label: t("statUsers"), value: String(users) },
    { label: t("statScores"), value: String(scores) },
  ];

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t("dashboardTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{t("dashboardSubtitle")}</p>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} dir="up" delay={i * 70}>
            <div
              className={
                stat.accent
                  ? "grain relative overflow-hidden rounded-2xl bg-ink p-6 text-cream shadow-[0_30px_60px_-40px_rgba(33,26,19,0.6)]"
                  : "rounded-2xl border border-line bg-white/70 p-6 shadow-[0_1px_2px_rgba(33,26,19,0.04)] transition hover:border-clay/40 hover:shadow-[0_20px_50px_-30px_rgba(162,74,31,0.35)]"
              }
            >
              {stat.accent && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-clay/40 blur-2xl"
                />
              )}
              <p
                className={
                  stat.accent
                    ? "relative text-xs font-semibold uppercase tracking-[0.16em] text-cream/60"
                    : "text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
                }
              >
                {stat.label}
              </p>
              <p
                className={
                  stat.accent
                    ? "relative mt-3 font-display text-4xl font-semibold"
                    : "mt-3 font-display text-4xl font-semibold text-ink"
                }
              >
                {stat.value}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

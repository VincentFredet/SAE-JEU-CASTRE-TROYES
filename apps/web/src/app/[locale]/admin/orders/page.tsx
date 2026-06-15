import { getTranslations } from "next-intl/server";
import { prisma, OrderStatus } from "@jeux/db";
import { initLocale } from "@/lib/locale";
import { formatPrice } from "@/lib/money";
import { Reveal } from "@/components/Reveal";
import { OrderStatusSelect } from "./OrderStatusSelect";

type Props = { params: Promise<{ locale: string }> };

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-amber/15 text-clay-deep",
  PAID: "bg-pine/10 text-pine",
  CANCELLED: "bg-line text-ink-soft",
  REFUNDED: "bg-clay/10 text-clay",
};

export default async function AdminOrdersPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("admin");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true, email: true } } },
  });

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const statusLabel: Record<OrderStatus, string> = {
    PENDING: t("statusPending"),
    PAID: t("statusPaid"),
    CANCELLED: t("statusCancelled"),
    REFUNDED: t("statusRefunded"),
  };

  const options = Object.values(OrderStatus).map((value) => ({
    value,
    label: statusLabel[value],
  }));

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t("ordersTitle")}
        </h1>
        <p className="mt-2 text-ink-soft">{t("ordersSubtitle")}</p>
      </Reveal>

      {orders.length === 0 ? (
        <p className="mt-12 text-ink-soft">{t("ordersEmpty")}</p>
      ) : (
        <Reveal dir="up" delay={80}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white/70 shadow-[0_1px_2px_rgba(33,26,19,0.04)]">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-4 border-b border-line px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft lg:grid">
              <span>{t("colCustomer")}</span>
              <span>{t("colTotal")}</span>
              <span>{t("colDate")}</span>
              <span>{t("colStatus")}</span>
            </div>

            <ul className="divide-y divide-line">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="grid items-center gap-4 px-6 py-4 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{order.user.username}</p>
                    <p className="truncate text-xs text-ink-soft">{order.user.email}</p>
                  </div>
                  <p className="font-semibold text-ink">
                    {formatPrice(order.totalCents, order.currency, locale)}
                  </p>
                  <p className="text-sm text-ink-soft">{dateFmt.format(order.createdAt)}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                    <OrderStatusSelect id={order.id} current={order.status} options={options} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}
    </div>
  );
}

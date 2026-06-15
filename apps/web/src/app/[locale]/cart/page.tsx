import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";
import { checkout } from "@/lib/checkout";
import { formatPrice } from "@/lib/money";
import { initLocale } from "@/lib/locale";
import { ProductImage } from "@/components/shop/ProductImage";
import { QuantityControl } from "@/components/shop/QuantityControl";
import { Reveal } from "@/components/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ordered?: string; error?: string }>;
};

export default async function CartPage({ params, searchParams }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("shop");
  const tc = await getTranslations("common");
  const session = await auth();
  const { ordered, error } = await searchParams;

  if (!session?.user) {
    return (
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-clay/20 blur-3xl animate-float-slow"
        />
        <div className="relative mx-auto max-w-2xl px-6 py-24">
          <Reveal>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">
              {t("cartTitle")}
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-5 text-lg text-ink-soft">{t("loginToBuy")}</p>
          </Reveal>
          <Reveal delay={160}>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-clay"
            >
              {t("loginToBuy")}
            </Link>
          </Reveal>
        </div>
      </div>
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: { product: { include: { translations: { where: { locale } } } } },
      },
    },
  });

  const items = cart?.items ?? [];
  const currency = items[0]?.product.currency ?? "EUR";
  const totalCents = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-24 h-[24rem] w-[24rem] rounded-full bg-clay/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-64 h-96 w-96 rounded-full bg-amber/20 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-4xl px-6 py-20">
        <header className="max-w-2xl">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("title")}
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
              {t("cartTitle")}
            </h1>
          </Reveal>
        </header>

        {ordered === "1" && (
          <Reveal delay={120}>
            <p className="mt-8 rounded-2xl border border-pine/25 bg-pine/10 px-5 py-4 text-sm font-medium text-pine">
              {t("orderPlaced")}
            </p>
          </Reveal>
        )}

        {error === "1" && (
          <Reveal delay={120}>
            <p className="mt-8 rounded-2xl border border-clay-deep/30 bg-clay/10 px-5 py-4 text-sm font-medium text-clay-deep">
              {tc("error")}
            </p>
          </Reveal>
        )}

        {items.length === 0 ? (
          <Reveal delay={140}>
            <div className="mt-12">
              <p className="text-lg text-ink-soft">{t("cartEmpty")}</p>
              <Link
                href="/shop"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-clay"
              >
                {t("backToShop")}
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:items-start">
            <ul className="space-y-5">
              {items.map((item, i) => {
                const name = item.product.translations[0]?.name ?? item.product.slug;
                return (
                  <Reveal key={item.id} dir="left" delay={i * 70}>
                    <li className="group flex flex-col gap-5 rounded-[1.75rem] border border-line bg-white/70 p-5 transition hover:border-clay/40 hover:shadow-[0_24px_50px_-32px_rgba(162,74,31,0.4)] sm:flex-row sm:items-center">
                      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
                        <ProductImage
                          src={item.product.imageUrl}
                          alt={name}
                          seed={item.product.slug}
                        />
                      </div>

                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-display text-xl font-semibold leading-snug text-ink">
                              {name}
                            </h2>
                            <p className="mt-1 text-sm text-ink-soft">
                              {formatPrice(
                                item.product.priceCents,
                                item.product.currency,
                                locale,
                              )}
                            </p>
                          </div>
                          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                            {formatPrice(
                              item.product.priceCents * item.quantity,
                              item.product.currency,
                              locale,
                            )}
                          </span>
                        </div>
                        <QuantityControl
                          itemId={item.id}
                          quantity={item.quantity}
                          max={item.product.stock}
                        />
                      </div>
                    </li>
                  </Reveal>
                );
              })}

              <Reveal delay={120}>
                <Link
                  href="/shop"
                  className="inline-flex items-center text-sm font-medium text-ink-soft underline-offset-4 transition hover:text-clay hover:underline"
                >
                  {t("continueShopping")}
                </Link>
              </Reveal>
            </ul>

            <Reveal dir="right" delay={120}>
              <div className="grain sticky top-24 overflow-hidden rounded-[2rem] bg-ink p-8 text-cream shadow-[0_40px_80px_-50px_rgba(33,26,19,0.7)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-clay/40 blur-3xl animate-float"
                />
                <span className="relative text-xs font-semibold uppercase tracking-[0.18em] text-cream/60">
                  {t("total")}
                </span>
                <p className="relative mt-3 font-display text-5xl font-semibold leading-none tabular-nums text-cream">
                  {formatPrice(totalCents, currency, locale)}
                </p>
                <form action={checkout} className="relative mt-8">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-cream px-8 py-4 text-base font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay hover:text-cream"
                  >
                    {t("checkout")}
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}

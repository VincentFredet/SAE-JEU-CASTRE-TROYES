import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";
import { checkout } from "@/lib/checkout";
import { formatPrice } from "@/lib/money";
import { initLocale } from "@/lib/locale";
import { ProductImage } from "@/components/shop/ProductImage";
import { QuantityControl } from "@/components/shop/QuantityControl";

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
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t("cartTitle")}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">{t("loginToBuy")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("loginToBuy")}
        </Link>
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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("cartTitle")}</h1>

      {ordered === "1" && (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {t("orderPlaced")}
        </p>
      )}

      {error === "1" && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          {tc("error")}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-8">
          <p className="text-zinc-600 dark:text-zinc-300">{t("cartEmpty")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("backToShop")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => {
              const name = item.product.translations[0]?.name ?? item.product.slug;
              return (
                <li key={item.id} className="flex gap-4 py-5">
                  <div className="w-24 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage
                      src={item.product.imageUrl}
                      alt={name}
                      seed={item.product.slug}
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-semibold">{name}</h2>
                      <span className="font-semibold tabular-nums">
                        {formatPrice(
                          item.product.priceCents * item.quantity,
                          item.product.currency,
                          locale,
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {formatPrice(item.product.priceCents, item.product.currency, locale)}
                    </p>
                    <div className="mt-auto">
                      <QuantityControl
                        itemId={item.id}
                        quantity={item.quantity}
                        max={item.product.stock}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <span className="text-lg font-semibold">{t("total")}</span>
            <span className="text-xl font-bold tabular-nums">
              {formatPrice(totalCents, currency, locale)}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/shop"
              className="text-sm font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
            >
              {t("continueShopping")}
            </Link>
            <form action={checkout}>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {t("checkout")}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

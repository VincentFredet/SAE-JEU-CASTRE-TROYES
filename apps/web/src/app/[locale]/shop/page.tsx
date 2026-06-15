import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";
import { addToCart } from "@/lib/cart-actions";
import { formatPrice } from "@/lib/money";
import { initLocale } from "@/lib/locale";
import { ProductImage } from "@/components/shop/ProductImage";

type Props = { params: Promise<{ locale: string }> };

export default async function ShopPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("shop");
  const session = await auth();

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      translations: { where: { locale } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
      </header>

      {products.length === 0 ? (
        <p className="mt-12 text-zinc-500">{t("empty")}</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const tr = product.translations[0];
            const name = tr?.name ?? product.slug;
            const inStock = product.stock > 0;

            return (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <ProductImage src={product.imageUrl} alt={name} seed={product.slug} />

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold">{name}</h2>
                  {tr?.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {tr.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {formatPrice(product.priceCents, product.currency, locale)}
                    </span>
                    <span
                      className={
                        inStock
                          ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-xs font-medium text-zinc-400"
                      }
                    >
                      {inStock ? t("inStock") : t("outOfStock")}
                    </span>
                  </div>

                  <div className="mt-5 pt-1">
                    {!session?.user ? (
                      <Link
                        href="/login"
                        className="block rounded-full border border-zinc-300 px-4 py-2 text-center text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        {t("loginToBuy")}
                      </Link>
                    ) : (
                      <form action={addToCart.bind(null, product.id)}>
                        <button
                          type="submit"
                          disabled={!inStock}
                          className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {t("addToCart")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

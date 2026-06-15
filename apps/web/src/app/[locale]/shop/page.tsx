import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";
import { addToCart } from "@/lib/cart-actions";
import { formatPrice } from "@/lib/money";
import { initLocale } from "@/lib/locale";
import { ProductImage } from "@/components/shop/ProductImage";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";

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

  const signedIn = Boolean(session?.user);
  const featured = products[0];
  const rest = products.slice(1);

  function buyAction(productId: string, inStock: boolean, large: boolean) {
    if (!signedIn) {
      return (
        <Link
          href="/login"
          className={`inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-center font-semibold text-ink transition hover:border-clay hover:text-clay ${
            large ? "text-base" : "text-sm"
          }`}
        >
          {t("loginToBuy")}
        </Link>
      );
    }
    return (
      <form action={addToCart.bind(null, productId)}>
        <button
          type="submit"
          disabled={!inStock}
          className={`inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2.5 font-semibold text-cream transition duration-200 hover:-translate-y-0.5 hover:bg-clay hover:shadow-[0_18px_40px_-18px_rgba(162,74,31,0.6)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink disabled:hover:shadow-none ${
            large ? "text-base" : "text-sm"
          }`}
        >
          {t("addToCart")}
        </button>
      </form>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-clay/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-72 h-96 w-96 rounded-full bg-amber/20 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("title")}
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.03] tracking-tight text-ink sm:text-6xl">
              {t("subtitle")}
            </h1>
          </Reveal>
        </header>

        {products.length === 0 ? (
          <Reveal delay={120}>
            <p className="mt-16 text-lg text-ink-soft">{t("empty")}</p>
          </Reveal>
        ) : (
          <div className="mt-16 space-y-8">
            {featured && (
              <Reveal dir="scale">
                <Tilt max={4}>
                  <article className="group grid gap-0 overflow-hidden rounded-[2.5rem] border border-line bg-white/70 shadow-[0_40px_80px_-50px_rgba(33,26,19,0.5)] transition hover:border-clay/40 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative min-h-[18rem] lg:min-h-[26rem]">
                      <ProductImage
                        src={featured.imageUrl}
                        alt={featured.translations[0]?.name ?? featured.slug}
                        seed={featured.slug}
                      />
                      <span className="absolute left-6 top-6 inline-flex items-center rounded-full bg-ink/85 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur">
                        {t("title")}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between p-8 sm:p-12">
                      <div>
                        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                          {featured.translations[0]?.name ?? featured.slug}
                        </h2>
                        {featured.translations[0]?.description && (
                          <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
                            {featured.translations[0].description}
                          </p>
                        )}
                      </div>

                      <div className="mt-10">
                        <div className="flex items-end justify-between gap-4">
                          <span className="font-display text-5xl font-semibold leading-none text-gradient">
                            {formatPrice(featured.priceCents, featured.currency, locale)}
                          </span>
                          <span
                            className={`mb-1 inline-flex items-center gap-2 text-sm font-medium ${
                              featured.stock > 0 ? "text-pine" : "text-ink-soft/60"
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`h-2 w-2 rounded-full ${
                                featured.stock > 0 ? "bg-pine" : "bg-ink-soft/40"
                              }`}
                            />
                            {featured.stock > 0 ? t("inStock") : t("outOfStock")}
                          </span>
                        </div>
                        <div className="mt-7">
                          {buyAction(featured.id, featured.stock > 0, true)}
                        </div>
                      </div>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            )}

            {rest.length > 0 && (
              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((product, i) => {
                  const tr = product.translations[0];
                  const name = tr?.name ?? product.slug;
                  const inStock = product.stock > 0;
                  const raised = i % 3 === 1;

                  return (
                    <li key={product.id} className={raised ? "lg:mt-12" : ""}>
                      <Reveal dir="up" delay={i * 80}>
                        <Tilt>
                          <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-white/70 transition hover:border-clay/40 hover:shadow-[0_28px_60px_-32px_rgba(162,74,31,0.4)]">
                            <div className="relative h-52 overflow-hidden">
                              <ProductImage src={product.imageUrl} alt={name} seed={product.slug} />
                              <span
                                className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cream/85 px-3 py-1 text-xs font-medium backdrop-blur ${
                                  inStock ? "text-pine" : "text-ink-soft/70"
                                }`}
                              >
                                <span
                                  aria-hidden
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    inStock ? "bg-pine" : "bg-ink-soft/40"
                                  }`}
                                />
                                {inStock ? t("inStock") : t("outOfStock")}
                              </span>
                            </div>

                            <div className="flex flex-1 flex-col p-6">
                              <h2 className="font-display text-xl font-semibold leading-snug text-ink">
                                {name}
                              </h2>
                              {tr?.description && (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                                  {tr.description}
                                </p>
                              )}

                              <div className="mt-5 flex items-baseline gap-1">
                                <span className="font-display text-3xl font-semibold text-ink">
                                  {formatPrice(product.priceCents, product.currency, locale)}
                                </span>
                              </div>

                              <div className="mt-6 pt-1">
                                {buyAction(product.id, inStock, false)}
                              </div>
                            </div>
                          </article>
                        </Tilt>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

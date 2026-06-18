import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { getProduct } from "@/lib/reliques-api";
import { formatEuro } from "@/lib/money";
import { buttonGhost } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { ProductImage } from "@/components/shop/ProductImage";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const locale = await initLocale(params);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("checkout");
  const { product: productId } = await searchParams;
  const product = productId ? await getProduct(productId, locale) : null;

  if (!product) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-lg text-ink-soft">{t("notFound")}</p>
        <Link href="/shop" className={`${buttonGhost} mt-6`}>
          {t("backToShop")}
        </Link>
      </section>
    );
  }

  const inStock = (product.stock ?? 0) > 0;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-amber/15 blur-3xl animate-float-slow"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <Link href="/shop" className="text-sm font-medium text-ink-soft transition hover:text-clay">
          ← {t("backToShop")}
        </Link>

        <Reveal>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t("formTitle")}
          </h1>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal dir="up">
            <aside className="overflow-hidden rounded-3xl border border-line bg-white/70 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)]">
              <div className="relative h-48">
                <ProductImage
                  src={product.images?.[0] ?? null}
                  alt={product.title ?? `#${product.id}`}
                  seed={String(product.id)}
                />
              </div>
              <div className="p-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                {t("summary")}
              </span>
              <h2 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
                {product.title ?? `#${product.id}`}
              </h2>
              {product.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{product.description}</p>
              )}
              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-sm text-ink-soft">{t("unitPrice")}</span>
                <span className="font-display text-2xl font-semibold text-ink">
                  {formatEuro(product.price, locale)}
                </span>
              </div>
              </div>
            </aside>

            <p className="mt-4 text-xs text-ink-soft/70">{t("payNote")}</p>
          </Reveal>

          <Reveal dir="up" delay={80}>
            <div className="rounded-3xl border border-line bg-white/70 p-7 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)]">
              {inStock ? (
                <CheckoutForm
                  productId={product.id}
                  email={session.user.email ?? ""}
                  maxQuantity={product.stock ?? 1}
                />
              ) : (
                <p className="text-ink-soft">{t("outOfStock")}</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

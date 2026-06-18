import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { getShop, getProducts } from "@/lib/reliques-api";
import { formatEuro } from "@/lib/money";
import { buttonPrimary, buttonGhost } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { StoresMap } from "@/components/stores/StoresMap";
import type { MapMarker } from "@/components/stores/StoresMapInner";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function StoreDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await initLocale(params);
  const t = await getTranslations("stores");
  const ts = await getTranslations("shop");
  const session = await auth();

  const [shop, products] = await Promise.all([getShop(id, locale), getProducts(locale)]);
  if (!shop) notFound();

  const product = products[0] ?? null;
  const stock = shop.totalStock ?? 0;
  const inStock = stock > 0;
  const typeLabel =
    shop.type === "physical" ? t("typePhysical") : shop.type === "online" ? t("typeOnline") : shop.type;
  const addressLine = [shop.address, [shop.postalCode, shop.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const markers: MapMarker[] =
    shop.latitude != null && shop.longitude != null
      ? [
          {
            id: shop.id,
            name: shop.name,
            lat: shop.latitude,
            lng: shop.longitude,
            typeLabel,
            address: addressLine || null,
          },
        ]
      : [];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-pine/15 blur-3xl animate-float-slow"
      />
      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <Link href="/stores" className="text-sm font-medium text-ink-soft transition hover:text-clay">
          ← {t("backToStores")}
        </Link>

        <Reveal>
          <div className="mt-6">
            {typeLabel && (
              <span className="inline-flex w-fit items-center rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream">
                {typeLabel}
              </span>
            )}
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {shop.name}
            </h1>
            {addressLine && <p className="mt-3 text-lg text-ink-soft">{addressLine}</p>}
            <p
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
                inStock ? "text-pine" : "text-ink-soft/60"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-pine" : "bg-ink-soft/40"}`}
              />
              {inStock ? t("stockAvailable", { n: stock }) : t("stockOut")}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal dir="up">
            {markers.length > 0 ? (
              <div className="h-[360px] overflow-hidden rounded-3xl border border-line shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)]">
                <StoresMap markers={markers} detailsLabel={t("details")} />
              </div>
            ) : (
              <p className="rounded-3xl border border-line bg-white/70 p-7 text-ink-soft">
                {t("noAddress")}
              </p>
            )}
          </Reveal>

          <Reveal dir="up" delay={80}>
            <div className="rounded-3xl border border-line bg-white/70 p-7 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)]">
              <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
                {t("orderTitle")}
              </h2>
              {product && (
                <p className="mt-2 text-sm text-ink-soft">
                  {product.title ?? `#${product.id}`} - {formatEuro(product.price, locale)}
                </p>
              )}
              <p className="mt-1 text-sm text-ink-soft">{t("orderIntro")}</p>

              <div className="mt-6">
                {!product || (product.stock ?? 0) <= 0 ? (
                  <p className="text-ink-soft">{ts("outOfStock")}</p>
                ) : !session?.user ? (
                  <Link href="/login" className={`${buttonGhost} w-full justify-center`}>
                    {ts("loginToBuy")}
                  </Link>
                ) : (
                  <Link
                    href={`/checkout?product=${product.id}`}
                    className={`${buttonPrimary} w-full justify-center`}
                  >
                    {ts("order")}
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

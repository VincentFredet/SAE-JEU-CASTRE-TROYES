import { getTranslations } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { getShops, type Shop } from "@/lib/reliques-api";
import { Reveal } from "@/components/Reveal";
import { Tilt } from "@/components/Tilt";
import { StoresMap } from "@/components/stores/StoresMap";
import type { MapMarker } from "@/components/stores/StoresMapInner";

type Props = { params: Promise<{ locale: string }> };

function addressLines(shop: Shop): string[] {
  const lines: string[] = [];
  if (shop.address) lines.push(shop.address);
  const cityLine = [shop.postalCode, shop.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  return lines;
}

export default async function StoresPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("stores");
  const shops = await getShops(locale);

  const typeLabel = (type: Shop["type"]) =>
    type === "physical" ? t("typePhysical") : type === "online" ? t("typeOnline") : type;
  const stockLabel = (n: number | null | undefined) =>
    (n ?? 0) > 0 ? t("stockAvailable", { n: n as number }) : t("stockOut");

  const markers: MapMarker[] = shops
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.latitude as number,
      lng: s.longitude as number,
      typeLabel: typeLabel(s.type),
      address: addressLines(s).join(", ") || null,
      stockLabel: stockLabel(s.totalStock),
      inStock: (s.totalStock ?? 0) > 0,
      href: getPathname({ href: `/stores/${s.id}`, locale: locale as "fr" | "en" }),
    }));

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-pine/15 blur-3xl animate-float-slow"
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
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
          </Reveal>
        </header>

        {shops.length > 0 && (
          <Reveal delay={200} dir="scale">
            <div className="mt-12 h-[420px] overflow-hidden rounded-3xl border border-line shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)]">
              <StoresMap markers={markers} detailsLabel={t("details")} />
            </div>
          </Reveal>
        )}

        {shops.length === 0 ? (
          <Reveal delay={120}>
            <p className="mt-16 text-lg text-ink-soft">{t("empty")}</p>
          </Reveal>
        ) : (
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop, i) => {
              const lines = addressLines(shop);
              const label = typeLabel(shop.type);
              return (
                <Reveal key={shop.id} delay={i * 60} dir="up">
                  <Tilt max={4}>
                    <article className="flex h-full flex-col rounded-3xl border border-line bg-white/70 p-7 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)] transition hover:border-clay/40">
                      {label && (
                        <span className="inline-flex w-fit items-center rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream">
                          {label}
                        </span>
                      )}
                      <h2 className="mt-5 font-display text-2xl font-semibold leading-tight text-ink">
                        {shop.name}
                      </h2>
                      {lines.length > 0 ? (
                        <address className="mt-3 not-italic leading-relaxed text-ink-soft">
                          {lines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </address>
                      ) : (
                        <p className="mt-3 text-sm text-ink-soft/70">{t("noAddress")}</p>
                      )}
                      <p
                        className={`mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium ${
                          (shop.totalStock ?? 0) > 0 ? "text-pine" : "text-ink-soft/60"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            (shop.totalStock ?? 0) > 0 ? "bg-pine" : "bg-ink-soft/40"
                          }`}
                        />
                        {stockLabel(shop.totalStock)}
                      </p>
                      <Link
                        href={`/stores/${shop.id}`}
                        className="mt-auto pt-6 text-sm font-semibold text-clay transition hover:text-ink"
                      >
                        {t("details")} →
                      </Link>
                    </article>
                  </Tilt>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

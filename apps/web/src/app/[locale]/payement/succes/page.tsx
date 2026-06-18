import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { buttonPrimary, buttonGhost } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
};

// Page de retour après paiement Stripe (success_url du backend partenaire) :
// /payement/succes?ref=CMD-XXXXXXXX. Le webhook reste la source de vérité côté backend.
export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  await initLocale(params);
  const t = await getTranslations("payment");
  const { ref } = await searchParams;
  const reference = ref && /^[A-Za-z0-9-]{1,40}$/.test(ref) ? ref : null;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-pine/15 blur-3xl animate-float-slow"
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-20">
        <Reveal>
          <span className="inline-flex items-center self-start rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("eyebrow")}
          </span>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pine/12 text-pine">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M5 12.5 L10 17.5 L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("successTitle")}
            </h1>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{t("successLead")}</p>
        </Reveal>

        {reference && (
          <Reveal delay={180}>
            <div className="mt-7 rounded-2xl border border-line bg-white/70 px-5 py-4">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                {t("reference")}
              </span>
              <span className="mt-1 block font-display text-xl font-semibold text-clay">
                {reference}
              </span>
            </div>
          </Reveal>
        )}

        <Reveal delay={220}>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft/90">{t("successNote")}</p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonPrimary}>
              {t("continue")}
            </Link>
            <Link href="/" className={buttonGhost}>
              {t("backHome")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

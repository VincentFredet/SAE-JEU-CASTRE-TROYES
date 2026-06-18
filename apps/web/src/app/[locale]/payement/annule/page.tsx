import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { buttonPrimary, buttonGhost } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
};

// Page de retour si le paiement Stripe est abandonné (cancel_url du backend partenaire).
export default async function PaymentCancelPage({ params, searchParams }: Props) {
  await initLocale(params);
  const t = await getTranslations("payment");
  const { ref } = await searchParams;
  const reference = ref && /^[A-Za-z0-9-]{1,40}$/.test(ref) ? ref : null;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-clay/15 blur-3xl animate-float-slow"
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-20">
        <Reveal>
          <span className="inline-flex items-center self-start rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("eyebrow")}
          </span>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M7 7 L17 17 M17 7 L7 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("cancelTitle")}
            </h1>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{t("cancelLead")}</p>
        </Reveal>

        {reference && (
          <Reveal delay={180}>
            <div className="mt-7 rounded-2xl border border-line bg-white/70 px-5 py-4">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                {t("reference")}
              </span>
              <span className="mt-1 block font-display text-xl font-semibold text-ink-soft">
                {reference}
              </span>
            </div>
          </Reveal>
        )}

        <Reveal delay={220}>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft/90">{t("cancelNote")}</p>
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

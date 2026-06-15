import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/orders";
import { card, buttonPrimary } from "@/lib/ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  await initLocale(params);
  const t = await getTranslations("checkout");
  const { session_id } = await searchParams;

  // Filet de securite si le webhook n'est pas configure (dev) : on confirme ici.
  if (stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid" && session.metadata?.orderId) {
        await fulfillOrder(session.metadata.orderId);
      }
    } catch {
      // le webhook reste la source de verite
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className={card}>
        <h1 className="text-2xl font-bold tracking-tight">{t("successTitle")}</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{t("successBody")}</p>
        <Link href="/shop" className={`${buttonPrimary} mt-8 inline-block`}>
          {t("continue")}
        </Link>
      </div>
    </div>
  );
}

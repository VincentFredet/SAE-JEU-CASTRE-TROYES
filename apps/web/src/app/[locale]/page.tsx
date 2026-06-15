import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("home");

  const features = [
    { title: t("feature1Title"), text: t("feature1Text") },
    { title: t("feature2Title"), text: t("feature2Text") },
    { title: t("feature3Title"), text: t("feature3Text") },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/play"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("ctaPlay")}
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t("ctaShop")}
          </Link>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-px bg-zinc-200 sm:grid-cols-3 dark:bg-zinc-800">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-8 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

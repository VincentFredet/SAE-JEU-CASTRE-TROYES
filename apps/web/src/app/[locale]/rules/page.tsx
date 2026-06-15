import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/lib/locale";
import { card, buttonPrimary } from "@/lib/ui";

type Props = { params: Promise<{ locale: string }> };

export default async function RulesPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("rules");

  const facts = [
    { label: t("players"), value: t("playersValue") },
    { label: t("duration"), value: t("durationValue") },
    { label: t("age"), value: t("ageValue") },
  ];

  const sections = [
    { title: t("objectiveTitle"), body: t("objectiveBody") },
    { title: t("setupTitle"), body: t("setupBody") },
    { title: t("turnTitle"), body: t("turnBody") },
    { title: t("endTitle"), body: t("endBody") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>

      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        {t("draft")}
      </p>

      <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
        {facts.map((f) => (
          <div key={f.label} className="bg-white p-5 text-center dark:bg-zinc-950">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{f.label}</dt>
            <dd className="mt-1 text-lg font-semibold">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-col gap-4">
        {sections.map((s) => (
          <section key={s.title} className={card}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/play" className={buttonPrimary}>
          {t("ctaPlay")}
        </Link>
      </div>
    </div>
  );
}

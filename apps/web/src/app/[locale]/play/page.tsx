import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { PlayClient } from "@/components/game/PlayClient";

type Props = { params: Promise<{ locale: string }> };

export default async function PlayPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("game");
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("loginRequired")}
        </Link>
      </div>
    );
  }

  return <PlayClient userId={session.user.id} />;
}

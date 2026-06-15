import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";
import { buttonPrimary } from "@/lib/ui";
import { PlayClient } from "@/components/game/PlayClient";

type Props = { params: Promise<{ locale: string }> };

export default async function PlayPage({ params }: Props) {
  await initLocale(params);
  const t = await getTranslations("game");
  const session = await auth();

  if (!session?.user) {
    return (
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-clay/15 blur-3xl animate-float-slow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-amber/15 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {t("title")}
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              {t("loginRequired")}
            </h1>
          </Reveal>
          <Reveal delay={170}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">{t("comingSoon")}</p>
          </Reveal>
          <Reveal delay={250}>
            <Link href="/login" className={`${buttonPrimary} mt-9 px-7 py-3 text-base`}>
              {t("loginRequired")}
            </Link>
          </Reveal>
        </div>
      </section>
    );
  }

  return <PlayClient userId={session.user.id} />;
}

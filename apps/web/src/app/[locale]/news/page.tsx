import { getTranslations } from "next-intl/server";
import { initLocale } from "@/lib/locale";
import { getNews, getEvents, type ReliquesEvent } from "@/lib/reliques-api";
import { Reveal } from "@/components/Reveal";
import { RichText } from "@/components/RichText";

type Props = { params: Promise<{ locale: string }> };

function formatDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);
}

function eventWhen(ev: ReliquesEvent, locale: string): string | null {
  const start = formatDate(ev.startDate, locale);
  const end = formatDate(ev.endDate, locale);
  if (start && end && start !== end) return `${start} - ${end}`;
  return start ?? end;
}

function eventWhere(ev: ReliquesEvent): string | null {
  return [ev.address, [ev.postalCode, ev.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ") || null;
}

export default async function NewsPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("news");
  const [news, events] = await Promise.all([getNews(locale), getEvents(locale)]);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-32 h-[30rem] w-[30rem] rounded-full bg-clay/15 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-80 h-96 w-96 rounded-full bg-amber/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20">
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
        </header>

        {/* Actualités */}
        <Reveal delay={120}>
          <h2 className="mt-16 font-display text-2xl font-semibold text-ink">{t("newsTitle")}</h2>
        </Reveal>
        {news.length === 0 ? (
          <Reveal delay={150}>
            <p className="mt-6 text-ink-soft">{t("emptyNews")}</p>
          </Reveal>
        ) : (
          <div className="mt-8 space-y-6">
            {news.map((article, i) => {
              const date = formatDate(article.publishedAt, locale);
              return (
                <Reveal key={article.id} delay={i * 60}>
                  <article className="rounded-3xl border border-line bg-white/70 p-7 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)] transition hover:border-clay/40">
                    {date && (
                      <time className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">
                        {date}
                      </time>
                    )}
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink">
                      {article.title}
                    </h3>
                    {article.chapo && (
                      <p className="mt-3 leading-relaxed text-ink-soft">{article.chapo}</p>
                    )}
                    <RichText html={article.content} className="mt-3" />
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Agenda / Événements */}
        <Reveal delay={120}>
          <h2 className="mt-20 font-display text-2xl font-semibold text-ink">{t("eventsTitle")}</h2>
        </Reveal>
        {events.length === 0 ? (
          <Reveal delay={150}>
            <p className="mt-6 text-ink-soft">{t("emptyEvents")}</p>
          </Reveal>
        ) : (
          <div className="mt-8 space-y-6">
            {events.map((ev, i) => {
              const when = eventWhen(ev, locale);
              const where = eventWhere(ev);
              return (
                <Reveal key={ev.id} delay={i * 60}>
                  <article className="rounded-3xl border border-line bg-white/70 p-7 shadow-[0_30px_60px_-50px_rgba(33,26,19,0.5)] transition hover:border-clay/40">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]">
                      {when && (
                        <time className="inline-flex items-center rounded-full bg-pine/10 px-3 py-1 text-pine">
                          {when}
                        </time>
                      )}
                      {where && <span className="text-ink-soft">{where}</span>}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
                      {ev.title}
                    </h3>
                    {ev.chapo && (
                      <p className="mt-3 leading-relaxed text-ink-soft">{ev.chapo}</p>
                    )}
                    <RichText html={ev.content} className="mt-3" />
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

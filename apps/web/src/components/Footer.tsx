import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("common");
  const tn = await getTranslations("nav");

  const links = [
    { href: "/shop", label: tn("shop") },
    { href: "/leaderboard", label: tn("leaderboard") },
    { href: "/rules", label: tn("rules") },
    { href: "/play", label: tn("play") },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-parchment/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-display text-xs font-semibold text-cream">
            CT
          </span>
          <span className="font-display text-base font-semibold text-ink">{t("appName")}</span>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition hover:text-clay">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-sm text-ink-soft">
          © {new Date().getFullYear()} {t("appName")}
        </p>
      </div>
    </footer>
  );
}

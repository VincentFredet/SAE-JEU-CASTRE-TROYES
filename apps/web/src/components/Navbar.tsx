import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Navbar() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const session = await auth();

  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/leaderboard", label: t("leaderboard") },
    { href: "/rules", label: t("rules") },
    { href: "/play", label: t("play") },
  ];
  if (session?.user?.role === "ADMIN") {
    links.push({ href: "/admin", label: t("admin") });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-base font-semibold text-cream transition group-hover:bg-clay">
            R
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              {tc("appName")}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-soft">
              {tc("studio")}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="relative transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-clay after:transition-all after:duration-300 hover:text-ink hover:after:w-full"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            className="hidden text-sm font-medium text-ink-soft transition hover:text-ink sm:block"
          >
            {t("cart")}
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="text-sm font-semibold text-ink transition hover:text-clay"
              >
                {session.user.username}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-clay hover:text-clay"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-cream transition hover:bg-clay"
            >
              {t("login")}
            </Link>
          )}

          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  );
}

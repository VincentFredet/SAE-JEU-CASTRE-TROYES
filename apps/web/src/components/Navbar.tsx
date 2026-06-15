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
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/leaderboard", label: t("leaderboard") },
    { href: "/play", label: t("play") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-sm font-black text-white dark:bg-white dark:text-zinc-900">
            CT
          </span>
          {tc("appName")}
        </Link>

        <ul className="hidden items-center gap-6 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-300">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition hover:text-zinc-900 dark:hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            {t("cart")}
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="text-sm font-semibold">
                {session.user.username}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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

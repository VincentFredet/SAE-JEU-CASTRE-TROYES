import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { Reveal } from "@/components/Reveal";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  await initLocale(params);
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const nav = [
    { href: "/admin", label: t("navDashboard") },
    { href: "/admin/products", label: t("navProducts") },
    { href: "/admin/orders", label: t("navOrders") },
    { href: "/admin/users", label: t("navUsers") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:gap-12">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <Reveal dir="right">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-sm font-semibold text-cream">
                A
              </span>
              <div>
                <p className="font-display text-base font-semibold leading-tight text-ink">
                  {t("title")}
                </p>
                <p className="text-xs text-ink-soft">{session.user.username}</p>
              </div>
            </div>
          </Reveal>

          <nav className="mt-7 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-parchment/70 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

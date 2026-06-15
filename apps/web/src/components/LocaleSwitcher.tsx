"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-200 p-0.5 dark:border-zinc-700">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition ${
            l === locale
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

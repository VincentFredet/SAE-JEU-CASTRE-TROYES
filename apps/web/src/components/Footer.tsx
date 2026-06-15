import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500">
        © {new Date().getFullYear()} {t("appName")} - {t("tagline")}
      </div>
    </footer>
  );
}

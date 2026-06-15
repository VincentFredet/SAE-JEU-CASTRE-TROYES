import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  // "/" sert toujours le francais ; le choix de langue passe par le selecteur.
  localeDetection: false,
});

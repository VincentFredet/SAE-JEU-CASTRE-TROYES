import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@jeux/shared", "@jeux/db"],
  serverExternalPackages: ["@prisma/client", ".prisma/client", "stripe"],
};

export default withNextIntl(nextConfig);

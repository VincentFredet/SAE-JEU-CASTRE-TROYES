import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DATABASE_URL = "postgresql://jeux:jeux_dev_pwd@127.0.0.1:5432/jeux?schema=public";
const AUTH_SECRET = "dev-secret-change-me-please-0000000000000000";

const files = {
  "packages/db/.env": `DATABASE_URL="${DATABASE_URL}"\n`,
  "apps/web/.env.local": [
    `DATABASE_URL="${DATABASE_URL}"`,
    `AUTH_SECRET="${AUTH_SECRET}"`,
    `AUTH_URL="http://localhost:3000"`,
    `NEXT_PUBLIC_REALTIME_URL="http://localhost:4000"`,
    "",
  ].join("\n"),
  "apps/realtime/.env": [
    `DATABASE_URL="${DATABASE_URL}"`,
    `AUTH_SECRET="${AUTH_SECRET}"`,
    `REALTIME_PORT="4000"`,
    `REALTIME_CORS_ORIGIN="http://localhost:3000"`,
    `ALLOW_DEV_AUTH="1"`,
    "",
  ].join("\n"),
};

for (const [path, content] of Object.entries(files)) {
  if (existsSync(path)) {
    console.log(`= ${path} (conservé)`);
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`+ ${path}`);
}

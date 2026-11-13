import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envCandidates = [
  path.resolve(__dirname, "../../../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const WEB_ORIGIN = "https://resturent.sandipandas.website";

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!corsOrigins.includes(WEB_ORIGIN)) corsOrigins.push(WEB_ORIGIN);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "dhabar",
    password: process.env.MYSQL_PASSWORD ?? "dhabar",
    database: process.env.MYSQL_DATABASE ?? "dhabar",
  },
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-only-change-me",
  accessTtlSeconds: 60 * 15,
  refreshTtlSeconds: 60 * 60 * 24 * 7,
  corsOrigins,
  webOrigin: WEB_ORIGIN,
  apiOrigin: "https://test.sandipandas.website",
};

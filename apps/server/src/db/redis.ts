import Redis from "ioredis";
import { config } from "../config";

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
});

redis.on("error", (error: Error) => {
  console.error(`Redis: ${error.message}`);
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForRedis(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if ((await redis.ping()) === "PONG") return;
    } catch (error) {
      lastError = error;
      await delay(1000);
    }
  }
  throw new Error(`Redis did not become ready. ${String(lastError)}`);
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}

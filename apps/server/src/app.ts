import cors from "cors";
import express from "express";
import { seed } from "./features/access/access";
import { authRouter } from "./features/auth/auth";
import { config } from "./config";
import { dashboardRouter } from "./features/dashboard/dashboard";
import { closePool, migrate, query } from "./db/pool";
import { errorHandler, requestId } from "./http";
import { closeRedis, redis, waitForRedis } from "./db/redis";

export async function createApp(): Promise<express.Express> {
  await migrate();
  await waitForRedis();
  await seed();

  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(requestId);
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/v1/health", async (_req, res, next) => {
    try {
      await query("SELECT 1 AS ok");
      const redisReply = await redis.ping();
      res.json({ mysql: "ok", redis: redisReply === "PONG" ? "ok" : "down" });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", dashboardRouter);

  app.use((req, res) => {
    res.status(404).json({
      code: "NOT_FOUND",
      message: "That path does not exist.",
      field_errors: {},
      request_id: req.requestId,
    });
  });
  app.use(errorHandler);
  return app;
}

export async function closeResources(): Promise<void> {
  await closePool();
  await closeRedis();
}

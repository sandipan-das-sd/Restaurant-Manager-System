import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Router, type Request, type RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { PermissionKey } from "../../shared";
import { findUserByEmail, passwordHashForEmail, permissionsForUser, requireActiveUser, toAuthUser } from "../access/access";
import { config } from "../../config";
import { query } from "../../db/pool";
import { HttpError, wrap } from "../../http";
import { redis } from "../../db/redis";

const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(200),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

const dummyHashPromise = bcrypt.hash("not-a-real-password", 10);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mysqlUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function assertLoginAllowed(email: string): Promise<void> {
  const count = Number((await redis.get(`login:fail:${email}`)) ?? 0);
  if (count >= 20) {
    throw new HttpError(429, "RATE_LIMITED", "Too many sign-in attempts. Wait a few minutes and try again.");
  }
}

async function recordLoginFailure(email: string): Promise<void> {
  const key = `login:fail:${email}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 600);
  }
}

async function clearLoginFailures(email: string): Promise<void> {
  await redis.del(`login:fail:${email}`);
}

async function storeSession(userId: string): Promise<{ sessionId: string; refreshToken: string }> {
  const sessionId = randomUUID();
  const refreshToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.refreshTtlSeconds * 1000);
  await query(
    `INSERT INTO sessions (id, user_id, refresh_hash, expires_at) VALUES (?, ?, ?, ?)`,
    [sessionId, userId, hashToken(refreshToken), mysqlUtc(expiresAt)],
  );
  await redis.set(`session:${sessionId}`, JSON.stringify({ userId }), "EX", config.refreshTtlSeconds);
  return { sessionId, refreshToken };
}

function signAccess(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId }, config.accessSecret, {
    expiresIn: config.accessTtlSeconds,
  });
}

export async function readBearer(header: string | undefined): Promise<{ userId: string; sessionId: string }> {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(match[1], config.accessSecret) as jwt.JwtPayload;
  } catch {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  const sessionId = typeof payload.sid === "string" ? payload.sid : "";
  if (!userId || !sessionId) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }

  const key = `session:${sessionId}`;
  const cached = await redis.get(key);
  if (cached) {
    const parsed = JSON.parse(cached) as { userId?: string };
    if (parsed.userId !== userId) {
      throw new HttpError(401, "UNAUTHENTICATED", "Your session has ended. Sign in again.");
    }
  } else {
    const rows = await query<{ user_id: string; expires_at: Date; revoked_at: Date | null }>(
      `SELECT user_id, expires_at, revoked_at FROM sessions WHERE id = ? LIMIT 1`,
      [sessionId],
    );
    const session = rows[0];
    const expired = !session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now();
    if (expired || session.user_id !== userId) {
      throw new HttpError(401, "UNAUTHENTICATED", "Your session has ended. Sign in again.");
    }
    await redis.set(key, JSON.stringify({ userId }), "EX", config.refreshTtlSeconds);
  }

  return { userId, sessionId };
}

export async function authenticate(req: Request): Promise<void> {
  const session = await readBearer(req.header("authorization"));
  const permissions = await permissionsForUser(session.userId);
  req.auth = { ...session, permissions };
}

async function revokeSession(sessionId: string): Promise<void> {
  await query(`UPDATE sessions SET revoked_at = UTC_TIMESTAMP() WHERE id = ? AND revoked_at IS NULL`, [sessionId]);
  await redis.del(`session:${sessionId}`);
}

async function revokeByRefreshToken(refreshToken: string): Promise<void> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM sessions WHERE refresh_hash = ? AND revoked_at IS NULL LIMIT 1`,
    [hashToken(refreshToken)],
  );
  if (rows[0]) {
    await revokeSession(rows[0].id);
  }
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "body";
      fieldErrors[key] = issue.message;
    }
    throw new HttpError(422, "VALIDATION_ERROR", "Check the highlighted fields.", fieldErrors);
  }
  return parsed.data;
}

export const authRouter = Router();

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const email = body.email.toLowerCase();
    await assertLoginAllowed(email);
    const dummyHash = await dummyHashPromise;
    const passwordHash = (await passwordHashForEmail(email)) ?? dummyHash;
    const passwordMatches = await bcrypt.compare(body.password, passwordHash);
    const row = passwordMatches ? await findUserByEmail(email) : null;
    if (!row || !row.active || passwordHash === dummyHash) {
      await recordLoginFailure(email);
      throw new HttpError(401, "INVALID_LOGIN", "Email or password is not valid.");
    }
    await clearLoginFailures(email);
    const session = await storeSession(row.id);
    const permissions = await permissionsForUser(row.id);
    res.json({
      accessToken: signAccess(row.id, session.sessionId),
      refreshToken: session.refreshToken,
      expiresIn: config.accessTtlSeconds,
      user: toAuthUser(row, permissions),
    });
  }),
);

authRouter.post(
  "/refresh",
  wrap(async (req, res) => {
    const body = parseBody(refreshSchema, req.body);
    const rows = await query<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
      `SELECT id, user_id, expires_at, revoked_at FROM sessions WHERE refresh_hash = ? LIMIT 1`,
      [hashToken(body.refreshToken)],
    );
    const current = rows[0];
    if (!current || current.revoked_at || new Date(current.expires_at).getTime() <= Date.now()) {
      throw new HttpError(401, "UNAUTHENTICATED", "Your session has ended. Sign in again.");
    }
    await revokeSession(current.id);
    const next = await storeSession(current.user_id);
    const user = await requireActiveUser(current.user_id);
    res.json({
      accessToken: signAccess(current.user_id, next.sessionId),
      refreshToken: next.refreshToken,
      expiresIn: config.accessTtlSeconds,
      user,
    });
  }),
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    const body = parseBody(logoutSchema, req.body ?? {});
    const header = req.header("authorization");
    if (header) {
      try {
        const session = await readBearer(header);
        await revokeSession(session.sessionId);
      } catch {
        // An expired access token should still clear a refresh token.
      }
    }
    if (body.refreshToken) {
      await revokeByRefreshToken(body.refreshToken);
    }
    res.status(204).end();
  }),
);

function deniedMessage(permission: PermissionKey): string {
  if (permission === "roles.view") {
    return "The role list is limited to Super Admin and Owner.";
  }
  return "This role cannot open that desk.";
}

export function requirePermission(permission: PermissionKey): RequestHandler {
  return (req, _res, next) => {
    authenticate(req)
      .then(() => {
        if (!req.auth?.permissions.includes(permission)) {
          next(new HttpError(403, "PERMISSION_DENIED", deniedMessage(permission)));
          return;
        }
        next();
      })
      .catch(next);
  };
}

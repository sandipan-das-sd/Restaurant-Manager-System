import bcrypt from "bcryptjs";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  PERMISSION_KEYS,
  ROLES,
  roleByKey,
  type AuthUser,
  type PermissionKey,
  type RoleKey,
} from "../../shared";
import { pool, query } from "../../db/pool";
import { OUTLET_ID, stableId } from "../../db/ids";
import { HttpError } from "../../http";
import { redis } from "../../db/redis";

type UserRow = {
  id: string;
  name: string;
  email: string;
  active: number;
  outlet_name: string;
  role_key: RoleKey;
  role_name: string;
  role_description: string;
};

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "dashboard.view": "Open the dashboard",
  "sales.view": "Open the sales desk",
  "kitchen.view": "Open the kitchen desk",
  "purchases.view": "Open the purchases desk",
  "reports.view": "Open reports",
  "roles.view": "Read the role list",
};

export async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO outlets (id, name, timezone, currency)
       VALUES (?, 'Restaurant Manager System', 'Asia/Kolkata', 'INR')
       ON DUPLICATE KEY UPDATE name = VALUES(name), timezone = VALUES(timezone), currency = VALUES(currency)`,
      [OUTLET_ID],
    );

    for (const permission of PERMISSION_KEYS) {
      await connection.query(
        `INSERT INTO permissions (id, permission_key, label)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE label = VALUES(label)`,
        [stableId("permission", permission), permission, PERMISSION_LABELS[permission]],
      );
    }

    for (const role of ROLES) {
      const roleId = stableId("role", role.key);
      await connection.query(
        `INSERT INTO roles (id, role_key, name, description, sort_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order)`,
        [roleId, role.key, role.name, role.description, role.sortOrder],
      );
      await connection.query(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);
      for (const permission of role.permissions) {
        await connection.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          [roleId, stableId("permission", permission)],
        );
      }
    }

    for (const account of DEMO_ACCOUNTS) {
      const userId = stableId("user", account.email);
      await connection.query(
        `INSERT INTO users (id, outlet_id, name, email, password_hash, active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), active = 1`,
        [userId, OUTLET_ID, account.name, account.email, passwordHash],
      );
      await connection.query(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);
      await connection.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [
        userId,
        stableId("role", account.role),
      ]);
    }

    await connection.commit();
    const cachedPermissions = await redis.keys("perms:*");
    if (cachedPermissions.length > 0) {
      await redis.del(...cachedPermissions);
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    `SELECT u.id, u.name, u.email, u.active, o.name AS outlet_name,
            r.role_key, r.name AS role_name, r.description AS role_description
     FROM users u
     JOIN outlets o ON o.id = u.outlet_id
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.email = ?
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(userId: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    `SELECT u.id, u.name, u.email, u.active, o.name AS outlet_name,
            r.role_key, r.name AS role_name, r.description AS role_description
     FROM users u
     JOIN outlets o ON o.id = u.outlet_id
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export function toAuthUser(row: UserRow, permissions: PermissionKey[]): AuthUser {
  const role = roleByKey(row.role_key);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    outletName: row.outlet_name,
    role: {
      key: row.role_key,
      name: row.role_name,
      description: row.role_description,
      accent: role.accent,
    },
    permissions,
  };
}

export async function permissionsForUser(userId: string): Promise<PermissionKey[]> {
  const cacheKey = `perms:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as PermissionKey[];
  }
  const rows = await query<{ permission_key: PermissionKey }>(
    `SELECT p.permission_key
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ?`,
    [userId],
  );
  const permissions = rows.map((row) => row.permission_key);
  await redis.set(cacheKey, JSON.stringify(permissions), "EX", 60);
  return permissions;
}

export async function requireActiveUser(userId: string): Promise<AuthUser> {
  const row = await findUserById(userId);
  if (!row || !row.active) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  const permissions = await permissionsForUser(userId);
  return toAuthUser(row, permissions);
}

export async function passwordHashForEmail(email: string): Promise<string | null> {
  const rows = await query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0]?.password_hash ?? null;
}

import { Router } from "express";
import { APP_NAME, FEATURES, type FeatureKey, type RoleKey } from "../../shared";
import { requireActiveUser } from "../access/access";
import { requirePermission } from "../auth/auth";
import { query } from "../../db/pool";
import { HttpError, wrap } from "../../http";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/me",
  requirePermission("dashboard.view"),
  wrap(async (req, res) => {
    const user = await requireActiveUser(req.auth!.userId);
    res.json(user);
  }),
);

dashboardRouter.get(
  "/dashboard",
  requirePermission("dashboard.view"),
  wrap(async (req, res) => {
    const user = await requireActiveUser(req.auth!.userId);
    res.json({
      welcome: `Welcome to ${APP_NAME}`,
      personName: user.name,
      roleName: user.role.name,
      roleKey: user.role.key,
      roleDescription: user.role.description,
      accent: user.role.accent,
      features: FEATURES.map((feature) => ({
        key: feature.key,
        title: feature.title,
        summary: feature.summary,
        allowed: user.permissions.includes(feature.permission),
      })),
    });
  }),
);

dashboardRouter.get(
  "/features/:key",
  requirePermission("dashboard.view"),
  wrap(async (req, res) => {
    const feature = FEATURES.find((item) => item.key === req.params.key);
    if (!feature) {
      throw new HttpError(404, "NOT_FOUND", "That desk does not exist.");
    }
    const user = await requireActiveUser(req.auth!.userId);
    if (!user.permissions.includes(feature.permission)) {
      throw new HttpError(403, "PERMISSION_DENIED", `${feature.title} is closed for ${user.role.name}.`);
    }
    res.json({
      key: feature.key as FeatureKey,
      title: feature.title,
      summary: feature.summary,
      message: `${feature.title} is open for ${user.role.name}. This demo stops at the door.`,
    });
  }),
);

dashboardRouter.get(
  "/roles",
  requirePermission("roles.view"),
  wrap(async (_req, res) => {
    const roles = await query<{ role_key: RoleKey; name: string; description: string }>(
      `SELECT role_key, name, description FROM roles ORDER BY sort_order`,
    );
    res.json({
      roles: roles.map((role) => ({
        key: role.role_key,
        name: role.name,
        description: role.description,
      })),
    });
  }),
);

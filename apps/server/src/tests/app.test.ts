import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { DEMO_PASSWORD } from "../shared";
import { closeResources, createApp } from "../app";
import type { Express } from "express";

let app: Express;

before(async () => {
  app = await createApp();
});

after(async () => {
  await closeResources();
});

async function login(email: string) {
  const response = await request(app).post("/api/v1/auth/login").send({
    email,
    password: DEMO_PASSWORD,
  });
  assert.equal(response.status, 200);
  return response.body as {
    accessToken: string;
    user: { role: { name: string } };
  };
}

test("health checks mysql and redis", async () => {
  const response = await request(app).get("/api/v1/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.mysql, "ok");
  assert.equal(response.body.redis, "ok");
});

test("super admin opens the welcome line", async () => {
  const session = await login("superadmin@dhabar.local");
  assert.equal(session.user.role.name, "Super Admin");
  const dashboard = await request(app)
    .get("/api/v1/dashboard")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.welcome, "Welcome to Restaurant Manager System");
  assert.equal(dashboard.body.roleName, "Super Admin");
  assert.equal(dashboard.body.personName, "Awanish Rai");
  assert.equal(
    dashboard.body.features.every((feature: { allowed: boolean }) => feature.allowed),
    true,
  );
});

test("cashier sees the same welcome and a different role", async () => {
  const session = await login("cashier@dhabar.local");
  const dashboard = await request(app)
    .get("/api/v1/dashboard")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.welcome, "Welcome to Restaurant Manager System");
  assert.equal(dashboard.body.roleName, "Cashier");
  assert.equal(dashboard.body.personName, "Rohan Das");
  const allowed = Object.fromEntries(
    dashboard.body.features.map((feature: { key: string; allowed: boolean }) => [feature.key, feature.allowed]),
  );
  assert.equal(allowed.sales, true);
  assert.equal(allowed.kitchen, false);
  assert.equal(allowed.roles, false);
});

test("cashier can open sales and is refused by the kitchen desk", async () => {
  const session = await login("cashier@dhabar.local");
  const sales = await request(app)
    .get("/api/v1/features/sales")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(sales.status, 200);
  assert.match(sales.body.message, /open for Cashier/);
  const kitchen = await request(app)
    .get("/api/v1/features/kitchen")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(kitchen.status, 403);
  assert.equal(kitchen.body.code, "PERMISSION_DENIED");
});

test("cashier cannot read the role list", async () => {
  const session = await login("cashier@dhabar.local");
  const response = await request(app)
    .get("/api/v1/roles")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, "PERMISSION_DENIED");
});

test("super admin can read the role list", async () => {
  const session = await login("superadmin@dhabar.local");
  const response = await request(app)
    .get("/api/v1/roles")
    .set("Authorization", `Bearer ${session.accessToken}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.roles.some((role: { name: string }) => role.name === "Super Admin"), true);
  assert.equal(response.body.roles.length, 7);
});

test("a wrong password is rejected", async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email: "superadmin@dhabar.local",
    password: "wrong-password",
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.code, "INVALID_LOGIN");
});

test("the dashboard requires a sign-in", async () => {
  const response = await request(app).get("/api/v1/dashboard");
  assert.equal(response.status, 401);
  assert.equal(response.body.code, "UNAUTHENTICATED");
});

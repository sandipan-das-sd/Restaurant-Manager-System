import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { config } from "../config";

export const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
});

export async function query<T extends object>(
  sql: string,
  params: Array<string | number | null> = [],
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForMysql(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return;
    } catch (error) {
      lastError = error;
      await delay(1000);
    }
  }
  throw new Error(`MySQL did not become ready. ${String(lastError)}`);
}

function schemaPath(): string {
  const candidates = [
    path.resolve(__dirname, "../../sql/001_schema.sql"),
    path.resolve(__dirname, "../../../sql/001_schema.sql"),
    path.resolve(process.cwd(), "sql/001_schema.sql"),
    path.resolve(process.cwd(), "apps/server/sql/001_schema.sql"),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error("Could not find 001_schema.sql");
  }
  return found;
}

export async function migrate(): Promise<void> {
  await waitForMysql();
  const sql = fs.readFileSync(schemaPath(), "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

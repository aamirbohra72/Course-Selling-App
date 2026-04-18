import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

let pool;
let dbInstance;

function connectionUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and paste your Neon connection string " +
        "(Neon console → Connection details → URI, use pooled + sslmode=require).",
    );
  }
  return url;
}

export function getPool() {
  if (!pool) {
    const url = connectionUrl();
    const useSsl =
      process.env.DATABASE_SSL !== "false" &&
      (url.includes("sslmode=require") ||
        url.includes("sslmode=verify-full") ||
        /neon\.tech/i.test(url));

    pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 15_000),
      ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
    });
  }
  return pool;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

/** Drizzle client; pool connects on first query. */
export const db = new Proxy(
  {},
  {
    get(_t, prop, receiver) {
      const real = getDb();
      const v = Reflect.get(real, prop, receiver);
      return typeof v === "function" ? v.bind(real) : v;
    },
  },
);

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
  dbInstance = undefined;
}

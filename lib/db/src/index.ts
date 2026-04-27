import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRESQL_URL) return process.env.POSTGRESQL_URL;
  if (process.env.DB_URL) return process.env.DB_URL;
  if (process.env.PGURL) return process.env.PGURL;

  // Construct from individual PG* vars (Railway Postgres plugin injects these)
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB;

  if (host && user && password && database) {
    console.log("[DB] Constructed connection string from PG* env vars");
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  const available = Object.keys(process.env)
    .filter((k) => k.includes("DATABASE") || k.includes("POSTGRES") || k.includes("PG"))
    .join(", ");
  throw new Error(
    `No database connection string found. ` +
      `Checked DATABASE_URL, POSTGRES_URL, PGURL and PG* vars. ` +
      `Relevant env vars present: [${available || "none"}]`
  );
}

function getPool(): pg.Pool {
  if (!_pool) {
    const connectionString = resolveConnectionString();
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export * from "./schema";

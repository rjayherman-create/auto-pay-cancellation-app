import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function resolveConnectionString(): string {
  // Try all variable names Railway / other platforms might use
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRESQL_URL,
    process.env.DB_URL,
    process.env.PGURL,
  ];

  for (const url of candidates) {
    if (url) return url;
  }

  // Try building from individual PG* vars (Railway Postgres plugin injects these)
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB;

  if (host && user && password && database) {
    const url = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    console.log("[DB] Constructed connection string from PG* env vars");
    return url;
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

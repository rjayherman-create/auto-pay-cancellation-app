import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

function resolveConnectionString(): string {
  if (env("DATABASE_URL")) return env("DATABASE_URL")!;
  if (env("POSTGRES_URL")) return env("POSTGRES_URL")!;
  if (env("POSTGRESQL_URL")) return env("POSTGRESQL_URL")!;
  if (env("DB_URL")) return env("DB_URL")!;
  if (env("PGURL")) return env("PGURL")!;

  // Construct from individual PG* vars (Railway Postgres plugin injects these)
  const host = env("PGHOST") || env("POSTGRES_HOST");
  const port = env("PGPORT") || env("POSTGRES_PORT") || "5432";
  const user = env("PGUSER") || env("POSTGRES_USER");
  const password = env("PGPASSWORD") || env("POSTGRES_PASSWORD");
  const database = env("PGDATABASE") || env("POSTGRES_DB");

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

// ─── Auto-migrate: create enums + tables if they don't exist ─────────────────
export async function initDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    console.log("[DB] Running schema initialization...");
    await client.query(`
      -- Enums (safe to run multiple times)
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('trial','active','cancelled','expired');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE account_type AS ENUM ('checking','savings','credit');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_frequency AS ENUM ('weekly','monthly','quarterly','annually');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('active','cancelled','disputed');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE cancellation_difficulty AS ENUM ('easy','medium','hard');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE action_type AS ENUM ('cancelled','detected','disputed','saved');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- Tables
      CREATE TABLE IF NOT EXISTS users (
        id                    SERIAL PRIMARY KEY,
        email                 TEXT NOT NULL UNIQUE,
        password_hash         TEXT NOT NULL,
        name                  TEXT NOT NULL,
        subscription_status   subscription_status NOT NULL DEFAULT 'trial',
        trial_ends_at         TIMESTAMP,
        stripe_customer_id    TEXT,
        stripe_subscription_id TEXT,
        created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bank_name           TEXT NOT NULL,
        account_type        account_type NOT NULL,
        last_four           TEXT NOT NULL,
        is_active           BOOLEAN NOT NULL DEFAULT TRUE,
        plaid_access_token  TEXT,
        plaid_item_id       TEXT,
        connected_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recurring_payments (
        id                      SERIAL PRIMARY KEY,
        user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id              INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
        merchant_name           TEXT NOT NULL,
        amount                  REAL NOT NULL,
        currency                TEXT NOT NULL DEFAULT 'USD',
        frequency               payment_frequency NOT NULL,
        category                TEXT NOT NULL,
        status                  payment_status NOT NULL DEFAULT 'active',
        next_charge_date        DATE NOT NULL,
        last_charge_date        DATE,
        cancellation_difficulty cancellation_difficulty NOT NULL DEFAULT 'medium',
        logo_url                TEXT,
        created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_actions (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          action_type NOT NULL,
        merchant_name TEXT NOT NULL,
        amount        REAL NOT NULL DEFAULT 0,
        description   TEXT NOT NULL,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[DB] Schema ready.");
  } catch (err: any) {
    console.error("[DB] Schema initialization failed:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

export * from "./schema";

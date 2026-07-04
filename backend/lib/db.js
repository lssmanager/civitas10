let pool;
let db;
const schema = new Proxy({}, { get(_target, prop) { return require("../db/schema")[prop]; } });

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL is required to connect to Postgres");
    error.code = "DATABASE_URL_MISSING";
    throw error;
  }
  return process.env.DATABASE_URL;
}

function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 5000),
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

function getDb() {
  if (!db) {
    const { drizzle } = require("drizzle-orm/node-postgres");
    db = drizzle(getPool(), { schema });
  }
  return db;
}


function sanitizeDatabaseError(error) {
  if (!error || typeof error !== "object") return { message: String(error || "unknown database error") };
  const details = {
    message: error.message,
    code: error.code || null,
    severity: error.severity || null,
    routine: error.routine || null,
    schema: error.schema || null,
    table: error.table || null,
    column: error.column || null,
    constraint: error.constraint || null,
  };
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value != null && value !== ""));
}

function classifyDatabaseError(error) {
  const code = error?.code;
  if (code === "42P01") return "relation_does_not_exist";
  if (code === "42703") return "column_does_not_exist";
  if (code === "42501") return "permission_denied";
  if (code === "28P01") return "invalid_password";
  if (code === "3D000") return "database_does_not_exist";
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT") return "connection_failed";
  return code ? "postgres_error" : "database_error";
}

async function queryPostgres(query = "select 1", params = []) {
  if (typeof query === "string") return getPool().query(query, params);
  return getDb().execute(query);
}

async function pingDatabase() {
  const { sql } = require("drizzle-orm");
  const startedAt = Date.now();
  await getDb().execute(sql`select 1`);
  return { ok: true, latencyMs: Date.now() - startedAt };
}

async function closeDatabase() {
  if (pool) await pool.end();
  pool = null;
  db = null;
}

module.exports = { classifyDatabaseError, closeDatabase, getDatabaseUrl, getDb, getPool, pingDatabase, queryPostgres, sanitizeDatabaseError, schema };

#!/usr/bin/env node
"use strict";

try { require("dotenv").config(); } catch (_error) { /* dotenv is optional in tests. */ }

const REQUIRED_TABLES = Object.freeze(["location_import_runs", "location_countries", "location_states", "location_cities"]);

function loadRuntime() {
  return require("../lib/db");
}

async function tableStatus({ queryPostgres = loadRuntime().queryPostgres } = {}) {
  const { rows } = await queryPostgres(
    `select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[])`,
    [REQUIRED_TABLES],
  );
  const existing = new Set(rows.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter((table) => !existing.has(table));
  return { ok: missingTables.length === 0, missingTables };
}

async function loadCatalogStatus({ queryPostgres = loadRuntime().queryPostgres } = {}) {
  const tables = await tableStatus({ queryPostgres });
  if (!tables.ok) {
    const error = new Error(`Location catalog schema is missing required tables: ${tables.missingTables.join(", ")}. Run npm run db:migrate:sql first.`);
    error.code = "LOCATION_CATALOG_SCHEMA_MISSING";
    error.details = tables;
    throw error;
  }

  const { rows } = await queryPostgres(
    `select
       (select count(*)::int from location_countries where is_active = true) as countries,
       (select count(*)::int from location_states where is_active = true) as states,
       (select count(*)::int from location_cities where is_active = true) as cities,
       (select json_build_object('id', id, 'sourceVersion', source_version, 'completedAt', completed_at, 'countries', countries_count, 'states', states_count, 'cities', cities_count)
          from location_import_runs
         where status = 'completed'
         order by completed_at desc nulls last, started_at desc
         limit 1) as "lastCompletedImport"`,
  );
  const status = rows[0] || {};
  return {
    countries: Number(status.countries || 0),
    states: Number(status.states || 0),
    cities: Number(status.cities || 0),
    lastCompletedImport: status.lastCompletedImport || null,
  };
}

function isCatalogReady(status) {
  return Boolean(status && status.countries > 0 && status.lastCompletedImport);
}

async function ensureLocationCatalog({ queryPostgres = loadRuntime().queryPostgres, runImport, logger = console } = {}) {
  const before = await loadCatalogStatus({ queryPostgres });
  if (isCatalogReady(before)) {
    const result = { component: "location-catalog", status: "ok", action: "skipped", counts: { countries: before.countries, states: before.states, cities: before.cities }, lastCompletedImport: before.lastCompletedImport };
    logger.log(JSON.stringify(result));
    return result;
  }

  const importFn = runImport || require("./import-location-catalog").runImport;
  await importFn();
  const after = await loadCatalogStatus({ queryPostgres });
  if (!isCatalogReady(after)) {
    const error = new Error("Location catalog import completed but the catalog is still not ready.");
    error.code = "LOCATION_CATALOG_IMPORT_INCOMPLETE";
    error.details = after;
    throw error;
  }
  const result = { component: "location-catalog", status: "ok", action: "imported", counts: { countries: after.countries, states: after.states, cities: after.cities }, lastCompletedImport: after.lastCompletedImport };
  logger.log(JSON.stringify(result));
  return result;
}

async function main() {
  const runtime = loadRuntime();
  try {
    await ensureLocationCatalog({ queryPostgres: runtime.queryPostgres });
  } catch (error) {
    console.error(JSON.stringify({ component: "location-catalog", status: "failed", error: error.message, code: error.code || null, details: error.details || null }));
    process.exitCode = 1;
  } finally {
    await runtime.closeDatabase();
  }
}

if (require.main === module) void main();

module.exports = { REQUIRED_TABLES, ensureLocationCatalog, isCatalogReady, loadCatalogStatus, tableStatus };

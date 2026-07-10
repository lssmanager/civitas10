const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { parsePositiveInteger } = require("../services/locations");
const { mapCountry, mapState, mapCity, CITY_BATCH_SIZE, CITIES_JSON_URL, SOURCE_LICENSE } = require("../scripts/import-location-catalog");

test("location route params accept only positive integer identifiers", () => {
  assert.equal(parsePositiveInteger("1"), 1);
  assert.equal(parsePositiveInteger("0"), null);
  assert.equal(parsePositiveInteger("abc"), null);
});

test("location importer maps dr5hn JSON fields for idempotent catalog tables", () => {
  assert.equal(CITY_BATCH_SIZE, 1000);
  assert.match(SOURCE_LICENSE, /ODbL/);
  assert.match(CITIES_JSON_URL, /json-cities\.json\.gz$/);
  assert.deepEqual(mapCountry({ id: "48", name: "Colombia", iso2: "CO", iso3: "COL", numeric_code: "170", phone_code: "57", latitude: "4.000000", longitude: "-72.000000" }), [48, "dr5hn-master-json", "Colombia", "CO", "COL", "170", "57", null, null, null, null, null, null, "4.000000", "-72.000000"]);
  assert.equal(mapState({ id: "2890", name: "Antioquia", country_id: "48", country_code: "CO" }, new Map([[48, 10]]))[2], 10);
  assert.equal(mapCity({ id: "21160", name: "Medellín", state_id: "2890", country_id: "48", country_code: "CO" }, new Map([[48, 10]]), new Map([[2890, 20]]))[3], 20);
});

test("backend registers canonical public location endpoints", () => {
  const source = readFileSync(join(__dirname, "..", "index.js"), "utf8");
  assert.match(source, /secureRoute\.get\("\/locations\/countries", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/states", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/cities", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/search", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/health", "public"/);
});

const { ensureLocationCatalog, isCatalogReady, loadCatalogStatus, REQUIRED_TABLES } = require("../scripts/ensure-location-catalog");

test("location ensure skips import when active countries and a completed import exist", async () => {
  let imported = false;
  const status = { countries: 250, states: 5308, cities: 152967, lastCompletedImport: { id: 1 } };
  const result = await ensureLocationCatalog({
    queryPostgres: async (sql) => sql.includes("information_schema.tables")
      ? { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) }
      : { rows: [status] },
    runImport: async () => { imported = true; },
    logger: { log() {} },
  });
  assert.equal(imported, false);
  assert.equal(result.action, "skipped");
});

test("location ensure imports when catalog is empty or incomplete", async () => {
  let imported = false;
  let calls = 0;
  const result = await ensureLocationCatalog({
    queryPostgres: async (sql) => {
      if (sql.includes("information_schema.tables")) return { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) };
      calls += 1;
      return { rows: [calls === 1 ? { countries: 0, states: 0, cities: 0, lastCompletedImport: null } : { countries: 250, states: 5308, cities: 152967, lastCompletedImport: { id: 2 } }] };
    },
    runImport: async () => { imported = true; },
    logger: { log() {} },
  });
  assert.equal(imported, true);
  assert.equal(result.action, "imported");
});

test("location ensure fails clearly when required location tables are missing", async () => {
  await assert.rejects(
    () => loadCatalogStatus({ queryPostgres: async () => ({ rows: [{ table_name: "location_countries" }] }) }),
    /Location catalog schema is missing required tables/,
  );
});

test("location ensure CLI closes database connections", () => {
  const source = readFileSync(join(__dirname, "..", "scripts", "ensure-location-catalog.js"), "utf8");
  assert.match(source, /finally \{\s*await runtime\.closeDatabase\(\);\s*\}/);
  assert.equal(isCatalogReady({ countries: 1, lastCompletedImport: { id: 1 } }), true);
});

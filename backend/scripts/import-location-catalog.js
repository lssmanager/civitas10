#!/usr/bin/env node
let runtime;
function loadRuntime() {
  if (!runtime) {
    try { require("dotenv").config(); } catch (_error) { /* dotenv is only required when running the importer in an installed backend. */ }
    runtime = require("../lib/db");
  }
  return runtime;
}

const SOURCE_NAME = "dr5hn/countries-states-cities-database";
const SOURCE_URL = "https://github.com/dr5hn/countries-states-cities-database";
const RAW_BASE_URL = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json";
const RELEASE_ASSET_BASE_URL = "https://github.com/dr5hn/countries-states-cities-database/releases/latest/download";
const COUNTRIES_JSON_URL = process.env.LOCATION_COUNTRIES_JSON_URL || `${RAW_BASE_URL}/countries.json`;
const STATES_JSON_URL = process.env.LOCATION_STATES_JSON_URL || `${RAW_BASE_URL}/states.json`;
const CITIES_JSON_URL = process.env.LOCATION_CITIES_JSON_URL || `${RELEASE_ASSET_BASE_URL}/json-cities.json.gz`;
const SOURCE_VERSION = process.env.LOCATION_CATALOG_SOURCE_VERSION || "dr5hn-master-json";
const SOURCE_LICENSE = "ODbL-1.0 (Open Database License)";
const CITY_BATCH_SIZE = Number(process.env.LOCATION_IMPORT_CITY_BATCH_SIZE || 1000);

const toText = (value) => (value === null || value === undefined || value === "" ? null : String(value));
const toDecimal = toText;
const toSourceId = (value) => Number(value);
const toPhoneCode = (row) => toText(row.phonecode ?? row.phone_code);

async function downloadJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${label}: ${response.status} ${response.statusText}`);
  if (url.endsWith(".gz")) {
    const { gunzipSync } = require("node:zlib");
    const buffer = Buffer.from(await response.arrayBuffer());
    return JSON.parse(gunzipSync(buffer).toString("utf8"));
  }
  return response.json();
}

const mapCountry = (row) => [
  toSourceId(row.id), SOURCE_VERSION, row.name, row.iso2, toText(row.iso3), toText(row.numeric_code), toPhoneCode(row),
  toText(row.capital), toText(row.currency), toText(row.native), toText(row.emoji), toText(row.region), toText(row.subregion),
  toDecimal(row.latitude), toDecimal(row.longitude),
];
const mapState = (row, countryIdBySource) => [
  toSourceId(row.id), SOURCE_VERSION, countryIdBySource.get(toSourceId(row.country_id)), toSourceId(row.country_id), row.name,
  toText(row.state_code), toText(row.type), toDecimal(row.latitude), toDecimal(row.longitude),
];
const mapCity = (row, countryIdBySource, stateIdBySource) => [
  toSourceId(row.id), SOURCE_VERSION, countryIdBySource.get(toSourceId(row.country_id)), stateIdBySource.get(toSourceId(row.state_id)) || null,
  toSourceId(row.country_id), row.state_id ? toSourceId(row.state_id) : null, row.name, toDecimal(row.latitude), toDecimal(row.longitude),
];

async function createImportRun() {
  const { queryPostgres } = loadRuntime();
  const { rows } = await queryPostgres(
    `insert into location_import_runs(source_name, source_url, source_version, license, status)
     values ($1, $2, $3, $4, 'running') returning id`,
    [SOURCE_NAME, SOURCE_URL, SOURCE_VERSION, SOURCE_LICENSE]
  );
  return rows[0].id;
}

async function completeImportRun(id, counts) {
  const { queryPostgres } = loadRuntime();
  await queryPostgres(
    `update location_import_runs
        set status = 'completed', completed_at = now(), countries_count = $2, states_count = $3, cities_count = $4
      where id = $1`,
    [id, counts.countries, counts.states, counts.cities]
  );
}

async function failImportRun(id, error) {
  const { queryPostgres } = loadRuntime();
  await queryPostgres(
    `update location_import_runs set status = 'failed', completed_at = now(), error_json = $2 where id = $1`,
    [id, { name: error.name, message: error.message, stack: error.stack }]
  );
}

async function upsertRows(table, columns, conflictColumn, rows, batchSize = 500) {
  if (rows.length === 0) return;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = [];
    const placeholders = batch.map((row, rowIndex) => {
      const base = rowIndex * columns.length;
      values.push(...row);
      return `(${columns.map((_, columnIndex) => `$${base + columnIndex + 1}`).join(", ")})`;
    }).join(", ");
    const updateSet = columns
      .filter((column) => column !== conflictColumn)
      .map((column) => `${column} = excluded.${column}`)
      .concat(["is_active = true", "updated_at = now()"])
      .join(", ");
    const { queryPostgres } = loadRuntime();
    await queryPostgres(
      `insert into ${table} (${columns.join(", ")}) values ${placeholders}
       on conflict (${conflictColumn}) do update set ${updateSet}`,
      values
    );
  }
}

async function loadIdMap(table) {
  const { queryPostgres } = loadRuntime();
  const { rows } = await queryPostgres(`select id, source_id from ${table} where source_version = $1`, [SOURCE_VERSION]);
  return new Map(rows.map((row) => [Number(row.source_id), Number(row.id)]));
}

async function markInactive(table, sourceIds) {
  const { queryPostgres } = loadRuntime();
  await queryPostgres(`update ${table} set is_active = false, updated_at = now() where source_version = $1 and not (source_id = any($2::int[]))`, [SOURCE_VERSION, sourceIds]);
}

async function runImport() {
  const importRunId = await createImportRun();
  try {
    const [countryRows, stateRows, cityRows] = await Promise.all([
      downloadJson(COUNTRIES_JSON_URL, "countries.json"),
      downloadJson(STATES_JSON_URL, "states.json"),
      downloadJson(CITIES_JSON_URL, "json-cities.json.gz"),
    ]);

    await upsertRows("location_countries", ["source_id", "source_version", "name", "iso2", "iso3", "numeric_code", "phone_code", "capital", "currency", "native", "emoji", "region", "subregion", "latitude", "longitude"], "source_id", countryRows.map(mapCountry));
    const countryIdBySource = await loadIdMap("location_countries");

    await upsertRows("location_states", ["source_id", "source_version", "country_id", "country_source_id", "name", "state_code", "type", "latitude", "longitude"], "source_id", stateRows.map((row) => mapState(row, countryIdBySource)).filter((row) => row[2]));
    const stateIdBySource = await loadIdMap("location_states");

    for (let offset = 0; offset < cityRows.length; offset += CITY_BATCH_SIZE) {
      const batch = cityRows.slice(offset, offset + CITY_BATCH_SIZE).map((row) => mapCity(row, countryIdBySource, stateIdBySource)).filter((row) => row[2]);
      await upsertRows("location_cities", ["source_id", "source_version", "country_id", "state_id", "country_source_id", "state_source_id", "name", "latitude", "longitude"], "source_id", batch, CITY_BATCH_SIZE);
      console.log(`Imported ${Math.min(offset + CITY_BATCH_SIZE, cityRows.length)} / ${cityRows.length} cities`);
    }

    await markInactive("location_cities", cityRows.map((row) => toSourceId(row.id)));
    await markInactive("location_states", stateRows.map((row) => toSourceId(row.id)));
    await markInactive("location_countries", countryRows.map((row) => toSourceId(row.id)));

    await completeImportRun(importRunId, { countries: countryRows.length, states: stateRows.length, cities: cityRows.length });
    console.log(`Imported ${countryRows.length} countries, ${stateRows.length} states, ${cityRows.length} cities from ${SOURCE_NAME}.`);
  } catch (error) {
    await failImportRun(importRunId, error);
    throw error;
  }
}

if (require.main === module) runImport().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => loadRuntime().closeDatabase());
module.exports = { CITIES_JSON_URL, CITY_BATCH_SIZE, COUNTRIES_JSON_URL, SOURCE_LICENSE, SOURCE_NAME, SOURCE_URL, SOURCE_VERSION, STATES_JSON_URL, mapCity, mapCountry, mapState, runImport };

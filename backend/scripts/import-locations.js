#!/usr/bin/env node
let cachedRuntime;
function loadRuntime() {
  if (!cachedRuntime) {
    require("dotenv").config();
    const { getDb, closeDatabase } = require("../lib/db");
    const { countries, states, cities } = require("../db/schema");
    const { sql } = require("drizzle-orm");
    cachedRuntime = { getDb, closeDatabase, countries, states, cities, sql };
  }
  return cachedRuntime;
}

const BASE_URL = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json";
const CITY_BATCH_SIZE = Number(process.env.LOCATION_IMPORT_CITY_BATCH_SIZE || 1000);

const toDecimal = (value) => (value === null || value === undefined || value === "" ? null : String(value));
const toText = (value) => (value === null || value === undefined || value === "" ? null : String(value));

async function downloadJson(file) {
  const response = await fetch(`${BASE_URL}/${file}`);
  if (!response.ok) throw new Error(`Failed to download ${file}: ${response.status} ${response.statusText}`);
  return response.json();
}

const mapCountry = (row) => ({
  id: Number(row.id), name: row.name, iso2: row.iso2, iso3: row.iso3,
  numericCode: toText(row.numeric_code), phoneCode: toText(row.phone_code), capital: toText(row.capital),
  currency: toText(row.currency), currencyName: toText(row.currency_name), currencySymbol: toText(row.currency_symbol),
  region: toText(row.region), subregion: toText(row.subregion), nativeName: toText(row.native), emoji: toText(row.emoji),
  latitude: toDecimal(row.latitude), longitude: toDecimal(row.longitude), wikiDataId: toText(row.wikiDataId),
});
const mapState = (row) => ({
  id: Number(row.id), name: row.name, countryId: Number(row.country_id), countryCode: row.country_code,
  stateCode: toText(row.state_code), type: toText(row.type), latitude: toDecimal(row.latitude), longitude: toDecimal(row.longitude), wikiDataId: toText(row.wikiDataId),
});
const mapCity = (row) => ({
  id: Number(row.id), name: row.name, stateId: row.state_id ? Number(row.state_id) : null, stateCode: toText(row.state_code),
  countryId: Number(row.country_id), countryCode: row.country_code, latitude: toDecimal(row.latitude), longitude: toDecimal(row.longitude),
  timezone: toText(row.timezone), wikiDataId: toText(row.wikiDataId),
});

async function run() {
  const { getDb, countries, states, cities, sql } = loadRuntime();
  const db = getDb();
  const [countryRows, stateRows, cityRows] = await Promise.all([downloadJson("countries.json"), downloadJson("states.json"), downloadJson("cities.json")]);
  await db.execute(sql`truncate table cities, states, countries restart identity cascade`);
  await db.insert(countries).values(countryRows.map(mapCountry));
  await db.insert(states).values(stateRows.map(mapState));
  for (let i = 0; i < cityRows.length; i += CITY_BATCH_SIZE) {
    await db.insert(cities).values(cityRows.slice(i, i + CITY_BATCH_SIZE).map(mapCity));
    console.log(`Imported ${Math.min(i + CITY_BATCH_SIZE, cityRows.length)} / ${cityRows.length} cities`);
  }
  console.log(`Imported ${countryRows.length} countries, ${stateRows.length} states, ${cityRows.length} cities.`);
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => loadRuntime().closeDatabase());
module.exports = { CITY_BATCH_SIZE, mapCity, mapCountry, mapState };

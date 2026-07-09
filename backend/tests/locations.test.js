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

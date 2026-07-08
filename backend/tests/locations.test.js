const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { parsePositiveInteger } = require("../services/locations");
const { mapCountry, mapState, mapCity, CITY_BATCH_SIZE } = require("../scripts/import-locations");

test("location route params accept only positive integer identifiers", () => {
  assert.equal(parsePositiveInteger("1"), 1);
  assert.equal(parsePositiveInteger("0"), null);
  assert.equal(parsePositiveInteger("abc"), null);
});

test("location importer maps dr5hn JSON fields and batches cities", () => {
  assert.equal(CITY_BATCH_SIZE, 1000);
  assert.deepEqual(mapCountry({ id: "48", name: "Colombia", iso2: "CO", iso3: "COL", numeric_code: "170", phone_code: "57", latitude: "4.000000", longitude: "-72.000000" }), {
    id: 48, name: "Colombia", iso2: "CO", iso3: "COL", numericCode: "170", phoneCode: "57", capital: null, currency: null, currencyName: null, currencySymbol: null, region: null, subregion: null, nativeName: null, emoji: null, latitude: "4.000000", longitude: "-72.000000", wikiDataId: null,
  });
  assert.equal(mapState({ id: "2890", name: "Antioquia", country_id: "48", country_code: "CO" }).countryId, 48);
  assert.equal(mapCity({ id: "21160", name: "Medellín", state_id: "2890", country_id: "48", country_code: "CO" }).stateId, 2890);
});

test("backend registers public location endpoints", () => {
  const source = readFileSync(join(__dirname, "..", "index.js"), "utf8");
  assert.match(source, /secureRoute\.get\("\/locations\/countries", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/countries\/:countryId\/states", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/states\/:stateId\/cities", "public"/);
  assert.match(source, /secureRoute\.get\("\/locations\/countries\/:countryId\/phone-code", "public"/);
});

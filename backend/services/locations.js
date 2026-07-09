const { queryPostgres } = require("../lib/db");

const parsePositiveInteger = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const emptyCatalogPayload = (resource) => ({
  error: "LocationCatalogEmpty",
  message: "Location catalog has not been imported. Run `npm --prefix backend run locations:import`.",
  resource,
});

async function getCatalogHealth() {
  const { rows } = await queryPostgres(`
    select
      (select count(*)::int from location_countries where is_active = true) as countries,
      (select count(*)::int from location_states where is_active = true) as states,
      (select count(*)::int from location_cities where is_active = true) as cities,
      (select source_version from location_import_runs where status = 'completed' order by completed_at desc nulls last, started_at desc limit 1) as "sourceVersion",
      (select completed_at from location_import_runs where status = 'completed' order by completed_at desc nulls last, started_at desc limit 1) as "lastImportCompletedAt"
  `);
  const row = rows[0] || { countries: 0, states: 0, cities: 0 };
  return { ...row, loaded: Number(row.countries) > 0 };
}

async function listCountries() {
  const { rows } = await queryPostgres(
    `select id, source_id as "sourceId", name, iso2, iso3, phone_code as "phoneCode", emoji
       from location_countries
      where is_active = true
      order by name asc`
  );
  return rows;
}

async function listStatesByCountry(countryId) {
  const { rows } = await queryPostgres(
    `select id, source_id as "sourceId", country_id as "countryId", country_source_id as "countrySourceId", name,
            state_code as "stateCode", type
       from location_states
      where is_active = true and country_id = $1
      order by name asc`,
    [countryId]
  );
  return rows;
}

async function listCities({ countryId = null, stateId = null, limit = 500 } = {}) {
  if (stateId) {
    const { rows } = await queryPostgres(
      `select id, source_id as "sourceId", country_id as "countryId", state_id as "stateId", name
         from location_cities
        where is_active = true and state_id = $1
        order by name asc
        limit $2`,
      [stateId, limit]
    );
    return rows;
  }
  if (countryId) {
    const { rows } = await queryPostgres(
      `select id, source_id as "sourceId", country_id as "countryId", state_id as "stateId", name
         from location_cities
        where is_active = true and country_id = $1
        order by name asc
        limit $2`,
      [countryId, limit]
    );
    return rows;
  }
  return [];
}

async function searchLocations(query, { limit = 20 } = {}) {
  const q = typeof query === "string" ? query.trim() : "";
  if (q.length < 2) return [];
  const { rows } = await queryPostgres(
    `select 'country' as type, id, name, null::integer as "countryId", null::integer as "stateId"
       from location_countries
      where is_active = true and name ilike $1
      union all
     select 'state' as type, id, name, country_id as "countryId", null::integer as "stateId"
       from location_states
      where is_active = true and name ilike $1
      union all
     select 'city' as type, id, name, country_id as "countryId", state_id as "stateId"
       from location_cities
      where is_active = true and name ilike $1
      order by type, name
      limit $2`,
    [`%${q}%`, limit]
  );
  return rows;
}

async function getCountryPhoneCode(countryId) {
  const { rows } = await queryPostgres(
    `select id, phone_code as "phoneCode" from location_countries where is_active = true and id = $1`,
    [countryId]
  );
  return rows[0] || null;
}

module.exports = { emptyCatalogPayload, getCatalogHealth, getCountryPhoneCode, listCities, listCountries, listStatesByCountry, parsePositiveInteger, searchLocations };

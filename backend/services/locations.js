const { queryPostgres } = require("../lib/db");

const parsePositiveInteger = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

async function listCountries() {
  const { rows } = await queryPostgres(
    "select id, name, iso2, phone_code as \"phoneCode\", emoji from countries order by name asc"
  );
  return rows;
}

async function listStatesByCountry(countryId) {
  const { rows } = await queryPostgres(
    "select id, name, country_id as \"countryId\", country_code as \"countryCode\", state_code as \"stateCode\", type from states where country_id = $1 order by name asc",
    [countryId]
  );
  return rows;
}

async function listCitiesByState(stateId) {
  const { rows } = await queryPostgres(
    "select id, name, state_id as \"stateId\", state_code as \"stateCode\", country_id as \"countryId\", country_code as \"countryCode\", timezone from cities where state_id = $1 order by name asc",
    [stateId]
  );
  return rows;
}

async function getCountryPhoneCode(countryId) {
  const { rows } = await queryPostgres(
    "select id, phone_code as \"phoneCode\" from countries where id = $1",
    [countryId]
  );
  return rows[0] || null;
}

module.exports = { getCountryPhoneCode, listCitiesByState, listCountries, listStatesByCountry, parsePositiveInteger };

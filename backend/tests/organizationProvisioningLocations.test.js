const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeProvisioningInput } = require("../services/organizationProvisioningCore");
const { buildOrganizationCreatePayload } = require("../services/organizationProvisioningPayloads");

const baseBody = () => ({
  name: "Colegio Uno",
  entryUrl: "https://colegio.didaxus.com",
  appSubdomain: "colegio",
  appBaseDomain: "didaxus.com",
  adminDomain: "colegio.didaxus.com",
  administrativeContacts: [{ firstName: "Ada", firstSurname: "Lovelace", email: "ada@example.test", organizationRoleName: "organization_admin" }],
});

test("provisioning normalizes wizard location fields under business.location", () => {
  const normalized = normalizeProvisioningInput({
    ...baseBody(),
    business: {
      country: "Colombia",
      state: "Antioquia",
      city: "",
      location: {
        countryId: "48",
        stateId: "2890",
        cityId: "",
        manualCity: "El Retiro",
        phonePrefix: "57",
        countryCode: "co",
        stateCode: "ANT",
      },
    },
  });

  assert.deepEqual(normalized.errors, []);
  assert.deepEqual(normalized.value.business.location, {
    countryId: 48,
    stateId: 2890,
    manualCity: "El Retiro",
    phonePrefix: "+57",
    countryCode: "CO",
    stateCode: "ANT",
    source: "dr5hn/countries-states-cities-database",
  });
  assert.equal(normalized.value.business.city, "El Retiro");
  assert.equal(normalized.value.business.phonePrefix, "+57");
});

test("organization payload keeps only required business customData fields", () => {
  const normalized = normalizeProvisioningInput({
    ...baseBody(),
    business: {
      country: "Colombia",
      state: "Antioquia",
      city: "Medellín",
      location: { countryId: 48, stateId: 2890, cityId: 21160, phonePrefix: "+57", countryCode: "CO", stateCode: "ANT" },
    },
  });

  const payload = buildOrganizationCreatePayload(normalized.value);
  assert.equal(payload.customData.mainContactOfCivitas.business.country, "Colombia");
  assert.equal(payload.customData.mainContactOfCivitas.business.city, "Medellín");
  assert.equal(payload.customData.mainContactOfCivitas.business.location, undefined);
  assert.equal(payload.customData.mainContactOfCivitas.business.phonePrefix, undefined);
});

test("organization institutional contact does not copy administrative user personal contact data", () => {
  const { buildOrganizationCreatePayload } = require("../services/organizationProvisioningPayloads");
  const payload = buildOrganizationCreatePayload({
    canonical: { name: "Institution", description: "", appSubdomain: "institution", appBaseDomain: "didaxus.com", adminDomain: "institution.edu", jitProvisioning: { defaultRoleNames: [] } },
    contact: {},
    business: { phonePrefix: "+593", phoneNumber: "987654321" },
    administrativeContacts: [{ name: "Admin User", email: "admin@example.test", phone: "+573001112233" }],
  });
  assert.equal(payload.customData.mainContactOfCivitas.contact.email, "");
  assert.equal(payload.customData.mainContactOfCivitas.contact.phone, "");
  assert.equal(payload.customData.mainContactOfCivitas.business.phonePrefix, undefined);
  assert.equal(payload.customData.mainContactOfCivitas.business.phoneNumber, undefined);
});

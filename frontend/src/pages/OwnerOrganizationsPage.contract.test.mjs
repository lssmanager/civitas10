import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationsPage.tsx", import.meta.url), "utf8");

test("OwnerOrganizationsPage is scoped to provisioning and not secondary navigation", () => {
  assert.match(source, /Provisioning workspace/);
  assert.match(source, /template status, organización canónica, custom data, usuarios administrativos, segmentación y submit/i);
  assert.doesNotMatch(source, /Back to home/);
  assert.doesNotMatch(source, /<Link to="\/"/);
});


test("OwnerOrganizationsPage uses the operational location catalog on the real owner create route", () => {
  assert.match(source, /useLocationsApi/);
  assert.match(source, /locationsApi\.listCountries\(\)/);
  assert.match(source, /locationsApi\.listStates\(countryId\)/);
  assert.match(source, /locationsApi\.listCities\(stateId\)/);
  assert.doesNotMatch(source, /COUNTRY_OPTIONS/);
});

test("OwnerOrganizationsPage submits location metadata in the real create payload", () => {
  assert.match(source, /location: \{/);
  assert.match(source, /countryId: selectedCountry\?\.id/);
  assert.match(source, /stateId: selectedRegion\?\.id/);
  assert.match(source, /cityId: selectedCity\?\.id/);
  assert.match(source, /manualCity: form\.business\.manualCity\.trim\(\) \|\| undefined/);
  assert.match(source, /source: selectedCountry \? LOCATION_CATALOG_SOURCE : undefined/);
});


test("OwnerOrganizationsPage review step summarizes real grouped data and edit shortcuts", () => {
  assert.match(source, /const ReviewFields/);
  assert.match(source, /title="Organization"/);
  assert.match(source, /title="Business profile"/);
  assert.match(source, /title="Administrative users"/);
  assert.match(source, /title="Segmentation"/);
  assert.match(source, /onClick=\{\(\) => onEditStep\(0\)\}/);
  assert.match(source, /onClick=\{\(\) => onEditStep\(1\)\}/);
  assert.match(source, /onClick=\{\(\) => onEditStep\(2\)\}/);
  assert.doesNotMatch(source, /Completed provisioning groups/);
});

test("OwnerOrganizationsPage validates email format on blur before advancing", () => {
  assert.match(source, /EMAIL_FORMAT_PATTERN = \/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\//);
  assert.match(source, /onBlur=\{onContactEmailBlur\}/);
  assert.match(source, /onBlur=\{\(\) => onEmailBlur\(contact\.id\)\}/);
  assert.match(source, /disabled=\{hasInvalidCurrentStepEmail\}/);
});

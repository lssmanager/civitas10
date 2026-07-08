import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('organization wizard uses cascading country state city fields and phone prefix', () => {
  const source = readFileSync(join(__dirname, 'CreateOrganizationForm.tsx'), 'utf8');
  assert.match(source, /useLocationsApi/);
  assert.match(source, /listCountries\(\)/);
  assert.match(source, /listStates\(countryId\)/);
  assert.match(source, /listCities\(stateId\)/);
  assert.match(source, /phonePrefix/);
  assert.match(source, /manualCity/);
  assert.match(source, /buildCreateOrganizationPayload\(formData, \{ countries, states, cities \}\)/);
  assert.match(source, /business: \{/);
  assert.match(source, /location: \{/);
  assert.match(source, /city: selectedCity\?\.name \|\| manualCity/);
});

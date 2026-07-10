import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'src/pages/OwnerOrganizationsPage.tsx'), 'utf8');

test('owner create wizard hides manual city fallback when catalog cities are available', () => {
  assert.match(source, /shouldShowManualCityFallback/);
  assert.match(source, /cityOptions\.length === 0/);
  assert.match(source, /shouldShowManualCityFallback \? <FormField id="business-manual-city"/);
});

test('owner create wizard keeps manual city fallback for unavailable catalog or missing city cases', () => {
  assert.match(source, /locationsError \|\| \(form\.business\.stateId && cityOptions\.length === 0\)/);
  assert.match(source, /Manual city fallback \(optional\)/);
});

test('owner create wizard separates organization and admin phone prefix and number payloads', () => {
  assert.match(source, /Organization phone prefix/);
  assert.match(source, /Organization phone number/);
  assert.match(source, /User phone prefix/);
  assert.match(source, /User phone number/);
  assert.match(source, /\[form\.business\.phonePrefix\.trim\(\), form\.business\.phoneNumber\.trim\(\)\]/);
  assert.match(source, /\[contact\.phonePrefix\.trim\(\), contact\.phoneNumber\.trim\(\)\]/);
});

test('owner create wizard unifies canonical and business profile into one organization step', () => {
  assert.match(source, /\{ id: "organization", label: "Organization" \}/);
  assert.doesNotMatch(source, /label: "Canonical organization"/);
  assert.doesNotMatch(source, /label: "Business profile"/);
  assert.match(source, /<StepOrganization/);
});

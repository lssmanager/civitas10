import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'src/pages/OwnerOrganizationsPage.tsx'), 'utf8');

test('owner create wizard hides manual city fallback when catalog cities are available', () => {
  assert.match(source, /shouldShowManualCityFallback/);
  assert.match(source, /cityOptions\.length === 0/);
  assert.match(source, /shouldShowManualCityFallback \? \([\s\S]*?<FormField[\s\S]*?id="business-manual-city"/);
});

test('owner create wizard keeps manual city fallback for unavailable catalog or missing city cases', () => {
  assert.match(source, /locationsError \|\|\n\s*\(form\.business\.stateId && cityOptions\.length === 0\)/);
  assert.match(source, /Manual city fallback \(optional\)/);
});

test('owner create wizard separates organization and admin phone prefix and number payloads', () => {
  assert.match(source, /label="Organization phone"/);
  assert.match(source, /ariaLabel="Organization phone prefix"/);
  assert.match(source, /aria-label="Organization phone number"/);
  assert.match(source, /label="User phone"/);
  assert.match(source, /ariaLabel="User phone prefix"/);
  assert.match(source, /aria-label="User phone number"/);
  assert.match(source, /phone:\s+buildPhoneFromParts\([\s\S]*?form\.business\.phonePrefix,[\s\S]*?form\.business\.phoneNumber,[\s\S]*?\)/);
  assert.match(source, /phone:\s+buildPhoneFromParts\([\s\S]*?contact\.phonePrefix,[\s\S]*?contact\.phoneNumber[\s\S]*?\)/);
});

test('owner create wizard unifies canonical and business profile into one organization step', () => {
  assert.match(source, /\{ id: "organization", label: "Organization" \}/);
  assert.doesNotMatch(source, /label: "Canonical organization"/);
  assert.doesNotMatch(source, /label: "Business profile"/);
  assert.match(source, /<StepOrganization/);
});

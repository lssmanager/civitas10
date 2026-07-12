import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationsPage.tsx", import.meta.url), "utf8");

test("owner create autoloads controlled phone prefixes and treats prefix-only as no phone", () => {
  assert.match(source, /const getCountryDialCode = \(country: CountryOption \| null\)/);
  assert.match(source, /useState<WizardGlobalState>/);
  assert.match(source, /companyPrefix: prefix/);
  assert.match(source, /locationsApi\s*\.getPhoneCode\(selectedCountry\.id\)/);
  assert.match(source, /business: \{ \.\.\.current\.business, phonePrefix: prefix \}/);
  assert.match(source, /<PhonePrefixInput/);
  assert.match(source, /list=\{`\$\{id\}-country-prefixes`\}/);
  assert.match(source, /autoComplete="tel-country-code"/);
  assert.match(source, /const buildPhoneFromParts = \(prefix: string, localNumber: string\) => \{/);
  assert.match(source, /if \(!hasDialableLocalNumber\(number\)\) return undefined;/);
  assert.match(source, /if \(!normalizedPrefix\) return undefined;/);
  assert.match(source, /const includePhoneParts = \(prefix: string, localNumber: string\)/);
  assert.doesNotMatch(source, /placeholder="\+57/);
  assert.doesNotMatch(source, /placeholder="\+57 3001234567"/);
  assert.doesNotMatch(source, /placeholder="3001234567"/);
  assert.match(source, /Country loads the editable phone prefix value/);
  assert.match(source, /phone:\s+buildPhoneFromParts\([\s\S]*?form\.business\.phonePrefix,[\s\S]*?form\.business\.phoneNumber,[\s\S]*?\)/);
  assert.match(source, /phone:\s+buildPhoneFromParts\([\s\S]*?contact\.phonePrefix,[\s\S]*?contact\.phoneNumber[\s\S]*?\)/);
});

test("owner create autogenerates Logto-safe usernames from email local-part", () => {
  assert.match(source, /const normalizeLogtoUsername = \(value: string\) => \{/);
  assert.match(source, /replace\(\/\[\^a-z0-9_\]\/g, "_"\)/);
  assert.match(source, /const buildLogtoUsernameFromEmail = \(email: string\) =>\s+normalizeLogtoUsername\(email\.split\("@"\)\[0\] \|\| ""\)/);
  assert.match(source, /field === "email"/);
  assert.match(source, /username:\s+shouldAutofillUsername\s+\? nextGeneratedUsername\s+: contact\.username/s);
});

test("owner create autogenerates editable segmentation defaults from organization name", () => {
  assert.match(source, /const normalizeSegmentationLabel = \(value: string\)/);
  assert.match(source, /const buildSegmentationDefaults = \(organizationName: string\)/);
  assert.match(source, /tags: \[label\]/);
  assert.match(source, /lists: \[label\]/);
  assert.doesNotMatch(source, /org-\$\{slug\}/);
  assert.doesNotMatch(source, /onboarding-\$\{slug\}/);
  assert.match(source, /const \[segmentationEdited, setSegmentationEdited\]/);
  assert.match(source, /setSegmentationEdited\(\(current\) => \(\{ \.\.\.current, tags: true \}\)\)/);
  assert.match(source, /setSegmentationEdited\(\(current\) => \(\{ \.\.\.current, lists: true \}\)\)/);
});

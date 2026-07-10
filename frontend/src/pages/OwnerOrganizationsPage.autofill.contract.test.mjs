import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationsPage.tsx", import.meta.url), "utf8");

test("owner create autoloads editable phone prefixes and treats prefix-only as no phone", () => {
  assert.match(source, /phonePrefix: nextPrefix/);
  assert.match(source, /className=\{`\$\{inputClassName\} civitas-phone-prefix-field`\}/);
  assert.match(source, /onChange=\{\(event\) => updateBusinessField\("phonePrefix", event\.target\.value\)\}/);
  assert.match(source, /onChange=\{\(event\) => updateContact\(contact\.id, "phonePrefix", event\.target\.value\)\}/);
  assert.match(source, /const buildPhoneFromParts = \(prefix: string, localNumber: string\) => \{/);
  assert.match(source, /if \(!number\) return undefined;/);
  assert.match(source, /phone: buildPhoneFromParts\(form\.business\.phonePrefix, form\.business\.phoneNumber\)/);
  assert.match(source, /phone: buildPhoneFromParts\(contact\.phonePrefix, contact\.phoneNumber\)/);
});

test("owner create autogenerates Logto-safe usernames from email local-part", () => {
  assert.match(source, /const normalizeLogtoUsername = \(value: string\) => \{/);
  assert.match(source, /replace\(\/\[\^a-z0-9_\]\/g, "_"\)/);
  assert.match(source, /const buildLogtoUsernameFromEmail = \(email: string\) => normalizeLogtoUsername\(email\.split\("@"\)\[0\] \|\| ""\)/);
  assert.match(source, /field === "email"/);
  assert.match(source, /username: shouldAutofillUsername \? nextGeneratedUsername : contact\.username/);
});

test("owner create autogenerates editable segmentation defaults from organization name", () => {
  assert.match(source, /const buildSegmentationDefaults = \(organizationName: string\)/);
  assert.match(source, /tags: \[`org-\$\{slug\}`\]/);
  assert.match(source, /lists: \[`onboarding-\$\{slug\}`\]/);
  assert.match(source, /const \[segmentationEdited, setSegmentationEdited\]/);
  assert.match(source, /setSegmentationEdited\(\(current\) => \(\{ \.\.\.current, tags: true \}\)\)/);
  assert.match(source, /setSegmentationEdited\(\(current\) => \(\{ \.\.\.current, lists: true \}\)\)/);
});

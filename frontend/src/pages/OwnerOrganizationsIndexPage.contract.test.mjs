import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationsIndexPage.tsx", import.meta.url), "utf8");
const routes = readFileSync(new URL("../navigation/routes.ts", import.meta.url), "utf8");
const registry = readFileSync(new URL("../features/owner/organizations/organizations.screen.ts", import.meta.url), "utf8");

test("OwnerOrganizationsIndexPage lists Logto organizations as responsive cards", () => {
  assert.match(source, /ownerApi\.getOrganizations\(\)/);
  assert.match(source, /data-owner-organization-card/);
  assert.match(source, /civitas-grid-3/);
  assert.doesNotMatch(source, /DataTable/);
});

test("OwnerOrganizationsIndexPage has loading, empty, and error states", () => {
  assert.match(source, /Loading organizations from the owner Logto contract/);
  assert.match(source, /No Logto organizations are available yet/);
  assert.match(source, /Could not load organizations/);
  assert.match(source, /Retry/);
});

test("owner navigation separates organizations from create", () => {
  assert.match(routes, /ownerCreateOrganization/);
  assert.match(routes, /path: "\/owner\/create"/);
  assert.match(registry, /menuKey: "owner\.organizations"/);
  assert.match(registry, /menuKey: "owner\.organizations\.create"/);
  assert.match(registry, /parentMenuKey: "owner\.organizations"/);
});

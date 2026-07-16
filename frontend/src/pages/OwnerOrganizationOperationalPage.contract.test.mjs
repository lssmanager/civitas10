import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationOperationalPage.tsx", import.meta.url), "utf8");

test("OwnerOrganizationOperationalPage reads operational-state for the selected organization", () => {
  assert.match(source, /useParams\(\)/);
  assert.match(source, /ownerApi\.getOrganizationOperationalState\(organizationId\)/);
});

test("OwnerOrganizationOperationalPage keeps polling when the contract asks for it", () => {
  assert.match(source, /contract\.value\.polling\.shouldPoll/);
  assert.match(source, /setTimeout\(\(\) => void load\(\), interval\)/);
  assert.match(source, /timerRef\.current = null/);
});

test("OwnerOrganizationOperationalPage renders the owner capability surface returned by the backend", () => {
  assert.match(source, /CapabilityCard/);
  assert.match(source, /viewState\.organization\.capabilities\.map/);
  assert.match(source, /Owner capability surface returned by the backend contract/);
  assert.match(source, /BlockCard title="Worker"/);
});

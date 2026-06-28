import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOrganizationOperationalPage.tsx", import.meta.url), "utf8");

test("OwnerOrganizationOperationalPage reads operational-state for the selected organization", () => {
  assert.match(source, /useParams\(\)/);
  assert.match(source, /ownerApi\.getOrganizationOperationalState\(organizationId\)/);
});

test("OwnerOrganizationOperationalPage keeps polling when the contract asks for it", () => {
  assert.match(source, /response\.polling\?\.shouldPoll/);
  assert.match(source, /setTimeout\(\(\) => void load\(\), interval\)/);
  assert.match(source, /if \(state\?\.polling\?\.shouldPoll\)/);
});

test("OwnerOrganizationOperationalPage renders the backbone blocks we expect in the clean owner view", () => {
  assert.match(source, /BlockCard title="Canonical \/ Logto"/);
  assert.match(source, /BlockCard title="FluentCRM"/);
  assert.match(source, /BlockCard title="Worker"/);
  assert.match(source, /BlockCard title="Contact progress"/);
});

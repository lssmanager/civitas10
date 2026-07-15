import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/owner-operational-state-response.json", import.meta.url), "utf8"));
const page = readFileSync(new URL("../pages/OwnerOrganizationOperationalPage.tsx", import.meta.url), "utf8");
const contract = readFileSync(new URL("./operational.ts", import.meta.url), "utf8");

test("owner organization detail consumes the capability-surface operational contract", () => {
  assert.equal(fixture.contractVersion, "2026-07-civitas10-owner-capability-surfaces-v1");
  assert.ok(Array.isArray(fixture.capabilities));
  assert.equal(Object.hasOwn(fixture, "fluentcrm"), false);
  assert.match(contract, /type OwnerOperationalStateResponse/);
  assert.match(contract, /capabilities: OwnerCapabilityState\[\]/);
  assert.match(contract, /OPERATIONAL_CONTRACT_VERSION = "2026-07-civitas10-owner-capability-surfaces-v1"/);
  assert.match(contract, /validateOperationalResponse/);
  assert.match(contract, /const path = `\$\.capabilities\[\$\{index\}\]`/);
  assert.match(page, /validateOperationalResponse\(response\)/);
  assert.doesNotMatch(page, /viewState\.organization\.fluentcrm|viewState\.organization\.canonical|viewState\.organization\.contactProgress/);
});


test("owner operational contract rejects null runtimeState and missing freshness source with paths", () => {
  assert.match(contract, /runtimeState must be a non-null object/);
  assert.match(contract, /`\$\{path\}\.runtimeState\.\$\{key\}`/);
  assert.match(contract, /`\$\{path\}\.source`/);
  assert.match(contract, /unsupported contract version/);
});

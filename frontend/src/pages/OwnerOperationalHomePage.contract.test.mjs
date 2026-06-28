import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./OwnerOperationalHomePage.tsx", import.meta.url), "utf8");

test("OwnerOperationalHomePage loads organizations and runtime in parallel", () => {
  assert.match(source, /Promise\.all\(\s*\[/);
  assert.match(source, /ownerApi\.getOrganizations\(\)/);
  assert.match(source, /ownerApi\.getWorkerQueuesObservability\(\)/);
});

test("OwnerOperationalHomePage links to the clean owner runtime views", () => {
  assert.match(source, /appRoutes\.ownerOrganizations\.path/);
  assert.match(source, /appRoutes\.ownerWorkerQueues\.path/);
  assert.match(source, /Open state/);
});

test("OwnerOperationalHomePage explains the backbone-first owner view", () => {
  assert.match(source, /contrato operacional consolidado/i);
  assert.match(source, /No usa logs legacy como verdad principal/i);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("clean backend exposes owner operational-state and worker-queues routes", () => {
  const source = readFileSync(join(__dirname, "..", "index.js"), "utf8");
  assert.match(source, /require\("\.\/services\/operationalStateAssembler"\)/);
  assert.match(source, /require\("\.\/services\/operationalObservability"\)/);
  assert.match(source, /secureRoute\.get\("\/owner\/organizations\/:organizationId\/operational-state", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.ownerRead, OWNER_SCOPES.runtimeRead\] \}\), requireOwner/);
  assert.match(source, /secureRoute\.get\("\/owner\/system\/worker-queues", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.workerQueuesRead\] \}\), requireOwner/);
  assert.match(source, /buildConsolidatedOperationalResponse\(/);
  assert.match(source, /loadWorkerQueuesObservability\(/);
  assert.match(source, /if \(require\.main === module\)/);
});
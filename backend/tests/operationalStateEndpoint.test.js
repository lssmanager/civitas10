const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("clean backend exposes owner operational-state and worker-queues routes", () => {
  const source = readFileSync(join(__dirname, "..", "index.js"), "utf8");
  assert.match(source, /require\("\.\/services\/operationalStateAssembler"\)/);
  assert.match(source, /require\("\.\/services\/operationalObservability"\)/);
  assert.match(source, /secureRoute\.get\("\/owner\/organizations\/:organizationId\/operational-state", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.ownerRead, OWNER_SCOPES.runtimeRead\] \}\), requireGlobalOwner/);
  assert.match(source, /secureRoute\.get\("\/owner\/system\/worker-queues", "ownerRead", requireGlobalAccess\(\{ resource: API_RESOURCE, requiredScopes: \[OWNER_SCOPES.workerQueuesRead\] \}\), requireGlobalOwner/);
  assert.match(source, /buildConsolidatedOperationalResponse\(/);
  assert.match(source, /loadWorkerQueuesObservability\(/);
  assert.match(source, /if \(require\.main === module\)/);
});
test("operational operation creation validates owner-supplied input before persistence", () => {
  const source = readFileSync(join(__dirname, "..", "services", "operationalOperations.js"), "utf8");
  assert.match(source, /async function createOperation/);
  assert.match(source, /normalizeCreateOperationInput\(input\)/);
  assert.match(source, /ACTION_TYPE_PATTERN/);
  assert.match(source, /MAX_OPERATION_JSON_BYTES/);
});

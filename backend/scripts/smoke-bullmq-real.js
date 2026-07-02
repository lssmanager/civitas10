"use strict";
require("dotenv").config();
const { validateRuntimeEnv } = require("../runtime/env");
const { closeActionQueues, enqueueActionOperation } = require("../queues/actionQueue");
const { getDb, schema } = require("../lib/db");
const { eq } = require("drizzle-orm");
const timeoutMs = Number(process.env.SMOKE_BULLMQ_TIMEOUT_MS || 30000);
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function main() {
  validateRuntimeEnv({ requireRedis: true });
  const db = getDb();
  const idempotencyKey = `phase0-smoke-system-echo-${Date.now()}`;
  const [operation] = await db.insert(schema.operationalOperations).values({ operationType: "system.echo", entityType: "smoke_test", inputJson: { message: "phase0", idempotencyKey }, idempotencyKey, queueName: "priority_commands", maxAttempts: 1 }).returning();
  await enqueueActionOperation(operation, { queueName: "priority_commands" });
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const [row] = await db.select().from(schema.operationalOperations).where(eq(schema.operationalOperations.id, operation.id)).limit(1);
    if (row?.status === "completed") { console.log(JSON.stringify({ status: "ok", message: "system.echo completed", operationId: operation.id })); await closeActionQueues(); return; }
    if (row?.status === "failed") throw new Error(`system.echo failed for operation ${operation.id}`);
    await sleep(1000);
  }
  throw new Error(`system.echo did not complete within ${timeoutMs}ms`);
}
main().then(() => process.exit(0)).catch(async (error) => { console.error(JSON.stringify({ status: "failed", error: error.message })); try { await closeActionQueues(); } catch {} process.exit(1); });

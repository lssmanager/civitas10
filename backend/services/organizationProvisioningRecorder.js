const { getDb, schema } = require("../lib/db");
function orm() { return require("drizzle-orm"); }

function safeJson(value = {}) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function serializeError(error) { return { name: error?.name || "Error", message: error?.message || String(error), code: error?.code || null, status: error?.status || null }; }

function createOrganizationProvisioningRecorder({ actor = {}, idempotencyKey = null } = {}) {
  let operationId = null;
  async function ensureExistingOperation() {
    if (operationId || !idempotencyKey) return operationId;
    const [existing] = await getDb().select().from(schema.operationalOperations).where(orm().eq(schema.operationalOperations.idempotencyKey, idempotencyKey)).limit(1);
    operationId = existing?.id || null;
    return operationId;
  }
  return {
    async startOperation({ operationType = "organization.bootstrap", input = {} } = {}) {
      const [operation] = await getDb().insert(schema.operationalOperations).values({
        operationType,
        entityType: "logto_organization",
        status: "running",
        inputJson: { ...safeJson(input), actor: safeJson(actor), idempotencyKey },
        idempotencyKey,
        queueName: "owner_provisioning",
        claimedBy: actor.logtoUserId || "owner_global",
        claimedAt: new Date(),
      }).onConflictDoNothing().returning();
      operationId = operation?.id || await ensureExistingOperation();
      if (operationId) {
        await getDb().update(schema.operationalOperations).set({ status: "running", updatedAt: new Date(), claimedBy: actor.logtoUserId || "owner_global", claimedAt: new Date() }).where(orm().eq(schema.operationalOperations.id, operationId));
      }
      if (idempotencyKey) {
        await getDb().insert(schema.idempotencyRecords).values({ idempotencyKey, operationId, actionType: operationType, status: "started", resultJson: { operationId } }).onConflictDoUpdate({ target: schema.idempotencyRecords.idempotencyKey, set: { operationId, actionType: operationType, status: "started", resultJson: { operationId }, updatedAt: new Date() } });
      }
      if (operationId) await getDb().insert(schema.auditLogs).values({ actorLogtoUserId: actor.logtoUserId || null, actorType: "owner_global", action: "organization_bootstrap_started", targetType: "operational_operation", targetId: operationId, metadata: { operationType, idempotencyKey } });
      return operation || { id: operationId };
    },
    async getOperation() {
      await ensureExistingOperation();
      if (!operationId) return null;
      const [operation] = await getDb().select().from(schema.operationalOperations).where(orm().eq(schema.operationalOperations.id, operationId)).limit(1);
      return operation || null;
    },
    async getCompletedSteps() {
      await ensureExistingOperation();
      if (!operationId) return new Map();
      const steps = await getDb().select().from(schema.operationalOperationSteps).where(orm().eq(schema.operationalOperationSteps.operationId, operationId));
      const completed = new Map();
      for (const step of steps) if (step.status === "completed") completed.set(step.stepName, step.outputJson || {});
      return completed;
    },
    async recordStep({ stepName, status = "completed", metadata = {}, error = null } = {}) {
      await ensureExistingOperation();
      if (!operationId) return null;
      const now = new Date();
      const [step] = await getDb().insert(schema.operationalOperationSteps).values({
        operationId,
        stepName,
        status,
        inputJson: safeJson(metadata.input || metadata),
        outputJson: safeJson(metadata.output || metadata),
        lastErrorJson: error ? serializeError(error) : metadata.lastErrorJson || null,
        startedAt: now,
        completedAt: ["completed", "failed", "skipped"].includes(status) ? now : null,
      }).returning();
      return step;
    },
    async completeOperation({ organizationId, status = "created_with_logto_bootstrap", result = {} } = {}) {
      await ensureExistingOperation();
      if (!operationId) return null;
      const now = new Date();
      const resultJson = { status, organizationId, ...safeJson(result) };
      const [operation] = await getDb().update(schema.operationalOperations).set({ logtoOrganizationId: organizationId || null, entityId: organizationId || null, status: "completed", outputJson: resultJson, lastErrorJson: null, completedAt: now, updatedAt: now }).where(orm().eq(schema.operationalOperations.id, operationId)).returning();
      if (idempotencyKey) await getDb().insert(schema.idempotencyRecords).values({ idempotencyKey, operationId, actionType: "organization.bootstrap", status: "completed", resultJson }).onConflictDoUpdate({ target: schema.idempotencyRecords.idempotencyKey, set: { operationId, status: "completed", resultJson, updatedAt: now } });
      await getDb().insert(schema.auditLogs).values({ logtoOrganizationId: organizationId || null, actorLogtoUserId: actor.logtoUserId || null, actorType: "owner_global", action: "organization_bootstrap_completed", targetType: "logto_organization", targetId: organizationId || null, metadata: { operationId, status, idempotencyKey } });
      return operation;
    },
    async failOperation({ organizationId = null, error, status = "bootstrap_failed", result = {} } = {}) {
      await ensureExistingOperation();
      if (!operationId) return null;
      const now = new Date();
      const lastErrorJson = serializeError(error);
      const resultJson = { status, organizationId, ...safeJson(result), lastError: lastErrorJson };
      const [operation] = await getDb().update(schema.operationalOperations).set({ logtoOrganizationId: organizationId || null, entityId: organizationId || null, status: "failed", outputJson: resultJson, lastErrorJson, updatedAt: now }).where(orm().eq(schema.operationalOperations.id, operationId)).returning();
      if (idempotencyKey) await getDb().insert(schema.idempotencyRecords).values({ idempotencyKey, operationId, actionType: "organization.bootstrap", status: "failed", resultJson }).onConflictDoUpdate({ target: schema.idempotencyRecords.idempotencyKey, set: { operationId, status: "failed", resultJson, updatedAt: now } });
      await getDb().insert(schema.auditLogs).values({ logtoOrganizationId: organizationId || null, actorLogtoUserId: actor.logtoUserId || null, actorType: "owner_global", action: "organization_bootstrap_failed", targetType: organizationId ? "logto_organization" : "operational_operation", targetId: organizationId || operationId, result: "error", metadata: { operationId, status, idempotencyKey, lastError: lastErrorJson } });
      return operation;
    },
  };
}

function createMemoryProvisioningRecorder({ idempotencyKey = "memory-key" } = {}) {
  const steps = [];
  let operation = null;
  return {
    async startOperation({ operationType = "organization.bootstrap", input = {} } = {}) { operation = operation || { id: `op-${idempotencyKey}`, operationType, inputJson: input, status: "running", outputJson: {} }; operation.status = "running"; return operation; },
    async getOperation() { return operation; },
    async getCompletedSteps() { return new Map(steps.filter((step) => step.status === "completed").map((step) => [step.stepName, step.outputJson || {}])); },
    async recordStep({ stepName, status = "completed", metadata = {}, error = null } = {}) { const step = { stepName, status, outputJson: metadata.output || metadata, inputJson: metadata.input || metadata, lastErrorJson: error ? serializeError(error) : null }; steps.push(step); return step; },
    async completeOperation({ organizationId, status = "created_with_logto_bootstrap", result = {} } = {}) { operation = { ...(operation || {}), status: "completed", logtoOrganizationId: organizationId, outputJson: { status, organizationId, ...result } }; return operation; },
    async failOperation({ organizationId = null, error, status = "bootstrap_failed", result = {} } = {}) { operation = { ...(operation || {}), status: "failed", logtoOrganizationId: organizationId, lastErrorJson: serializeError(error), outputJson: { status, organizationId, ...result } }; return operation; },
    get steps() { return steps; },
    get operation() { return operation; },
  };
}

module.exports = { createMemoryProvisioningRecorder, createOrganizationProvisioningRecorder };

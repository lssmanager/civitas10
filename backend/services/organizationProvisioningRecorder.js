const { getDb, schema } = require("../lib/db");

function safeJson(value = {}) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

function createOrganizationProvisioningRecorder({ actor = {}, idempotencyKey = null } = {}) {
  let operationId = null;
  return {
    async startOperation({ operationType = "organization.bootstrap", input = {} } = {}) {
      const [operation] = await getDb().insert(schema.operationalOperations).values({
        operationType,
        entityType: "logto_organization",
        status: "running",
        inputJson: { ...safeJson(input), actor: safeJson(actor) },
        idempotencyKey,
        queueName: "owner_provisioning",
        claimedBy: actor.logtoUserId || "owner_global",
        claimedAt: new Date(),
      }).onConflictDoNothing().returning();
      operationId = operation?.id || operationId;
      if (!operationId && idempotencyKey) {
        const [existing] = await getDb().select().from(schema.operationalOperations).where(require("drizzle-orm").eq(schema.operationalOperations.idempotencyKey, idempotencyKey)).limit(1);
        operationId = existing?.id || null;
      }
      if (idempotencyKey) {
        await getDb().insert(schema.idempotencyRecords).values({ idempotencyKey, operationId, actionType: operationType, status: "started", resultJson: { operationId } }).onConflictDoUpdate({ target: schema.idempotencyRecords.idempotencyKey, set: { operationId, actionType: operationType, status: "started", resultJson: { operationId }, updatedAt: new Date() } });
      }
      if (operationId) {
        await getDb().insert(schema.auditLogs).values({ actorLogtoUserId: actor.logtoUserId || null, actorType: "owner_global", action: "organization_bootstrap_started", targetType: "operational_operation", targetId: operationId, metadata: { operationType, idempotencyKey } });
      }
      return operation;
    },
    async recordStep({ stepName, status = "completed", metadata = {} } = {}) {
      if (!operationId) return null;
      const now = new Date();
      const [step] = await getDb().insert(schema.operationalOperationSteps).values({
        operationId,
        stepName,
        status,
        inputJson: safeJson(metadata),
        outputJson: safeJson(metadata),
        startedAt: now,
        completedAt: ["completed", "failed"].includes(status) ? now : null,
      }).returning();
      return step;
    },
    async completeOperation({ organizationId, status = "created_with_logto_bootstrap" } = {}) {
      if (!operationId) return null;
      const now = new Date();
      const [operation] = await getDb().update(schema.operationalOperations).set({
        logtoOrganizationId: organizationId || null,
        entityId: organizationId || null,
        status: "completed",
        outputJson: { status, organizationId },
        completedAt: now,
        updatedAt: now,
      }).where(require("drizzle-orm").eq(schema.operationalOperations.id, operationId)).returning();
      if (idempotencyKey) {
        await getDb().insert(schema.idempotencyRecords).values({ idempotencyKey, operationId, actionType: "organization.bootstrap", status: "completed", resultJson: { operationId, organizationId, status } }).onConflictDoUpdate({ target: schema.idempotencyRecords.idempotencyKey, set: { operationId, status: "completed", resultJson: { operationId, organizationId, status }, updatedAt: now } });
      }
      await getDb().insert(schema.auditLogs).values({ logtoOrganizationId: organizationId || null, actorLogtoUserId: actor.logtoUserId || null, actorType: "owner_global", action: "organization_bootstrap_completed", targetType: "logto_organization", targetId: organizationId || null, metadata: { operationId, status } });
      return operation;
    },
  };
}

module.exports = { createOrganizationProvisioningRecorder };

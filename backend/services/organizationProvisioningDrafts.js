const crypto = require("node:crypto");
const { getDb, schema } = require("../lib/db");
function orm() { return require("drizzle-orm"); }

const WIZARD_STAGES = Object.freeze(["canonical", "business", "admins", "segmentation", "review"]);
const DEFAULT_STAGE = "canonical";

function createIdempotencyKey() {
  return `orgwiz_${crypto.randomUUID()}`;
}

function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function assertStage(stage) {
  if (!WIZARD_STAGES.includes(stage)) {
    const error = new Error(`Invalid organization provisioning wizard stage: ${stage}`);
    error.code = "INVALID_ORGANIZATION_WIZARD_STAGE";
    error.status = 400;
    throw error;
  }
}

function normalizeDraft(row = {}) {
  if (!row) return null;
  return {
    idempotencyKey: row.idempotencyKey,
    currentStage: row.currentStage,
    stagePayloads: row.stagePayloads || {},
    consolidatedPayload: row.consolidatedPayload || {},
    actor: row.actorJson || row.actor || {},
    status: row.status,
    submitStatus: row.submitStatus,
    logtoOrganizationId: row.logtoOrganizationId || null,
    lastError: row.lastErrorJson || null,
    submittedAt: row.submittedAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    canonicalSource: "logto",
    localPurpose: "operational_wizard_draft_only",
  };
}

async function saveOrganizationProvisioningDraft({ idempotencyKey = createIdempotencyKey(), currentStage = DEFAULT_STAGE, stagePayload = {}, stagePayloads = null, consolidatedPayload = {}, actor = {}, status = "draft", submitStatus = "not_submitted", logtoOrganizationId = null, lastError = null, submittedAt = null } = {}) {
  assertStage(currentStage);
  const now = new Date();
  const db = getDb();
  const [existing] = await db.select().from(schema.organizationProvisioningDrafts).where(orm().eq(schema.organizationProvisioningDrafts.idempotencyKey, idempotencyKey)).limit(1);
  const nextStagePayloads = { ...(existing?.stagePayloads || {}), ...safeObject(stagePayloads) };
  if (stagePayload && Object.keys(safeObject(stagePayload)).length > 0) nextStagePayloads[currentStage] = safeObject(stagePayload);
  const values = { idempotencyKey, currentStage, stagePayloads: nextStagePayloads, consolidatedPayload: { ...(existing?.consolidatedPayload || {}), ...safeObject(consolidatedPayload) }, actorJson: safeObject(actor), status, submitStatus, logtoOrganizationId, lastErrorJson: lastError, submittedAt, updatedAt: now };
  const [row] = await db.insert(schema.organizationProvisioningDrafts).values(values).onConflictDoUpdate({ target: schema.organizationProvisioningDrafts.idempotencyKey, set: values }).returning();
  return normalizeDraft(row);
}

async function getOrganizationProvisioningDraft({ idempotencyKey }) {
  const [row] = await getDb().select().from(schema.organizationProvisioningDrafts).where(orm().eq(schema.organizationProvisioningDrafts.idempotencyKey, idempotencyKey)).limit(1);
  return normalizeDraft(row);
}

function createMemoryOrganizationProvisioningDraftStore() {
  const rows = new Map();
  return {
    async saveOrganizationProvisioningDraft(input = {}) {
      const idempotencyKey = input.idempotencyKey || createIdempotencyKey();
      assertStage(input.currentStage || DEFAULT_STAGE);
      const existing = rows.get(idempotencyKey) || {};
      const currentStage = input.currentStage || existing.currentStage || DEFAULT_STAGE;
      const stagePayloads = { ...(existing.stagePayloads || {}), ...safeObject(input.stagePayloads) };
      if (input.stagePayload && Object.keys(safeObject(input.stagePayload)).length > 0) stagePayloads[currentStage] = safeObject(input.stagePayload);
      const row = { ...existing, idempotencyKey, currentStage, stagePayloads, consolidatedPayload: { ...(existing.consolidatedPayload || {}), ...safeObject(input.consolidatedPayload) }, actor: safeObject(input.actor), status: input.status || existing.status || "draft", submitStatus: input.submitStatus || existing.submitStatus || "not_submitted", logtoOrganizationId: input.logtoOrganizationId || existing.logtoOrganizationId || null, lastErrorJson: input.lastError || null, submittedAt: input.submittedAt || existing.submittedAt || null, updatedAt: new Date().toISOString(), createdAt: existing.createdAt || new Date().toISOString() };
      rows.set(idempotencyKey, row);
      return normalizeDraft(row);
    },
    async getOrganizationProvisioningDraft({ idempotencyKey }) { return normalizeDraft(rows.get(idempotencyKey)); },
  };
}

module.exports = { WIZARD_STAGES, createIdempotencyKey, createMemoryOrganizationProvisioningDraftStore, getOrganizationProvisioningDraft, saveOrganizationProvisioningDraft };

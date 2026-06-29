const { OPERATION_STATUSES } = require("../contracts/foundation");

class InMemoryFoundationStore {
  constructor() {
    this.operations = [];
    this.steps = [];
    this.items = [];
    this.idempotencyRecords = new Map();
  }

  async getIdempotencyRecord(idempotencyKey) {
    return this.idempotencyRecords.get(idempotencyKey) || null;
  }

  async createOperation({ orgId, actionType, input, idempotencyKey, maxAttempts = 3 }) {
    const operation = {
      id: `op-${this.operations.length + 1}`,
      org_id: orgId,
      action_type: actionType,
      status: OPERATION_STATUSES.PENDING,
      input,
      output: null,
      error: null,
      attempt: 1,
      max_attempts: maxAttempts,
      next_retry_at: null,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.operations.push(operation);
    return operation;
  }

  async updateOperation(id, patch) {
    const operation = this.operations.find((item) => item.id === id);
    if (!operation) throw new Error(`Operation not found: ${id}`);
    Object.assign(operation, patch);
    return operation;
  }

  async createStep({ operationId, stepName, status = "running", input = null }) {
    const step = {
      id: `step-${this.steps.length + 1}`,
      operation_id: operationId,
      step_name: stepName,
      status,
      input,
      output: null,
      error: null,
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    this.steps.push(step);
    return step;
  }

  async updateStep(id, patch) {
    const step = this.steps.find((item) => item.id === id);
    if (!step) throw new Error(`Step not found: ${id}`);
    Object.assign(step, patch);
    return step;
  }

  async saveIdempotencyRecord({ idempotencyKey, operationType, scope, status, result, ttlSeconds = 86400 }) {
    const now = Date.now();
    const record = {
      idempotency_key: idempotencyKey,
      operation_type: operationType,
      scope,
      status,
      result,
      ttl_seconds: ttlSeconds,
      expires_at: new Date(now + ttlSeconds * 1000).toISOString(),
      created_at: new Date(now).toISOString(),
    };
    this.idempotencyRecords.set(idempotencyKey, record);
    return record;
  }

  countOperationsByIdempotencyKey(idempotencyKey) {
    return this.operations.filter((operation) => operation.idempotency_key === idempotencyKey).length;
  }
}

module.exports = { InMemoryFoundationStore };

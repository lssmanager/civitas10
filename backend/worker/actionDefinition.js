const { ACTION_QUEUES } = require("../contracts/foundation");

class ActionDefinitionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ActionDefinitionError";
    this.status = 500;
  }
}

function validateActionDefinition(action) {
  const missing = [];
  if (!action || typeof action !== "object") throw new ActionDefinitionError("Action definition must be an object");
  if (!action.action_type) missing.push("action_type");
  if (!action.queue) missing.push("queue");
  if (!action.inputSchema || typeof action.inputSchema.parse !== "function") missing.push("inputSchema.parse");
  if (typeof action.precondition !== "function") missing.push("precondition");
  if (typeof action.run !== "function") missing.push("run");
  if (!action.retryPolicy) missing.push("retryPolicy");
  if (typeof action.idempotencyKey !== "function") missing.push("idempotencyKey");

  if (missing.length > 0) {
    throw new ActionDefinitionError(`Invalid ActionDefinition. Missing: ${missing.join(", ")}`);
  }

  if (!Object.values(ACTION_QUEUES).includes(action.queue)) {
    throw new ActionDefinitionError(`Invalid action queue: ${action.queue}`);
  }

  return action;
}

function createPassthroughSchema(validate = () => true) {
  return {
    parse(input) {
      const result = validate(input);
      if (result === false) {
        const error = new Error("Action input is invalid");
        error.name = "ActionInputValidationError";
        throw error;
      }
      return input;
    },
  };
}

module.exports = {
  ActionDefinitionError,
  createPassthroughSchema,
  validateActionDefinition,
};

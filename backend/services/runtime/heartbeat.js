const { redisCommand } = require("../../lib/redis");
const { getRuntimeQueueConfig } = require("./config");

function parseHeartbeatPayload(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function buildWorkerHeartbeatPayload({ queueTelemetry = [], now = new Date() } = {}) {
  const config = getRuntimeQueueConfig();
  return {
    service: "civitas-worker",
    pid: process.pid,
    queueName: config.queueName,
    queueRedisBase: config.queueRedisBase,
    prefix: config.prefix,
    updatedAt: now.toISOString(),
    queueTelemetry,
  };
}

async function writeWorkerHeartbeat({ redis = redisCommand, queueTelemetry = [], now = new Date() } = {}) {
  if (!process.env.REDIS_URL) return { status: "degraded", message: "REDIS_URL is not configured" };
  const config = getRuntimeQueueConfig();
  const payload = buildWorkerHeartbeatPayload({ queueTelemetry, now });
  await redis(["SET", config.heartbeatKey, JSON.stringify(payload), "EX", "60"]);
  return {
    status: "healthy",
    key: config.heartbeatKey,
    queueName: config.queueName,
    queueRedisBase: config.queueRedisBase,
    queueTelemetry,
  };
}

module.exports = {
  buildWorkerHeartbeatPayload,
  parseHeartbeatPayload,
  writeWorkerHeartbeat,
};

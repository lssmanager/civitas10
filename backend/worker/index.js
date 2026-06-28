const express = require("express");
require("dotenv").config({ path: process.env.WORKER_ENV_FILE || "./.env" });
require("dotenv").config();

const { getRedisHealth } = require("../lib/redisHealth");
const { getRuntimeQueueConfig } = require("../services/runtime/config");
const { writeWorkerHeartbeat } = require("../services/runtime/heartbeat");
const { loadRuntimeQueueTelemetry } = require("../services/runtime/queues");

const port = Number(process.env.WORKER_PORT || 3002);
const runtimeQueueConfig = getRuntimeQueueConfig();

async function publishWorkerHeartbeat() {
  if (!process.env.REDIS_URL) return { status: "degraded", message: "REDIS_URL is not configured" };
  const queueTelemetry = await loadRuntimeQueueTelemetry();
  return writeWorkerHeartbeat({ queueTelemetry });
}

const app = express();
app.get("/health", async (_req, res) => {
  const redis = await getRedisHealth();
  let heartbeat;
  try { heartbeat = await publishWorkerHeartbeat(); } catch (error) { heartbeat = { status: "unhealthy", message: error.message }; }
  const statuses = [redis.status, heartbeat.status];
  const status = statuses.includes("unhealthy") ? "unhealthy" : statuses.includes("degraded") ? "degraded" : "healthy";
  res.status(status === "healthy" ? 200 : status === "degraded" ? 200 : 503).json({
    status,
    service: "civitas-worker",
    redis,
    heartbeat,
    bullmq: {
      prefix: runtimeQueueConfig.prefix,
      queueName: runtimeQueueConfig.queueName,
      queueRedisBase: runtimeQueueConfig.queueRedisBase,
      readyForBullMQ: redis.status === "healthy",
    },
  });
});

setInterval(() => publishWorkerHeartbeat().catch((error) => console.error("Worker heartbeat failed", error.message)), 30000).unref();
publishWorkerHeartbeat().catch((error) => console.error("Initial worker heartbeat failed", error.message));

app.listen(port, () => console.log(`Civitas worker health service running on port ${port} with queue ${runtimeQueueConfig.queueName}`));

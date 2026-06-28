const express = require("express");
require("dotenv").config({ path: process.env.WORKER_ENV_FILE || "./.env" });
require("dotenv").config();

const { redisCommand } = require("../lib/redis");
const { getRedisHealth } = require("../lib/redisHealth");

const port = Number(process.env.WORKER_PORT || 3002);
const bullmqPrefix = process.env.BULLMQ_PREFIX || "civitas";
const heartbeatKey = `${bullmqPrefix}:worker:heartbeat`;
const queueName = `${bullmqPrefix}:queue:default`;

async function writeHeartbeat() {
  if (!process.env.REDIS_URL) return { status: "degraded", message: "REDIS_URL is not configured" };
  const value = JSON.stringify({ service: "civitas-worker", pid: process.pid, queueName, updatedAt: new Date().toISOString() });
  await redisCommand(["SET", heartbeatKey, value, "EX", "60"]);
  return { status: "healthy", key: heartbeatKey, queueName };
}

const app = express();
app.get("/health", async (_req, res) => {
  const redis = await getRedisHealth();
  let heartbeat;
  try { heartbeat = await writeHeartbeat(); } catch (error) { heartbeat = { status: "unhealthy", message: error.message }; }
  const statuses = [redis.status, heartbeat.status];
  const status = statuses.includes("unhealthy") ? "unhealthy" : statuses.includes("degraded") ? "degraded" : "healthy";
  res.status(status === "healthy" ? 200 : status === "degraded" ? 200 : 503).json({ status, service: "civitas-worker", redis, heartbeat, bullmq: { prefix: bullmqPrefix, queueName, readyForBullMQ: redis.status === "healthy" } });
});

setInterval(() => writeHeartbeat().catch((error) => console.error("Worker heartbeat failed", error.message)), 30000).unref();
writeHeartbeat().catch((error) => console.error("Initial worker heartbeat failed", error.message));

app.listen(port, () => console.log(`Civitas worker health service running on port ${port} with queue ${queueName}`));

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRedisWorkerHealthSnapshot } = require("../services/runtime/ownerObservability");

test("runtime snapshot reads heartbeat plus real queue counts from Redis", async () => {
  const previousEnv = {
    BULLMQ_PREFIX: process.env.BULLMQ_PREFIX,
    SYNC_QUEUE_NAME: process.env.SYNC_QUEUE_NAME,
    SYNC_QUEUE_REDIS_KEY: process.env.SYNC_QUEUE_REDIS_KEY,
    SYNC_WORKER_HEARTBEAT_KEY: process.env.SYNC_WORKER_HEARTBEAT_KEY,
  };

  process.env.BULLMQ_PREFIX = "civitas";
  process.env.SYNC_QUEUE_NAME = "default";
  delete process.env.SYNC_QUEUE_REDIS_KEY;
  delete process.env.SYNC_WORKER_HEARTBEAT_KEY;

  const responses = new Map([
    ["PING", "PONG"],
    ["GET civitas:worker:heartbeat", JSON.stringify({
      service: "civitas-worker",
      pid: 42,
      queueName: "default",
      queueRedisBase: "civitas:default",
      updatedAt: "2026-06-28T11:59:55.000Z",
    })],
    ["LLEN civitas:default:wait", 2],
    ["LLEN civitas:default:active", 1],
    ["ZCARD civitas:default:delayed", 1],
    ["ZCARD civitas:default:failed", 1],
    ["LRANGE civitas:default:wait 0 0", ["job-wait-1"]],
    ["LRANGE civitas:default:active 0 0", ["job-active-1"]],
    ["ZRANGE civitas:default:delayed 0 0 WITHSCORES", ["job-delayed-1", "1782647890000"]],
    ["ZRANGE civitas:default:failed 0 0 WITHSCORES", ["job-failed-1", "1782647960000"]],
    ["HMGET civitas:default:job-wait-1 timestamp processedOn finishedOn", ["1782647880000", null, null]],
    ["HMGET civitas:default:job-active-1 timestamp processedOn finishedOn", ["1782647900000", "1782647910000", null]],
    ["HMGET civitas:default:job-failed-1 timestamp processedOn finishedOn", ["1782647920000", "1782647930000", "1782647940000"]],
  ]);

  const redis = async (commandParts) => {
    const key = commandParts.join(" ");
    if (!responses.has(key)) throw new Error(`Unexpected Redis command: ${key}`);
    return responses.get(key);
  };

  const snapshot = await loadRedisWorkerHealthSnapshot({
    redis,
    now: new Date("2026-06-28T12:00:00.000Z"),
  });

  assert.equal(snapshot.redis.status, "healthy");
  assert.equal(snapshot.worker.state, "alive");
  assert.equal(snapshot.worker.heartbeatAt, "2026-06-28T11:59:55.000Z");
  assert.equal(snapshot.queues[0].name, "default");
  assert.equal(snapshot.queues[0].waiting, 2);
  assert.equal(snapshot.queues[0].active, 1);
  assert.equal(snapshot.queues[0].delayed, 1);
  assert.equal(snapshot.queues[0].failed, 1);
  assert.equal(snapshot.queues[0].oldestJobAt, "2026-06-28T11:58:00.000Z");
  assert.equal(snapshot.queues[0].oldestJobAgeSeconds, 120);
  assert.equal(snapshot.queues[0].source, "redis_runtime");

  process.env.BULLMQ_PREFIX = previousEnv.BULLMQ_PREFIX;
  process.env.SYNC_QUEUE_NAME = previousEnv.SYNC_QUEUE_NAME;
  if (previousEnv.SYNC_QUEUE_REDIS_KEY === undefined) delete process.env.SYNC_QUEUE_REDIS_KEY;
  else process.env.SYNC_QUEUE_REDIS_KEY = previousEnv.SYNC_QUEUE_REDIS_KEY;
  if (previousEnv.SYNC_WORKER_HEARTBEAT_KEY === undefined) delete process.env.SYNC_WORKER_HEARTBEAT_KEY;
  else process.env.SYNC_WORKER_HEARTBEAT_KEY = previousEnv.SYNC_WORKER_HEARTBEAT_KEY;
});

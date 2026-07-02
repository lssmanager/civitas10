const DEFAULT_QUEUE_NAMES = Object.freeze(["priority_commands", "background_events"]);

function normalizeQueueNames(value) {
  if (!value) return DEFAULT_QUEUE_NAMES;
  const names = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return names.length > 0 ? [...new Set(names)] : DEFAULT_QUEUE_NAMES;
}

function getRuntimeQueueConfig() {
  const prefix = process.env.BULLMQ_PREFIX || "civitas";
  const queueNames = normalizeQueueNames(DEFAULT_QUEUE_NAMES.join(","));
  const queues = queueNames.map((name) => ({
    name,
    redisBase: `${prefix}:${name}`,
  }));

  return {
    prefix,
    queueName: queueNames[0],
    queueNames,
    queues,
    queueRedisBase: `${prefix}:${queueNames[0]}`,
    heartbeatKey: `${prefix}:worker:heartbeat`,
  };
}

module.exports = { DEFAULT_QUEUE_NAMES, getRuntimeQueueConfig, normalizeQueueNames };

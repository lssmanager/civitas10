const { redisCommand } = require("./redis");
async function getRedisHealth() {
  if (!process.env.REDIS_URL) return { status: "degraded", configured: false, message: "REDIS_URL is not configured" };
  try {
    const startedAt = Date.now();
    const response = await redisCommand(["PING"]);
    return { status: response === "PONG" ? "healthy" : "degraded", configured: true, latencyMs: Date.now() - startedAt, response };
  } catch (error) {
    return { status: "unhealthy", configured: true, message: error.message };
  }
}
module.exports = { getRedisHealth };

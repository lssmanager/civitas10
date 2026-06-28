const { queryPostgres } = require("./db");

async function getDatabaseHealth() {
  if (!process.env.DATABASE_URL) return { status: "unhealthy", configured: false, message: "DATABASE_URL is not configured" };
  try {
    const startedAt = Date.now();
    await queryPostgres("select 1");
    return { status: "healthy", configured: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { status: "unhealthy", configured: true, message: error.message };
  }
}
module.exports = { getDatabaseHealth };

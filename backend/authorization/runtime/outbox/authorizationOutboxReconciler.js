"use strict";
function createAuthorizationOutboxReconciler({ repository, now = () => new Date() }) {
  async function recoverExpiredClaims({ leaseMs = 60000 } = {}) {
    const events = await repository.listOutboxEvents();
    let recovered = 0;
    for (const event of events) {
      if (event.status === "publishing" && event.claimedAt && new Date(event.claimedAt).getTime() + leaseMs <= now().getTime()) {
        await repository.saveOutboxEvent({ ...event, status: "pending", claimedBy: null, claimedAt: null, updatedAt: now().toISOString() }); recovered += 1;
      }
    }
    return { recovered };
  }
  return { recoverExpiredClaims };
}
module.exports = { createAuthorizationOutboxReconciler };

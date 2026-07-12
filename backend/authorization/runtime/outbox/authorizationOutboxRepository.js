"use strict";
function createAuthorizationOutboxRepository(db) {
  const { sql, eq } = require("drizzle-orm");
  const { schema } = require("../../../lib/db");
  return {
    async insert(event) { const [row] = await db.insert(schema.authorizationOutboxEvents).values(event).onConflictDoNothing().returning(); return row || null; },
    async claimPending({ workerId, batchSize = 25, now = new Date(), leaseMs = 60000 } = {}) {
      const result = await db.execute(sql`
        update authorization_outbox_events
           set status = 'publishing', claimed_by = ${workerId}, claimed_at = ${now}, attempts = attempts + 1, updated_at = ${now}
         where id in (
           select id
             from authorization_outbox_events
            where (
              (status = 'pending' and available_at <= ${now})
              or (status = 'publishing' and claimed_at < ${new Date(now.getTime() - leaseMs)})
            )
            order by available_at asc, created_at asc
            for update skip locked
            limit ${batchSize}
         )
         returning *
      `);
      return result.rows || [];
    },
    async markPublished(eventId, now = new Date()) { const [row] = await db.update(schema.authorizationOutboxEvents).set({ status: "published", publishedAt: now, updatedAt: now }).where(eq(schema.authorizationOutboxEvents.id, eventId)).returning(); return row; },
    async markFailed(eventId, patch) { const [row] = await db.update(schema.authorizationOutboxEvents).set(patch).where(eq(schema.authorizationOutboxEvents.id, eventId)).returning(); return row; },
  };
}
module.exports = { createAuthorizationOutboxRepository };

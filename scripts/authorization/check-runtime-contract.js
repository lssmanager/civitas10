#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../..");
function read(relative) { return fs.readFileSync(path.join(root, relative), "utf8"); }
function assertIncludes(file, needle) { const text = read(file); if (!text.includes(needle)) { console.error(`${file} missing ${needle}`); process.exit(1); } }
assertIncludes("backend/db/migrations/0011_authorization_runtime_consistency.sql", "authorization_outbox_events");
assertIncludes("backend/db/migrations/0011_authorization_runtime_consistency.sql", "UNIQUE (event_type, aggregate_type, aggregate_id, event_version)");
assertIncludes("backend/db/migrations/0011_authorization_runtime_consistency.sql", "authorization_scope_assignments_exactly_one_target_ck");
assertIncludes("backend/authorization/runtime/outbox/authorizationOutboxRepository.js", "for update skip locked");
assertIncludes("backend/db/migrations/0011_authorization_runtime_consistency.sql", "num_nonnulls(dimension_value_id, unit_id, resource_ref) = 1");
assertIncludes("backend/authorization/runtime/outbox/authorizationOutboxDispatcher.js", "claimPending");
assertIncludes("backend/authorization/runtime/outbox/authorizationOutboxDispatcher.js", "publishing");
assertIncludes("backend/authorization/runtime/cacheKeyRegistry.js", "civitas");
assertIncludes("backend/authorization/runtime/reauthorization/asyncAuthorizationRevalidator.js", "authorization_snapshot_stale");
assertIncludes("backend/authorization/runtime/feature-flags/featureAvailabilityResolver.js", "tenant_override_disable_only");
assertIncludes("backend/authorization/runtime/billing/seatChangeWorkflowRuntime.js", "owner.seat_change_requests.approve");
console.log("authorization runtime consistency contract check passed");

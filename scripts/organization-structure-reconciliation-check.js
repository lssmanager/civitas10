"use strict";
const fs = require("node:fs");
const path = require("node:path");
const text = fs.readFileSync(path.join(__dirname, "../backend/organization-structure/scopeProjectionReconciler.js"), "utf8");
for (const required of ["projectionIdentity", "reconcileScopeCandidates", "revokeSourceDerivedScopes", "authorization.scope_projection.reconciled", "authorization.scope_projection.revoked"]) if (!text.includes(required)) { console.error(`missing reconciliation contract: ${required}`); process.exit(1); }
console.log("organization structure reconciliation check passed");

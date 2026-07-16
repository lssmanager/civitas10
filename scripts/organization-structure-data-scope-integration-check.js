"use strict";
const fs = require("node:fs");
const path = require("node:path");
const files = ["backend/organization-structure/scopeProjectionReconciler.js", "backend/organization-structure/scopeCandidateIntegration.js", "backend/organization-structure/sourceValidationProvider.js"];
const text = files.map((file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
for (const required of ["unit_membership", "translation", "source", "logtoRoleId", "reconcileScopeCandidates", "revokeSourceDerivedScopes"]) if (!text.includes(required)) { console.error(`missing integration contract ${required}`); process.exit(1); }
for (const bad of [/force activate/i, /bearer token/i, /audience.*permission/i]) if (bad.test(text)) { console.error(`forbidden integration pattern ${bad}`); process.exit(1); }
console.log("organization structure data-scope integration check passed");

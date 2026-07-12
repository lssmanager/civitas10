#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const requiredFiles = [
  "backend/db/schema/authz-entitlements.js",
  "backend/db/migrations/0007_authz_entitlement_overlay.sql",
  "backend/authorization/entitlements/entitlementEvaluator.js",
  "backend/authorization/entitlements/entitlementService.js",
  "backend/authorization/entitlements/entitlementPolicyAdapter.js",
];
const errors = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file))).map((file) => `${file} is missing`);
const migration = fs.existsSync(path.join(root, "backend/db/migrations/0007_authz_entitlement_overlay.sql")) ? fs.readFileSync(path.join(root, "backend/db/migrations/0007_authz_entitlement_overlay.sql"), "utf8") : "";
for (const needle of ["org_role_entitlement_limits", "org_role_permission_activations", "authorization_policy_versions", "tenant_activation_exceeds_owner_ceiling", "FOREIGN KEY (entitlement_limit_id, logto_organization_id, logto_role_id, permission_key)"]) {
  if (!migration.includes(needle)) errors.push(`migration missing ${needle}`);
}
const evaluator = fs.existsSync(path.join(root, "backend/authorization/entitlements/entitlementEvaluator.js")) ? fs.readFileSync(path.join(root, "backend/authorization/entitlements/entitlementEvaluator.js"), "utf8") : "";
if (!evaluator.includes("rolePathId") || !evaluator.includes("TOKEN_SCOPE_MISSING")) errors.push("entitlement evaluator must preserve role-path provenance and scope-first deny");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Entitlement overlay contract check passed.");

#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const indexSource = fs.readFileSync(path.join(root, "backend/index.js"), "utf8");
const docs = fs.existsSync(path.join(root, "docs/authorization/tenant-isolation-and-entitlements.md")) ? fs.readFileSync(path.join(root, "docs/authorization/tenant-isolation-and-entitlements.md"), "utf8") : "";
const errors = [];
if (!indexSource.includes('"/o/:organizationId/documents"')) errors.push("canonical /o/:organizationId/documents route is missing");
if (!indexSource.includes("organizationMemberReadLegacyRedirect")) errors.push("legacy GET /documents must be an authenticated redirect, not a parallel controller");
if (!indexSource.includes("organizationAdminWriteLegacyRejected")) errors.push("legacy mutation /documents must be rejected to avoid replay");
const forbiddenRuntimePatterns = [/secureRoute\.(get|post|put|patch|delete)\("\/(org|organization)\//, /secureRoute\.(get|post|put|patch|delete)\("\/:organizationId\//];
for (const pattern of forbiddenRuntimePatterns) if (pattern.test(indexSource)) errors.push(`forbidden tenant route pattern detected: ${pattern}`);
if (!docs.includes("Tenant route inventory")) errors.push("tenant route inventory documentation is missing");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Tenant route contract check passed.");

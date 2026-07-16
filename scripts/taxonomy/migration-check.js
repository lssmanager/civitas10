"use strict";
const fs = require("node:fs");
const path = require("node:path");
const migration = fs.readFileSync(path.join(__dirname, "../../backend/db/migrations/0008_authz_taxonomy.sql"), "utf8");
const checks = [
  /dimension_key in \('academic\.section'/,
  /stable_key ~ '\^\[a-z0-9\]/,
  /constraint trigger organization_dimension_values_parent_guard_trigger/,
  /WITH RECURSIVE ancestors/i,
  /jsonb_typeof\(metadata\) = 'object'/,
  /status in \('draft','active','deprecating','archived'\)/,
];
for (const check of checks) if (!check.test(migration)) { console.error(`migration check failed: ${check}`); process.exit(1); }
console.log("taxonomy migration check passed");

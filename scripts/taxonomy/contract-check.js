"use strict";
const fs = require("node:fs");
const path = require("node:path");
const migration = fs.readFileSync(path.join(__dirname, "../../backend/db/migrations/0008_authz_taxonomy.sql"), "utf8");
const forbidden = [/organization_math_teacher/, /lms\.subject\.mathematics\.read/, /math_teachers/, /primary as a permission/, /publish\s+redis/i];
for (const pattern of forbidden) { if (pattern.test(migration)) { console.error(`forbidden taxonomy role/scope pattern: ${pattern}`); process.exit(1); } }
for (const required of ["taxonomy_dimension_definitions", "organization_dimension_values", "organization_taxonomy_state", "taxonomy_dimension_capabilities", "taxonomy_cycle_detected", "hashtextextended"]) {
  if (!migration.includes(required)) { console.error(`missing taxonomy migration contract: ${required}`); process.exit(1); }
}
console.log("taxonomy contract check passed");

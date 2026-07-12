"use strict";
const fs=require("node:fs"); const path=require("node:path"); const migration=fs.readFileSync(path.join(__dirname,"../backend/db/migrations/0009_authz_units.sql"),"utf8");
const checks=[/unit_type in \('academic_division'/,/status in \('draft','active','deprecating','archived'\)/,/relationship_type in \('leads','teaches','manages','member','supports','studies','assigned_to'\)/,/WITH RECURSIVE ancestors/i,/constraint trigger organization_units_parent_guard_trigger/,/organization_audience_definitions_json_object_check/];
for(const check of checks) if(!check.test(migration)){console.error(`organization structure migration check failed: ${check}`); process.exit(1)}
console.log("organization structure migration check passed");

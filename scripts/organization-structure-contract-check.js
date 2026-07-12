"use strict";
const fs=require("node:fs"); const path=require("node:path"); const migration=fs.readFileSync(path.join(__dirname,"../backend/db/migrations/0009_authz_units.sql"),"utf8");
for(const req of ["organization_units","hierarchy_key","organization_unit_memberships","coalesce(logto_role_id, '')","organization_capability_group_refs","organization_audience_definitions","organization_structure_versions","hashtextextended","organization_unit_cycle_detected"]) if(!migration.includes(req)){console.error(`missing organization structure contract: ${req}`); process.exit(1)}
for(const bad of [/moodle_groups/,/buddyboss_groups/,/organization_primary_director/,/primary_directors scope/,/guardian_of'\)/]) if(bad.test(migration)){console.error(`forbidden organization structure pattern: ${bad}`); process.exit(1)}
console.log("organization structure contract check passed");

"use strict";
const fs=require("node:fs"), path=require("node:path"); const migration=fs.readFileSync(path.join(__dirname,"../backend/db/migrations/0010_authz_data_scopes.sql"),"utf8");
const checks=[/scope_kind in \('dimension','unit','resource'\)/,/source_type in \('explicit','unit_membership','person_relationship','capability_group','system_migration'\)/,/status in \('scheduled','active','expired','revoked','invalidated'\)/,/valid_until is null or valid_until > valid_from/,/foreign key \(dimension_value_id, logto_organization_id\)/,/where scope_kind = 'resource' and status in \('scheduled','active'\)/];
for(const check of checks) if(!check.test(migration)){console.error(`data scope migration check failed: ${check}`); process.exit(1)}
console.log("data scope migration check passed");

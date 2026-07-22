"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const migration0016 = fs.readFileSync(path.join(root, "backend/db/migrations/0016_authorization_scope_assignments_contract.sql"), "utf8");
const migration0010to0016 = ["0010_authz_data_scopes.sql", "0013_membership_role_bound_scope_subject.sql", "0014_scope_templates.sql", "0016_authorization_scope_assignments_contract.sql"].map((f) => fs.readFileSync(path.join(root, "backend/db/migrations", f), "utf8")).join("\n");
const checks = [/status in \('scheduled','active','expired','revoked','invalidated'\)/i, /add column if not exists membership_id/i, /add column if not exists canonical_role_id/i, /authorization_scope_assignments_exactly_one_target_ck/i, /authorization_scope_assignments_membership_role_idx/i, /where scope_kind = 'resource' and status in \('scheduled','active'\)/i];
for (const check of checks) if (!check.test(migration0010to0016)) { console.error(`data scope migration check failed: ${check}`); process.exit(1); }
for (const bad of [/create table if not exists authorization_scope_assignments/i, /where state = 'active'/i, /\bstate\s+text\b/i]) if (bad.test(migration0016)) { console.error(`0016 contains forbidden incompatible schema pattern: ${bad}`); process.exit(1); }

async function runRealPostgresCheck() {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) { console.log("data scope migration check passed (static); set TEST_DATABASE_URL for real PostgreSQL information_schema checks"); return; }
  const { Client } = require("pg");
  const client = new Client({ connectionString: url });
  await client.connect();
  const run = async (sql) => client.query(sql);
  try {
    await run("drop schema if exists authz_scope_migration_check cascade; create schema authz_scope_migration_check; set search_path to authz_scope_migration_check, public; create extension if not exists pgcrypto");
    for (const f of fs.readdirSync(path.join(root, "backend/db/migrations")).filter((f) => f.endsWith(".sql")).sort()) await run(fs.readFileSync(path.join(root, "backend/db/migrations", f), "utf8"));
    await assertContract(client, "base empty 0000->0016");
    await run("drop schema if exists authz_scope_migration_check cascade; create schema authz_scope_migration_check; set search_path to authz_scope_migration_check, public; create extension if not exists pgcrypto");
    for (const f of fs.readdirSync(path.join(root, "backend/db/migrations")).filter((f) => f.endsWith(".sql") && f <= "0015_lms_group_leadership_read_model.sql").sort()) await run(fs.readFileSync(path.join(root, "backend/db/migrations", f), "utf8"));
    await run(migration0016);
    await assertContract(client, "upgrade 0015->0016");
    for (const f of fs.readdirSync(path.join(root, "backend/db/migrations")).filter((f) => f.endsWith(".sql")).sort()) await run(fs.readFileSync(path.join(root, "backend/db/migrations", f), "utf8"));
    await assertContract(client, "rerun all migrations");
  } finally { await client.end(); }
}
async function assertContract(client, label) {
  const columns = await client.query("select column_name from information_schema.columns where table_schema='authz_scope_migration_check' and table_name='authorization_scope_assignments'");
  const names = new Set(columns.rows.map((r) => r.column_name));
  for (const col of ["status", "membership_id", "canonical_role_id"]) if (!names.has(col)) throw new Error(`${label}: missing ${col}`);
  const indexes = await client.query("select indexdef from pg_indexes where schemaname='authz_scope_migration_check' and tablename='authorization_scope_assignments'");
  if (!indexes.rows.some((r) => /status IN \('scheduled', 'active'\)|status = ANY/i.test(r.indexdef))) throw new Error(`${label}: indexes do not use status`);
  await client.query("insert into taxonomy_dimension_definitions(id, dimension_key, display_name, value_kind, contract_version) values ('00000000-0000-0000-0000-000000000001','organization.campus','Campus','enumeration','test') on conflict do nothing");
  await client.query("insert into organization_dimension_values(id, logto_organization_id, dimension_definition_id, dimension_key_cache, stable_key, display_name, status, created_by_logto_user_id, updated_by_logto_user_id) values ('00000000-0000-0000-0000-000000000101','org1','00000000-0000-0000-0000-000000000001','organization.campus','c1','Campus','active','admin','admin') on conflict do nothing");
  const base = "logto_organization_id, logto_user_id, membership_id, logto_role_id, canonical_role_id, capability, scope_kind, dimension_key, dimension_value_id, source_type, source_version, status, assigned_by_logto_user_id, reason, valid_from";
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u1','m1','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','scheduled','admin','test',now()+interval '1 day')`);
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u1','m2','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','active','admin','test',now())`);
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u1','m3','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','revoked','admin','test',now())`);
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u1','m4','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','expired','admin','test',now())`);
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u2','m5','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','active','admin','test',now())`);
  await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u2','m5','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','revoked','admin','test',now())`);
  let rejected = false; try { await client.query(`insert into authorization_scope_assignments(${base}) values ('org1','u2','m5','r1','cr1','lms','dimension','organization.campus','00000000-0000-0000-0000-000000000101','explicit','v1','scheduled','admin','test',now())`); } catch { rejected = true; }
  if (!rejected) throw new Error(`${label}: duplicate active/scheduled assignment was accepted`);
}
runRealPostgresCheck().catch((e) => { console.error(e); process.exit(1); });

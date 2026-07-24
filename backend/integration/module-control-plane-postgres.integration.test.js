const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { sql } = require('drizzle-orm');
const schema = require('../db/schema');
const { runSqlMigrations, assertOperationalSchema } = require('../runtime/migrations');
const { createModuleControlPlaneService, createPostgresModuleControlPlaneRepository, REASON_CODES } = require('../services/moduleControlPlane');

if (!process.env.DATABASE_URL && process.env.P3_005_POSTGRES_CHECK === '1') {
  throw new Error('DATABASE_URL is required for modules:p3-005:postgres-check; provide an isolated PostgreSQL test database.');
}
if (!process.env.DATABASE_URL) {
  test('PostgreSQL module control-plane integration requires DATABASE_URL outside the dedicated postgres-check gate', { skip: 'DATABASE_URL is only mandatory for npm run modules:p3-005:postgres-check' }, () => {});
} else {

async function resetDatabase(pool) {
  await pool.query('drop schema if exists public cascade');
  await pool.query('create schema public');
  await pool.query('create extension if not exists pgcrypto');
}
function makeService(pool, overrides={}) {
  const db = drizzle(pool, { schema });
  const repository = createPostgresModuleControlPlaneRepository({ db, pool, ...overrides });
  return { db, repository, service: createModuleControlPlaneService({ repository }) };
}
async function seed(service) {
  await service.seedCatalogFromP3_002();
  const planning = await service.resolveModuleVersion({ moduleId:'planning', semanticVersion:'0.1.0' });
  const lms = await service.resolveModuleVersion({ moduleId:'lms', semanticVersion:'0.1.0' });
  return { planning, lms };
}
async function compatibleRuntime(service, repository, moduleVersion, suffix='a') {
  const rt = await service.registerModuleRuntime({ runtimeId:`${moduleVersion.moduleId}-runtime-${suffix}`, moduleId:moduleVersion.moduleId, moduleOwner:`${moduleVersion.moduleId}-runtime-boundary`, deploymentMode:moduleVersion.deploymentMode, runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available', serviceIdentityRequired: moduleVersion.deploymentMode === 'federated' });
  await repository.recordCompatibility({ moduleVersionId:moduleVersion.id, runtimeId:rt.id, compatibilityStatus:'compatible', hostContractVersion:'civitas-host/v1', runtimeContractVersion:rt.runtimeContractVersion, compatibilityRange:'1.x', policy:'explicit' });
  return rt;
}

test('fresh migrations create P3-005 schema and are idempotent', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  try {
    await resetDatabase(pool);
    await runSqlMigrations({ pool, logger:{ log(){} } });
    await assertOperationalSchema({ pool });
    await runSqlMigrations({ pool, logger:{ log(){} } });
    await assertOperationalSchema({ pool });
    const tables = await pool.query("select table_name from information_schema.tables where table_schema='public' and table_name = any($1::text[])", [[ 'module_catalog','module_versions','organization_modules','module_runtime_catalog','organization_module_runtime_bindings','module_contract_compatibility' ]]);
    assert.equal(tables.rowCount, 6);
  } finally { await pool.end(); }
});

test('PostgreSQL repository persists module control-plane state across service instances', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
  try {
    await resetDatabase(pool); await runSqlMigrations({ pool, logger:{ log(){} } });
    let ctx = makeService(pool); const { planning } = await seed(ctx.service);
    const installation = await ctx.service.provisionOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'planning', moduleVersionId:planning.id, actor:'u1', reason:'install' });
    const runtime = await compatibleRuntime(ctx.service, ctx.repository, planning, 'a');
    const binding = await ctx.service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:runtime.runtimeId, actor:'u1', reason:'bind' });
    ctx = makeService(pool);
    assert.equal((await ctx.service.getOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'planning' })).id, installation.id);
    assert.equal((await ctx.repository.listBindings({ logtoOrganizationId:'orgA', moduleId:'planning' }))[0].id, binding.id);
  } finally { await pool.end(); }
});

test('PostgreSQL repository scopes installs and bindings by organization', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
  try {
    await resetDatabase(pool); await runSqlMigrations({ pool, logger:{ log(){} } });
    const { service, repository } = makeService(pool); const { planning } = await seed(service);
    await service.provisionOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'planning', moduleVersionId:planning.id, actor:'u1', reason:'install A' });
    await service.provisionOrganizationModule({ logtoOrganizationId:'orgB', moduleId:'planning', moduleVersionId:planning.id, actor:'u2', reason:'install B' });
    const rtA = await compatibleRuntime(service, repository, planning, 'a');
    const rtB = await compatibleRuntime(service, repository, planning, 'b');
    const bindA = await service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:rtA.runtimeId, actor:'u1', reason:'bind A' });
    const bindB = await service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgB', moduleId:'planning', runtimeId:rtB.runtimeId, actor:'u2', reason:'bind B' });
    assert.equal((await repository.listBindings({ logtoOrganizationId:'orgA', moduleId:'planning' })).length, 1);
    assert.equal((await repository.listBindings({ logtoOrganizationId:'orgB', moduleId:'planning' })).length, 1);
    await assert.rejects(() => service.suspendOrRemoveRuntimeBinding({ logtoOrganizationId:'orgA', bindingId:bindB.id, expectedVersion:bindB.version, status:'suspended', actor:'u1', reason:'wrong tenant' }), { code: REASON_CODES.BINDING_CONFLICT });
    const suspended = await service.suspendOrRemoveRuntimeBinding({ logtoOrganizationId:'orgA', bindingId:bindA.id, expectedVersion:bindA.version, status:'suspended', actor:'u1', reason:'tenant safe' });
    assert.equal(suspended.status, 'suspended');
  } finally { await pool.end(); }
});

test('SQL optimistic concurrency lets exactly one lifecycle writer win', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
  try {
    await resetDatabase(pool); await runSqlMigrations({ pool, logger:{ log(){} } });
    const { service, repository } = makeService(pool); const { lms } = await seed(service);
    await service.provisionOrganizationModule({ logtoOrganizationId:'orgC', moduleId:'lms', moduleVersionId:lms.id, actor:'u1', reason:'install' });
    const attempts = await Promise.allSettled([
      repository.updateOrganizationModuleLifecycle({ logtoOrganizationId:'orgC', moduleId:'lms', expectedVersion:1, lifecycle:'provisioning', actorLogtoUserId:'u1', reason:'writer 1' }),
      repository.updateOrganizationModuleLifecycle({ logtoOrganizationId:'orgC', moduleId:'lms', expectedVersion:1, lifecycle:'provisioning', actorLogtoUserId:'u2', reason:'writer 2' })
    ]);
    assert.equal(attempts.filter(r=>r.status==='fulfilled').length, 1, JSON.stringify(attempts.map(r=>r.status==='rejected'?{status:r.status,code:r.reason.code,message:r.reason.message}:r)));
    assert.equal(attempts.filter(r=>r.status==='rejected' && r.reason.code===REASON_CODES.CONFLICT).length, 1, JSON.stringify(attempts.map(r=>r.status==='rejected'?{status:r.status,code:r.reason.code,message:r.reason.message}:r)));
  } finally { await pool.end(); }
});

test('audit and outbox hooks are transactional and redact secretsRef', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
  try {
    await resetDatabase(pool); await runSqlMigrations({ pool, logger:{ log(){} } });
    const ctx = makeService(pool); const { lms } = await seed(ctx.service);
    await compatibleRuntime(ctx.service, ctx.repository, lms, 'audit');
    const counts = await pool.query("select (select count(*) from audit_logs)::int as audits, (select count(*) from operational_operations where queue_name='module-control-plane')::int as outbox");
    assert.ok(counts.rows[0].audits > 0);
    assert.ok(counts.rows[0].outbox > 0);
    const failing = makeService(pool, { auditWriter: async () => { throw new Error('audit failed'); } });
    await assert.rejects(() => failing.service.registerModuleRuntime({ runtimeId:'lms-runtime-rollback', moduleId:'lms', moduleOwner:'lms-runtime-boundary', deploymentMode:'embedded', runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available' }));
    assert.equal(await failing.repository.getRuntimeByRuntimeId('lms-runtime-rollback'), null);
    const rollbackCounts = await pool.query("select (select count(*) from module_runtime_catalog where runtime_id='lms-runtime-rollback')::int as runtimes, (select count(*) from operational_operations where queue_name='module-control-plane' and input_json::text like '%lms-runtime-rollback%')::int as outbox");
    assert.equal(rollbackCounts.rows[0].runtimes, 0);
    assert.equal(rollbackCounts.rows[0].outbox, 0);
    await assert.rejects(() => ctx.service.registerModuleRuntime({ runtimeId:'lms-runtime-secret', moduleId:'lms', moduleOwner:'lms-runtime-boundary', deploymentMode:'embedded', runtimeContractVersion:'civitas-module-runtime/v1', serviceRef:'https://user:password@example.invalid' }));
  } finally { await pool.end(); }
});

}

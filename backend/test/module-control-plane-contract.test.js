const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createModuleControlPlaneService, createInMemoryModuleControlPlaneRepository, assertNoSecrets, REASON_CODES, TRANSITIONS } = require('../services/moduleControlPlane');

async function prepared(){ const repo=createInMemoryModuleControlPlaneRepository(); const service=createModuleControlPlaneService({ repository:repo }); await service.seedCatalogFromP3_002(); const planning=await service.resolveModuleVersion({ moduleId:'planning', semanticVersion:'0.1.0' }); const lms=await service.resolveModuleVersion({ moduleId:'lms', semanticVersion:'0.1.0' }); return { repo, service, planning, lms }; }

test('migration 0017 creates module control plane primitives and preserves foundation primitives', () => {
  const sql = fs.readFileSync(path.join(__dirname,'..','db','migrations','0017_module_control_plane.sql'),'utf8');
  for (const table of ['module_catalog','module_versions','organization_modules','module_runtime_catalog','organization_module_runtime_bindings','module_contract_compatibility']) assert.match(sql, new RegExp(`create table if not exists ${table}`));
  for (const primitive of ['registry_connector_bindings','organization_runtime_state','operational_operations']) assert.doesNotMatch(sql, new RegExp(`drop table.*${primitive}`,'i'));
  assert.match(sql, /MODULE_MIGRATION_DUPLICATE_BINDING/);
});

test('schema guard includes module control plane tables', () => {
  const { REQUIRED_OPERATIONAL_SCHEMA } = require('../runtime/migrations');
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.module_catalog.includes('module_id'));
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.organization_modules.includes('version'));
  assert.ok(REQUIRED_OPERATIONAL_SCHEMA.organization_module_runtime_bindings.includes('is_executable'));
});

test('catalog seed derives module versions from P3-002 source without duplicate authored lists', async () => {
  const { repo, planning } = await prepared();
  assert.equal(repo.catalog.size, 11);
  assert.equal(planning.deploymentMode, 'federated');
  assert.equal(planning.contractStatus, 'planned');
});

test('two organizations are tenant isolated and can bind different runtimes for same module', async () => {
  const { service, repo, planning } = await prepared();
  await service.provisionOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'planning', moduleVersionId:planning.id, actor:'u1', reason:'test' });
  await service.provisionOrganizationModule({ logtoOrganizationId:'orgB', moduleId:'planning', moduleVersionId:planning.id, actor:'u2', reason:'test' });
  const rtA = await service.registerModuleRuntime({ runtimeId:'planning-runtime-a', moduleId:'planning', moduleOwner:'agora-planning-runtime-boundary', deploymentMode:'federated', runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available', serviceIdentityRequired:true });
  const rtB = await service.registerModuleRuntime({ runtimeId:'planning-runtime-b', moduleId:'planning', moduleOwner:'agora-planning-runtime-boundary', deploymentMode:'federated', runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available', serviceIdentityRequired:true });
  await repo.recordCompatibility({ moduleVersionId:planning.id, runtimeId:rtA.id, compatibilityStatus:'compatible', hostContractVersion:'civitas-host/v1', runtimeContractVersion:'civitas-module-runtime/v1', compatibilityRange:'1.x', policy:'explicit' });
  await repo.recordCompatibility({ moduleVersionId:planning.id, runtimeId:rtB.id, compatibilityStatus:'compatible', hostContractVersion:'civitas-host/v1', runtimeContractVersion:'civitas-module-runtime/v1', compatibilityRange:'1.x', policy:'explicit' });
  await service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:'planning-runtime-a', actor:'u1', reason:'bind A' });
  await service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgB', moduleId:'planning', runtimeId:'planning-runtime-b', actor:'u2', reason:'bind B' });
  assert.equal((await repo.listBindings({ logtoOrganizationId:'orgA', moduleId:'planning' }))[0].runtimeId, rtA.id);
  assert.equal((await repo.listBindings({ logtoOrganizationId:'orgB', moduleId:'planning' }))[0].runtimeId, rtB.id);
});

test('lifecycle transition matrix, no implicit activation, stale version conflict and history hooks', async () => {
  const { service, repo, lms } = await prepared();
  assert.deepEqual(TRANSITIONS.disabled, ['provisioning']);
  const om = await service.provisionOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'lms', moduleVersionId:lms.id, actor:'u1', reason:'install' });
  await assert.rejects(() => service.transitionOrganizationModuleLifecycle({ logtoOrganizationId:'orgA', moduleId:'lms', expectedVersion:om.version, toLifecycle:'active', actor:'u1', reason:'bad' }), { code: REASON_CODES.INVALID });
  const p = await service.transitionOrganizationModuleLifecycle({ logtoOrganizationId:'orgA', moduleId:'lms', expectedVersion:1, toLifecycle:'provisioning', actor:'u1', reason:'start' });
  await assert.rejects(() => service.transitionOrganizationModuleLifecycle({ logtoOrganizationId:'orgA', moduleId:'lms', expectedVersion:1, toLifecycle:'disabled', actor:'u1', reason:'stale' }), { code: REASON_CODES.CONFLICT });
  assert.equal(p.version, 2);
  assert.ok(repo.audit.length > 0);
  assert.ok(repo.outbox.length > 0);
});

test('active requires executable compatible runtime binding and wrong module/incompatible runtime fail closed', async () => {
  const { service, repo, planning, lms } = await prepared();
  const om = await service.provisionOrganizationModule({ logtoOrganizationId:'orgA', moduleId:'planning', moduleVersionId:planning.id, actor:'u1', reason:'install' });
  const bad = await service.registerModuleRuntime({ runtimeId:'lms-runtime', moduleId:'lms', moduleOwner:'civitas-learning-boundary', deploymentMode:'embedded', runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available' });
  await repo.recordCompatibility({ moduleVersionId:lms.id, runtimeId:bad.id, compatibilityStatus:'compatible', hostContractVersion:'civitas-host/v1', runtimeContractVersion:'civitas-module-runtime/v1', compatibilityRange:'1.x', policy:'explicit' });
  await assert.rejects(() => service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:'lms-runtime', actor:'u1', reason:'wrong' }), { code: REASON_CODES.WRONG_MODULE });
  const rt = await service.registerModuleRuntime({ runtimeId:'planning-runtime', moduleId:'planning', moduleOwner:'agora-planning-runtime-boundary', deploymentMode:'federated', runtimeContractVersion:'civitas-module-runtime/v1', runtimeStatus:'available', serviceIdentityRequired:true });
  await repo.recordCompatibility({ moduleVersionId:planning.id, runtimeId:rt.id, compatibilityStatus:'verification_required', hostContractVersion:'civitas-host/v1', runtimeContractVersion:'civitas-module-runtime/v1', compatibilityRange:'1.x', policy:'explicit' });
  await assert.rejects(() => service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:'planning-runtime', actor:'u1', reason:'incompat' }), { code: REASON_CODES.INCOMPATIBLE });
  repo.compat.set(`${planning.id}|${rt.id}`, { moduleVersionId:planning.id, runtimeId:rt.id, compatibilityStatus:'compatible' });
  await service.bindOrganizationModuleRuntime({ logtoOrganizationId:'orgA', moduleId:'planning', runtimeId:'planning-runtime', actor:'u1', reason:'bind' });
  await service.transitionOrganizationModuleLifecycle({ logtoOrganizationId:'orgA', moduleId:'planning', expectedVersion:om.version, toLifecycle:'provisioning', actor:'u1', reason:'provision' });
  const active = await service.transitionOrganizationModuleLifecycle({ logtoOrganizationId:'orgA', moduleId:'planning', expectedVersion:2, toLifecycle:'active', actor:'u1', reason:'activate with evidence' });
  assert.equal(active.lifecycle, 'active');
});

test('secret safety rejects values without logging secret value', () => {
  assert.throws(() => assertNoSecrets({ config:{ apiKey:'redacted-value' }, url:'https://user:pass@example.invalid' }), (error) => {
    assert.equal(error.code, 'MODULE_SECRET_DETECTED');
    assert.ok(error.details.paths.includes('payload.config.apiKey'));
    assert.doesNotMatch(error.message, /redacted-value|pass/);
    return true;
  });
});


const repoRoot = path.join(__dirname, '..', '..');
const preflightScript = path.join(repoRoot, 'scripts', 'modules', 'p3-005-preflight.mjs');
const trackedPreflightArtifacts = [
  path.join(repoRoot, 'artifacts', 'modules', 'p3-005-migration-reconciliation.json'),
  path.join(repoRoot, 'artifacts', 'modules', 'p3-005-migration-reconciliation.md'),
];

function runPreflight(args = []) {
  return execFileSync(process.execPath, [preflightScript, ...args], { cwd: repoRoot, encoding: 'utf8' });
}

function assertTrackedPreflightArtifactsAbsent() {
  for (const artifactPath of trackedPreflightArtifacts) assert.equal(fs.existsSync(artifactPath), false, `${artifactPath} must not exist`);
}

function assertNoSecretValues(serializedReport) {
  assert.doesNotMatch(serializedReport, /password=|api[_-]?key=|secret=|token=|authorization:|bearer\s+[a-z0-9._-]+|redacted-value|user:pass/i);
}

test('preflight artifacts use required terminology and contain provenance', () => {
  const tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'civitas-p3-005-'));
  try {
    runPreflight(['--write-report', tempdir]);
    const report = JSON.parse(fs.readFileSync(path.join(tempdir, 'p3-005-migration-reconciliation.json'), 'utf8'));
    const markdown = fs.readFileSync(path.join(tempdir, 'p3-005-migration-reconciliation.md'), 'utf8');
    const serializedReport = JSON.stringify(report);

    assert.equal(report.schemaVersion, 'p3-005-module-reconciliation/v1');
    assert.match(report.catalog.hash, /^[a-f0-9]{64}$/);
    assert.equal(report.catalog.version, '2.0.0');
    assert.equal(report.moduleCount, report.catalog.moduleCount);
    assert.equal(report.moduleCount, 11);
    if (report.branch) assert.match(markdown, new RegExp(`Branch: ${report.branch}`));
    if (report.commitSha) {
      assert.match(report.commitSha, /^[a-f0-9]{40}$/);
      assert.match(markdown, new RegExp(`Commit SHA: ${report.commitSha}`));
    }
    if (report.mergeBase) {
      assert.match(report.mergeBase, /^[a-f0-9]{40}$/);
      assert.match(markdown, new RegExp(`Merge-base: ${report.mergeBase}`));
    }
    assert.ok(report.primitives.some(p => p.primitive === 'organization_runtime_state' && p.classification === 'primitive-referenced' && p.decision === 'reference'));
    assert.ok(report.primitives.some(p => p.classification === 'primitive-preserved' && p.decision === 'preserve'));
    assert.ok(report.primitives.some(p => p.classification === 'primitive-referenced' && p.decision === 'reference'));
    assert.ok(report.primitives.some(p => p.classification === 'primitive-extended' && p.decision === 'extend'));
    assert.equal(report.redactionStatus, 'paths-only-no-secret-values');
    assert.match(markdown, /foundation|primitive-preserved|primitive-referenced|primitive-extended/);
    assert.match(markdown, /preserve|reference|extend/);
    assert.match(markdown, /Redaction: paths-only-no-secret-values/);
    assertNoSecretValues(serializedReport);
    assertNoSecretValues(markdown);
  } finally {
    fs.rmSync(tempdir, { recursive: true, force: true });
  }
});

test('default preflight is read-only and does not create tracked artifacts', () => {
  assertTrackedPreflightArtifactsAbsent();
  const report = JSON.parse(runPreflight());
  assert.equal(report.reportWritten, false);
  assertTrackedPreflightArtifactsAbsent();
});

test('--write-report only writes expected files in requested directory', () => {
  const tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'civitas-p3-005-'));
  try {
    assertTrackedPreflightArtifactsAbsent();
    runPreflight(['--write-report', tempdir]);
    assert.deepEqual(fs.readdirSync(tempdir).sort(), [
      'p3-005-migration-reconciliation.json',
      'p3-005-migration-reconciliation.md',
    ]);
    assert.equal(fs.statSync(path.join(tempdir, 'p3-005-migration-reconciliation.json')).isFile(), true);
    assert.equal(fs.statSync(path.join(tempdir, 'p3-005-migration-reconciliation.md')).isFile(), true);
    assertTrackedPreflightArtifactsAbsent();
  } finally {
    fs.rmSync(tempdir, { recursive: true, force: true });
  }
});

test('production wiring requires an explicit repository and never falls back to in-memory maps', () => {
  const source = fs.readFileSync(path.join(__dirname,'..','services','moduleControlPlane.js'),'utf8');
  assert.throws(() => createModuleControlPlaneService(), { code: REASON_CODES.REPOSITORY_REQUIRED });
  assert.doesNotMatch(source, /repository\s*=\s*createInMemoryModuleControlPlaneRepository/);
  assert.doesNotMatch(source, /repository\s*\|\|\s*createInMemoryModuleControlPlaneRepository/);
  assert.match(source, /createPostgresModuleControlPlaneRepository/);
});

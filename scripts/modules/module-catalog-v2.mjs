import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG_REL = 'contracts/modules/module-catalog.v2.json';
const INVENTORY_REL = 'contracts/modules/generated/module-catalog-v2.inventory.json';
const HASH_REL = 'contracts/modules/generated/module-catalog-v2.inventory.sha256';
const TYPES_REL = 'contracts/modules/generated/module-catalog-v2.types.ts';
const CATALOG = resolve(REPO_ROOT, CATALOG_REL);
const INVENTORY = resolve(REPO_ROOT, INVENTORY_REL);
const HASH = resolve(REPO_ROOT, HASH_REL);
const TYPES = resolve(REPO_ROOT, TYPES_REL);
const EXPECTED = ['analytics','community','crm','hr','lms','marketing','payments','planning','reports','scheduling','support'];
const EMBEDDED = EXPECTED.filter((id) => id !== 'planning');
const STATUSES = ['proposed','planned','active','deprecated','removed'];
const MODES = ['embedded','federated'];
const CONTRIB = ['api-openapi','ui','screen-action','navigation','permission-catalog','event','mcp','runtime-contract'];
const SECRET_KEY = /(^|[-_.])(accessToken|refreshToken|token|password|secret|clientSecret|privateKey|signingKey|credential|authorizationHeader|sessionCookie|callbackSecret|webhookSecret|runtimeEndpoint|healthSnapshot|installationState|tenantBinding|secretsRef|routeMount|navigationActive|liveProviderState)([-_.]|$)/i;
const LIVE_VALUE = /https?:\/\/|callback|bearer\s+|set-cookie|runtime endpoint|health snapshot|tenant binding|installation state/i;
const PROVIDER = /^(agora|moodle|canvas|plasma|openai)\./i;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function loadCatalog(path = CATALOG) { return JSON.parse(readFileSync(path, 'utf8')); }
function error(errors, code, path, message) { errors.push({ code, path, message }); }
function walk(value, path, errors) {
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}/${i}`, errors));
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
    const p = `${path}/${k}`;
    if (SECRET_KEY.test(k)) error(errors, 'MODULE_SECRET_OR_LIVE_FIELD', p, 'secret-like or live runtime field is forbidden');
    walk(v, p, errors);
  }
  if (typeof value === 'string' && LIVE_VALUE.test(value)) error(errors, 'MODULE_SECRET_OR_LIVE_VALUE', path, 'live endpoint, callback, token, cookie or runtime state value is forbidden');
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonicalize(value[k])]));
  return value;
}
function json(value) { return JSON.stringify(canonicalize(value), null, 2) + '\n'; }
function assertTransition(from, to, evidence) {
  const allowed = new Set(['proposed->planned','active->deprecated','deprecated->removed']);
  if (allowed.has(`${from}->${to}`)) return [];
  if (from === 'planned' && to === 'active') {
    const gates = ['implementation','consumer','authorizationPolicies','tests','deployment','observability','rollback'];
    return gates.every((g) => evidence?.[g]) ? [] : [{ code:'MODULE_TRANSITION_EVIDENCE_REQUIRED', path:'/transition/evidence', message:'planned->active requires full evidence gates' }];
  }
  if (from === 'deprecated' && to === 'active' && evidence?.decision) return [];
  if (from === 'planned' && to === 'removed' && evidence?.decision) return [];
  return [{ code:'MODULE_TRANSITION_FORBIDDEN', path:'/transition', message:`${from}->${to} is forbidden without a new ADR or required evidence` }];
}
export function validateCatalog(catalog) {
  const errors = [];
  walk(catalog, '', errors);
  if (catalog.schemaVersion !== 'civitas-module-manifest/v2') error(errors,'MODULE_SCHEMA_VERSION','/schemaVersion','schemaVersion must be civitas-module-manifest/v2');
  if (!SEMVER.test(catalog.catalogVersion ?? '')) error(errors,'MODULE_SEMVER','/catalogVersion','catalogVersion must be strict SemVer');
  if (!Array.isArray(catalog.modules)) return [{ code:'MODULE_SCHEMA', path:'/modules', message:'modules must be an array' }];
  if (catalog.modules.length !== 11) error(errors,'MODULE_COUNT','/modules','catalog must contain exactly 11 modules');
  const ids = catalog.modules.map((m) => m.id);
  if (JSON.stringify([...ids].sort()) !== JSON.stringify(EXPECTED)) error(errors,'MODULE_ID_SET','/modules','module IDs must match the ADR-003 eleven-module set');
  const seen = new Set(), owners = new Set(), caps = new Map();
  for (const [i, m] of catalog.modules.entries()) {
    const p = `/modules/${i}`;
    if (seen.has(m.id)) error(errors,'MODULE_DUPLICATE_ID',`${p}/id`,'duplicate module id'); seen.add(m.id);
    if (!EXPECTED.includes(m.id)) error(errors,'MODULE_UNKNOWN_ID',`${p}/id`,'unknown module id');
    if (PROVIDER.test(m.id)) error(errors,'MODULE_PROVIDER_LEAKAGE',`${p}/id`,'provider-shaped canonical module id');
    if (!SEMVER.test(m.version ?? '')) error(errors,'MODULE_SEMVER',`${p}/version`,'version must be strict SemVer');
    if (!STATUSES.includes(m.status)) error(errors,'MODULE_UNKNOWN_STATUS',`${p}/status`,'unknown status');
    if (!MODES.includes(m.deploymentMode)) error(errors,'MODULE_UNKNOWN_DEPLOYMENT_MODE',`${p}/deploymentMode`,'unknown deploymentMode');
    const bo = m.ownership?.businessOwner; if (owners.has(bo)) error(errors,'MODULE_DUPLICATE_BUSINESS_OWNER',`${p}/ownership/businessOwner`,'business owner must be unique'); owners.add(bo);
    for (const [j, c] of (m.capabilities ?? []).entries()) {
      if (!c.startsWith(`${m.id}.`)) error(errors,'MODULE_CAPABILITY_PREFIX',`${p}/capabilities/${j}`,'capability must start with moduleId.');
      if (PROVIDER.test(c)) error(errors,'MODULE_PROVIDER_LEAKAGE',`${p}/capabilities/${j}`,'provider-shaped canonical capability id');
      if (caps.has(c)) error(errors,'MODULE_DUPLICATE_CAPABILITY',`${p}/capabilities/${j}`,'capability claimed by multiple modules'); caps.set(c, m.id);
    }
    for (const [j, d] of (m.dependencies ?? []).entries()) {
      if (!EXPECTED.includes(d.moduleId)) error(errors,'MODULE_DEPENDENCY_UNKNOWN',`${p}/dependencies/${j}/moduleId`,'dependency must target an existing module');
      if (d.moduleId === m.id) error(errors,'MODULE_DEPENDENCY_SELF',`${p}/dependencies/${j}/moduleId`,'self dependency is forbidden');
      if (PROVIDER.test(d.moduleId)) error(errors,'MODULE_PROVIDER_LEAKAGE',`${p}/dependencies/${j}/moduleId`,'provider-shaped dependency id');
    }
    for (const [j, c] of (m.contributions ?? []).entries()) {
      const cp = `${p}/contributions/${j}`;
      if (!CONTRIB.includes(c.type)) error(errors,'MODULE_CONTRIBUTION_TYPE',`${cp}/type`,'unknown contribution type');
      if (!SEMVER.test(c.version ?? '')) error(errors,'MODULE_CONTRIBUTION_REF',`${cp}/version`,'contribution version must be strict SemVer');
      if (!c.owner || !c.artifact || !c.status) error(errors,'MODULE_CONTRIBUTION_REF',cp,'contribution reference is incomplete');
      if (PROVIDER.test(c.artifact)) error(errors,'MODULE_PROVIDER_LEAKAGE',`${cp}/artifact`,'provider-shaped contribution artifact');
    }
    if (m.deploymentMode === 'federated') {
      const f = m.federated;
      for (const k of ['runtimeContractVersion','audience','uiContractVersion','uiEntryRef','compatibilityPolicy']) if (!f?.[k]) error(errors,'MODULE_FEDERATED_REQUIRED',`${p}/federated/${k}`,'federated metadata is required');
      if (f?.serviceIdentityRequired !== true) error(errors,'MODULE_FEDERATED_SERVICE_IDENTITY',`${p}/federated/serviceIdentityRequired`,'federated modules require serviceIdentityRequired=true');
      if (!m.ownership?.runtimeOwner || !m.dataOwnership?.owner) error(errors,'MODULE_FEDERATED_OWNERSHIP',p,'federated runtime and data ownership are required');
    } else if (m.federated) error(errors,'MODULE_EMBEDDED_REMOTE_METADATA',`${p}/federated`,'embedded modules cannot declare federated metadata');
  }
  const byId = Object.fromEntries(catalog.modules.map((m) => [m.id, m]));
  const visiting = new Set(), visited = new Set();
  function dfs(id, stack=[]) { if (visiting.has(id)) return error(errors,'MODULE_DEPENDENCY_CYCLE',`/modules/${ids.indexOf(id)}/dependencies`,'dependency cycle detected'); if (visited.has(id)) return; visiting.add(id); for (const d of byId[id]?.dependencies ?? []) if (byId[d.moduleId]) dfs(d.moduleId, [...stack,id]); visiting.delete(id); visited.add(id); }
  EXPECTED.forEach((id) => dfs(id));
  const planning = byId.planning;
  if (planning?.status !== 'planned') error(errors,'MODULE_PLANNING_STATUS','/modules/planning/status','planning must remain planned');
  if (planning?.deploymentMode !== 'federated') error(errors,'MODULE_PLANNING_DEPLOYMENT','/modules/planning/deploymentMode','planning must remain federated');
  for (const id of EMBEDDED) { if (byId[id]?.status !== 'planned') error(errors,'MODULE_EMBEDDED_STATUS',`/modules/${id}/status`,`${id} must remain planned`); if (byId[id]?.deploymentMode !== 'embedded') error(errors,'MODULE_EMBEDDED_DEPLOYMENT',`/modules/${id}/deploymentMode`,`${id} must remain embedded`); }
  if (JSON.stringify(catalog.modules.map((m) => m.id)) !== JSON.stringify([...ids].sort())) error(errors,'MODULE_ORDER','/modules','modules must be sorted by id');
  return errors.sort((a,b) => `${a.code}${a.path}`.localeCompare(`${b.code}${b.path}`));
}
export function buildInventory(catalog) {
  const sourceDigest = createHash('sha256').update(readFileSync(CATALOG)).digest('hex');
  return { schemaVersion: catalog.schemaVersion, catalogVersion: catalog.catalogVersion, moduleCount: catalog.modules.length, moduleIds: catalog.modules.map(m=>m.id).sort(), modules: catalog.modules.map(m => ({ id:m.id, status:m.status, deploymentMode:m.deploymentMode, ownership:m.ownership, capabilities:[...m.capabilities].sort(), dependencies:(m.dependencies??[]).map(d=>d.moduleId).sort(), contributions:(m.contributions??[]).map(c=>({type:c.type,version:c.version,owner:c.owner,artifact:c.artifact,status:c.status})).sort((a,b)=>a.type.localeCompare(b.type)||a.artifact.localeCompare(b.artifact)) })).sort((a,b)=>a.id.localeCompare(b.id)), sourceDigest };
}
export function inventoryBytes(catalog) { return json(buildInventory(catalog)); }
export function generateTypes(catalog) {
  const ids = catalog.modules.map(m=>m.id).sort();
  return `// Generated from ${CATALOG_REL}. Do not edit.\nexport type CivitasModuleId = ${ids.map(id=>`'${id}'`).join(' | ')};\nexport type ModuleKind = 'business';\nexport type ModuleStatus = 'proposed' | 'planned' | 'active' | 'deprecated' | 'removed';\nexport type ModuleDeploymentMode = 'embedded' | 'federated';\nexport interface ModuleOwnership { businessOwner: string; capabilityOwner: string; dataOwner: string; publicApiOwner: string; runtimeOwner: string; uiContributionOwner: string; }\nexport interface ModuleDependency { moduleId: CivitasModuleId; version?: string; optional?: boolean; }\nexport interface ModuleContributionReference { type: 'api-openapi' | 'ui' | 'screen-action' | 'navigation' | 'permission-catalog' | 'event' | 'mcp' | 'runtime-contract'; version: string; owner: string; artifact: string; status: 'planned' | 'compatible' | 'deprecated'; contractVersion?: string; }\nexport interface ModuleCompatibilityPolicy { policy: string; compatible: boolean; aliases?: Array<{ from: string; to: CivitasModuleId; status: string; removalRequires: string }>; }\nexport interface FederatedModuleContractMetadata { runtimeContractVersion: string; audience: string; serviceIdentityRequired: true; uiContractVersion: string; uiEntryRef: string; compatibilityPolicy: string; productSurface: string; }\nexport interface ModuleManifestV2 { schemaVersion: 'civitas-module-manifest/v2'; id: CivitasModuleId; version: string; kind: ModuleKind; status: ModuleStatus; deploymentMode: ModuleDeploymentMode; businessBoundary: string; ownership: ModuleOwnership; dataOwnership: { owner: string; transactionalSystem: string }; capabilities: string[]; dependencies: ModuleDependency[]; contributions: ModuleContributionReference[]; compatibility: ModuleCompatibilityPolicy; lifecycle: { supportsTenantLifecycle: boolean; storesTenantInstallationState: false }; federated?: FederatedModuleContractMetadata; }\nexport interface ModuleCatalogV2 { schemaVersion: 'civitas-module-manifest/v2'; catalogVersion: string; modules: ModuleManifestV2[]; }\n`;
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = `${dir}/${name}`;
    if (['node_modules', 'dist', '.git'].includes(name)) continue;
    const st = statSync(path);
    if (st.isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}
export function checkNoSecondSource() {
  const governed = ['backend', 'frontend/src', 'contracts/openapi', 'contracts/authorization', '.github/workflows', 'scripts'].map((d) => resolve(REPO_ROOT, d))
    .flatMap(listFiles)
    .filter((file) => !file.endsWith('module-catalog-v2.mjs') && !file.includes('module-catalog-v2-contract.test'));
  return governed.flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    const declaresManifest = text.includes('civitas-module-manifest/v2') || text.includes('ModuleCatalogV2');
    const authoredArray = /(?:const|let|var|export\s+const)\s+(?:CIVITAS_)?MODULES\s*=\s*\[/m.test(text);
    return declaresManifest || authoredArray ? [{ code: 'MODULE_SECOND_SOURCE_OF_TRUTH', path: file, message: 'possible authored module catalog outside contracts/modules/module-catalog.v2.json' }] : [];
  });
}

export { assertTransition };
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] ?? '--check';
  const catalog = loadCatalog();
  const errors = [...validateCatalog(catalog), ...checkNoSecondSource()];
  if (errors.length) { for (const e of errors) console.error(`${e.code} ${e.path} ${e.message}`); process.exit(1); }
  const inv = inventoryBytes(catalog); const hash = createHash('sha256').update(inv).digest('hex') + '\n'; const types = generateTypes(catalog);
  if (mode === '--generate') { writeFileSync(INVENTORY, inv); writeFileSync(HASH, hash); writeFileSync(TYPES, types); console.log(`generated ${INVENTORY_REL} ${hash.trim()}`); }
  else { const mismatches = []; if (!existsSync(INVENTORY) || readFileSync(INVENTORY,'utf8') !== inv) mismatches.push(INVENTORY_REL); if (!existsSync(HASH) || readFileSync(HASH,'utf8') !== hash) mismatches.push(HASH_REL); if (!existsSync(TYPES) || readFileSync(TYPES,'utf8') !== types) mismatches.push(TYPES_REL); if (mismatches.length) { console.error(`MODULE_GENERATED_DRIFT ${mismatches.join(', ')}`); process.exit(1); } console.log(`module catalog v2 check passed ${hash.trim()}`); }
}

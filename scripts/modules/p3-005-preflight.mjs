import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { loadCatalogHash } from '../../backend/services/moduleControlPlane.js';

const OUT_JSON = 'artifacts/modules/p3-005-migration-reconciliation.json';
const OUT_MD = 'artifacts/modules/p3-005-migration-reconciliation.md';
const primitives = [
  ['registry_capabilities','primitive-preserved','technical provider-neutral capabilities','key','status'],
  ['registry_adapters','primitive-preserved','technical adapter implementations','capability_id + key','status/module_ref'],
  ['registry_connectors','primitive-preserved','configured connector instances','adapter_id + key','status/secrets_ref'],
  ['registry_connector_bindings','primitive-referenced','tenant capability-to-connector binding','logto_organization_id + capability_id active','status/is_active'],
  ['organization_runtime_state','primitive-referenced','technical mappings and operational state','logto_organization_id + capability + state_key','status'],
  ['operational_operations','primitive-consumer','async operation tracking/idempotency','id/idempotency_key','status'],
  ['audit_logs','primitive-consumer','audit record sink','id','action/result'],
  ['idempotency_records','primitive-consumer','idempotent action records','idempotency_key','status'],
  ['module_catalog','primitive-extended','module identity control plane','module_id','catalog_status'],
  ['module_versions','primitive-extended','manifest version control plane','module_id + semantic_version','contract_status'],
  ['organization_modules','primitive-extended','tenant module installation lifecycle','logto_organization_id + module_id','lifecycle/version'],
  ['module_runtime_catalog','primitive-extended','business module runtime catalog','runtime_id','runtime_status/version'],
  ['organization_module_runtime_bindings','primitive-extended','tenant business runtime binding','logto_organization_id + organization_module_id + module_id active','status/version'],
  ['module_contract_compatibility','primitive-extended','explicit module/runtime/host compatibility','module_version_id + runtime_id + versions','compatibility_status']
];
function sh(cmd){ try { return execSync(cmd, { encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim(); } catch { return null; } }
const report = { schemaVersion:'p3-005-module-reconciliation/v1', branch:sh('git branch --show-current'), commitSha:sh('git rev-parse HEAD'), mergeBase:sh('git merge-base HEAD main') || null, catalog:{ path:'contracts/modules/module-catalog.v2.json', hash:loadCatalogHash(), version:JSON.parse(fs.readFileSync('contracts/modules/module-catalog.v2.json','utf8')).catalogVersion }, counts:Object.fromEntries(primitives.map(p=>[p[0],'preflight-offline-structural'])), mappings:{ unambiguous:[] }, blockers:[], manualReview:[], redactionStatus:'paths-only-no-secret-values', primitives:primitives.map(([primitive,classification,responsibility,naturalKeys,lifecycle])=>({ primitive, classification, responsibility, tenantIdentity: primitive.includes('organization')||primitive.includes('connector_bindings')?'logto_organization_id':'global/control-plane', naturalKeys, constraints:'see migration 0017 and existing schema guards', lifecycleStatus:lifecycle, relationToP3005:classification, decision: classification.includes('preserved')?'preserve':classification.includes('referenced')?'reference':classification.includes('consumer')?'compatibility':'extend' })) };
fs.mkdirSync('artifacts/modules',{recursive:true});
fs.writeFileSync(OUT_JSON, JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(OUT_MD, `# P3-005 migration reconciliation preflight\n\n- Branch: ${report.branch}\n- Commit SHA: ${report.commitSha}\n- Merge-base: ${report.mergeBase || 'unavailable'}\n- Catalog version: ${report.catalog.version}\n- Catalog hash: ${report.catalog.hash}\n- Redaction: ${report.redactionStatus}\n\n| Primitive | Classification | Responsibility | Tenant identity | Natural keys | Decision |\n|---|---|---|---|---|---|\n${report.primitives.map(p=>`| ${p.primitive} | ${p.classification} | ${p.responsibility} | ${p.tenantIdentity} | ${p.naturalKeys} | ${p.decision} |`).join('\n')}\n\n## Blockers\n\n${report.blockers.length ? report.blockers.map(b=>`- ${b.code}: ${b.path}`).join('\n') : '- None in offline structural preflight. Database row-level preflight must run before destructive backfills.'}\n`);
console.log(`wrote ${OUT_JSON} and ${OUT_MD}`);
if(report.blockers.length) process.exit(1);

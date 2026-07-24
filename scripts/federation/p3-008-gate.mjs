import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const mode=process.argv[2]||'all';
const required=['backend/planning/infrastructure/moduleExecutionContext.js','backend/planning/infrastructure/runtimeContractV1.js','backend/planning/infrastructure/serviceIdentity.js','backend/planning/infrastructure/transportAdapter.js','contracts/federation/planning-runtime/v1/schema.json','backend/test/planning-federated-gateway.test.js'];
for (const f of required) if(!fs.existsSync(f)) { console.error(`P3-008 ${mode} missing ${f}`); process.exit(1); }
const sources=required.map(f=>[f,fs.readFileSync(f,'utf8')]);
function fail(message){ console.error(`P3-008 ${mode} ${message}`); process.exit(1); }
for (const [file,text] of sources) {
  if(/createUnsignedContext|allowAll|Authorization\s*:\s*.*(user|access|bearer|token)|Cookie\s*:/i.test(text)) fail(`unsafe bypass or user credential forwarding marker in ${file}`);
  if(/getRuntimeById\s*\(/.test(text)) fail(`ambiguous runtime lookup in ${file}`);
  if(/headers\s*=\s*\{\s*\.\.\./.test(text)) fail(`caller header spread in ${file}`);
  if(/stack:'REDACT_ME'/.test(text) && !file.includes('fakeFederatedRuntime')) fail(`raw remote stack marker in ${file}`);
}
const contract=JSON.parse(fs.readFileSync('contracts/federation/planning-runtime/v1/schema.json','utf8'));
if(contract.serviceIdentityRequired!==true || contract.moduleExecutionContext!=='civitas-module-execution-context/v1') fail('contract must require service identity and signed execution context');
execFileSync(process.execPath,['--test','backend/test/planning-federated-gateway.test.js'],{stdio:'inherit'});
console.log(`P3-008 ${mode} gate passed`);

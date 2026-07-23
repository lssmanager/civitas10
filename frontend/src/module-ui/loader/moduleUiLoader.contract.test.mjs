import test from 'node:test'; import assert from 'node:assert/strict';
import { loadSecureModuleUiContribution } from './secureLoader.ts';
import { ModuleUiContributionCache } from './cache.ts';
import { fakePlanningUiContribution, fakeRemoteUiCode } from '../testing/fakeRemoteUiContribution.ts';
const catalog={ catalogHash:'a'.repeat(64), modules:[{ id:'planning', version:'0.1.0', status:'planned', capabilities:['planning.plans','planning.profile'] }] };
const registry={ resolve(){ return { origin:'https://modules.civitas.invalid', path:'/planning/0.1.0/0.1.0/planning-ui.js', content:fakeRemoteUiCode, contentType:'text/javascript; charset=utf-8' } } };
test('valid civitas-module-ui/v1 loads only after schema origin integrity and compatibility gates', async()=>{ const res=await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:registry, importVerifiedModule:async()=>({ default:{} }) }); assert.equal(res.ok,true); assert.equal(res.contribution.integrityVerified,true); assert.equal(res.contribution.resolvedArtifact.origin,'https://modules.civitas.invalid'); });
test('planned contribution, unknown capability, blocked origin and tampered integrity fail closed', async()=>{ const planned=structuredClone(fakePlanningUiContribution); planned.contract.status='planned'; planned.routes[0].status='planned'; planned.screens[0].status='planned'; planned.actions[0].status='planned'; assert.equal((await loadSecureModuleUiContribution(planned,{ catalog, artifactRegistry:registry })).ok,false); const badCap=structuredClone(fakePlanningUiContribution); badCap.screens[0].capabilityId='planning.unknown'; assert.equal((await loadSecureModuleUiContribution(badCap,{ catalog, artifactRegistry:registry })).code,'unknown_capability'); const blocked={ resolve(){ return { origin:'https://evil.invalid', path:'/planning/0.1.0/0.1.0/planning-ui.js', content:fakeRemoteUiCode, contentType:'text/javascript; charset=utf-8' } } }; assert.equal((await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:blocked })).code,'origin_blocked'); const tampered={ resolve(){ return { origin:'https://modules.civitas.invalid', path:'/planning/0.1.0/0.1.0/planning-ui.js', content:'tampered', contentType:'text/javascript; charset=utf-8' } } }; assert.equal((await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:tampered })).code,'integrity_failure'); });
test('host API/design mismatch and asset graph mismatch fail without white screen', async()=>{ const bad=structuredClone(fakePlanningUiContribution); bad.compatibility.hostApiVersion='civitas-module-ui-host/v2'; assert.equal((await loadSecureModuleUiContribution(bad,{ catalog, artifactRegistry:registry })).fallbackState,'host_api_incompatible'); const graph=structuredClone(fakePlanningUiContribution); graph.artifact.assetManifest.integrity=graph.artifact.integrity; const res=await loadSecureModuleUiContribution(graph,{ catalog, artifactRegistry:registry }); assert.equal(res.ok,false); assert.equal(res.safeTitle,'module_ui.asset_graph_invalid.title'); });
test('rollback can use previous verified contribution without changing authorization', async()=>{ const cache=new ModuleUiContributionCache(); await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:registry, cache, importVerifiedModule:async()=>({ default:{} }) }); const failImport=await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:registry, cache, importVerifiedModule:async()=>{ throw new Error('boom') } }); assert.equal(failImport.ok,true); assert.equal(failImport.cacheState,'previous_verified'); });

test('malformed remote payloads return schema_invalid without throwing TypeError', async()=>{
  for(const payload of [null, {}, { contract:{ schemaVersion:'civitas-module-ui/v1' } }, (()=>{ const x=structuredClone(fakePlanningUiContribution); delete x.compatibility; return x; })(), (()=>{ const x=structuredClone(fakePlanningUiContribution); delete x.routes; return x; })(), (()=>{ const x=structuredClone(fakePlanningUiContribution); x.routes=[null]; return x; })(), (()=>{ const x=structuredClone(fakePlanningUiContribution); delete x.artifact.entrypoint; return x; })(), (()=>{ const x=structuredClone(fakePlanningUiContribution); delete x.artifact.assetManifest.assets; return x; })(), (()=>{ const x=structuredClone(fakePlanningUiContribution); x.contract.status='unknown'; return x; })()]){
    const res=await loadSecureModuleUiContribution(payload,{ catalog, artifactRegistry:registry });
    assert.equal(res.ok,false);
    assert.equal(res.code,'schema_invalid');
    assert.equal(res.safeTitle,'module_ui.schema_invalid.title');
  }
});

test('artifact resolver uses UTF-8 byte length and enforces contribution origin allowlist', async()=>{
  const multibyte=structuredClone(fakePlanningUiContribution);
  const code='export default "á"';
  multibyte.artifact.entrypoint.sizeBytes=code.length;
  multibyte.artifact.integrity='sha256-does-not-matter';
  const bytesRegistry={ resolve(){ return { origin:'https://modules.civitas.invalid', path:'/planning/0.1.0/0.1.0/planning-ui.js', content:code, contentType:'text/javascript; charset=utf-8' } } };
  assert.equal((await loadSecureModuleUiContribution(multibyte,{ catalog, artifactRegistry:bytesRegistry })).code,'artifact_reference_invalid');
  const origin=structuredClone(fakePlanningUiContribution);
  origin.security.allowedOrigins=['https://other.civitas.invalid'];
  assert.equal((await loadSecureModuleUiContribution(origin,{ catalog, artifactRegistry:registry })).code,'origin_blocked');
});

test('rollback returns previous verified module exports instead of null default', async()=>{
  const cache=new ModuleUiContributionCache();
  const previousExports={ default:{ rendered:true } };
  await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:registry, cache, importVerifiedModule:async()=>previousExports });
  const failImport=await loadSecureModuleUiContribution(fakePlanningUiContribution,{ catalog, artifactRegistry:registry, cache, importVerifiedModule:async()=>{ throw new Error('boom') } });
  assert.equal(failImport.ok,true);
  assert.equal(failImport.cacheState,'previous_verified');
  assert.equal(failImport.moduleExports, previousExports);
});

import { MODULE_UI_CONTRACT_VERSION, MODULE_UI_HOST_API_VERSION, MODULE_UI_DESIGN_SYSTEM_VERSION, type ModuleUiContribution, type ModuleUiFailureCode, type ModuleUiStatus } from "./contracts.ts";
export type ModuleCatalogReadModel = { modules:readonly { id:string; version:string; status:string; capabilities:readonly ({id:string}|string)[] }[]; catalogHash:string };
const idPattern=/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const statuses:readonly ModuleUiStatus[]=["planned","active","deprecated"];
const executionKinds=["read","write","asynchronous"] as const;
const mutabilities=["read","write"] as const;
function isPlainObject(value:unknown): value is Record<string, unknown>{ return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function nonEmptyString(value:unknown): value is string{ return typeof value === "string" && value.trim().length > 0; }
function positiveInteger(value:unknown): value is number{ return typeof value === "number" && Number.isInteger(value) && value > 0; }
function oneOf<T extends readonly string[]>(value:unknown, allowed:T): value is T[number]{ return typeof value === "string" && (allowed as readonly string[]).includes(value); }
function objectArray(value:unknown): value is Record<string, unknown>[]{ return Array.isArray(value) && value.every(isPlainObject); }
function hasStrings(value:unknown): value is readonly string[]{ return Array.isArray(value) && value.every(nonEmptyString); }
function catalogCaps(module:ModuleCatalogReadModel["modules"][number]){ return new Set(module.capabilities.map(x=>typeof x==="string"?x:x.id)); }
export function validateModuleUiContribution(input:unknown, catalog:ModuleCatalogReadModel){ const fail=(code:ModuleUiFailureCode)=>({ ok:false as const, code });
  if(!isPlainObject(input)) return fail("schema_invalid");
  const c=input as Record<string, unknown>;
  if(!isPlainObject(c.contract)||!isPlainObject(c.identity)||!isPlainObject(c.compatibility)||!isPlainObject(c.artifact)||!objectArray(c.routes)||!objectArray(c.screens)||!objectArray(c.actions)||!isPlainObject(c.fallback)||!isPlainObject(c.security)) return fail("schema_invalid");
  const contract=c.contract; if(contract.schemaVersion!==MODULE_UI_CONTRACT_VERSION||contract.uiContractVersion!==MODULE_UI_CONTRACT_VERSION||!nonEmptyString(contract.contributionVersion)||!oneOf(contract.status,statuses)) return fail("schema_invalid");
  const identity=c.identity; if(!nonEmptyString(identity.moduleId)||!nonEmptyString(identity.moduleVersion)||!nonEmptyString(identity.catalogHash)||!nonEmptyString(identity.manifestHash)||!idPattern.test(identity.moduleId)) return fail("schema_invalid");
  const compatibility=c.compatibility; if(!nonEmptyString(compatibility.designSystemVersion)||!nonEmptyString(compatibility.hostApiVersion)) return fail("schema_invalid");
  if(compatibility.hostApiVersion!==MODULE_UI_HOST_API_VERSION) return fail("host_api_incompatible"); if(compatibility.designSystemVersion!==MODULE_UI_DESIGN_SYSTEM_VERSION) return fail("design_system_incompatible");
  const artifact=c.artifact; if(!isPlainObject(artifact.entrypoint)||!isPlainObject(artifact.assetManifest)||!nonEmptyString(artifact.integrity)) return fail("schema_invalid");
  const entrypoint=artifact.entrypoint; if(!nonEmptyString(entrypoint.artifactId)||entrypoint.contentType!=="text/javascript; charset=utf-8"||!positiveInteger(entrypoint.sizeBytes)) return fail("schema_invalid");
  const assetManifest=artifact.assetManifest; if(assetManifest.manifestVersion!=="civitas-module-ui-assets/v1"||!nonEmptyString(assetManifest.integrity)||!objectArray(assetManifest.assets)) return fail("schema_invalid");
  for(const asset of assetManifest.assets){ if(!nonEmptyString(asset.artifactId)||!nonEmptyString(asset.integrity)||!nonEmptyString(asset.contentType)||!positiveInteger(asset.sizeBytes)) return fail("schema_invalid"); }
  if(artifact.signature!==undefined){ if(!isPlainObject(artifact.signature)||!nonEmptyString(artifact.signature.keyId)||artifact.signature.algorithm!=="ed25519"||!nonEmptyString(artifact.signature.value)) return fail("schema_invalid"); }
  if(!nonEmptyString(c.fallback.unavailable)||!nonEmptyString(c.fallback.incompatible)||!nonEmptyString(c.fallback.integrityFailure)) return fail("schema_invalid");
  if(!hasStrings(c.security.allowedOrigins)||!hasStrings(c.security.requiredCapabilities)||c.security.allowedOrigins.length===0) return fail("schema_invalid");
  const mod=catalog.modules.find(m=>m.id===identity.moduleId); if(!mod) return fail("unknown_module"); const caps=catalogCaps(mod); const moduleId=identity.moduleId;
  const routeIds=new Set<string>(), screenIds=new Set<string>(), actionIds=new Set<string>();
  for(const r of c.routes){ if(!nonEmptyString(r.routeId)||!nonEmptyString(r.capabilityId)||!nonEmptyString(r.pathTemplate)||r.organizationScope!=="required"||!nonEmptyString(r.screenId)||!oneOf(r.status,statuses)||!nonEmptyString(r.permission)||!isPlainObject(r.breadcrumb)||!nonEmptyString(r.breadcrumb.labelKey)||r.moduleId!==moduleId) return fail("schema_invalid"); if(!caps.has(r.capabilityId)) return fail("unknown_capability"); if(routeIds.has(r.routeId)||!idPattern.test(r.routeId)||r.status!==contract.status) return fail("duplicate_id"); routeIds.add(r.routeId); }
  for(const s of c.screens){ if(!nonEmptyString(s.screenId)||!nonEmptyString(s.capabilityId)||!nonEmptyString(s.routeId)||!nonEmptyString(s.titleKey)||!nonEmptyString(s.iconId)||!oneOf(s.status,statuses)||!nonEmptyString(s.permission)||!oneOf(s.availability,["required","read_only_allowed","partial_allowed"] as const)||!isPlainObject(s.component)||!nonEmptyString(s.component.exportName)||s.moduleId!==moduleId) return fail("schema_invalid"); if(!caps.has(s.capabilityId)) return fail("unknown_capability"); if(screenIds.has(s.screenId)||!idPattern.test(s.screenId)||!routeIds.has(s.routeId)||s.status!==contract.status) return fail("duplicate_id"); screenIds.add(s.screenId); }
  for(const a of c.actions){ if(!nonEmptyString(a.actionId)||!nonEmptyString(a.screenId)||!nonEmptyString(a.capabilityId)||!nonEmptyString(a.operationId)||!nonEmptyString(a.permission)||!oneOf(a.executionKind,executionKinds)||!oneOf(a.mutability,mutabilities)||!oneOf(a.status,statuses)||a.moduleId!==moduleId) return fail("schema_invalid"); if(!caps.has(a.capabilityId)) return fail("unknown_capability"); if(actionIds.has(a.actionId)||!idPattern.test(a.actionId)||!screenIds.has(a.screenId)||a.status!==contract.status) return fail("duplicate_id"); actionIds.add(a.actionId); }
  for(const screen of c.screens) if(!c.routes.some(r=>r.screenId===screen.screenId)) return fail("schema_invalid");
  for(const requiredCap of c.security.requiredCapabilities) if(!caps.has(requiredCap)) return fail("unknown_capability");
  if(contract.status==="planned") return fail("planned_not_mountable"); return { ok:true as const, contribution:input as ModuleUiContribution };
}
export function compatibilityStatus(c:ModuleUiContribution){ if(c.compatibility.hostApiVersion!==MODULE_UI_HOST_API_VERSION) return { ok:false as const, code:"host_api_incompatible" as const }; if(c.compatibility.designSystemVersion!==MODULE_UI_DESIGN_SYSTEM_VERSION) return { ok:false as const, code:"design_system_incompatible" as const }; return { ok:true as const, status:c.contract.status==="deprecated"?"deprecated_compatible" as const:"compatible" as const }; }

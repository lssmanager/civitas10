import type { CapabilityKey } from "../../authorization/contracts/ids";
export type ModuleCapabilityReference = { moduleId:string; capabilityId:string };
export type HistoricalCapabilityMapping = { capabilityKey:CapabilityKey; moduleId:string; capabilityId:string; status:"canonical"|"compatibility"|"deprecated"|"blocked" };
export const MODULE_CAPABILITY_MAPPING_VERSION = "civitas-module-capability-mapping/v1" as const;
export const historicalCapabilityMappings: readonly HistoricalCapabilityMapping[] = Object.freeze([{ capabilityKey:"planning" as CapabilityKey, moduleId:"planning", capabilityId:"planning.plans", status:"canonical" }]);
export function resolveCapabilityKey(ref:ModuleCapabilityReference):CapabilityKey{ const matches=historicalCapabilityMappings.filter(m=>m.moduleId===ref.moduleId && m.capabilityId===ref.capabilityId && m.status!=="blocked"); if(matches.length!==1) throw new Error("module_capability_mapping_ambiguous_or_missing"); return matches[0].capabilityKey; }

// Generated from contracts/modules/module-catalog.v2.json. Do not edit.
export type CivitasModuleId = 'analytics' | 'community' | 'crm' | 'hr' | 'lms' | 'marketing' | 'payments' | 'planning' | 'reports' | 'scheduling' | 'support';
export type ModuleKind = 'business';
export type ModuleStatus = 'proposed' | 'planned' | 'active' | 'deprecated' | 'removed';
export type ModuleDeploymentMode = 'embedded' | 'federated';
export interface ModuleOwnership { businessOwner: string; capabilityOwner: string; dataOwner: string; publicApiOwner: string; runtimeOwner: string; uiContributionOwner: string; }
export interface ModuleDependency { moduleId: CivitasModuleId; version?: string; optional?: boolean; }
export interface ModuleContributionReference { type: 'api-openapi' | 'ui' | 'screen-action' | 'navigation' | 'permission-catalog' | 'event' | 'mcp' | 'runtime-contract'; version: string; owner: string; artifact: string; status: 'planned' | 'compatible' | 'deprecated'; contractVersion?: string; }
export interface ModuleCompatibilityPolicy { policy: string; compatible: boolean; aliases?: Array<{ from: string; to: CivitasModuleId; status: string; removalRequires: string }>; }
export interface FederatedModuleContractMetadata { runtimeContractVersion: string; audience: string; serviceIdentityRequired: true; uiContractVersion: string; uiEntryRef: string; compatibilityPolicy: string; productSurface: string; }
export interface ModuleManifestV2 { schemaVersion: 'civitas-module-manifest/v2'; id: CivitasModuleId; version: string; kind: ModuleKind; status: ModuleStatus; deploymentMode: ModuleDeploymentMode; businessBoundary: string; ownership: ModuleOwnership; dataOwnership: { owner: string; transactionalSystem: string }; capabilities: string[]; dependencies: ModuleDependency[]; contributions: ModuleContributionReference[]; compatibility: ModuleCompatibilityPolicy; lifecycle: { supportsTenantLifecycle: boolean; storesTenantInstallationState: false }; federated?: FederatedModuleContractMetadata; }
export interface ModuleCatalogV2 { schemaVersion: 'civitas-module-manifest/v2'; catalogVersion: string; modules: ModuleManifestV2[]; }

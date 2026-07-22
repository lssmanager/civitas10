import type { ActionDefinition } from "../contracts/action-definition";
import type { ActionId, ScreenId } from "../contracts/ids";
import type { ScreenDefinition } from "../contracts/screen-definition";
import { authorizationCatalogHash, roleModelVersion, visualRegistryContractVersion } from "./catalogs";
import { validateVisualRegistry } from "./validate-visual-registry";

export type VisualRegistry = { screens: readonly ScreenDefinition[]; actions: readonly ActionDefinition[]; screenById: ReadonlyMap<ScreenId, ScreenDefinition>; actionById: ReadonlyMap<ActionId, ActionDefinition>; catalogHash: string; roleModelVersion: string; contractVersion: string; snapshotProvenance: Readonly<{ catalogHash: string; roleModelVersion: string; source: string }> };

export const compileVisualRegistry = ({ screens, actions }: { screens: readonly ScreenDefinition[]; actions: readonly ActionDefinition[] }): VisualRegistry => {
  const snapshotProvenance = { catalogHash: authorizationCatalogHash, roleModelVersion, source: "frontend/src/authorization/registry" };
  const registry = { screens, actions, screenById: new Map(screens.map((screen) => [screen.screenId, screen])), actionById: new Map(actions.map((action) => [action.actionId, action])), catalogHash: authorizationCatalogHash, roleModelVersion, contractVersion: visualRegistryContractVersion, snapshotProvenance };
  const result = validateVisualRegistry(registry);
  if (!result.valid) throw new Error(`Invalid visual registry:\n${result.errors.join("\n")}`);
  return registry;
};

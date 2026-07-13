import type { ActionDefinition } from "../contracts/action-definition";
import type { ActionId, ScreenId } from "../contracts/ids";
import type { ScreenDefinition } from "../contracts/screen-definition";
import { validateVisualRegistry } from "./validate-visual-registry";

export type VisualRegistry = { screens: readonly ScreenDefinition[]; actions: readonly ActionDefinition[]; screenById: ReadonlyMap<ScreenId, ScreenDefinition>; actionById: ReadonlyMap<ActionId, ActionDefinition> };

export const compileVisualRegistry = ({ screens, actions }: { screens: readonly ScreenDefinition[]; actions: readonly ActionDefinition[] }): VisualRegistry => {
  const registry = { screens, actions, screenById: new Map(screens.map((screen) => [screen.screenId, screen])), actionById: new Map(actions.map((action) => [action.actionId, action])) };
  const result = validateVisualRegistry(registry);
  if (!result.valid) throw new Error(`Invalid visual registry:\n${result.errors.join("\n")}`);
  return registry;
};

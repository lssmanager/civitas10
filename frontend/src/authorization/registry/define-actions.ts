import type { ActionDefinition } from "../contracts/action-definition";
export const defineActions = <T extends readonly ActionDefinition[]>(actions: T): T => actions;

import type { ModuleUiFailureCode } from "./contracts.ts";
export const moduleUiFallbackState = (code:ModuleUiFailureCode, correlationId?:string) => Object.freeze({ role:"alert", tabIndex:-1, titleKey:`module_ui.${code}.title`, descriptionKey:`module_ui.${code}.description`, reasonCode:code, correlationId, safeAction:"return_to_previous_route" });

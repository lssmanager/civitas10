import type { ScreenDefinition } from "../contracts/screen-definition";
export const defineScreen = <T extends ScreenDefinition>(screen: T): T => screen;

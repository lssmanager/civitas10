export type RouteParams = Record<string, string | number>;

export type DefinedRoute<Pattern extends string = string> = {
  readonly pattern: Pattern;
  build: (params?: RouteParams) => string;
};

const paramPattern = /:([A-Za-z][A-Za-z0-9_]*)/g;
const routePlaceholderPattern = /^:[A-Za-z][A-Za-z0-9_]*$/;

export const isConcreteRouteParam = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0 && !routePlaceholderPattern.test(value);

export const defineRoute = <Pattern extends string>(pattern: Pattern): DefinedRoute<Pattern> => {
  return Object.freeze({
    pattern,
    build(values: RouteParams = {}) {
      return pattern.replace(paramPattern, (placeholder, name: string) => {
        const value = values[name];
        if (!isConcreteRouteParam(value === undefined || value === null ? undefined : String(value)) || String(value) === placeholder) {
          throw new Error(`Missing concrete route param ${name} for ${pattern}`);
        }
        return encodeURIComponent(String(value));
      });
    },
  });
};

export const routeRequiresParams = (route: DefinedRoute | string) => /:[A-Za-z][A-Za-z0-9_]*/.test(typeof route === "string" ? route : route.pattern);

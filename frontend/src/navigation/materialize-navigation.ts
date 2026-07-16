import type { NavigationNode } from "./routes";

export const materializeNavigationTree = (items: readonly NavigationNode[], params: Record<string, string | undefined> = {}): NavigationNode[] => items.flatMap((item) => {
  let path = item.path;
  if (item.build) {
    try {
      path = item.build(params as Record<string, string>);
    } catch {
      return [];
    }
  }
  return [{ ...item, path, children: item.children ? materializeNavigationTree(item.children, params) : undefined }];
});

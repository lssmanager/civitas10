const ORGANIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function organizationPath(organizationId: string, relativePath = ""): string {
  const id = String(organizationId || "").trim();
  if (!ORGANIZATION_ID_PATTERN.test(id) || id.includes("/") || id.includes("\\")) {
    throw new Error("organization_id_invalid");
  }
  const relative = String(relativePath || "").trim();
  if (relative.includes("..") || relative.includes("\\")) {
    throw new Error("tenant_relative_path_invalid");
  }
  const normalized = relative.replace(/^\/+/, "").replace(/\/+/g, "/");
  return `/o/${encodeURIComponent(id)}${normalized ? `/${normalized}` : ""}`;
}

export const organizationDocumentsPath = (organizationId: string): string => organizationPath(organizationId, "documents");
export const organizationAuthorizationContextPath = (organizationId: string): string => organizationPath(organizationId, "me/authorization-context");

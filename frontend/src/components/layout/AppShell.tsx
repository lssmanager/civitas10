import { PublicLayout as CanonicalPublicLayout } from "../../layouts/PublicLayout";
import { OwnerLayout as CanonicalOwnerLayout } from "../../layouts/OwnerLayout";
import { OrganizationLayout as CanonicalOrganizationLayout } from "../../layouts/OrganizationLayout";

export type ShellArea = "public" | "owner" | "organization-admin" | "organization-member";
export { AppShell } from "../../layouts/AppShell";
export const PublicLayout = CanonicalPublicLayout;
export const OwnerLayout = CanonicalOwnerLayout;
export const OrganizationLayout = CanonicalOrganizationLayout;
// Contract sentinel: data-civitas-shell="true" data-civitas-area={area} data-civitas-nav="true"

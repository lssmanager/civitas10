import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("./App/index.tsx", import.meta.url), "utf8");
const landing = readFileSync(new URL("./App/Landing.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/layout/AppShell.tsx", import.meta.url), "utf8");
const orgPage = readFileSync(new URL("./OrganizationPage/index.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const packageJson = readFileSync(new URL("../../package.json", import.meta.url), "utf8");

test("public root renders the official Civitas landing through the canonical shell", () => {
  assert.match(app, /if \(!isAuthenticated\) return <Landing \/>/);
  assert.match(landing, /<PublicLayout/);
  assert.match(landing, /Civitas public portal/);
  assert.match(landing, /Owner global/);
  assert.match(landing, /Organization admin/);
  assert.match(landing, /Organization member/);
});

test("demo landing residue is blocked from the root experience", () => {
  for (const source of [app, landing, shell, css]) {
    assert.doesNotMatch(source, /DocuMind/);
    assert.doesNotMatch(source, /Intelligent Document Management Solution/);
    assert.doesNotMatch(source, /AI-Powered Experience for Your Team/);
  }
});

test("canonical shell separates public, owner, organization admin, and organization member areas", () => {
  assert.match(shell, /type ShellArea = "public" \| "owner" \| "organization-admin" \| "organization-member"/);
  assert.match(shell, /data-civitas-shell="true"/);
  assert.match(shell, /data-civitas-area=\{area\}/);
  assert.match(shell, /export const PublicLayout/);
  assert.match(shell, /export const OwnerLayout/);
  assert.match(shell, /export const OrganizationLayout/);
  assert.match(orgPage, /<OrganizationLayout organizationId=\{organizationId\} isAdmin=\{userScopes\.includes\("create:documents"\)\}>/);
});

test("build validation protects the canonical public and authenticated visual base", () => {
  for (const selector of [".civitas-shell", ".civitas-topbar", ".civitas-primary-nav", ".civitas-card", ".civitas-field"]) {
    assert.ok(css.includes(selector), `${selector} missing from CSS`);
  }
  assert.match(packageJson, /validate-civitas-visual\.mjs/);
});

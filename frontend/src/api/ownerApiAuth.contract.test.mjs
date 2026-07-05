import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseSource = readFileSync(new URL("./base.ts", import.meta.url), "utf8");
const ownerSource = readFileSync(new URL("./owner.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");
const envSource = readFileSync(new URL("../env.ts", import.meta.url), "utf8");
const envExample = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");

test("owner API fetch obtains a user access token for the configured API resource", () => {
  assert.match(baseSource, /const API_RESOURCE = APP_ENV\.api\.resource/);
  assert.match(baseSource, /ownerApiFetch/);
  assert.match(baseSource, /getAccessToken\(API_RESOURCE\)/);
  assert.match(baseSource, /assertOwnerUserAccessToken\(token\)/);
  assert.doesNotMatch(ownerSource, /fetchWithToken\("\/owner/);
  assert.match(ownerSource, /ownerApiFetch\("\/owner\/organizations"\)/);
  assert.match(ownerSource, /ownerApiFetch\("\/owner\/system\/worker-queues"\)/);
});

test("owner API client rejects client-credentials-like tokens before calling owner endpoints", () => {
  assert.match(baseSource, /payload\.sub === payload\.client_id/);
  assert.match(baseSource, /OWNER_TOKEN_IS_CLIENT_TOKEN/);
  assert.match(baseSource, /OWNER_TOKEN_AUDIENCE_MISMATCH/);
});

test("owner API errors use actionable user messages and keep technical details out of the DOM path", () => {
  assert.match(baseSource, /Your owner session could not be authorized by the Civitas API/);
  assert.match(baseSource, /owner_global role required/);
  assert.match(baseSource, /console\.error\("Civitas API rejected the access token"/);
});

test("Logto config asks for API audience and role claims", () => {
  assert.match(appSource, /resources: \[ReservedResource\.Organization, APP_ENV\.api\.resource\]/);
  assert.match(appSource, /organization:create/);
  assert.match(appSource, /worker-queues:read/);
  assert.match(appSource, /impersonation:write/);
  assert.match(appSource, /UserScope\.Roles/);
  assert.match(appSource, /UserScope\.OrganizationRoles/);
});

test("frontend API helpers split global owner and organization token flows", () => {
  assert.match(baseSource, /globalApiFetch/);
  assert.match(baseSource, /organizationApiFetch/);
  assert.doesNotMatch(baseSource, /organizationId\?: string/);
  assert.match(baseSource, /getOrganizationToken\(organizationId\)/);
  assert.match(ownerSource, /ownerApiFetch/);
});

test("frontend env documents API URL and optional API resource split", () => {
  assert.match(envSource, /resource: import\.meta\.env\.VITE_API_RESOURCE/);
  assert.match(envExample, /VITE_API_URL=https:\/\/civitas\.didaxus\.com\/api/);
  assert.match(envExample, /VITE_API_RESOURCE=https:\/\/civitas\.didaxus\.com\/api/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseSource = readFileSync(new URL("./base.ts", import.meta.url), "utf8");
const ownerSource = readFileSync(new URL("./owner.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");
const envExample = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");

test("owner API fetch obtains a Logto access token for the configured API resource", () => {
  assert.match(baseSource, /ownerApiFetch/);
  assert.match(baseSource, /getAccessToken\(API_URL\)/);
  assert.doesNotMatch(ownerSource, /fetchWithToken\("\/owner/);
  assert.match(ownerSource, /ownerApiFetch\("\/owner\/organizations"\)/);
  assert.match(ownerSource, /ownerApiFetch\("\/owner\/system\/worker-queues"\)/);
});

test("owner API errors distinguish rejected token from missing owner role", () => {
  assert.match(baseSource, /response\.status === 401\) return "Access token rejected by API"/);
  assert.match(baseSource, /response\.status === 403\) return "Owner role required"/);
});

test("Logto config asks for API audience and role claims", () => {
  assert.match(appSource, /resources: \[ReservedResource\.Organization, APP_ENV\.api\.url\]/);
  assert.match(appSource, /UserScope\.Roles/);
  assert.match(appSource, /UserScope\.OrganizationRoles/);
});

test("frontend env documents the canonical API URL", () => {
  assert.match(envExample, /VITE_API_URL=https:\/\/civitas\.socialstudies\.cloud\/api/);
});

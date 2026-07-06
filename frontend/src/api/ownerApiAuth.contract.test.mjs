import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseSource = readFileSync(new URL("./base.ts", import.meta.url), "utf8");
const ownerSource = readFileSync(new URL("./owner.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../pages/App/index.tsx", import.meta.url), "utf8");
const logtoConfigSource = readFileSync(new URL("../auth/logtoConfig.ts", import.meta.url), "utf8");
const landingSource = readFileSync(new URL("../pages/App/Landing.tsx", import.meta.url), "utf8");
const envSource = readFileSync(new URL("../env.ts", import.meta.url), "utf8");
const configSource = readFileSync(new URL("../../../config/civitas.config.ts", import.meta.url), "utf8");
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

test("owner API client warns during development when the resource token lacks owner shell scopes", () => {
  assert.match(baseSource, /warnIfOwnerTokenLooksInsufficient\(token\)/);
  assert.match(baseSource, /meta\.env\?\.DEV/);
  assert.match(baseSource, /missingOwnerShellScopes/);
  assert.match(baseSource, /Civitas owner API access token is missing expected claims/);
});

test("owner API errors use actionable user messages and keep technical details out of the DOM path", () => {
  assert.match(baseSource, /Your owner session could not be authorized by the Civitas API/);
  assert.match(baseSource, /global role required/);
  assert.match(baseSource, /missing required scopes/);
  assert.match(baseSource, /OWNER_GLOBAL_SCOPES_REQUIRED/);
  assert.match(baseSource, /console\.error\("Civitas API rejected the access token"/);
});

test("Logto config asks for the single API resource and owner shell global scopes", () => {
  assert.match(appSource, /config=\{civitasLogtoConfig\}/);
  assert.match(logtoConfigSource, /resources: \[APP_ENV\.api\.resource\]/);
  assert.match(logtoConfigSource, /scopes: \[\.\.\.LOGTO_OWNER_SHELL_SCOPES\]/);
  assert.match(logtoConfigSource, /LOGTO_OWNER_SHELL_SCOPES/);
  assert.match(logtoConfigSource, /Do not request organization resources/);
  assert.doesNotMatch(logtoConfigSource, /UserScope\.Roles|UserScope\.OrganizationRoles|ReservedResource\.Organization/);
});

test("signIn uses central Civitas options without overriding scopes or resource", () => {
  assert.match(landingSource, /signIn\(getCivitasSignInOptions\(firstScreen\)\)/);
  assert.match(logtoConfigSource, /getCivitasSignInOptions/);
  assert.doesNotMatch(landingSource, /scope:|scopes:|resource:|resources:/);
  assert.doesNotMatch(logtoConfigSource, /scope:|scopes:.*getCivitasSignInOptions|resource:/);
});

test("frontend API helpers split global owner and organization token flows", () => {
  assert.match(baseSource, /globalApiFetch/);
  assert.match(baseSource, /organizationApiFetch/);
  assert.doesNotMatch(baseSource, /organizationId\?: string/);
  assert.match(baseSource, /getOrganizationToken\(organizationId\)/);
  assert.match(ownerSource, /ownerApiFetch/);
});

test("frontend env derives the single Logto API resource from the shared contract", () => {
  assert.match(envSource, /resource: civitasConfig\.logtoResource/);
  assert.match(envExample, /VITE_API_URL=https:\/\/civitas\.didaxus\.com\/api/);
  assert.match(envExample, /VITE_LOGTO_ENDPOINT=https:\/\/auth\.didaxus\.com/);
  assert.doesNotMatch(envExample, new RegExp(`${["VITE", "LOGTO", "API", "RESOURCE"].join("_") }=`));
  assert.match(configSource, /validateDeploymentConfig\(\{ service: "frontend"/);
  assert.match(configSource, /frontendDeploymentConfig\.logtoResource/);
  assert.match(configSource, /return `\$\{window\.location\.origin\}\/callback`/);
  assert.match(configSource, /return window\.location\.origin/);
  assert.doesNotMatch(configSource, /VITE_APP_REDIRECT_URI|VITE_APP_SIGNOUT_REDIRECT_URI/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseSource = readFileSync(new URL("./base.ts", import.meta.url), "utf8");
const meSource = readFileSync(new URL("./me.ts", import.meta.url), "utf8");
const locationsSource = readFileSync(new URL("./locations.ts", import.meta.url), "utf8");

test("API client validates JSON content-type before parsing responses", () => {
  assert.match(baseSource, /headers\.get\("content-type"\)/);
  assert.match(baseSource, /API_NON_JSON_RESPONSE/);
  assert.match(baseSource, /Check VITE_API_URL\/API_URL and proxy routing so \/api\/\* reaches the backend/);
  assert.match(baseSource, /Body preview/);
});

test("standalone API helpers use the shared JSON response guard", () => {
  assert.match(meSource, /readJsonResponse<MeResponse>\(response\)/);
  assert.doesNotMatch(meSource, /return response\.json\(\)/);
  assert.match(locationsSource, /readJsonResponse<T>\(response\)/);
  assert.doesNotMatch(locationsSource, /response\.json\(\)/);
});

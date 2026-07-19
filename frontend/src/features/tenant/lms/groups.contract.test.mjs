import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const moduleSource = readFileSync(new URL("./groups/LmsGroupsModule.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("./groups.api.ts", import.meta.url), "utf8");
const screenSource = readFileSync(new URL("./groups.screen.ts", import.meta.url), "utf8");
const actionSource = readFileSync(new URL("./groups.actions.ts", import.meta.url), "utf8");

test("LMS Groups UI consumes endpoint decisions without local role or JWT authorization", () => {
  assert.match(moduleSource, /Solo ves grupos donde eres líder/);
  assert.match(moduleSource, /Read only/);
  assert.doesNotMatch(moduleSource, /grades\.update|grades\.manage|Edit grades|Create grade/);
  assert.doesNotMatch(moduleSource, /organization_groupleader|role\s*===|jwt|claims/);
  assert.match(apiSource, /\/lms\/groups/);
});

test("LMS Groups screen and actions reference active semantic LMS permissions only", () => {
  assert.match(screenSource, /lms\.groups\.read/);
  assert.match(actionSource, /lms\.group_members\.read/);
  assert.doesNotMatch(screenSource + actionSource, /org\.documents\.read|\|/);
});

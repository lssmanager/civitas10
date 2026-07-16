import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./appErrorPresentation.ts", import.meta.url), "utf8");

test("canonical error adapter normalizes undefined into a full presentation", () => {
  assert.match(source, /toAppErrorPresentation\(error: unknown/);
  assert.match(source, /code: "unknown_error"/);
  assert.match(source, /humanMessage: fallbackMessage/);
  assert.match(source, /retryable: true/);
});

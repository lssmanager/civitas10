import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./SectionNavigation.tsx", import.meta.url), "utf8");

test("section navigation uses route links on desktop and a native selector on mobile", () => {
  assert.match(source, /<nav/);
  assert.match(source, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(source, /<select/);
  assert.match(source, /navigate\(item.href\)/);
  assert.doesNotMatch(source, /role="tab"|overflow-x|Tabs/);
});

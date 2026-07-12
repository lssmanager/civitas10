#!/usr/bin/env node
"use strict";
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
function discoverFiles() {
  try {
    const tracked = execFileSync("git", ["ls-files", "backend/authorization/policies"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    if (tracked.length) return tracked;
  } catch (_error) {}
  const root = "backend/authorization/policies";
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".js")) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}
const files = discoverFiles();
const violations = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  if (/logtoManagement|management-api-client|Management API/i.test(source)) violations.push({ file, pattern: "management-api-runtime-import" });
  if (/req\.body\.polic|req\.query\.polic|registerPolicy\(req\./.test(source)) violations.push({ file, pattern: "request-driven-policy-registration" });
  if (/role\s*===\s*["']organization_/.test(source)) violations.push({ file, pattern: "role-name-hierarchy" });
  if (/org\.impersonate|impersonation:write/.test(source)) violations.push({ file, pattern: "legacy-impersonation-scope" });
}
if (violations.length) { console.error(JSON.stringify({ error: "policy_runtime_contract_violation", violations }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, checkedFiles: files.length }));

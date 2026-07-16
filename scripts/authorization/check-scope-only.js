#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const codeFiles = tracked.filter((file) => /^(backend|auth)\//.test(file) && !/\/test\//.test(file) && !/\/tests\//.test(file));
const violations = [];
for (const file of codeFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/\bROLE_PERMISSIONS\b/.test(source)) violations.push({ file, pattern: "ROLE_PERMISSIONS" });
  if (/owner_global\s*[:=].*\[\s*['"]\*['"]/.test(source)) violations.push({ file, pattern: "owner_global wildcard" });
  if (/roles\s*\.\s*some\(|rolePermissions|perms\.includes\(\s*['"]\*['"]\s*\)/i.test(source) && /requirePermission/.test(file)) violations.push({ file, pattern: "role-derived permission fallback" });
}

if (violations.length) {
  console.error(JSON.stringify({ error: "scope_only_contract_violation", violations }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checkedFiles: codeFiles.length }));

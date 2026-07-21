"use strict";
const { readdirSync, readFileSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");
const roots = ["backend/authorization", "backend/rbac", "core/authz", "frontend/src/authorization"];
const forbidden = /managementLevel|management_level|MANAGEMENT_LEVEL|ManagementLevel/;
const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", "dist", "build"].includes(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(js|cjs|mjs|ts|tsx)$/.test(entry)) {
      const source = readFileSync(path, "utf8");
      if (forbidden.test(source)) violations.push(relative(process.cwd(), path));
    }
  }
}
for (const root of roots) walk(root);
if (violations.length) {
  console.error(`managementLevel must not be read by authorization evaluators:\n${violations.join("\n")}`);
  process.exit(1);
}

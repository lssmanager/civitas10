#!/usr/bin/env node
import fs from 'node:fs';

const source = fs.readFileSync('backend/services/moduleControlPlane.js', 'utf8');
const forbidden = [
  /repository\s*=\s*createInMemoryModuleControlPlaneRepository/,
  /repository\s*\|\|\s*createInMemoryModuleControlPlaneRepository\s*\(/,
  /NODE_ENV[^\n]+createInMemoryModuleControlPlaneRepository\s*\(/,
];
const violations = forbidden.filter((pattern) => pattern.test(source)).map(String);
if (violations.length) {
  console.error('MODULE_CONTROL_PLANE_MEMORY_FALLBACK_FORBIDDEN');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
if (!/createPostgresModuleControlPlaneRepository/.test(source) || !/MODULE_CONTROL_PLANE_REPOSITORY_REQUIRED/.test(source)) {
  console.error('MODULE_CONTROL_PLANE_POSTGRES_WIRING_REQUIRED');
  process.exit(1);
}
console.log('Module control plane production wiring has no in-memory fallback.');

#!/usr/bin/env node
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..', '..');
const frontend = join(root, 'frontend', 'src');
const errors = [];
const walk = (dir, files = []) => { for (const entry of readdirSync(dir)) { const path = join(dir, entry); if (statSync(path).isDirectory()) walk(path, files); else if (/\.(ts|tsx)$/.test(entry)) files.push(path); } return files; };
for (const file of walk(frontend)) {
  const rel = file.slice(root.length + 1);
  const source = readFileSync(file, 'utf8');
  const legacyAllowlist = ['frontend/src/api/owner.ts'];
  if (legacyAllowlist.includes(rel)) continue;
  if (!rel.includes('authz/rbacMatrix.ts') && !rel.includes('authz/ownerScopes.ts') && !rel.includes('authorization/')) {
    if (/requiredGlobalRoles|requiredOrganizationRoles|evaluateCapabilityRule|RBACMatrix/.test(source)) errors.push(`${rel}: legacy RBAC matrix import/check is forbidden outside compatibility files`);
    if (/\brole\s*===|roles\.includes\(/.test(source)) errors.push(`${rel}: role checks must not authorize product UI`);
    if (/owner:read|owner:write|impersonation:write/.test(source)) errors.push(`${rel}: legacy scope string found`);
  }
}
try { statSync(join(frontend, 'authz', 'rbacMatrix.ts')); errors.push('frontend/src/authz/rbacMatrix.ts must not be reintroduced'); } catch {}
const registry = readFileSync(join(frontend, 'authorization', 'registry', 'index.ts'), 'utf8');
if (!/compileVisualRegistry/.test(registry) || registry.split('\n').length > 80) errors.push('registry root must aggregate modular definitions only');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('[visual-contract] static guards passed');

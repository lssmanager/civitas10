#!/usr/bin/env node
import fs from 'node:fs'
const beforePath = process.argv[2]
const afterPath = process.argv[3] || 'artifacts/authorization/role-potential.json'
if (!beforePath || !fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
  console.error('usage: node scripts/authorization/diff-role-model.mjs <before-role-potential.json> [after-role-potential.json]')
  process.exit(1)
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8')).roleModel
const before = read(beforePath); const after = read(afterPath)
const beforeRoles = new Map(before.roles.map((role) => [role.roleKey, new Set(role.potentialPermissionIds)]))
const diff = after.roles.map((role) => {
  const previous = beforeRoles.get(role.roleKey) || new Set()
  const current = new Set(role.potentialPermissionIds)
  return { roleKey: role.roleKey, added: [...current].filter((id)=>!previous.has(id)).sort(), removed: [...previous].filter((id)=>!current.has(id)).sort() }
}).filter((entry) => entry.added.length || entry.removed.length)
console.log(JSON.stringify({ roleModelHashBefore: before.roleModelHash, roleModelHashAfter: after.roleModelHash, affectedRoles: diff }, null, 2))

#!/usr/bin/env node
import fs from 'node:fs'
import { loadCatalog, validateCatalog, catalogHash, canonicalJson } from './permission-catalog-utils.mjs'
const check = process.argv.includes('--check')
const catalog = loadCatalog(); const result = validateCatalog(catalog)
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(1) }
const normalized = { ...catalog, catalogHash: catalogHash(catalog), permissions: [...catalog.permissions].sort((a,b)=>a.name.localeCompare(b.name)) }
const activePermissions = normalized.permissions.filter((p)=>p.targetStatus === 'active' && p.observedImplementation === 'active')
const runtime = `'use strict'\n\nconst catalog = Object.freeze(${JSON.stringify(normalized,null,2)})\nconst permissions = Object.freeze(catalog.permissions.map(Object.freeze))\nconst activePermissions = Object.freeze(${JSON.stringify(activePermissions,null,2)}.map(Object.freeze))\nconst permissionsByName = Object.freeze(Object.fromEntries(permissions.map((permission) => [permission.name, permission])))\nmodule.exports = { catalog, catalogHash: '${normalized.catalogHash}', permissions, activePermissions, permissionsByName }\n`
const inventory = JSON.stringify(normalized,null,2)+'\n'
const committedOutputs = {'core/authz/catalog/generated/permission-catalog.js': runtime}
let drift = false
for (const [path, body] of Object.entries(committedOutputs)) { if (fs.existsSync(path) && fs.readFileSync(path,'utf8') !== body) drift = true; if (!check) fs.writeFileSync(path, body) }
if (!check) fs.writeFileSync('artifacts/authorization/permission-catalog.json', inventory)
if (check && drift) { console.error('generated permission catalog runtime is out of date'); process.exit(1) }
console.log(`${check ? 'checked' : 'generated'} permission catalog ${normalized.catalogHash}`)

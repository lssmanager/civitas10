#!/usr/bin/env node
import { loadCatalog, validateCatalog, catalogHash } from './permission-catalog-utils.mjs'
const catalog = loadCatalog()
const result = validateCatalog(catalog)
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(1) }
console.log(`permission catalog valid: ${catalog.permissions.length} permissions, ${catalog.legacyDecisions.length} legacy decisions, hash ${catalogHash(catalog)}`)

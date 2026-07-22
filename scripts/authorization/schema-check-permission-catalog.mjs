#!/usr/bin/env node
import fs from 'node:fs'
import { CATALOG_PATH, SCHEMA_PATH, loadCatalog } from './permission-catalog-utils.mjs'

function pathOf(path) { return path || '$' }
function validateSchema(schema, value, path = '$', errors = []) {
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/$defs/', '')
    return validateSchema(rootSchema.$defs[ref], value, path, errors)
  }
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type]
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
    if (!allowed.includes(actual)) errors.push(`${pathOf(path)} expected ${allowed.join('|')} but got ${actual}`)
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${pathOf(path)} must be one of ${schema.enum.join(', ')}`)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${path}.${key} is required`)
    const props = schema.properties || {}
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in props)) errors.push(`${path}.${key} is not allowed by schema`)
    for (const [key, child] of Object.entries(props)) if (key in value) validateSchema(child, value[key], `${path}.${key}`, errors)
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, index) => validateSchema(schema.items, item, `${path}[${index}]`, errors))
  return errors
}

if (!fs.existsSync(CATALOG_PATH)) { console.error(`${CATALOG_PATH} is missing`); process.exit(1) }
if (!fs.existsSync(SCHEMA_PATH)) { console.error(`${SCHEMA_PATH} is missing`); process.exit(1) }
const rootSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
const catalog = loadCatalog()
const errors = validateSchema(rootSchema, catalog)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`permission catalog schema valid: ${CATALOG_PATH} against ${SCHEMA_PATH}`)

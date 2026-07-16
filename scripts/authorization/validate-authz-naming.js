#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')
const { scanRepository } = require('./scan-authorization-names')
const mode = process.argv.includes('--report') ? 'report' : 'check'
const report = scanRepository()
if (mode === 'report') {
  fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true })
  fs.writeFileSync(path.join(process.cwd(), 'artifacts/authorization-naming-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Authorization naming report: ${report.records.length} records, ${report.summary.violations.length} violations`)
  console.log(JSON.stringify(report.summary.counts))
  process.exit(0)
}
if (report.summary.allowlistErrors.length || report.summary.violations.length) {
  console.error(JSON.stringify({ allowlistErrors: report.summary.allowlistErrors, violations: report.summary.violations.slice(0, 50) }, null, 2))
  process.exit(1)
}
console.log(`Authorization naming check passed: ${report.records.length} records scanned`)

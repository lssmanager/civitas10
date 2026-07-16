#!/usr/bin/env node
'use strict'
const { main } = require('./cli')
main(['contract-check']).catch((error)=>{ console.error(error.message); process.exit(1) })

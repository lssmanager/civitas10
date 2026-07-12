'use strict'
const { scanFile } = require('./scan-authorization-names')
function validateDocumentationFile(file, options = {}) {
  if (options.archived || /(^|\/)archive(d)?\//.test(file)) return []
  return scanFile(file, options.root || process.cwd()).filter((record) => record.category === 'violation')
}
module.exports = { validateDocumentationFile }

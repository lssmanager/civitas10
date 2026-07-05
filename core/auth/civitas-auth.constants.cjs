"use strict";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const source = readFileSync(join(__dirname, "civitas-auth.constants.ts"), "utf8");

function readConstant(name) {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*["']([^"']+)["']`));
  if (!match) {
    throw new Error(`Missing Civitas auth constant: ${name}`);
  }
  return match[1];
}

module.exports = Object.freeze({
  CIVITAS_LOGTO_API_RESOURCE: readConstant("CIVITAS_LOGTO_API_RESOURCE"),
  CIVITAS_LOGTO_ISSUER: readConstant("CIVITAS_LOGTO_ISSUER"),
  CIVITAS_API_URL: readConstant("CIVITAS_API_URL"),
});

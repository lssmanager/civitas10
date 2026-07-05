"use strict";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function loadCivitasAuthContract() {
  const contractPath = join(__dirname, "..", "..", "dist", "auth.contract.json");
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  const resource = contract?.logto?.apiResource;
  if (!resource || /^https?:\/\//i.test(resource)) {
    throw new Error("Invalid compiled Civitas auth contract: logto.apiResource must be a logical resource");
  }
  return Object.freeze(contract);
}

module.exports = { loadCivitasAuthContract };

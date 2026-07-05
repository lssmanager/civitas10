"use strict";

const { CivitasSharedContract, deepClone } = require("./civitas-shared.contract.cjs");

function assertSharedContract(contract) {
  const resource = contract?.logto?.apiResource;
  const publicUrl = contract?.api?.publicUrl;
  const issuer = contract?.logto?.issuer;
  if (!resource || /^https?:\/\//i.test(resource)) throw new Error("Invalid Civitas shared contract: logto.apiResource must be a logical resource");
  if (!issuer || !/^https?:\/\//i.test(issuer)) throw new Error("Invalid Civitas shared contract: logto.issuer must be an HTTP base URL");
  if (!publicUrl || !/^https?:\/\//i.test(publicUrl)) throw new Error("Invalid Civitas shared contract: api.publicUrl must be an HTTP URL");
  if (resource === publicUrl) throw new Error("Invalid Civitas shared contract: logical resource must not equal public API URL");
  if (!contract?.auth?.global?.ownerRole) throw new Error("Invalid Civitas shared contract: missing global owner role");
  return contract;
}

function loadCivitasSharedContract() {
  return Object.freeze(assertSharedContract(deepClone(CivitasSharedContract)));
}

function loadCivitasAuthContract() {
  const contract = loadCivitasSharedContract();
  return Object.freeze({ logto: contract.logto, api: contract.api, auth: contract.auth });
}

module.exports = { loadCivitasSharedContract, loadCivitasAuthContract, assertSharedContract };

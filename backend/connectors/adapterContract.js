"use strict";

const contracts = require("../../contracts");
const { codes, connectorError } = require("./errors");

function assertAdapterContract(adapter) {
  try {
    return contracts.assertAdapterContract(adapter);
  } catch (error) {
    throw connectorError(codes.CONFIG_INVALID, error.message, error.details || {});
  }
}

module.exports = { ...contracts, assertAdapterContract };

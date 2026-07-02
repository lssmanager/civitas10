"use strict";

const { VALID_CAPABILITIES } = require("./adapters/contracts");

const CAPABILITIES = VALID_CAPABILITIES;
function isSupportedCapability(capability) { return CAPABILITIES.includes(capability); }
module.exports = { CAPABILITIES, VALID_CAPABILITIES, isSupportedCapability };

"use strict";
function createUnavailableDataScopeProvider() { return { async evaluate() { return { status: "unavailable" }; } }; }
module.exports = { createUnavailableDataScopeProvider };

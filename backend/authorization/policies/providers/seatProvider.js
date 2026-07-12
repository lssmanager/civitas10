"use strict";
function createSeatProvider({ available = true } = {}) { return { async evaluateAvailability() { return { status: available ? "available" : "unavailable" }; } }; }
module.exports = { createSeatProvider };

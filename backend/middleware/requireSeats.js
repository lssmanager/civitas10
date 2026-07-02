"use strict";

function readNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function requireSeats(req, res, next) {
  if (!req.org) return res.status(400).json({ error: "OrganizationContextRequired", message: "requireOrg must run before requireSeats." });
  const seatsTotal = readNumber(req.org.seats_total ?? req.org.seatsTotal ?? req.org.seats?.total);
  const seatsUsed = readNumber(req.org.seats_used ?? req.org.seatsUsed ?? req.org.seats?.used);
  if (seatsTotal === null || seatsUsed === null) return res.status(400).json({ error: "InvalidOrganizationSeats", message: "Organization seat context requires seats_total and seats_used." });
  const available = Math.max(seatsTotal - seatsUsed, 0);
  if (available <= 0) return res.status(422).json({ error: "NoSeatsAvailable", message: "No seats are available for this organization.", available, action: "increase_seat_limit_or_release_existing_seat" });
  req.seats = { seats_total: seatsTotal, seats_used: seatsUsed, available };
  return next();
}
module.exports = { requireSeats };

// backend/middleware/requireSeats.js
// Lee req.org — garantizado por requireOrg que debe ir antes

'use strict'

async function requireSeats(req, res, next) {
  if (!req.org) {
    return res.status(500).json({
      error: 'Error de configuración de middleware',
      detail: 'requireOrg debe ejecutarse antes que requireSeats',
    })
  }

  if (req.org.seats_available <= 0) {
    return res.status(422).json({
      error: 'Sin sillas disponibles',
      seats_total: req.org.seats_total,
      seats_used: req.org.seats_used,
      seats_available: 0,
      action: 'Adquirir más sillas o liberar sillas sin uso',
    })
  }

  return next()
}

module.exports = { requireSeats }

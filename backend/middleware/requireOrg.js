// backend/middleware/requireOrg.js
// ÚNICA pieza autorizada para poblar req.org
// Siempre va después de requireAuth, siempre antes de requireSeats

'use strict'

const { queryPostgres } = require('../lib/db')

async function requireOrg(req, res, next) {
  const org_id = req.params?.org_id
               ?? req.params?.id
               ?? req.params?.organizationId
               ?? req.body?.org_id

  if (!org_id) {
    return res.status(400).json({
      error: 'org_id requerido',
      detail: 'Proveer org_id en los parámetros de ruta o en el body'
    })
  }

  let org
  try {
    const result = await queryPostgres(
      `SELECT id,
              logto_organization_id,
              operational_status AS status,
              metadata->>'plan' AS plan,
              COALESCE((metadata->>'seats_total')::int, 0) AS seats_total,
              COALESCE((metadata->>'seats_used')::int, 0) AS seats_used
       FROM operational_tenants
       WHERE id = $1 OR logto_organization_id = $1
       LIMIT 1`,
      [org_id]
    )
    org = result.rows[0]
  } catch (_err) {
    return res.status(500).json({ error: 'Error al verificar organización' })
  }

  if (!org) {
    return res.status(404).json({ error: 'Organización no encontrada' })
  }

  if (org.status === 'suspended') {
    return res.status(403).json({
      error: 'Organización suspendida',
      action: 'Contactar al owner para reactivar'
    })
  }

  if (org.status === 'cancelled') {
    return res.status(403).json({
      error: 'Organización cancelada',
      action: 'Contactar soporte'
    })
  }

  const seatsTotal = org.seats_total ?? 0
  const seatsUsed = org.seats_used ?? 0
  req.org = {
    id: org.id,
    logto_organization_id: org.logto_organization_id,
    status: org.status,
    plan: org.plan,
    seats_total: seatsTotal,
    seats_used: seatsUsed,
    seats_available: seatsTotal - seatsUsed,
  }

  return next()
}

module.exports = { requireOrg }

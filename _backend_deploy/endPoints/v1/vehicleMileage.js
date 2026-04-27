/**
 * vehicleMileage.js — Suivi kilométrique des véhicules
 *
 * Routes:
 *   GET   /v1/vehicles/:vehicleId/mileage   → odomètre actuel + historique + alertes service
 *   POST  /v1/vehicles/:vehicleId/mileage   → log un relevé, met à jour current_odometer_km
 *   PATCH /v1/vehicles/:vehicleId           → met à jour les colonnes de service (next_service_km, etc.)
 *
 * Tables: vehicles (colonnes km), vehicle_mileage_logs (migration 042)
 * Note: km_driven est une colonne GENERATED ALWAYS — ne jamais l'insérer directement.
 */

const { connect } = require('../../swiftDb');

/* ─── GET /v1/vehicles/:vehicleId/mileage ────────────────────────────────── */
const getMileage = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const vehicleId = parseInt(req.params.vehicleId, 10);
  if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicleId' });

  const connection = await connect();
  try {
    // Récupérer infos véhicule + colonnes service (company-scoped)
    const [vehicleRows] = await connection.execute(
      `SELECT id, current_odometer_km, last_service_km, next_service_km,
              next_service_date, service_interval_km
       FROM vehicles
       WHERE id = ? AND company_id = ?`,
      [vehicleId, companyId]
    );
    if (!vehicleRows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const vehicle = vehicleRows[0];

    // Historique des 50 derniers logs
    const [logs] = await connection.execute(
      `SELECT vml.id, vml.odometer_before, vml.odometer_after, vml.km_driven,
              vml.note, vml.logged_at, vml.job_id,
              u.first_name, u.last_name
       FROM vehicle_mileage_logs vml
       JOIN users u ON u.id = vml.logged_by
       WHERE vml.vehicle_id = ? AND vml.company_id = ?
       ORDER BY vml.logged_at DESC
       LIMIT 50`,
      [vehicleId, companyId]
    );

    // Calculer alertes service
    const alerts = [];
    const current = parseFloat(vehicle.current_odometer_km) || 0;
    if (vehicle.next_service_km !== null) {
      const remaining = parseFloat(vehicle.next_service_km) - current;
      if (remaining <= 500) {
        alerts.push({ type: 'km_service', message: `Service due in ${remaining.toFixed(0)} km` });
      }
    }
    if (vehicle.next_service_date) {
      const daysUntil = Math.ceil((new Date(vehicle.next_service_date) - new Date()) / 86400000);
      if (daysUntil <= 30) {
        alerts.push({ type: 'date_service', message: `Service due in ${daysUntil} day(s)` });
      }
    }

    return res.status(200).json({
      success: true,
      data: { vehicle, logs, alerts }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/vehicles/:vehicleId/mileage ───────────────────────────────── */
const logMileage = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const vehicleId = parseInt(req.params.vehicleId, 10);
  if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicleId' });

  const { odometer_after, job_id, note } = req.body;
  const odometerAfter = parseFloat(odometer_after);
  if (isNaN(odometerAfter) || odometerAfter < 0) {
    return res.status(400).json({ success: false, message: 'odometer_after must be a positive number' });
  }

  const resolvedJobId = job_id ? parseInt(job_id, 10) : null;
  if (job_id && isNaN(resolvedJobId)) {
    return res.status(400).json({ success: false, message: 'Invalid job_id' });
  }

  const connection = await connect();
  try {
    // Récupérer odomètre actuel (= odometer_before du nouveau log)
    const [vehicleRows] = await connection.execute(
      'SELECT id, current_odometer_km FROM vehicles WHERE id = ? AND company_id = ?',
      [vehicleId, companyId]
    );
    if (!vehicleRows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const odometerBefore = parseFloat(vehicleRows[0].current_odometer_km) || 0;
    if (odometerAfter < odometerBefore) {
      return res.status(400).json({
        success: false,
        message: `odometer_after (${odometerAfter}) must be >= current odometer (${odometerBefore})`
      });
    }

    // Insérer le log (km_driven est GENERATED ALWAYS — non inséré)
    const [result] = await connection.execute(
      `INSERT INTO vehicle_mileage_logs
         (vehicle_id, company_id, job_id, logged_by, odometer_before, odometer_after, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, companyId, resolvedJobId, userId, odometerBefore, odometerAfter, note || null]
    );

    // Mettre à jour l'odomètre courant du véhicule
    await connection.execute(
      'UPDATE vehicles SET current_odometer_km = ? WHERE id = ? AND company_id = ?',
      [odometerAfter, vehicleId, companyId]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        odometer_before: odometerBefore,
        odometer_after: odometerAfter,
        km_driven: parseFloat((odometerAfter - odometerBefore).toFixed(2))
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/vehicles/:vehicleId ─────────────────────────────────────── */
// Mise à jour des colonnes de service uniquement
const updateServiceInfo = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const vehicleId = parseInt(req.params.vehicleId, 10);
  if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicleId' });

  const { next_service_km, next_service_date, service_interval_km, last_service_km } = req.body;

  const updates = [];
  const params = [];

  if (next_service_km !== undefined) {
    const v = next_service_km === null ? null : parseFloat(next_service_km);
    if (v !== null && isNaN(v)) return res.status(400).json({ success: false, message: 'Invalid next_service_km' });
    updates.push('next_service_km = ?'); params.push(v);
  }
  if (next_service_date !== undefined) {
    if (next_service_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(next_service_date)) {
      return res.status(400).json({ success: false, message: 'next_service_date must be YYYY-MM-DD or null' });
    }
    updates.push('next_service_date = ?'); params.push(next_service_date || null);
  }
  if (service_interval_km !== undefined) {
    const v = parseFloat(service_interval_km);
    if (isNaN(v) || v <= 0) return res.status(400).json({ success: false, message: 'service_interval_km must be positive' });
    updates.push('service_interval_km = ?'); params.push(v);
  }
  if (last_service_km !== undefined) {
    const v = last_service_km === null ? null : parseFloat(last_service_km);
    if (v !== null && isNaN(v)) return res.status(400).json({ success: false, message: 'Invalid last_service_km' });
    updates.push('last_service_km = ?'); params.push(v);
  }

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

  const connection = await connect();
  try {
    params.push(vehicleId, companyId);
    const [result] = await connection.execute(
      `UPDATE vehicles SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    return res.status(200).json({ success: true, message: 'Service info updated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { getMileage, logMileage, updateServiceInfo };

/**
 * vehicleMaintenance.js — Alertes de maintenance des véhicules
 *
 * Routes:
 *   GET    /v1/vehicles/maintenance-alerts?status=          → toutes les alertes de la company
 *   GET    /v1/vehicles/:vehicleId/maintenance-alerts       → alertes d'un véhicule
 *   POST   /v1/vehicles/:vehicleId/maintenance-alerts       → créer une alerte
 *   PATCH  /v1/vehicles/maintenance-alerts/:alertId         → mettre à jour (ex: marquer 'done')
 *   DELETE /v1/vehicles/maintenance-alerts/:alertId         → supprimer une alerte
 *
 * Table: vehicle_maintenance_alerts (migration 043)
 * Note: quand status → 'done', resolved_by et resolved_at sont mis à jour.
 */

const { connect } = require('../../swiftDb');

const VALID_STATUSES = ['pending', 'done', 'overdue', 'snoozed'];
const VALID_ALERT_TYPES = ['oil_change', 'tyre', 'brake', 'registration', 'inspection', 'other'];

/* ─── GET /v1/vehicles/maintenance-alerts?status= ────────────────────────── */
const listAllAlerts = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { status } = req.query;
  const statusFilter = status && VALID_STATUSES.includes(status) ? status : null;

  const connection = await connect();
  try {
    const query = `
      SELECT vma.id, vma.vehicle_id, vma.alert_type, vma.title,
             vma.due_date, vma.due_km, vma.status, vma.notes,
             vma.created_at, vma.resolved_at,
             v.plate_number
      FROM vehicle_maintenance_alerts vma
      JOIN vehicles v ON v.id = vma.vehicle_id
      WHERE vma.company_id = ?
        ${statusFilter ? 'AND vma.status = ?' : ''}
      ORDER BY vma.due_date ASC, vma.created_at DESC`;

    const params = statusFilter ? [companyId, statusFilter] : [companyId];
    const [rows] = await connection.execute(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/vehicles/:vehicleId/maintenance-alerts ─────────────────────── */
const listVehicleAlerts = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const vehicleId = parseInt(req.params.vehicleId, 10);
  if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicleId' });

  const connection = await connect();
  try {
    // Vérifier ownership du véhicule
    const [vehicleCheck] = await connection.execute(
      'SELECT id FROM vehicles WHERE id = ? AND company_id = ?',
      [vehicleId, companyId]
    );
    if (!vehicleCheck.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const [rows] = await connection.execute(
      `SELECT id, alert_type, title, due_date, due_km, status, notes, created_at, resolved_at
       FROM vehicle_maintenance_alerts
       WHERE vehicle_id = ? AND company_id = ?
       ORDER BY FIELD(status,'pending','overdue','snoozed','done'), due_date ASC`,
      [vehicleId, companyId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/vehicles/:vehicleId/maintenance-alerts ────────────────────── */
const createAlert = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const vehicleId = parseInt(req.params.vehicleId, 10);
  if (isNaN(vehicleId)) return res.status(400).json({ success: false, message: 'Invalid vehicleId' });

  const { alert_type, title, due_date, due_km, notes } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  const resolvedType = VALID_ALERT_TYPES.includes(alert_type) ? alert_type : 'other';

  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
    return res.status(400).json({ success: false, message: 'due_date must be YYYY-MM-DD' });
  }
  const resolvedDueKm = due_km !== undefined && due_km !== null ? parseFloat(due_km) : null;
  if (resolvedDueKm !== null && isNaN(resolvedDueKm)) {
    return res.status(400).json({ success: false, message: 'Invalid due_km' });
  }

  const connection = await connect();
  try {
    const [vehicleCheck] = await connection.execute(
      'SELECT id FROM vehicles WHERE id = ? AND company_id = ?',
      [vehicleId, companyId]
    );
    if (!vehicleCheck.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const [result] = await connection.execute(
      `INSERT INTO vehicle_maintenance_alerts
         (vehicle_id, company_id, alert_type, title, due_date, due_km, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, companyId, resolvedType, title.trim(), due_date || null, resolvedDueKm, notes || null, userId]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/vehicles/maintenance-alerts/:alertId ─────────────────────── */
const updateAlert = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const alertId = parseInt(req.params.alertId, 10);
  if (isNaN(alertId)) return res.status(400).json({ success: false, message: 'Invalid alertId' });

  const { status, notes } = req.body;
  const updates = [];
  const params = [];

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    updates.push('status = ?');
    params.push(status);
    // Résolution automatique si marqué 'done'
    if (status === 'done') {
      updates.push('resolved_by = ?', 'resolved_at = NOW()');
      params.push(userId);
    }
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes || null);
  }
  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

  const connection = await connect();
  try {
    params.push(alertId, companyId);
    const [result] = await connection.execute(
      `UPDATE vehicle_maintenance_alerts SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
    return res.status(200).json({ success: true, message: 'Alert updated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/vehicles/maintenance-alerts/:alertId ────────────────────── */
const deleteAlert = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const alertId = parseInt(req.params.alertId, 10);
  if (isNaN(alertId)) return res.status(400).json({ success: false, message: 'Invalid alertId' });

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'DELETE FROM vehicle_maintenance_alerts WHERE id = ? AND company_id = ?',
      [alertId, companyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
    return res.status(200).json({ success: true, message: 'Alert deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listAllAlerts, listVehicleAlerts, createAlert, updateAlert, deleteAlert };

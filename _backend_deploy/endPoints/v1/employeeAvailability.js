/**
 * employeeAvailability.js — Disponibilités hebdomadaires + exceptions ponctuelles
 *
 * Routes:
 *   GET    /v1/employees/:userId/availability                     → dispos hebdo + exceptions
 *   PUT    /v1/employees/:userId/availability                     → remplace tout le planning (upsert global)
 *   POST   /v1/employees/:userId/availability/exceptions          → ajoute une exception ponctuelle
 *   DELETE /v1/employees/:userId/availability/exceptions/:id      → supprime une exception
 *
 * Tables: employee_availability, employee_availability_exceptions (migration 039)
 * Scoping: company_id vérifié sur chaque requête pour éviter toute fuite inter-company.
 */

const { connect } = require('../../swiftDb');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
/** Vérifie que :userId appartient à la même company que le requérant. */
const verifyEmployeeBelongsToCompany = async (connection, targetUserId, companyId) => {
  const [rows] = await connection.execute(
    'SELECT id FROM users WHERE id = ? AND company_id = ?',
    [targetUserId, companyId]
  );
  return rows.length > 0;
};

/* ─── GET /v1/employees/:userId/availability ──────────────────────────────── */
const getAvailability = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!requesterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const connection = await connect();
  try {
    if (!(await verifyEmployeeBelongsToCompany(connection, targetUserId, companyId))) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const [availabilities] = await connection.execute(
      `SELECT id, day_of_week, start_time, end_time, is_available, note
       FROM employee_availability
       WHERE user_id = ? AND company_id = ?
       ORDER BY day_of_week, start_time`,
      [targetUserId, companyId]
    );

    const [exceptions] = await connection.execute(
      `SELECT id, exception_date, is_available, reason, created_at
       FROM employee_availability_exceptions
       WHERE user_id = ? AND company_id = ?
       ORDER BY exception_date`,
      [targetUserId, companyId]
    );

    return res.status(200).json({ success: true, data: { availabilities, exceptions } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PUT /v1/employees/:userId/availability ─────────────────────────────── */
// Upsert global: supprime toutes les dispos récurrentes et réinsère
const replaceAvailability = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!requesterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const { availabilities } = req.body;
  if (!Array.isArray(availabilities)) {
    return res.status(400).json({ success: false, message: 'availabilities must be an array' });
  }

  // Valider chaque entrée
  for (const item of availabilities) {
    const dow = parseInt(item.day_of_week, 10);
    if (isNaN(dow) || dow < 0 || dow > 6) {
      return res.status(400).json({ success: false, message: 'day_of_week must be 0-6' });
    }
    if (!item.start_time || !item.end_time) {
      return res.status(400).json({ success: false, message: 'start_time and end_time are required' });
    }
  }

  const connection = await connect();
  try {
    if (!(await verifyEmployeeBelongsToCompany(connection, targetUserId, companyId))) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // DELETE all then re-INSERT
    await connection.execute(
      'DELETE FROM employee_availability WHERE user_id = ? AND company_id = ?',
      [targetUserId, companyId]
    );

    if (availabilities.length > 0) {
      const values = availabilities.map(a => [
        targetUserId,
        companyId,
        parseInt(a.day_of_week, 10),
        a.start_time,
        a.end_time,
        a.is_available !== undefined ? (a.is_available ? 1 : 0) : 1,
        a.note || null
      ]);
      for (const v of values) {
        await connection.execute(
          `INSERT INTO employee_availability
             (user_id, company_id, day_of_week, start_time, end_time, is_available, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          v
        );
      }
    }

    return res.status(200).json({ success: true, message: 'Availability updated', count: availabilities.length });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/employees/:userId/availability/exceptions ─────────────────── */
const addException = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!requesterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const { exception_date, is_available, reason } = req.body;
  if (!exception_date || !/^\d{4}-\d{2}-\d{2}$/.test(exception_date)) {
    return res.status(400).json({ success: false, message: 'exception_date must be YYYY-MM-DD' });
  }

  const connection = await connect();
  try {
    if (!(await verifyEmployeeBelongsToCompany(connection, targetUserId, companyId))) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // UPSERT sur la contrainte UNIQUE (user_id, exception_date)
    const [result] = await connection.execute(
      `INSERT INTO employee_availability_exceptions
         (user_id, company_id, exception_date, is_available, reason)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), reason = VALUES(reason)`,
      [targetUserId, companyId, exception_date, is_available ? 1 : 0, reason || null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId || null } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/employees/:userId/availability/exceptions/:id ───────────── */
const deleteException = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!requesterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  const exceptionId = parseInt(req.params.id, 10);
  if (isNaN(targetUserId) || isNaN(exceptionId)) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'DELETE FROM employee_availability_exceptions WHERE id = ? AND user_id = ? AND company_id = ?',
      [exceptionId, targetUserId, companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exception not found' });
    }
    return res.status(200).json({ success: true, message: 'Exception deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { getAvailability, replaceAvailability, addException, deleteException };

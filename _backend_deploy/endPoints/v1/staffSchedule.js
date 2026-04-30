/**
 * staffSchedule.js — Vue planning hebdomadaire par employé
 *
 * Routes:
 *   GET /v1/staff/:userId/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Retourne les jobs assignés à un employé sur une période donnée,
 * groupés par date pour une vue agenda/planning.
 *
 * Tables: job_assignments, jobs, clients
 * Sécurité: company_id vérifié, l'employé ciblé doit appartenir à la même company.
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

/** Formate une date JS en YYYY-MM-DD */
const toYMD = (d) => d.toISOString().slice(0, 10);

/* ─── GET /v1/staff/:userId/schedule ─────────────────────────────────────── */
const getStaffSchedule = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!requesterId || !companyId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ success: false, message: 'Invalid userId' });
  }

  // Bornes de période — défaut : semaine courante (lundi–dimanche)
  let fromDate, toDate;
  try {
    if (req.query.from && req.query.to) {
      fromDate = new Date(req.query.from);
      toDate = new Date(req.query.to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw new Error('invalid');
    } else {
      const now = new Date();
      const day = now.getDay(); // 0=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      fromDate = monday;
      toDate = sunday;
    }
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  // Limite de 31 jours max pour éviter les abus
  const diffDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
  if (diffDays > 31) {
    return res.status(400).json({ success: false, message: 'Date range cannot exceed 31 days.' });
  }

  const connection = await connect();
  try {
    if (!(await verifyEmployeeBelongsToCompany(connection, targetUserId, companyId))) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Récupérer le nom de l'employé
    const [userRows] = await connection.execute(
      'SELECT id, first_name, last_name FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    const employee = userRows[0] || null;

    // Récupérer les jobs assignés à l'employé sur la période
    const [rows] = await connection.execute(
      `SELECT
         j.id,
         j.code,
         j.title,
         j.status,
         j.start_time,
         j.end_time,
         j.estimated_duration,
         j.address AS pickup_address,
         j.delivery_address,
         j.date AS job_date,
         ja.role AS assignment_role,
         ja.status AS assignment_status,
         COALESCE(CONCAT(c.first_name, ' ', c.last_name), j.client_name, 'Unknown client') AS client_name
       FROM job_assignments ja
       INNER JOIN jobs j ON j.id = ja.job_id
       LEFT JOIN clients c ON c.id = j.client_id AND c.company_id = j.company_id
       WHERE ja.user_id = ?
         AND ja.company_id = ?
         AND j.company_id = ?
         AND (
           (j.date >= ? AND j.date <= ?)
           OR (j.start_time >= ? AND j.start_time <= ?)
         )
       ORDER BY COALESCE(j.start_time, j.date), j.id`,
      [
        targetUserId,
        companyId,
        companyId,
        toYMD(fromDate), toYMD(toDate),
        toYMD(fromDate) + ' 00:00:00', toYMD(toDate) + ' 23:59:59',
      ]
    );

    // Grouper par date (YYYY-MM-DD)
    const byDate = {};
    for (const row of rows) {
      // Déterminer la date du job
      let dateKey = null;
      if (row.start_time) {
        dateKey = String(row.start_time).slice(0, 10);
      } else if (row.job_date) {
        dateKey = String(row.job_date).slice(0, 10);
      }
      if (!dateKey) continue;

      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push({
        id: row.id,
        code: row.code,
        title: row.title || `Job #${row.code}`,
        status: row.status,
        startTime: row.start_time ? String(row.start_time) : null,
        endTime: row.end_time ? String(row.end_time) : null,
        estimatedDuration: row.estimated_duration,
        pickupAddress: row.pickup_address,
        deliveryAddress: row.delivery_address,
        clientName: row.client_name,
        assignmentRole: row.assignment_role,
        assignmentStatus: row.assignment_status,
      });
    }

    // Construire la liste de jours dans la période
    const days = [];
    const cursor = new Date(fromDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = toYMD(cursor);
      days.push({ date: key, jobs: byDate[key] || [] });
      cursor.setDate(cursor.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      data: {
        employee: employee
          ? { id: employee.id, firstName: employee.first_name, lastName: employee.last_name }
          : null,
        from: toYMD(fromDate),
        to: toYMD(toDate),
        days,
        totalJobs: rows.length,
      },
    });
  } catch (err) {
    console.error('[staffSchedule] error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.end();
  }
};

module.exports = { getStaffSchedule };

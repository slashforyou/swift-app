/**
 * employeeHourQuotas.js — Quotas horaires hebdomadaires et suivi des heures
 *
 * Routes:
 *   GET   /v1/employees/weekly-hours?week_start=YYYY-MM-DD  → heures semaine de tous les employés + quota + flag
 *   PATCH /v1/employees/:userId/hour-quota                  → met à jour le quota (patron only)
 *   GET   /v1/employees/:userId/weekly-hours                → historique 12 semaines pour un employé
 *
 * Tables: users.max_hours_per_week, employee_weekly_hours (migration 041)
 * Sécurité: PATCH quota = patron only (company_role = 'patron')
 */

const { connect } = require('../../swiftDb');

/* ─── GET /v1/employees/weekly-hours?week_start=YYYY-MM-DD ──────────────── */
const getCompanyWeeklyHours = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { week_start } = req.query;
  if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
    return res.status(400).json({ success: false, message: 'week_start must be YYYY-MM-DD' });
  }

  const connection = await connect();
  try {
    // Retourner tous les employés de la company + leurs heures pour la semaine donnée + quota
    const [rows] = await connection.execute(
      `SELECT
         u.id AS user_id,
         u.first_name,
         u.last_name,
         u.max_hours_per_week,
         COALESCE(ewh.total_hours, 0) AS total_hours,
         COALESCE(ewh.job_count, 0)   AS job_count,
         CASE
           WHEN u.max_hours_per_week IS NOT NULL
                AND COALESCE(ewh.total_hours, 0) > u.max_hours_per_week
           THEN 1 ELSE 0
         END AS over_quota
       FROM users u
       LEFT JOIN employee_weekly_hours ewh
              ON ewh.user_id = u.id AND ewh.week_start = ?
       WHERE u.company_id = ?
       ORDER BY u.first_name, u.last_name`,
      [week_start, companyId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/employees/:userId/hour-quota ─────────────────────────────── */
const updateHourQuota = async (req, res) => {
  const requesterId = req.user?.id;
  const companyId = req.user?.company_id;
  const requesterRole = req.user?.company_role;
  if (!requesterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Patron only
  if (requesterRole !== 'patron') {
    return res.status(403).json({ success: false, message: 'Only patrons can update hour quotas' });
  }

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const max = req.body.max_hours_per_week;
  // NULL = no limit, otherwise must be a positive number
  const maxHours = max === null || max === undefined ? null : parseFloat(max);
  if (maxHours !== null && (isNaN(maxHours) || maxHours < 0 || maxHours > 168)) {
    return res.status(400).json({ success: false, message: 'max_hours_per_week must be between 0 and 168, or null' });
  }

  const connection = await connect();
  try {
    // Vérifier que la cible appartient à la même company
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    await connection.execute(
      'UPDATE users SET max_hours_per_week = ? WHERE id = ? AND company_id = ?',
      [maxHours, targetUserId, companyId]
    );
    return res.status(200).json({ success: true, data: { max_hours_per_week: maxHours } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/employees/:userId/weekly-hours ─────────────────────────────── */
const getEmployeeWeeklyHoursHistory = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const connection = await connect();
  try {
    // Vérifier que l'employé appartient à la company
    const [userCheck] = await connection.execute(
      'SELECT id, max_hours_per_week FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Historique des 12 dernières semaines
    const [rows] = await connection.execute(
      `SELECT week_start, total_hours, job_count
       FROM employee_weekly_hours
       WHERE user_id = ? AND company_id = ?
       ORDER BY week_start DESC
       LIMIT 12`,
      [targetUserId, companyId]
    );
    return res.status(200).json({
      success: true,
      data: {
        max_hours_per_week: userCheck[0].max_hours_per_week,
        history: rows
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { getCompanyWeeklyHours, updateHourQuota, getEmployeeWeeklyHoursHistory };

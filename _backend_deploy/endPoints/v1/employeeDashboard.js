const pool = require('../../swiftDb');

/**
 * GET /v1/employee/dashboard
 * Returns personal stats, job history and weekly hours for the authenticated employee.
 * Requires authenticateToken middleware (req.user populated).
 *
 * Query params:
 *   - page (int, default 1): for job history pagination (10 per page)
 *   - start (YYYY-MM-DD): start date for hours breakdown
 *   - end   (YYYY-MM-DD): end date for hours breakdown
 */
const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    // Default date range: last 7 days
    const endDate = req.query.end || new Date().toISOString().slice(0, 10);
    const startDate = req.query.start || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return d.toISOString().slice(0, 10);
    })();

    // ── STATS ─────────────────────────────────────────────────────────────────
    // Count jobs assigned to this user
    const [statsResult] = await pool.execute(
      `SELECT
         COUNT(*) AS total_jobs,
         SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
         COALESCE(SUM(
           CASE WHEN j.status = 'completed'
                THEN TIMESTAMPDIFF(MINUTE, j.start_time, j.end_time) / 60.0
                ELSE 0 END
         ), 0) AS total_hours
       FROM jobs j
       WHERE j.assigned_staff_id = ?`,
      [userId]
    );

    // XP total from gamification_events
    const [xpResult] = await pool.execute(
      `SELECT COALESCE(SUM(xp_earned), 0) AS total_xp
       FROM xp_transactions
       WHERE user_id = ?`,
      [userId]
    );

    const stats = {
      totalJobs: statsResult[0].total_jobs || 0,
      completedJobs: statsResult[0].completed_jobs || 0,
      totalHours: parseFloat((statsResult[0].total_hours || 0).toFixed(1)),
      totalXp: xpResult[0].total_xp || 0,
    };

    // ── JOB HISTORY (paginated) ───────────────────────────────────────────────
    const [jobsResult] = await pool.execute(
      `SELECT
         j.id,
         j.code,
         j.title,
         j.status,
         j.start_time,
         j.end_time,
         j.address,
         CONCAT(c.first_name, ' ', c.last_name) AS client_name,
         CASE
           WHEN j.end_time IS NOT NULL AND j.start_time IS NOT NULL
           THEN ROUND(TIMESTAMPDIFF(MINUTE, j.start_time, j.end_time) / 60.0, 1)
           ELSE NULL
         END AS duration_hours
       FROM jobs j
       LEFT JOIN clients c ON j.client_id = c.id
       WHERE j.assigned_staff_id = ?
       ORDER BY j.start_time DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM jobs WHERE assigned_staff_id = ?`,
      [userId]
    );

    // ── HOURS PER DAY (date range) ────────────────────────────────────────────
    const [hoursResult] = await pool.execute(
      `SELECT
         DATE(j.start_time) AS work_date,
         ROUND(SUM(TIMESTAMPDIFF(MINUTE, j.start_time, j.end_time)) / 60.0, 1) AS hours
       FROM jobs j
       WHERE j.assigned_staff_id = ?
         AND j.status = 'completed'
         AND j.start_time IS NOT NULL
         AND j.end_time IS NOT NULL
         AND DATE(j.start_time) BETWEEN ? AND ?
       GROUP BY DATE(j.start_time)
       ORDER BY work_date ASC`,
      [userId, startDate, endDate]
    );

    return res.json({
      success: true,
      data: {
        stats,
        jobHistory: {
          entries: jobsResult,
          total: countResult[0].total || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0].total || 0) / limit),
        },
        hours: {
          startDate,
          endDate,
          entries: hoursResult,
        },
      },
    });
  } catch (err) {
    console.error('[employeeDashboard] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getEmployeeDashboard };

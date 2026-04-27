/**
 * revenueDashboard.js — Dashboard revenus agrégé
 *
 * Route:
 *   GET /v1/dashboard/revenue?period=week|month|year&date=YYYY-MM-DD
 *
 * Retourne:
 *   - total_revenue, job_count, avg_job_value, completed_jobs, pending_payments
 *   - by_period: [{label, revenue, job_count}]
 *   - top_clients: [{client_name, total}]
 *   - growth_vs_previous: {revenue_pct, job_count_pct}
 *
 * Sources: jobs (total_price, status, completed_at), clients (first_name, last_name)
 */

const { connect } = require('../../swiftDb');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Calcule les bornes de période (start, end) et la période précédente.
 * date: anchor date (ISO string)
 */
const getPeriodBounds = (period, date) => {
  const anchor = date ? new Date(date) : new Date();
  anchor.setHours(0, 0, 0, 0);
  let start, end, prevStart, prevEnd;

  if (period === 'week') {
    // Lundi de la semaine
    const day = anchor.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    start = new Date(anchor);
    start.setDate(anchor.getDate() + diffToMon);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 7);
    prevEnd = new Date(end);
    prevEnd.setDate(end.getDate() - 7);
  } else if (period === 'year') {
    const y = anchor.getFullYear();
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
    prevStart = new Date(y - 1, 0, 1);
    prevEnd = new Date(y - 1, 11, 31);
  } else {
    // month (default)
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0); // last day of month
    prevStart = new Date(y, m - 1, 1);
    prevEnd = new Date(y, m, 0);
  }

  const fmt = d => d.toISOString().slice(0, 10);
  return {
    start: fmt(start),
    end: fmt(end),
    prevStart: fmt(prevStart),
    prevEnd: fmt(prevEnd)
  };
};

/** Génère les labels by_period selon la période. */
const getPeriodGroupQuery = (period) => {
  if (period === 'week') {
    // Grouper par jour de la semaine (0=Dim … 6=Sam → renommé en labels)
    return {
      groupExpr: `DATE_FORMAT(j.completed_at, '%Y-%m-%d')`,
      labelExpr: `DAYNAME(j.completed_at)`,
    };
  } else if (period === 'year') {
    return {
      groupExpr: `DATE_FORMAT(j.completed_at, '%Y-%m')`,
      labelExpr: `DATE_FORMAT(j.completed_at, '%b')`,
    };
  } else {
    // month → par semaine du mois
    return {
      groupExpr: `WEEK(j.completed_at, 3)`,
      labelExpr: `CONCAT('W', WEEK(j.completed_at, 3) - WEEK(DATE_FORMAT(j.completed_at,'%Y-%m-01'), 3) + 1)`,
    };
  }
};

/* ─── GET /v1/dashboard/revenue ──────────────────────────────────────────── */
const getRevenue = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const period = ['week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';
  const { start, end, prevStart, prevEnd } = getPeriodBounds(period, req.query.date);

  const connection = await connect();
  try {
    // ── Stats globales période courante ──────────────────────────────────────
    const [statsRows] = await connection.execute(
      `SELECT
         COALESCE(SUM(total_price), 0)                                           AS total_revenue,
         COUNT(*)                                                                 AS job_count,
         COALESCE(AVG(total_price), 0)                                           AS avg_job_value,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)                  AS completed_jobs,
         SUM(CASE WHEN status IN ('pending','in_progress') THEN total_price ELSE 0 END) AS pending_payments
       FROM jobs j
       WHERE j.company_id = ?
         AND DATE(COALESCE(j.completed_at, j.created_at)) BETWEEN ? AND ?`,
      [companyId, start, end]
    );
    const stats = statsRows[0];

    // ── Stats période précédente (pour growth) ───────────────────────────────
    const [prevRows] = await connection.execute(
      `SELECT
         COALESCE(SUM(total_price), 0) AS total_revenue,
         COUNT(*)                       AS job_count
       FROM jobs j
       WHERE j.company_id = ?
         AND DATE(COALESCE(j.completed_at, j.created_at)) BETWEEN ? AND ?`,
      [companyId, prevStart, prevEnd]
    );
    const prev = prevRows[0];

    const growthRevenue = prev.total_revenue > 0
      ? parseFloat((((stats.total_revenue - prev.total_revenue) / prev.total_revenue) * 100).toFixed(1))
      : null;
    const growthJobs = prev.job_count > 0
      ? parseFloat((((stats.job_count - prev.job_count) / prev.job_count) * 100).toFixed(1))
      : null;

    // ── By-period breakdown ──────────────────────────────────────────────────
    const { groupExpr, labelExpr } = getPeriodGroupQuery(period);
    const [byPeriodRows] = await connection.execute(
      `SELECT
         ${labelExpr} AS label,
         COALESCE(SUM(total_price), 0) AS revenue,
         COUNT(*) AS job_count
       FROM jobs j
       WHERE j.company_id = ?
         AND DATE(COALESCE(j.completed_at, j.created_at)) BETWEEN ? AND ?
       GROUP BY ${groupExpr}
       ORDER BY ${groupExpr}`,
      [companyId, start, end]
    );

    // ── Top clients ──────────────────────────────────────────────────────────
    const [topClients] = await connection.execute(
      `SELECT
         CONCAT(c.first_name, ' ', c.last_name) AS client_name,
         COALESCE(SUM(j.total_price), 0)         AS total
       FROM jobs j
       JOIN clients c ON c.id = j.client_id
       WHERE j.company_id = ?
         AND DATE(COALESCE(j.completed_at, j.created_at)) BETWEEN ? AND ?
       GROUP BY j.client_id, c.first_name, c.last_name
       ORDER BY total DESC
       LIMIT 5`,
      [companyId, start, end]
    );

    return res.status(200).json({
      success: true,
      data: {
        period,
        range: { start, end },
        total_revenue: parseFloat(stats.total_revenue) || 0,
        job_count: stats.job_count || 0,
        avg_job_value: parseFloat(parseFloat(stats.avg_job_value || 0).toFixed(2)),
        completed_jobs: stats.completed_jobs || 0,
        pending_payments: parseFloat(stats.pending_payments) || 0,
        by_period: byPeriodRows,
        top_clients: topClients,
        growth_vs_previous: {
          revenue_pct: growthRevenue,
          job_count_pct: growthJobs
        }
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { getRevenue };

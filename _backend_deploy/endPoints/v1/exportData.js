/**
 * exportData.js — Export CSV des données métier
 *
 * Routes:
 *   GET /v1/export/jobs?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD   → export jobs en CSV
 *   GET /v1/export/revenue?format=csv&year=YYYY                     → export CA mensuel en CSV
 *
 * CSV construit manuellement (pas de dépendance externe).
 * Sécurité: company_id scopé sur chaque requête — jamais de données cross-company.
 */

const { connect } = require('../../swiftDb');

/* ─── Helper: échapper une valeur CSV ────────────────────────────────────── */
const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Entourer de guillemets si la valeur contient virgule, guillemets ou retour à la ligne
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsvRow = (values) => values.map(csvEscape).join(',');

/* ─── GET /v1/export/jobs ────────────────────────────────────────────────── */
const exportJobs = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { from, to } = req.query;
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return res.status(400).json({ success: false, message: 'from must be YYYY-MM-DD' });
  }
  if (!to || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ success: false, message: 'to must be YYYY-MM-DD' });
  }

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      `SELECT
         j.id,
         j.code,
         j.title,
         j.status,
         j.difficulty,
         j.trucks_count,
         j.total_price,
         j.created_at,
         j.completed_at,
         CONCAT(c.first_name, ' ', c.last_name) AS client_name,
         c.email                                 AS client_email
       FROM jobs j
       LEFT JOIN clients c ON c.id = j.client_id
       WHERE j.company_id = ?
         AND DATE(j.created_at) BETWEEN ? AND ?
       ORDER BY j.created_at ASC
       LIMIT 10000`,
      [companyId, from, to]
    );

    const headers = ['Job ID', 'Code', 'Title', 'Status', 'Difficulty', 'Trucks', 'Total Price', 'Created At', 'Completed At', 'Client Name', 'Client Email'];
    const lines = [buildCsvRow(headers)];

    for (const r of rows) {
      lines.push(buildCsvRow([
        r.id,
        r.code,
        r.title,
        r.status,
        r.difficulty || '',
        r.trucks_count,
        r.total_price !== null ? parseFloat(r.total_price).toFixed(2) : '',
        r.created_at ? String(r.created_at).slice(0, 19) : '',
        r.completed_at ? String(r.completed_at).slice(0, 19) : '',
        r.client_name,
        r.client_email
      ]));
    }

    const filename = `jobs-export-${from}-${to}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(lines.join('\n'));
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/export/revenue ─────────────────────────────────────────────── */
const exportRevenue = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const year = parseInt(req.query.year, 10);
  if (isNaN(year) || year < 2020 || year > 2100) {
    return res.status(400).json({ success: false, message: 'year must be a valid 4-digit year' });
  }

  const connection = await connect();
  try {
    // CA mensuel agrégé depuis les jobs (total_price par mois)
    const [rows] = await connection.execute(
      `SELECT
         DATE_FORMAT(COALESCE(j.completed_at, j.created_at), '%Y-%m') AS month,
         COUNT(*)                                                       AS job_count,
         COALESCE(SUM(j.total_price), 0)                               AS revenue,
         SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END)      AS completed_jobs
       FROM jobs j
       WHERE j.company_id = ?
         AND YEAR(COALESCE(j.completed_at, j.created_at)) = ?
       GROUP BY month
       ORDER BY month ASC`,
      [companyId, year]
    );

    const headers = ['Month', 'Job Count', 'Revenue (AUD)', 'Completed Jobs'];
    const lines = [buildCsvRow(headers)];

    for (const r of rows) {
      lines.push(buildCsvRow([
        r.month,
        r.job_count,
        parseFloat(r.revenue).toFixed(2),
        r.completed_jobs
      ]));
    }

    const filename = `revenue-${year}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(lines.join('\n'));
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { exportJobs, exportRevenue };

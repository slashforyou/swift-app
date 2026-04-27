/**
 * employeeRatings.js — Notation interne des employés
 *
 * Routes:
 *   GET /v1/employees/:userId/ratings        → liste des notations reçues (company-scoped)
 *   POST /v1/employees/:userId/ratings       → noter un employé (patron/manager only)
 *   GET /v1/employees/ratings/summary        → résumé avg par employé pour toute la company
 *
 * Table: employee_ratings (migration 046)
 * Sécurité: POST = company_role !== 'employee' uniquement (patron ou manager)
 *           La cible ET l'auteur doivent appartenir à la même company.
 */

const { connect } = require('../../swiftDb');

/* ─── GET /v1/employees/:userId/ratings ──────────────────────────────────── */
const listRatings = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const connection = await connect();
  try {
    // Vérifier que la cible appartient à la company
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [rows] = await connection.execute(
      `SELECT er.id, er.rating, er.comment, er.job_id, er.created_at,
              u.first_name AS rater_first_name, u.last_name AS rater_last_name
       FROM employee_ratings er
       JOIN users u ON u.id = er.rated_by
       WHERE er.rated_user_id = ? AND er.company_id = ?
       ORDER BY er.created_at DESC`,
      [targetUserId, companyId]
    );

    // Statistiques sommaires
    const [statsRows] = await connection.execute(
      `SELECT COUNT(*) AS total, ROUND(AVG(rating), 2) AS avg_rating
       FROM employee_ratings
       WHERE rated_user_id = ? AND company_id = ?`,
      [targetUserId, companyId]
    );

    return res.status(200).json({
      success: true,
      data: {
        ratings: rows,
        stats: statsRows[0]
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/employees/:userId/ratings ─────────────────────────────────── */
const createRating = async (req, res) => {
  const raterId = req.user?.id;
  const companyId = req.user?.company_id;
  const raterRole = req.user?.company_role;
  if (!raterId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Patron ou manager uniquement
  if (raterRole === 'employee') {
    return res.status(403).json({ success: false, message: 'Only patrons and managers can rate employees' });
  }

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  // Interdire de se noter soi-même
  if (targetUserId === raterId) {
    return res.status(400).json({ success: false, message: 'Cannot rate yourself' });
  }

  const { rating, comment, job_id } = req.body;
  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
  }

  const resolvedJobId = job_id ? parseInt(job_id, 10) : null;
  if (job_id && isNaN(resolvedJobId)) {
    return res.status(400).json({ success: false, message: 'Invalid job_id' });
  }

  const connection = await connect();
  try {
    // Vérifier que la cible appartient à la même company
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Si job_id fourni, vérifier qu'il appartient à la company
    if (resolvedJobId) {
      const [jobCheck] = await connection.execute(
        'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
        [resolvedJobId, companyId]
      );
      if (!jobCheck.length) return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const [result] = await connection.execute(
      `INSERT INTO employee_ratings (rated_user_id, rated_by, company_id, job_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [targetUserId, raterId, companyId, resolvedJobId, ratingVal, comment || null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/employees/ratings/summary ──────────────────────────────────── */
const getRatingsSummary = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      `SELECT
         u.id AS user_id,
         u.first_name,
         u.last_name,
         COUNT(er.id)               AS total_ratings,
         ROUND(AVG(er.rating), 2)   AS avg_rating
       FROM users u
       LEFT JOIN employee_ratings er ON er.rated_user_id = u.id AND er.company_id = ?
       WHERE u.company_id = ?
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY avg_rating DESC`,
      [companyId, companyId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listRatings, createRating, getRatingsSummary };

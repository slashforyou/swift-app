/**
 * jobDifficulty.js — Difficulté et nombre de camions sur un job
 *
 * Routes:
 *   PATCH /v1/jobs/:jobId/difficulty    → met à jour le niveau de difficulté
 *   PATCH /v1/jobs/:jobId/trucks-count  → met à jour le nombre de camions requis
 *
 * Colonnes: jobs.difficulty, jobs.trucks_count (migration 036)
 */

const { connect } = require('../../swiftDb');

/* ─── PATCH /v1/jobs/:jobId/difficulty ────────────────────────────────────── */
const updateDifficulty = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
  const { difficulty } = req.body;
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ success: false, message: 'difficulty must be easy, medium, hard, or expert' });
  }

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'UPDATE jobs SET difficulty = ? WHERE id = ? AND company_id = ?',
      [difficulty, jobId, companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.status(200).json({ success: true, data: { difficulty } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/jobs/:jobId/trucks-count ──────────────────────────────────── */
const updateTrucksCount = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const trucks_count = parseInt(req.body.trucks_count, 10);
  if (isNaN(trucks_count) || trucks_count < 1 || trucks_count > 10) {
    return res.status(400).json({ success: false, message: 'trucks_count must be between 1 and 10' });
  }

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'UPDATE jobs SET trucks_count = ? WHERE id = ? AND company_id = ?',
      [trucks_count, jobId, companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.status(200).json({ success: true, data: { trucks_count } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { updateDifficulty, updateTrucksCount };

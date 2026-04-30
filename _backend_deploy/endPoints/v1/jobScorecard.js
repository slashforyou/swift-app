/**
 * jobScorecard.js — Endpoints scorecard
 * GET /swift-app/v1/jobs/:id/scorecard
 */

const { connect } = require('../../swiftDb');
const { getUserByToken } = require('../database/user');
const consoleStyle = require('../../utils/consoleStyle');

const getJobScorecardEndpoint = async (req, res) => {
  const { id: jobIdOrCode } = req.params;

  if (!jobIdOrCode) {
    return res.status(400).json({ success: false, message: 'Job ID required' });
  }

  let connection;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authorization token' });
    }

    connection = await connect();

    // Résoudre ID numérique
    let jobQuery, jobParams;
    if (/^\d+$/.test(jobIdOrCode)) {
      jobQuery  = 'SELECT id, contractor_company_id, contractee_company_id, status FROM jobs WHERE id = ?';
      jobParams = [parseInt(jobIdOrCode)];
    } else {
      jobQuery  = 'SELECT id, contractor_company_id, contractee_company_id, status FROM jobs WHERE code = ?';
      jobParams = [jobIdOrCode];
    }

    const [jobRows] = await connection.execute(jobQuery, jobParams);
    if (!jobRows.length) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const job   = jobRows[0];
    const jobId = job.id;

    // Guard cross-company
    if (user.company_id) {
      const allowed = user.company_id === job.contractee_company_id ||
                      user.company_id === job.contractor_company_id;
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Récupérer scorecard
    const [scorecardRows] = await connection.execute(
      'SELECT * FROM job_scorecards WHERE job_id = ?',
      [jobId]
    );

    if (!scorecardRows.length) {
      return res.status(404).json({ success: false, message: 'Scorecard not generated yet' });
    }

    const scorecard = scorecardRows[0];

    // Récupérer les résultats des checkpoints
    const [cpResults] = await connection.execute(
      `SELECT r.passed, r.value_text, r.checked_at,
              c.code, c.label_fr, c.label_en, c.category, c.weight
         FROM job_checkpoint_results r
         JOIN job_checkpoints c ON r.checkpoint_id = c.id
        WHERE r.job_id = ?
        ORDER BY c.category, c.weight DESC`,
      [jobId]
    );

    // Vérifier s'il y a un avis client soumis
    const [reviewRows] = await connection.execute(
      'SELECT rating_overall, rating_service, rating_team, comment, submitted_at FROM job_reviews WHERE job_id = ? AND submitted_at IS NOT NULL',
      [jobId]
    );

    connection.release();

    return res.status(200).json({
      success: true,
      scorecard: {
        job_id:      jobId,
        total_score: scorecard.total_score,
        max_score:   scorecard.max_score,
        percentage:  scorecard.percentage,
        generated_at: scorecard.generated_at,
        checkpoints: cpResults.map(r => ({
          code:       r.code,
          label_fr:   r.label_fr,
          label_en:   r.label_en,
          category:   r.category,
          weight:     r.weight,
          passed:     r.passed === 1,
          value_text: r.value_text,
          checked_at: r.checked_at,
        })),
      },
      client_review: reviewRows.length ? {
        rating_overall: reviewRows[0].rating_overall,
        rating_service: reviewRows[0].rating_service,
        rating_team:    reviewRows[0].rating_team,
        comment:        reviewRows[0].comment,
        submitted_at:   reviewRows[0].submitted_at,
      } : null,
    });

  } catch (err) {
    if (connection) connection.release();
    consoleStyle.error('ERROR', 'getJobScorecard failed', { error: err.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getJobScorecardEndpoint };

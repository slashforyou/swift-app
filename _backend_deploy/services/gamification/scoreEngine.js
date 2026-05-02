/**
 * Score Engine
 * Génère les scorecards de jobs et distribue les XP/trophées associés
 */
const { connect } = require('../../swiftDb');
const rewardWriter = require('./rewardWriter');

/**
 * Génère ou régénère la scorecard d'un job
 * Appeler après job.completed
 */
async function generateScorecard(jobId, participants = []) {
  let connection;
  try {
    connection = await connect();

    // Charger les infos du job
    const [[job]] = await connection.execute(
      `SELECT id, company_id, assigned_user_id, started_at, finished_at,
              estimated_start_time, estimated_duration_minutes
       FROM jobs WHERE id = ?`,
      [jobId]
    );
    if (!job) return null;

    // Compter les photos
    const [[photoRow]] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM job_photos WHERE job_id = ?`, [jobId]
    );
    const photosCount = photoRow ? photoRow.cnt : 0;

    // Compter les incidents
    const [[incidentRow]] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM job_incidents WHERE job_id = ? AND resolved = 0`,
      [jobId]
    ).catch(() => [[{ cnt: 0 }]]);
    const incidentsCount = incidentRow ? incidentRow.cnt : 0;

    // Récupérer les checkpoints universels
    const [checkpoints] = await connection.execute(
      `SELECT id, code, weight, xp_reward, trophy_reward, required FROM job_checkpoints
       WHERE job_type = '*' AND is_active = 1`
    );

    // Récupérer les résultats existants pour ce job
    const [results] = await connection.execute(
      `SELECT checkpoint_id, passed, score FROM job_checkpoint_results WHERE job_id = ?`,
      [jobId]
    );
    const resultMap = {};
    results.forEach(r => { resultMap[r.checkpoint_id] = r; });

    // Calculer app_score
    let totalWeight = 0;
    let weightedScore = 0;
    let checkpointsCompleted = 0;

    for (const cp of checkpoints) {
      totalWeight += cp.weight;
      const result = resultMap[cp.id];
      if (result && result.passed) {
        const score = result.score != null ? result.score : 100;
        weightedScore += (score / 100) * cp.weight;
        checkpointsCompleted++;
      }
    }

    // Bonus photo (si photos présentes, considérer photo_before / photo_after comme passés)
    const appScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

    // Variance de temps
    let timeVarianceMinutes = null;
    if (job.started_at && job.finished_at) {
      const actualDurationMinutes = Math.round(
        (new Date(job.finished_at) - new Date(job.started_at)) / 60000
      );
      if (job.estimated_duration_minutes) {
        timeVarianceMinutes = actualDurationMinutes - job.estimated_duration_minutes;
      }
    }

    // Upsert scorecard
    await connection.execute(
      `INSERT INTO job_scorecards
         (job_id, app_score_total, checkpoints_completed, checkpoints_total, incidents_count, photos_count, time_variance_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         app_score_total = VALUES(app_score_total),
         checkpoints_completed = VALUES(checkpoints_completed),
         checkpoints_total = VALUES(checkpoints_total),
         incidents_count = VALUES(incidents_count),
         photos_count = VALUES(photos_count),
         time_variance_minutes = VALUES(time_variance_minutes),
         generated_at = NOW()`,
      [jobId, appScore, checkpointsCompleted, checkpoints.length, incidentsCount, photosCount, timeVarianceMinutes]
    );

    // Distribuer les XP et trophées aux participants
    const xpBase = Math.round(appScore * 0.5) + 25; // Base 25 + bonus score
    const trophyBase = Math.max(0, Math.round(appScore / 20)); // 0–5 trophées selon score

    const targetEntities = _buildTargetEntities(job, participants);
    let totalXpDistributed = 0;
    let totalTrophiesDistributed = 0;

    for (const entity of targetEntities) {
      const weekKey = _getCurrentWeekKey();
      const xpResult = await rewardWriter.awardXP(
        entity.type, entity.id, 'job_score', `job_${jobId}_score`,
        xpBase, { job_id: jobId, app_score: appScore }
      );
      const trophyResult = await rewardWriter.awardTrophies(
        entity.type, entity.id, 'job_score', `job_${jobId}_score_trophy`,
        trophyBase, weekKey, { job_id: jobId }
      );
      if (xpResult) totalXpDistributed += xpBase;
      if (trophyResult) totalTrophiesDistributed += trophyBase;
    }

    // Mettre à jour le compteur distribué dans la scorecard
    await connection.execute(
      `UPDATE job_scorecards SET xp_distributed = ?, trophies_distributed = ? WHERE job_id = ?`,
      [totalXpDistributed, totalTrophiesDistributed, jobId]
    );

    return { appScore, xpBase, trophyBase, checkpointsCompleted, totalCheckpoints: checkpoints.length };
  } catch (err) {
    console.error('[ScoreEngine] generateScorecard error:', err.message);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Intègre une review client dans la scorecard du job
 */
async function integrateClientReview(reviewId) {
  let connection;
  try {
    connection = await connect();

    const [[review]] = await connection.execute(
      `SELECT job_id, rating_overall FROM client_reviews WHERE id = ?`,
      [reviewId]
    );
    if (!review) return null;

    const clientScore = Math.round((review.rating_overall / 5) * 100);

    await connection.execute(
      `UPDATE job_scorecards
       SET client_score_total = ?,
           final_score = ROUND((COALESCE(app_score_total, 50) + ?) / 2, 2)
       WHERE job_id = ?`,
      [clientScore, clientScore, review.job_id]
    );

    // XP bonus pour bonne review
    if (review.rating_overall >= 4) {
      const xpBonus = review.rating_overall === 5 ? 50 : 25;
      const [[job]] = await connection.execute(
        `SELECT company_id, assigned_user_id FROM jobs WHERE id = ?`,
        [review.job_id]
      );
      if (job) {
        await rewardWriter.awardXP('company', job.company_id, 'client_review', `review_${reviewId}`, xpBonus, { rating: review.rating_overall });
        if (job.assigned_user_id) {
          await rewardWriter.awardXP('user', job.assigned_user_id, 'client_review', `review_${reviewId}_user`, xpBonus, { rating: review.rating_overall });
        }
      }
    }

    return { clientScore };
  } catch (err) {
    console.error('[ScoreEngine] integrateClientReview error:', err.message);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

// ─── HELPERS ────────────────────────────────────────────────

function _buildTargetEntities(job, participants) {
  const entities = [];
  if (job.company_id) entities.push({ type: 'company', id: job.company_id });
  if (job.assigned_user_id) entities.push({ type: 'user', id: job.assigned_user_id });
  for (const p of participants) {
    if (p.user_id && !entities.find(e => e.type === 'user' && e.id === p.user_id)) {
      entities.push({ type: 'user', id: p.user_id });
    }
  }
  return entities;
}

function _getCurrentWeekKey() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

module.exports = { generateScorecard, integrateClientReview };

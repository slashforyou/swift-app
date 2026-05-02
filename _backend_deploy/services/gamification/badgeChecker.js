/**
 * Badge Checker
 * Vérifie et débloque les badges après chaque événement métier
 */
const { connect } = require('../../swiftDb');
const rewardWriter = require('./rewardWriter');

/**
 * Vérifie tous les badges pour une entité après un événement
 */
async function checkBadges(event) {
  let connection;
  try {
    connection = await connect();

    const entityType = event.entity_type || (event.user_id ? 'user' : 'company');
    const entityId = event.entity_id || event.user_id || event.company_id;
    if (!entityType || !entityId) return;

    // Charger les badges non encore débloqués
    const [badges] = await connection.execute(
      `SELECT b.code AS badge_code, b.requirement_type AS unlock_rule_type, b.requirement_value AS unlock_rule_payload, b.category
       FROM gamification_badge_definitions b
       WHERE b.is_active = 1
         AND b.code NOT IN (
           SELECT badge_code FROM gamification_badge_unlocks
           WHERE entity_type = ? AND entity_id = ?
         )`,
      [entityType, entityId]
    );

    for (const badge of badges) {
      const ruleType = badge.unlock_rule_type;
      const thresholdValue = typeof badge.unlock_rule_payload === 'number' ? badge.unlock_rule_payload : null;
      // Map requirement_type to internal rule type
      const mappedRule = _mapRequirementType(ruleType, badge.category);
      const payload = { threshold: thresholdValue, condition: null };

      let shouldUnlock = false;

      switch (mappedRule) {
        case 'job_count':
          shouldUnlock = await _checkJobCount(connection, entityType, entityId, payload, event);
          break;
        case 'streak_days':
          shouldUnlock = await _checkStreakDays(connection, entityId, payload);
          break;
        case 'no_incident_streak':
          shouldUnlock = await _checkNoIncidentStreak(connection, entityType, entityId, payload);
          break;
        case 'photo_count':
          shouldUnlock = await _checkPhotoCount(connection, entityId, payload);
          break;
        case 'review_count':
          shouldUnlock = await _checkReviewCount(connection, entityType, entityId, payload);
          break;
        case 'rating_avg':
          shouldUnlock = await _checkRatingAvg(connection, entityType, entityId, payload);
          break;
        case 'onboarding_complete':
          shouldUnlock = event.type === 'onboarding.completed' &&
            (event.user_id === entityId || event.entity_id === entityId);
          break;
        case 'manual':
          // Débloqué uniquement manuellement par admin
          break;
        default:
          break;
      }

      if (shouldUnlock) {
        const sourceJobId = event.job_id || null;
        await rewardWriter.unlockBadge(entityType, entityId, badge.badge_code, sourceJobId);
        console.log(`[BadgeChecker] Badge unlocked: ${badge.badge_code} for ${entityType}#${entityId}`);
      }
    }
  } catch (err) {
    console.error('[BadgeChecker] checkBadges error:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

// ─── RÈGLES INDIVIDUELLES ────────────────────────────────────

async function _checkJobCount(connection, entityType, entityId, payload, event) {
  if (event.type !== 'job.completed') return false;
  const condition = payload.condition;

  let query;
  const params = [];

  if (condition === 'early') {
    query = `SELECT COUNT(*) as cnt FROM job_scorecards s
             JOIN jobs j ON j.id = s.job_id
             WHERE j.${entityType === 'company' ? 'company_id' : 'assigned_user_id'} = ?
             AND s.time_variance_minutes < 0`;
    params.push(entityId);
  } else {
    query = `SELECT COUNT(*) as cnt FROM jobs
             WHERE ${entityType === 'company' ? 'company_id' : 'assigned_user_id'} = ?
             AND status = 'completed'`;
    params.push(entityId);
  }

  const [[row]] = await connection.execute(query, params);
  return row && row.cnt >= payload.threshold;
}

async function _checkStreakDays(connection, entityId, payload) {
  const [[profile]] = await connection.execute(
    `SELECT current_streak_days FROM gamification_profiles WHERE entity_type = 'user' AND entity_id = ?`,
    [entityId]
  );
  return profile && profile.current_streak_days >= payload.threshold;
}

async function _checkNoIncidentStreak(connection, entityType, entityId, payload) {
  // Derniers N jobs sans incidents
  const field = entityType === 'company' ? 'company_id' : 'assigned_user_id';
  const [recentJobs] = await connection.execute(
    `SELECT j.id FROM jobs j
     LEFT JOIN job_scorecards s ON s.job_id = j.id
     WHERE j.${field} = ? AND j.status = 'completed'
     ORDER BY j.finished_at DESC LIMIT ?`,
    [entityId, payload.threshold]
  );
  if (recentJobs.length < payload.threshold) return false;
  for (const job of recentJobs) {
    const [[row]] = await connection.execute(
      `SELECT incidents_count FROM job_scorecards WHERE job_id = ?`,
      [job.id]
    );
    if (!row || row.incidents_count > 0) return false;
  }
  return true;
}

async function _checkPhotoCount(connection, entityId, payload) {
  const [[row]] = await connection.execute(
    `SELECT COUNT(*) as cnt FROM job_photos jp
     JOIN jobs j ON j.id = jp.job_id
     WHERE j.assigned_user_id = ?`,
    [entityId]
  );
  return row && row.cnt >= payload.threshold;
}

async function _checkReviewCount(connection, entityType, entityId, payload) {
  const field = entityType === 'company' ? 'company_id' : 'assigned_user_id';
  const minRating = payload.min_rating || 1;
  const [[row]] = await connection.execute(
    `SELECT COUNT(*) as cnt FROM client_reviews cr
     JOIN jobs j ON j.id = cr.job_id
     WHERE j.${field} = ? AND cr.rating_overall >= ?`,
    [entityId, minRating]
  );
  return row && row.cnt >= payload.threshold;
}

async function _checkRatingAvg(connection, entityType, entityId, payload) {
  const field = entityType === 'company' ? 'company_id' : 'assigned_user_id';
  // Vérifier la moyenne sur les N derniers jobs
  const [recentRatings] = await connection.execute(
    `SELECT cr.rating_overall FROM client_reviews cr
     JOIN jobs j ON j.id = cr.job_id
     WHERE j.${field} = ?
     ORDER BY cr.created_at DESC LIMIT ?`,
    [entityId, payload.min_jobs || 20]
  );
  if (recentRatings.length < (payload.min_jobs || 20)) return false;
  const avg = recentRatings.reduce((s, r) => s + r.rating_overall, 0) / recentRatings.length;
  return avg >= payload.min_rating;
}

module.exports = { checkBadges };

// ─── MAPPING requirement_type → règle interne ───────────────
function _mapRequirementType(requirementType, category) {
  const map = {
    'jobs_count': 'job_count',
    'driver_jobs': 'job_count',
    'offsider_jobs': 'job_count',
    'business_jobs': 'job_count',
    'streak_days': 'streak_days',
    'perfect_days': 'streak_days',
    'level_reached': 'level_reached',
    'rating_count': 'review_count',
    'five_star_count': 'review_count',
    'perfect_job_count': 'no_incident_streak',
    'ontime_job_count': 'job_count',
    'referral_count': 'manual',
    'custom': 'manual',
  };
  return map[requirementType] || 'manual';
}

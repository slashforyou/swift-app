'use strict';

/**
 * Job Quality Score (JQS) Engine — Phase 3
 *
 * Calculates a quality score (0–100) for a completed job based on
 * job_events signals, then stores the result in job_quality_scores.
 *
 * Scoring table:
 *   photo_added         → 20 pts  (presence)
 *   signature_collected → 20 pts  (presence)
 *   payment_collected   → 20 pts  (presence)
 *   damage_reported     → 15 pts  (absence = good)
 *   review_submitted    → 15 pts  (presence)
 *   note_added          →  5 pts  (presence)
 *   job_completed       →  5 pts  (always earned)
 *   ─────────────────────────────
 *   TOTAL               → 100 pts
 */

const CRITERIA = [
  { key: 'photo_added',         max: 20, absenceGood: false },
  { key: 'signature_collected', max: 20, absenceGood: false },
  { key: 'payment_collected',   max: 20, absenceGood: false },
  { key: 'damage_reported',     max: 15, absenceGood: true  }, // no damage = good
  { key: 'review_submitted',    max: 15, absenceGood: false },
  { key: 'note_added',          max:  5, absenceGood: false },
  { key: 'job_completed',       max:  5, absenceGood: false }, // always earned
];

/**
 * Maps a raw score to a quality multiplier used for XP bonuses.
 * @param {number} score - Score 0–100
 * @returns {number}
 */
function getQualityMultiplier(score) {
  if (score >= 85) return 1.5;
  if (score >= 70) return 1.2;
  if (score >= 50) return 1.0;
  return 0.7;
}

/**
 * Calculates and stores the Job Quality Score for a completed job.
 *
 * Uses the provided connection — does NOT open or close a DB connection itself.
 * The INSERT uses INSERT IGNORE so the function is safe to call multiple times.
 *
 * @param {number} jobId
 * @param {number} companyId
 * @param {number} userId
 * @param {object} connection - Active mysql2 connection/pool
 * @returns {Promise<{ score: number, qualityMultiplier: number, criteriaJson: object }>}
 */
async function calculateAndStoreJobQualityScore(jobId, companyId, userId, connection) {
  if (!jobId || !userId) {
    throw new Error('[JQS] jobId and userId are required');
  }

  // 1. Fetch all event_types for this job
  const [events] = await connection.execute(
    'SELECT DISTINCT event_type FROM job_events WHERE job_id = ?',
    [jobId]
  );
  const eventSet = new Set(events.map(e => e.event_type));

  // 2. Calculate score and build criteriaJson
  let score = 0;
  const criteriaJson = {};

  for (const criterion of CRITERIA) {
    let earned;

    if (criterion.key === 'job_completed') {
      // job_completed is always earned — completing the job is the prerequisite
      earned = true;
    } else if (criterion.absenceGood) {
      // damage_reported: absence of event is the good outcome
      earned = !eventSet.has(criterion.key);
    } else {
      earned = eventSet.has(criterion.key);
    }

    const points = earned ? criterion.max : 0;
    score += points;

    criteriaJson[criterion.key] = {
      earned,
      points,
      max: criterion.max,
    };
  }

  // 3. Quality multiplier
  const qualityMultiplier = getQualityMultiplier(score);

  // 4. Persist — INSERT IGNORE ensures idempotency
  // Note: quality_multiplier is not stored in DB (not in schema 064).
  // It is computed on-the-fly and returned for the caller (XP bonus, log, etc.)
  await connection.execute(
    `INSERT IGNORE INTO job_quality_scores
       (job_id, company_id, user_id, score, criteria_json, calculated_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      jobId,
      companyId ?? null,
      userId,
      score,
      JSON.stringify(criteriaJson),
    ]
  );

  return { score, qualityMultiplier, criteriaJson };
}

module.exports = { calculateAndStoreJobQualityScore };

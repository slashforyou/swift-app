/**
 * utils/gamificationEngine.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * Moteur Gamification V2 — Fire-and-forget, idempotent.
 *
 * Toutes les fonctions sont async mais s'appellent en "fire & forget" depuis
 * les endpoints. Elles ne bloquent jamais la réponse HTTP.
 *
 * Architecture:
 *  - awardReward()    → INSERT INTO gamification_reward_ledger (idempotent)
 *  - syncProfile()    → UPDATE gamification_profiles (XP, level, stats)
 *  - syncLegacyXP()   → UPDATE users.experience + users.level (backward compat)
 *
 * Points d'entrée publics:
 *  - processJobCompleted(jobId, userId, companyId)
 *  - processPhotoAdded(jobId, userId, companyId, imageId)
 *  - processSignatureCollected(jobId, userId, companyId, signatureId)
 *  - processNoteAdded(jobId, userId, companyId, noteId)
 *  - processReviewSubmitted(reviewTokenId, jobId)
 *
 * @module utils/gamificationEngine
 */

'use strict';

const { connect } = require('../swiftDb');

// ─────────────────────────────────────────────────────────────────────────────
// TROPHÉES SAISONNIERS — Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la saison courante selon la date.
 * Hiver : 1 jan → 30 jun | Été : 1 jul → 31 déc
 * @returns {{ key: string, name: string, icon: string, startDate: string, endDate: string }}
 */
function getCurrentSeason(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  if (month <= 6) {
    return {
      key:       `season_winter_${year}`,
      name:      `Saison Hiver ${year}`,
      icon:      'snowflake',
      startDate: `${year}-01-01`,
      endDate:   `${year}-06-30`,
    };
  }
  return {
    key:       `season_summer_${year}`,
    name:      `Saison Été ${year}`,
    icon:      'sunny',
    startDate: `${year}-07-01`,
    endDate:   `${year}-12-31`,
  };
}

/**
 * Insère dans trophy_events (idempotent) et incrémente trophy_ledgers.
 * Met aussi à jour gamification_profiles.total_trophies (lifetime).
 *
 * @param {'user'|'company'} entityType
 * @param {number} entityId
 * @param {'job'|'review'|'quest'|'manual'} sourceType
 * @param {string} sourceId           — code unique idempotence
 * @param {number} amount
 * @param {number|null} jobId
 * @param {object} conn
 */
async function awardTrophies(entityType, entityId, sourceType, sourceId, amount, jobId, conn) {
  if (!amount || amount <= 0) return 0;
  const season = getCurrentSeason();

  try {
    const [result] = await conn.execute(
      `INSERT IGNORE INTO trophy_events
         (entity_type, entity_id, source_type, source_id, trophy_amount, season_key, job_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entityType, entityId, sourceType, sourceId, amount, season.key, jobId ?? null]
    );

    if (result.affectedRows === 0) return 0; // déjà attribué

    // Incrémenter le compteur saisonnier
    await conn.execute(
      `INSERT INTO trophy_ledgers (entity_type, entity_id, season_key, trophies)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE trophies = trophies + ?, updated_at = NOW()`,
      [entityType, entityId, season.key, amount, amount]
    );

    // Incrémenter le lifetime total sur gamification_profiles
    await conn.execute(
      `INSERT INTO gamification_profiles (entity_type, entity_id, total_trophies, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE total_trophies = COALESCE(total_trophies, 0) + ?, updated_at = NOW()`,
      [entityType, entityId, amount, amount]
    );

    return 1;
  } catch (err) {
    console.error('[gamificationEngine] awardTrophies failed:', sourceId, err.message);
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES XP
// Valeurs par défaut si non trouvées dans gamification_xp_rewards
// ─────────────────────────────────────────────────────────────────────────────
const XP_DEFAULTS = {
  job_completed:             50,
  photo_added:                5,
  signature_collected:       10,
  note_added:                 5,
  no_incident:               15,
  first_job_of_day:          10,
  review_submitted:          20,   // pour l'entreprise
  review_4star_overall:      20,   // pour chaque staff
  review_5star_overall:      40,   // pour chaque staff
  review_5star_service:      15,   // pour l'entreprise
  review_5star_team:         15,   // pour l'entreprise
  staff_5star_rating:        25,   // pour le staff noté individuellement
  staff_positive_adjectives: 10,   // par tranche de 3 adjectifs positifs
  photo_milestone_5:         10,   // 5 photos sur un même job
  photo_milestone_10:        20,   // 10 photos sur un même job
  photo_milestone_20:        40,   // 20 photos sur un même job
  photo_total_50:            100,  // 50 photos cumulatives (lifetime user)
  photo_total_100:           200,  // 100 photos cumulatives
  photo_total_500:           500,  // 500 photos cumulatives
};

// Cache des XP rewards (rechargé toutes les 5 minutes)
let _xpCache = null;
let _xpCacheAt = 0;
const XP_CACHE_TTL = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Charge les montants XP depuis la DB (avec cache).
 * Ne lève jamais d'exception.
 */
async function getXpAmount(actionCode) {
  try {
    const now = Date.now();
    if (!_xpCache || now - _xpCacheAt > XP_CACHE_TTL) {
      const conn = await connect();
      const [rows] = await conn.execute(
        'SELECT action_code, xp_amount FROM gamification_xp_rewards WHERE active = 1'
      );
      conn.release?.() ?? conn.end?.();
      _xpCache = {};
      for (const row of rows) {
        _xpCache[row.action_code] = row.xp_amount;
      }
      _xpCacheAt = now;
    }
    return _xpCache[actionCode] ?? XP_DEFAULTS[actionCode] ?? 0;
  } catch (_) {
    return XP_DEFAULTS[actionCode] ?? 0;
  }
}

/**
 * Insère une entrée dans gamification_reward_ledger (idempotent via UNIQUE KEY).
 * Retourne le nombre de lignes insérées (0 si déjà existant, 1 si nouveau).
 * Ne propage jamais d'exception.
 *
 * @param {Object} opts
 * @param {'user'|'company'} opts.entityType
 * @param {number} opts.entityId
 * @param {'xp'|'trophy'} opts.rewardType
 * @param {number} opts.amount
 * @param {'job'|'review'|'action'|'streak'|'milestone'|'badge'|'quest'|'admin'} opts.sourceType
 * @param {string} opts.sourceCode   — code unique pour idempotence
 * @param {string} opts.triggerEvent — ex: 'job_completed', 'photo_added'
 * @param {number|null} [opts.jobId]
 * @param {number|null} [opts.reviewTokenId]
 * @param {string} [opts.reason]
 * @param {Object|null} [opts.metadata]
 * @param {Object} conn — connexion DB déjà ouverte
 * @returns {Promise<number>} 0 ou 1
 */
async function awardReward(opts, conn) {
  const {
    entityType, entityId, rewardType, amount,
    sourceType, sourceCode, triggerEvent,
    jobId = null, reviewTokenId = null,
    reason = '', metadata = null,
  } = opts;

  if (!amount || amount <= 0) return 0;

  try {
    const [result] = await conn.execute(
      `INSERT IGNORE INTO gamification_reward_ledger
         (entity_type, entity_id, reward_type, amount,
          source_type, source_code, trigger_event,
          job_id, review_token_id, reason, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        entityType, entityId, rewardType, amount,
        sourceType, sourceCode, triggerEvent,
        jobId, reviewTokenId,
        reason.substring(0, 499),
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
    return result.affectedRows ?? 0;
  } catch (err) {
    console.error('[gamificationEngine] awardReward failed:', triggerEvent, err.message);
    return 0;
  }
}

/**
 * Synchronise gamification_profiles et users (XP + level) après un gain XP.
 * Utilise INSERT ... ON DUPLICATE KEY UPDATE pour assurer l'upsert.
 */
async function syncProfileXP(entityType, entityId, xpGained, conn) {
  if (!xpGained || xpGained <= 0) return;

  try {
    // Upsert gamification_profiles
    await conn.execute(
      `INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         lifetime_xp = lifetime_xp + VALUES(lifetime_xp),
         updated_at  = NOW()`,
      [entityType, entityId, xpGained]
    );

    // Pour les users: sync legacy users.experience + recalculer level
    if (entityType === 'user') {
      await syncLegacyUserXP(entityId, xpGained, conn);
    }
  } catch (err) {
    console.error('[gamificationEngine] syncProfileXP failed:', err.message);
  }
}

/**
 * Met à jour users.experience et users.level (backward compat avec le système actuel).
 */
async function syncLegacyUserXP(userId, xpGained, conn) {
  try {
    // Incrémenter XP
    await conn.execute(
      'UPDATE users SET experience = COALESCE(experience, 0) + ? WHERE id = ?',
      [xpGained, userId]
    );

    // Recalculer level depuis gamification_levels (ou defaults)
    const [[userRow]] = await conn.execute(
      'SELECT COALESCE(experience, 0) as xp FROM users WHERE id = ?',
      [userId]
    );
    if (!userRow) return;

    const newXp = userRow.xp;
    const [levels] = await conn.execute(
      'SELECT level, xp_required FROM gamification_levels ORDER BY xp_required DESC'
    );

    let newLevel = 1;
    for (const lv of levels) {
      if (newXp >= lv.xp_required) {
        newLevel = lv.level;
        break;
      }
    }

    await conn.execute(
      'UPDATE users SET level = ? WHERE id = ? AND COALESCE(level, 1) != ?',
      [newLevel, userId, newLevel]
    );
  } catch (err) {
    console.error('[gamificationEngine] syncLegacyUserXP failed:', err.message);
  }
}

/**
 * Met à jour un compteur sur gamification_profiles (total_photos_uploaded, etc.).
 */
async function incrementProfileStat(entityType, entityId, col, increment, conn) {
  try {
    await conn.execute(
      `INSERT INTO gamification_profiles (entity_type, entity_id, ${col}, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         ${col} = ${col} + VALUES(${col}),
         updated_at = NOW()`,
      [entityType, entityId, increment]
    );
  } catch (err) {
    console.error('[gamificationEngine] incrementProfileStat failed:', col, err.message);
  }
}

/**
 * Wrappers fire-and-forget: exécute fn() sans bloquer.
 */
function fireAndForget(fn) {
  (async () => {
    let conn;
    try {
      conn = await connect();
      await fn(conn);
    } catch (err) {
      console.error('[gamificationEngine] Unexpected error:', err.message);
    } finally {
      try { conn?.release?.() ?? conn?.end?.(); } catch (_) {}
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE 1 — JOB COMPLETED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récompense la complétion d'un job.
 * - XP job_completed → user qui a complété
 * - XP job_completed → company exécutrice (moitié)
 * - XP first_job_of_day → si c'est le 1er job du jour pour cet user
 * - XP no_incident → si aucun incident signalé sur ce job
 *
 * @param {number} jobId
 * @param {number} userId       - user qui a complété
 * @param {number|null} companyId - company exécutrice
 */
function processJobCompleted(jobId, userId, companyId) {
  if (!jobId || !userId) return;
  fireAndForget(async (conn) => {
    const xpJob     = await getXpAmount('job_completed');
    const xpNoInc   = await getXpAmount('no_incident');
    const xpFirstDay = await getXpAmount('first_job_of_day');

    // ── 1. XP job_completed → user
    const userInserted = await awardReward({
      entityType: 'user', entityId: userId,
      rewardType: 'xp', amount: xpJob,
      sourceType: 'job', sourceCode: `job_completed_job${jobId}_user${userId}`,
      triggerEvent: 'job_completed', jobId,
      reason: `Job #${jobId} complété`,
    }, conn);

    if (userInserted) {
      await syncProfileXP('user', userId, xpJob, conn);
      await incrementProfileStat('user', userId, 'total_jobs_completed', 1, conn);
    }

    // ── 2. XP job_completed → company
    if (companyId) {
      const compInserted = await awardReward({
        entityType: 'company', entityId: companyId,
        rewardType: 'xp', amount: Math.ceil(xpJob / 2),
        sourceType: 'job', sourceCode: `job_completed_job${jobId}_comp${companyId}`,
        triggerEvent: 'job_completed', jobId,
        reason: `Job #${jobId} complété par la company #${companyId}`,
      }, conn);

      if (compInserted) {
        await syncProfileXP('company', companyId, Math.ceil(xpJob / 2), conn);
        await incrementProfileStat('company', companyId, 'total_jobs_completed', 1, conn);
      }
    }

    // ── 3. XP first_job_of_day → user
    const today = new Date().toISOString().slice(0, 10);
    const [[firstJobCheck]] = await conn.execute(
      `SELECT COUNT(*) as cnt
       FROM gamification_reward_ledger
       WHERE entity_type = 'user' AND entity_id = ?
         AND trigger_event = 'first_job_of_day'
         AND DATE(created_at) = ?`,
      [userId, today]
    );
    if (firstJobCheck.cnt === 0) {
      const fjInserted = await awardReward({
        entityType: 'user', entityId: userId,
        rewardType: 'xp', amount: xpFirstDay,
        sourceType: 'job', sourceCode: `first_job_of_day_${today}_user${userId}`,
        triggerEvent: 'first_job_of_day', jobId,
        reason: `Premier job du jour (${today})`,
      }, conn);
      if (fjInserted) await syncProfileXP('user', userId, xpFirstDay, conn);
    }

    // ── 4. XP no_incident → vérifier si 0 incident sur ce job
    const [[incidentCheck]] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM payment_issues WHERE job_id = ?`,
      [jobId]
    );
    if (incidentCheck.cnt === 0) {
      const niInserted = await awardReward({
        entityType: 'user', entityId: userId,
        rewardType: 'xp', amount: xpNoInc,
        sourceType: 'job', sourceCode: `no_incident_job${jobId}_user${userId}`,
        triggerEvent: 'no_incident', jobId,
        reason: `Job #${jobId} terminé sans incident`,
      }, conn);
      if (niInserted) await syncProfileXP('user', userId, xpNoInc, conn);
    }

    console.log(`[gamificationEngine] processJobCompleted job=${jobId} user=${userId} comp=${companyId}`);

    // ── 5. Trophées job → user (1 trophée par job complété)
    await awardTrophies('user', userId, 'job', `job_completed_trophy_job${jobId}_user${userId}`, 1, jobId, conn);

    // ── 6. Trophées job → company (1 trophée aussi)
    if (companyId) {
      await awardTrophies('company', companyId, 'job', `job_completed_trophy_job${jobId}_comp${companyId}`, 1, jobId, conn);
    }

    // ── 7. [Phase 5] Vérifier & attribuer les badges
    const { checkBadges } = require('./badgeChecker');
    await checkBadges(userId, conn);

    // ── 8. [Phase 2] Progression des quêtes job_completed
    const { processQuestEvent: pqe_job } = require('./questEngine');
    await pqe_job('user', userId, 'job_completed', conn);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE 2 — PHOTO ADDED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récompense l'ajout d'une photo.
 * - XP photo_added → user
 * - Milestones: 5, 10, 20 photos sur ce job
 * - Milestones cumulatives: 50, 100, 500 photos total user
 *
 * @param {number} jobId
 * @param {number} userId
 * @param {number|null} companyId
 * @param {number|string} imageId - ID de l'image insérée
 */
function processPhotoAdded(jobId, userId, companyId, imageId) {
  if (!jobId || !userId) return;
  fireAndForget(async (conn) => {
    const xpPhoto = await getXpAmount('photo_added');

    // ── 1. XP par photo
    const inserted = await awardReward({
      entityType: 'user', entityId: userId,
      rewardType: 'xp', amount: xpPhoto,
      sourceType: 'action',
      sourceCode: `photo_added_job${jobId}_img${imageId}_user${userId}`,
      triggerEvent: 'photo_added', jobId,
      reason: `Photo ajoutée sur job #${jobId}`,
    }, conn);

    if (inserted) {
      await syncProfileXP('user', userId, xpPhoto, conn);
      await incrementProfileStat('user', userId, 'total_photos_uploaded', 1, conn);
    }

    // ── 2. Milestones photos sur ce job
    const [[jobPhotos]] = await conn.execute(
      'SELECT COUNT(*) as cnt FROM job_images WHERE job_id = ? AND user_id = ?',
      [jobId, userId]
    );
    const jobCount = jobPhotos.cnt;

    const jobMilestones = [
      { threshold: 5,  code: 'photo_milestone_5',  xpKey: 'photo_milestone_5' },
      { threshold: 10, code: 'photo_milestone_10', xpKey: 'photo_milestone_10' },
      { threshold: 20, code: 'photo_milestone_20', xpKey: 'photo_milestone_20' },
    ];

    for (const m of jobMilestones) {
      if (jobCount >= m.threshold) {
        const xpM = await getXpAmount(m.xpKey);
        const mIns = await awardReward({
          entityType: 'user', entityId: userId,
          rewardType: 'xp', amount: xpM,
          sourceType: 'milestone',
          sourceCode: `${m.code}_job${jobId}_user${userId}`,
          triggerEvent: m.code, jobId,
          reason: `${m.threshold} photos sur le job #${jobId}`,
        }, conn);
        if (mIns) await syncProfileXP('user', userId, xpM, conn);
      }
    }

    // ── 3. Milestones photos cumulatives (lifetime user)
    const [[profile]] = await conn.execute(
      `SELECT COALESCE(total_photos_uploaded, 0) as total
       FROM gamification_profiles WHERE entity_type = 'user' AND entity_id = ?`,
      [userId]
    );
    const totalPhotos = profile?.total ?? 0;

    const lifetimeMilestones = [
      { threshold: 50,  code: 'photo_total_50',  xpKey: 'photo_total_50' },
      { threshold: 100, code: 'photo_total_100', xpKey: 'photo_total_100' },
      { threshold: 500, code: 'photo_total_500', xpKey: 'photo_total_500' },
    ];

    for (const m of lifetimeMilestones) {
      if (totalPhotos >= m.threshold) {
        const xpM = await getXpAmount(m.xpKey);
        const mIns = await awardReward({
          entityType: 'user', entityId: userId,
          rewardType: 'xp', amount: xpM,
          sourceType: 'milestone',
          sourceCode: `${m.code}_user${userId}`,
          triggerEvent: m.code, jobId,
          reason: `${m.threshold} photos cumulées (lifetime)`,
        }, conn);
        if (mIns) await syncProfileXP('user', userId, xpM, conn);
      }
    }

    // ── [Phase 2] Progression des quêtes photo_added
    const { processQuestEvent: pqe_photo } = require('./questEngine');
    await pqe_photo('user', userId, 'photo_added', conn);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE 3 — SIGNATURE COLLECTED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récompense la collecte d'une signature client.
 *
 * @param {number} jobId
 * @param {number} userId
 * @param {number|null} companyId
 * @param {number|string} signatureId
 */
function processSignatureCollected(jobId, userId, companyId, signatureId) {
  if (!jobId || !userId) return;
  fireAndForget(async (conn) => {
    const xp = await getXpAmount('signature_collected');
    const inserted = await awardReward({
      entityType: 'user', entityId: userId,
      rewardType: 'xp', amount: xp,
      sourceType: 'action',
      sourceCode: `signature_collected_job${jobId}_sig${signatureId}_user${userId}`,
      triggerEvent: 'signature_collected', jobId,
      reason: `Signature collectée sur job #${jobId}`,
    }, conn);
    if (inserted) {
      await syncProfileXP('user', userId, xp, conn);
      await incrementProfileStat('user', userId, 'total_signatures', 1, conn);
    }

    // ── [Phase 2] Progression des quêtes signature_collected
    const { processQuestEvent: pqe_sig } = require('./questEngine');
    await pqe_sig('user', userId, 'signature_collected', conn);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE 4 — NOTE ADDED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récompense l'ajout d'une note.
 * Max 5 notes récompensées par job par user (anti-spam).
 *
 * @param {number} jobId
 * @param {number} userId
 * @param {number|null} companyId
 * @param {number|string} noteId
 */
function processNoteAdded(jobId, userId, companyId, noteId) {
  if (!jobId || !userId) return;
  fireAndForget(async (conn) => {
    // Anti-spam: max 5 notes récompensées par job
    const [[noteCount]] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM gamification_reward_ledger
       WHERE entity_type = 'user' AND entity_id = ?
         AND trigger_event = 'note_added' AND job_id = ?`,
      [userId, jobId]
    );
    if (noteCount.cnt >= 5) return;

    const xp = await getXpAmount('note_added');
    const inserted = await awardReward({
      entityType: 'user', entityId: userId,
      rewardType: 'xp', amount: xp,
      sourceType: 'action',
      sourceCode: `note_added_job${jobId}_note${noteId}_user${userId}`,
      triggerEvent: 'note_added', jobId,
      reason: `Note ajoutée sur job #${jobId}`,
    }, conn);
    if (inserted) await syncProfileXP('user', userId, xp, conn);

    // ── [Phase 2] Progression des quêtes note_added
    const { processQuestEvent: pqe_note } = require('./questEngine');
    await pqe_note('user', userId, 'note_added', conn);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE 5 — REVIEW SUBMITTED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distribue l'XP issue d'une review client soumise.
 *
 * Récompenses distribuées:
 * - review_submitted (XP base) → company exécutrice
 * - review_4star_overall / review_5star_overall → chaque staff du job
 * - review_5star_service → company (si rating_service = 5)
 * - review_5star_team → company (si rating_team = 5)
 * - staff_5star_rating → utilisateur individuellement noté 5 étoiles
 * - staff_positive_adjectives → utilisateurs avec adjectifs positifs
 * Marque xp_distributed = 1 sur job_review_tokens.
 *
 * @param {number} reviewTokenId
 * @param {number} jobId
 */
function processReviewSubmitted(reviewTokenId, jobId) {
  if (!reviewTokenId || !jobId) return;
  fireAndForget(async (conn) => {
    // Charger la review complète
    const [[review]] = await conn.execute(
      `SELECT id, job_id, rating_overall, rating_service, rating_team,
              staff_ratings, staff_adjectives, xp_distributed
       FROM job_review_tokens WHERE id = ? AND submitted_at IS NOT NULL`,
      [reviewTokenId]
    );

    if (!review || review.xp_distributed) return; // déjà traité

    const reviewId  = review.id;
    const rOverall  = review.rating_overall  ? parseInt(review.rating_overall)  : 0;
    const rService  = review.rating_service  ? parseInt(review.rating_service)  : 0;
    const rTeam     = review.rating_team     ? parseInt(review.rating_team)     : 0;
    const staffRatings    = parseJSON(review.staff_ratings,   []);
    const staffAdjectives = parseJSON(review.staff_adjectives, []);

    // Récupérer la company exécutrice du job
    const [[jobRow]] = await conn.execute(
      'SELECT contractor_company_id, contractee_company_id FROM jobs WHERE id = ?',
      [jobId]
    );
    // contractor = company qui RÉALISE le job
    const execCompanyId = jobRow?.contractor_company_id ?? jobRow?.contractee_company_id ?? null;

    // Récupérer les members de l'équipe sur ce job
    const [crewRows] = await conn.execute(
      `SELECT DISTINCT user_id FROM job_users WHERE job_id = ? AND unassigned_at IS NULL`,
      [jobId]
    );

    // ── 1. XP review_submitted → company exécutrice
    if (execCompanyId) {
      const xpSubm = await getXpAmount('review_submitted');
      const ins = await awardReward({
        entityType: 'company', entityId: execCompanyId,
        rewardType: 'xp', amount: xpSubm,
        sourceType: 'review',
        sourceCode: `review_submitted_rev${reviewId}_comp${execCompanyId}`,
        triggerEvent: 'review_submitted', jobId,
        reviewTokenId: reviewId,
        reason: `Avis client reçu sur le job #${jobId}`,
      }, conn);
      if (ins) {
        await syncProfileXP('company', execCompanyId, xpSubm, conn);
        await incrementProfileStat('company', execCompanyId, 'total_reviews_received', 1, conn);
      }
    }

    // ── 2. XP note_overall → chaque staff de l'équipe
    if (rOverall >= 4) {
      const xpKey = rOverall === 5 ? 'review_5star_overall' : 'review_4star_overall';
      const xpOverall = await getXpAmount(xpKey);

      for (const { user_id } of crewRows) {
        const ins2 = await awardReward({
          entityType: 'user', entityId: user_id,
          rewardType: 'xp', amount: xpOverall,
          sourceType: 'review',
          sourceCode: `${xpKey}_rev${reviewId}_user${user_id}`,
          triggerEvent: xpKey, jobId, reviewTokenId: reviewId,
          reason: `Note globale ${rOverall}★ reçue sur job #${jobId}`,
          metadata: { rating_overall: rOverall },
        }, conn);
        if (ins2) {
          await syncProfileXP('user', user_id, xpOverall, conn);
          await incrementProfileStat('user', user_id, 'total_reviews_received', 1, conn);
          if (rOverall === 5) {
            await incrementProfileStat('user', user_id, 'total_5star_reviews', 1, conn);
          }
        }
      }
    }

    // ── 3. XP review_5star_service → company
    if (execCompanyId && rService === 5) {
      const xpServ = await getXpAmount('review_5star_service');
      const ins3 = await awardReward({
        entityType: 'company', entityId: execCompanyId,
        rewardType: 'xp', amount: xpServ,
        sourceType: 'review',
        sourceCode: `review_5star_service_rev${reviewId}_comp${execCompanyId}`,
        triggerEvent: 'review_5star_service', jobId, reviewTokenId: reviewId,
        reason: `Service noté 5★ sur job #${jobId}`,
        metadata: { rating_service: rService },
      }, conn);
      if (ins3) await syncProfileXP('company', execCompanyId, xpServ, conn);
    }

    // ── 4. XP review_5star_team → company
    if (execCompanyId && rTeam === 5) {
      const xpTeam = await getXpAmount('review_5star_team');
      const ins4 = await awardReward({
        entityType: 'company', entityId: execCompanyId,
        rewardType: 'xp', amount: xpTeam,
        sourceType: 'review',
        sourceCode: `review_5star_team_rev${reviewId}_comp${execCompanyId}`,
        triggerEvent: 'review_5star_team', jobId, reviewTokenId: reviewId,
        reason: `Équipe notée 5★ sur job #${jobId}`,
        metadata: { rating_team: rTeam },
      }, conn);
      if (ins4) await syncProfileXP('company', execCompanyId, xpTeam, conn);
    }

    // ── 5. XP staff_5star_rating → ratings individuelles par staff
    if (Array.isArray(staffRatings)) {
      const xpStaff5 = await getXpAmount('staff_5star_rating');
      for (const sr of staffRatings) {
        const sUserId = sr.user_id ?? sr.userId ?? sr.id ?? null;
        const sRating = parseInt(sr.rating ?? sr.value ?? 0);
        if (!sUserId || sRating < 5) continue;

        const ins5 = await awardReward({
          entityType: 'user', entityId: sUserId,
          rewardType: 'xp', amount: xpStaff5,
          sourceType: 'review',
          sourceCode: `staff_5star_rating_rev${reviewId}_user${sUserId}`,
          triggerEvent: 'staff_5star_rating', jobId, reviewTokenId: reviewId,
          reason: `Noté 5★ individuellement sur job #${jobId}`,
          metadata: { rating: sRating },
        }, conn);
        if (ins5) await syncProfileXP('user', sUserId, xpStaff5, conn);
      }
    }

    // ── 6. XP staff_positive_adjectives → adjectifs positifs reçus
    if (Array.isArray(staffAdjectives)) {
      const xpAdj = await getXpAmount('staff_positive_adjectives');
      // staffAdjectives structure: [{user_id, adjectives: ['professional','fast',...]}]
      for (const sa of staffAdjectives) {
        const sUserId = sa.user_id ?? sa.userId ?? sa.id ?? null;
        const adjs = Array.isArray(sa.adjectives) ? sa.adjectives : [];
        const positiveCount = adjs.length; // on assume tous positifs
        if (!sUserId || positiveCount === 0) continue;

        // 1 XP par tranche de 3 adjectifs (max 3 tranches)
        const tranches = Math.min(3, Math.floor(positiveCount / 1)); // 1 adj = 1 tranche
        const adjXp = xpAdj * tranches;
        if (adjXp <= 0) continue;

        const ins6 = await awardReward({
          entityType: 'user', entityId: sUserId,
          rewardType: 'xp', amount: adjXp,
          sourceType: 'review',
          sourceCode: `staff_positive_adj_rev${reviewId}_user${sUserId}`,
          triggerEvent: 'staff_positive_adjectives', jobId, reviewTokenId: reviewId,
          reason: `${positiveCount} adjectif(s) positif(s) reçu(s) sur job #${jobId}`,
          metadata: { adjectives: adjs, count: positiveCount },
        }, conn);
        if (ins6) await syncProfileXP('user', sUserId, adjXp, conn);
      }
    }

    // ── 7. Marquer la review comme traitée (idempotence)
    await conn.execute(
      'UPDATE job_review_tokens SET xp_distributed = 1, xp_distributed_at = NOW() WHERE id = ?',
      [reviewTokenId]
    );

    // ── 8. Trophées bonus si note globale ≥ 4 étoiles
    if (rOverall >= 4 && crewRows.length > 0) {
      const bonusTrophies = rOverall === 5 ? 2 : 1;
      // Pour chaque membre de l'équipe
      for (const crew of crewRows) {
        const sUserId = crew.user_id;
        if (!sUserId) continue;
        await awardTrophies('user', sUserId, 'review',
          `review_trophy_${rOverall}star_rev${reviewId}_user${sUserId}`,
          bonusTrophies, jobId, conn);
      }
    }

    // Mettre à jour avg_review_overall sur company profile
    if (execCompanyId && rOverall > 0) {
      await conn.execute(
        `UPDATE gamification_profiles
         SET avg_review_overall = (
           SELECT AVG(r.rating_overall)
           FROM job_review_tokens r
           JOIN jobs j ON r.job_id = j.id
           WHERE (j.contractor_company_id = ? OR j.contractee_company_id = ?)
             AND r.submitted_at IS NOT NULL
             AND r.rating_overall IS NOT NULL
         )
         WHERE entity_type = 'company' AND entity_id = ?`,
        [execCompanyId, execCompanyId, execCompanyId]
      );
    }

    console.log(
      `[gamificationEngine] processReviewSubmitted reviewToken=${reviewTokenId} job=${jobId}` +
      ` overall=${rOverall} service=${rService} team=${rTeam} crew=${crewRows.length}`
    );

    // ── [Phase 2] Progression des quêtes review_submitted (pour chaque crew + company)
    const { processQuestEvent: pqe_review } = require('./questEngine');
    for (const crew of crewRows) {
      if (crew.user_id) await pqe_review('user', crew.user_id, 'review_submitted', conn);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function parseJSON(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (_) { return fallback; }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE — PERFECT JOB
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Récompense un job "parfait" : photos avant + après + signature client.
 * Déclenche la quête event_trigger = 'perfect_job'.
 * Idempotent via triggerEvent unique.
 */
function processPerfectJob(jobId, userId, companyId) {
  (async () => {
    const conn = await require('../swiftDb').connect();
    try {
      // Vérifier les conditions du job parfait
      const [[jobData]] = await conn.execute(
        `SELECT
           j.signature_date,
           j.start_window_start,
           (SELECT COUNT(*) FROM job_images WHERE job_id = j.id AND image_type = 'before' AND deleted_at IS NULL) AS before_count,
           (SELECT COUNT(*) FROM job_images WHERE job_id = j.id AND image_type = 'after'  AND deleted_at IS NULL) AS after_count
         FROM jobs j WHERE j.id = ?`,
        [jobId]
      );

      if (!jobData) return;

      const isPerfect = (
        jobData.before_count >= 1 &&
        jobData.after_count  >= 1 &&
        jobData.signature_date !== null
      );

      if (!isPerfect) return;

      // +30 XP utilisateur — idempotent
      await awardReward({
        entityType:   'user',
        entityId:     userId,
        rewardType:   'xp',
        amount:       30,
        sourceType:   'job',
        sourceCode:   'perfect_job',
        triggerEvent: `perfect_job_job${jobId}_user${userId}`,
        jobId,
      }, conn);

      // Progression quête perfect_job
      const { processQuestEvent } = require('./questEngine');
      await processQuestEvent('user', userId, 'perfect_job', conn);

      console.log(`[gamificationEngine] processPerfectJob job=${jobId} user=${userId}`);
    } catch (e) {
      console.error('[gamificationEngine] processPerfectJob error:', e.message);
    } finally {
      conn.release();
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE — JOB ON TIME
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Récompense un job démarré dans la fenêtre de départ prévue.
 * "À l'heure" = timer_started_at <= start_window_end (ou +15 min si pas de fin définie).
 * Déclenche la quête event_trigger = 'job_ontime'.
 */
function processJobOnTime(jobId, userId, companyId) {
  (async () => {
    const conn = await require('../swiftDb').connect();
    try {
      const [[jobData]] = await conn.execute(
        `SELECT timer_started_at, start_window_start, start_window_end FROM jobs WHERE id = ?`,
        [jobId]
      );

      if (!jobData || !jobData.timer_started_at || !jobData.start_window_start) return;

      const started   = new Date(jobData.timer_started_at);
      const deadline  = jobData.start_window_end
        ? new Date(jobData.start_window_end)
        : new Date(new Date(jobData.start_window_start).getTime() + 15 * 60 * 1000);

      if (started > deadline) return; // Non ponctuel

      // +20 XP utilisateur — idempotent
      await awardReward({
        entityType:   'user',
        entityId:     userId,
        rewardType:   'xp',
        amount:       20,
        sourceType:   'job',
        sourceCode:   'job_ontime',
        triggerEvent: `job_ontime_job${jobId}_user${userId}`,
        jobId,
      }, conn);

      // Progression quête job_ontime
      const { processQuestEvent } = require('./questEngine');
      await processQuestEvent('user', userId, 'job_ontime', conn);

      console.log(`[gamificationEngine] processJobOnTime job=${jobId} user=${userId}`);
    } catch (e) {
      console.error('[gamificationEngine] processJobOnTime error:', e.message);
    } finally {
      conn.release();
    }
  })();
}

module.exports = {
  processJobCompleted,
  processPhotoAdded,
  processSignatureCollected,
  processNoteAdded,
  processReviewSubmitted,
  getCurrentSeason,
  processPerfectJob,
  processJobOnTime,
};

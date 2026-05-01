/**
 * reviewGamification.js — Moteur de distribution XP + trophées après review client
 *
 * Appelé après qu'un client soumet son avis sur /review/:token.
 *
 * ─── Règles de distribution ────────────────────────────────────────────────
 *
 * Critères de notation → bénéficiaires :
 *   rating_overall     → TOUS (employés terrain + entreprise réalisatrice + entreprise créatrice)
 *   rating_team        → Employés terrain + entreprise réalisatrice
 *   rating_punctuality → Employés terrain + entreprise réalisatrice
 *   rating_care        → Employés terrain + entreprise réalisatrice
 *   rating_service     → Entreprise créatrice uniquement
 *   staff_ratings      → Utilisateur individuel + entreprise réalisatrice
 *
 * Multiplicateurs XP par rôle (pour les utilisateurs) :
 *   patron / owner      : ×3.0
 *   prestataire         : ×2.5
 *   employee / manager  : ×2.0
 *   supervisor          : ×1.8
 *   driver / offsider   : ×1.5
 *   default             : ×1.2
 *
 * Multiplicateurs XP par type d'entité (base ×1.0 = XP table gamification_xp_rewards) :
 *   Utilisateur terrain        : ×1.0  (multiplié par rôle en plus)
 *   Entreprise réalisatrice    : ×0.6
 *   Entreprise créatrice       : ×0.4
 *
 * Trophées :
 *   - On en gagne bien moins que d'XP
 *   - Rendements décroissants : plus le score de trophées de la saison est élevé,
 *     moins on en gagne (formule logarithmique)
 *   - Vérification du max_per_season avant attribution
 *
 * ─── Idempotence ────────────────────────────────────────────────────────────
 *   - Utilise `xp_distributed = 1` sur job_reviews pour éviter une double distribution
 *   - Les entrées dans gamification_reward_ledger ont un UNIQUE KEY sur source_code
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *   const { distributeReviewRewards } = require('../../utils/reviewGamification');
 *   await distributeReviewRewards(connection, reviewId);
 */

'use strict';

/* ─── Multiplicateurs XP par rôle ────────────────────────────────────────── */
const ROLE_MULTIPLIERS = {
  patron:       3.0,
  owner:        3.0,
  prestataire:  2.5,
  freelancer:   2.5,
  manager:      2.0,
  employee:     2.0,
  supervisor:   1.8,
  driver:       1.5,
  offsider:     1.5,
};
const ROLE_MULTIPLIER_DEFAULT = 1.2;

/* ─── Multiplicateurs par type d'entité ──────────────────────────────────── */
const ENTITY_MULTIPLIERS = {
  user:              1.0,   // sera encore multiplié par ROLE_MULTIPLIERS
  company_realizing: 0.6,
  company_creating:  0.4,
};

/* ─── Seuils de trophées ─────────────────────────────────────────────────── */
// Rendements décroissants : bonus_trophies = floor(1 / (1 + season_score / 20))
// Soit :  0-19 pts → 1 trophée base possible, 20-39 → 0.5 (arrondi), etc.
// En pratique, le moteur utilise canEarnTrophy() basé sur probabilité

/**
 * Détermine si l'entité peut encore gagner un trophée
 * en fonction de son score de saison actuel.
 * Rendements décroissants : plus le score est élevé, moins c'est probable.
 *
 * @param {number} seasonScore - Score trophées actuel de l'entité cette saison
 * @returns {boolean}
 */
function canEarnTrophy(seasonScore) {
  // Formule : probabilité = 1 / (1 + seasonScore / 10)
  // Score 0  → 100%, Score 10 → 50%, Score 30 → 25%, Score 100 → ~9%
  const probability = 1 / (1 + seasonScore / 10);
  return Math.random() < probability;
}

/**
 * Récupère ou crée un profil gamification pour une entité.
 *
 * @param {import('mysql2/promise').Connection} conn
 * @param {'user'|'company'} entityType
 * @param {number} entityId
 * @returns {Promise<object>} Le profil
 */
async function getOrCreateProfile(conn, entityType, entityId) {
  const [rows] = await conn.execute(
    'SELECT * FROM gamification_profiles WHERE entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );
  if (rows.length) return rows[0];

  await conn.execute(
    `INSERT IGNORE INTO gamification_profiles (entity_type, entity_id, lifetime_xp, current_level)
     VALUES (?, ?, 0, 1)`,
    [entityType, entityId]
  );
  const [created] = await conn.execute(
    'SELECT * FROM gamification_profiles WHERE entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );
  return created[0] || { lifetime_xp: 0, current_level: 1, current_season_score: 0, entity_type: entityType, entity_id: entityId };
}

/**
 * Calcule le niveau correspondant à un montant de XP total.
 *
 * @param {import('mysql2/promise').Connection} conn
 * @param {number} totalXp
 * @returns {Promise<number>} Numéro du niveau
 */
async function computeLevel(conn, totalXp) {
  const [levels] = await conn.execute(
    'SELECT level, xp_required FROM gamification_levels ORDER BY xp_required DESC'
  );
  for (const lvl of levels) {
    if (totalXp >= lvl.xp_required) return lvl.level;
  }
  return 1;
}

/**
 * Ajoute du XP dans le ledger (idempotent via UNIQUE source_code) et met à jour le profil.
 *
 * @param {import('mysql2/promise').Connection} conn
 * @param {'user'|'company'} entityType
 * @param {number} entityId
 * @param {number} xpAmount
 * @param {string} sourceCode - Code unique d'idempotence
 * @param {string} triggerEvent
 * @param {string} reason
 * @param {number|null} jobId
 * @param {number|null} reviewId
 * @param {object|null} metadata
 */
async function addXp(conn, entityType, entityId, xpAmount, sourceCode, triggerEvent, reason, jobId = null, reviewId = null, metadata = null) {
  if (xpAmount <= 0) return;

  // Insert idempotent dans le ledger
  const [result] = await conn.execute(
    `INSERT IGNORE INTO gamification_reward_ledger
       (entity_type, entity_id, reward_type, amount, source_type, source_code,
        trigger_event, job_id, review_token_id, reason, metadata)
     VALUES (?, ?, 'xp', ?, 'review', ?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, xpAmount, sourceCode, triggerEvent, jobId, reviewId, reason,
     metadata ? JSON.stringify(metadata) : null]
  );

  if (result.affectedRows === 0) return; // déjà distribué

  // Mettre à jour le profil
  const profile = await getOrCreateProfile(conn, entityType, entityId);
  const newXp = (profile.lifetime_xp || 0) + xpAmount;
  const newLevel = await computeLevel(conn, newXp);

  await conn.execute(
    `UPDATE gamification_profiles
     SET lifetime_xp = ?, current_level = ?, updated_at = NOW()
     WHERE entity_type = ? AND entity_id = ?`,
    [newXp, newLevel, entityType, entityId]
  );
}

/**
 * Attribue un trophée à une entité (vérifie les limites et les rendements décroissants).
 *
 * @param {import('mysql2/promise').Connection} conn
 * @param {'user'|'company'} entityType
 * @param {number} entityId
 * @param {string} trophyCode
 * @param {number} jobId
 * @param {number} reviewId
 */
async function awardTrophy(conn, entityType, entityId, trophyCode, jobId, reviewId) {
  // Récupérer la définition du trophée
  const [trophyDefs] = await conn.execute(
    'SELECT * FROM gamification_trophies_def WHERE code = ? AND is_active = 1',
    [trophyCode]
  );
  if (!trophyDefs.length) return;
  const trophy = trophyDefs[0];

  // Récupérer la saison active
  const [seasons] = await conn.execute(
    'SELECT id FROM gamification_seasons WHERE is_active = 1 LIMIT 1'
  );
  if (!seasons.length) return;
  const seasonId = seasons[0].id;

  // Récupérer le profil pour les rendements décroissants
  const profile = await getOrCreateProfile(conn, entityType, entityId);
  const seasonScore = profile.current_season_score || 0;

  // Rendements décroissants
  if (!canEarnTrophy(seasonScore)) return;

  // Vérifier max_per_season
  if (trophy.max_per_season !== null) {
    const [countRows] = await conn.execute(
      `SELECT COUNT(*) AS cnt FROM gamification_trophies_earned
       WHERE entity_type = ? AND entity_id = ? AND season_id = ? AND trophy_code = ?`,
      [entityType, entityId, seasonId, trophyCode]
    );
    if (countRows[0].cnt >= trophy.max_per_season) return;
  }

  // Insérer le trophée
  const [ins] = await conn.execute(
    `INSERT IGNORE INTO gamification_trophies_earned
       (entity_type, entity_id, season_id, trophy_code, job_id, review_id, trophy_weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, seasonId, trophyCode, jobId, reviewId, trophy.rarity_weight]
  );
  if (ins.affectedRows === 0) return;

  // Mettre à jour le score de la saison dans le profil
  await conn.execute(
    `UPDATE gamification_profiles
     SET current_season_score = current_season_score + ?,
         current_season_id    = ?,
         total_trophies_ever  = total_trophies_ever + 1,
         updated_at           = NOW()
     WHERE entity_type = ? AND entity_id = ?`,
    [trophy.rarity_weight, seasonId, entityType, entityId]
  );
}

/**
 * Fonction principale : distribue XP et trophées après soumission d'un avis.
 *
 * @param {import('mysql2/promise').Connection} conn
 * @param {number} reviewId - ID de la row dans job_reviews
 */
async function distributeReviewRewards(conn, reviewId) {
  // ── Charger la review ──────────────────────────────────────────────────────
  const [reviewRows] = await conn.execute(
    `SELECT r.*,
            j.contractor_company_id,
            j.contractee_company_id
     FROM job_reviews r
     JOIN jobs j ON j.id = r.job_id
     WHERE r.id = ? AND r.submitted_at IS NOT NULL AND r.xp_distributed = 0`,
    [reviewId]
  );
  if (!reviewRows.length) return; // déjà distribuée ou pas soumise

  const review = reviewRows[0];
  const jobId            = review.job_id;
  const realizingCompany = review.contractor_company_id; // entreprise qui réalise le job
  const creatingCompany  = review.contractee_company_id || review.company_id; // entreprise créatrice

  // ── Charger les membres de l'équipe terrain ────────────────────────────────
  const [teamMembers] = await conn.execute(
    `SELECT u.id, u.role,
            COALESCE(ja.role, ju.role, u.role) AS job_role
     FROM jobs j
     LEFT JOIN job_assignments ja ON ja.job_id = j.id
               AND ja.resource_type = 'staff'
               AND ja.status = 'confirmed'
     LEFT JOIN job_users ju ON ju.job_id = j.id AND ju.unassigned_at IS NULL
     LEFT JOIN users u ON u.id = COALESCE(ja.resource_id, ju.user_id)
     WHERE j.id = ? AND u.id IS NOT NULL`,
    [jobId]
  );

  // Dédupliquer par user id
  const teamMap = new Map();
  for (const m of teamMembers) {
    if (!teamMap.has(m.id)) teamMap.set(m.id, m.job_role || m.role || 'employee');
  }

  // ── Lire les XP de base depuis la table gamification_xp_rewards ───────────
  const [xpConfig] = await conn.execute(
    'SELECT action_code, xp_amount FROM gamification_xp_rewards WHERE active = 1'
  );
  const XP = {};
  for (const row of xpConfig) XP[row.action_code] = row.xp_amount;

  const xp = (code) => XP[code] || 0;
  const roleMultiplier = (role) => ROLE_MULTIPLIERS[role?.toLowerCase()] || ROLE_MULTIPLIER_DEFAULT;

  // ── Utilitaire : distribuer XP à tous les bénéficiaires ───────────────────
  const R     = review;
  const o     = R.rating_overall     || 0;
  const team  = R.rating_team        || 0;
  const svc   = R.rating_service     || 0;
  const punct = R.rating_punctuality || 0;
  const care  = R.rating_care        || 0;

  const starKey = (base, stars) => {
    if (stars >= 5) return `${base}_5star`;
    if (stars >= 4) return `${base}_4star`;
    if (stars >= 3) return `${base}_3star`;
    return null;
  };

  // ── Distribution OVERALL → tout le monde ─────────────────────────────────
  if (o > 0) {
    const key = starKey('review_overall', o);
    if (key) {
      const baseXp = xp(key);

      // Utilisateurs terrain
      for (const [userId, role] of teamMap) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.user * roleMultiplier(role));
        await addXp(conn, 'user', userId, amount,
          `review_overall_job${jobId}_user${userId}`, 'review_overall',
          `Note globale ${o}★ (job #${jobId})`, jobId, reviewId,
          { rating: o, role });
      }

      // Entreprise réalisatrice
      if (realizingCompany) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_realizing);
        await addXp(conn, 'company', realizingCompany, amount,
          `review_overall_job${jobId}_company${realizingCompany}`, 'review_overall',
          `Note globale ${o}★ reçue (job #${jobId})`, jobId, reviewId, { rating: o });
      }

      // Entreprise créatrice (si différente)
      if (creatingCompany && creatingCompany !== realizingCompany) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_creating);
        await addXp(conn, 'company', creatingCompany, amount,
          `review_overall_job${jobId}_crcompany${creatingCompany}`, 'review_overall',
          `Note globale ${o}★ reçue (job #${jobId})`, jobId, reviewId, { rating: o });
      }
    }
  }

  // ── Distribution TEAM → employés terrain + entreprise réalisatrice ────────
  if (team > 0) {
    const key = starKey('review_team', team);
    if (key) {
      const baseXp = xp(key);

      for (const [userId, role] of teamMap) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.user * roleMultiplier(role));
        await addXp(conn, 'user', userId, amount,
          `review_team_job${jobId}_user${userId}`, 'review_team',
          `Note équipe ${team}★ (job #${jobId})`, jobId, reviewId, { rating: team, role });
      }

      if (realizingCompany) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_realizing);
        await addXp(conn, 'company', realizingCompany, amount,
          `review_team_job${jobId}_company${realizingCompany}`, 'review_team',
          `Note équipe ${team}★ reçue (job #${jobId})`, jobId, reviewId, { rating: team });
      }
    }
  }

  // ── Distribution SERVICE → entreprise créatrice uniquement ───────────────
  if (svc > 0 && creatingCompany) {
    const key = starKey('review_service', svc);
    if (key) {
      const amount = Math.round(xp(key) * ENTITY_MULTIPLIERS.company_creating);
      await addXp(conn, 'company', creatingCompany, amount,
        `review_service_job${jobId}_company${creatingCompany}`, 'review_service',
        `Note service ${svc}★ reçue (job #${jobId})`, jobId, reviewId, { rating: svc });
    }
  }

  // ── Distribution PUNCTUALITY → employés terrain + entreprise réalisatrice ─
  if (punct >= 4) {
    const key = starKey('review_punctuality', punct);
    if (key) {
      const baseXp = xp(key);
      for (const [userId, role] of teamMap) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.user * roleMultiplier(role));
        await addXp(conn, 'user', userId, amount,
          `review_punct_job${jobId}_user${userId}`, 'review_punctuality',
          `Ponctualité ${punct}★ (job #${jobId})`, jobId, reviewId, { rating: punct, role });
      }
      if (realizingCompany) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_realizing);
        await addXp(conn, 'company', realizingCompany, amount,
          `review_punct_job${jobId}_company${realizingCompany}`, 'review_punctuality',
          `Ponctualité ${punct}★ (job #${jobId})`, jobId, reviewId, { rating: punct });
      }
    }
  }

  // ── Distribution CARE → employés terrain + entreprise réalisatrice ────────
  if (care >= 4) {
    const key = starKey('review_care', care);
    if (key) {
      const baseXp = xp(key);
      for (const [userId, role] of teamMap) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.user * roleMultiplier(role));
        await addXp(conn, 'user', userId, amount,
          `review_care_job${jobId}_user${userId}`, 'review_care',
          `Soin matériel ${care}★ (job #${jobId})`, jobId, reviewId, { rating: care, role });
      }
      if (realizingCompany) {
        const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_realizing);
        await addXp(conn, 'company', realizingCompany, amount,
          `review_care_job${jobId}_company${realizingCompany}`, 'review_care',
          `Soin matériel ${care}★ (job #${jobId})`, jobId, reviewId, { rating: care });
      }
    }
  }

  // ── Distribution STAFF INDIVIDUEL ─────────────────────────────────────────
  let staffRatings = [];
  try { staffRatings = JSON.parse(R.staff_ratings || '[]'); } catch { staffRatings = []; }

  for (const sr of staffRatings) {
    const uid = parseInt(sr.user_id || sr.id, 10);
    if (!uid || !sr.rating) continue;
    const memberRole = teamMap.get(uid) || 'employee';
    const ratingVal  = parseInt(sr.rating, 10);
    const adjectives = Array.isArray(sr.adjectives) ? sr.adjectives : [];

    // XP pour note individuelle
    const staffKey = starKey('staff_review', ratingVal);
    if (staffKey) {
      const baseXp = xp(staffKey);
      const amount = Math.round(baseXp * ENTITY_MULTIPLIERS.user * roleMultiplier(memberRole));
      await addXp(conn, 'user', uid, amount,
        `staff_review_job${jobId}_user${uid}`, 'staff_review',
        `Note individuelle ${ratingVal}★ (job #${jobId})`, jobId, reviewId,
        { rating: ratingVal, role: memberRole });

      // La note individuelle bénéficie aussi à l'entreprise réalisatrice (partiel)
      if (realizingCompany) {
        const compAmount = Math.round(baseXp * ENTITY_MULTIPLIERS.company_realizing * 0.5);
        await addXp(conn, 'company', realizingCompany, compAmount,
          `staff_review_job${jobId}_user${uid}_comp${realizingCompany}`, 'staff_review',
          `Note individuelle ${ratingVal}★ d'un employé (job #${jobId})`, jobId, reviewId,
          { rating: ratingVal, user_id: uid });
      }
    }

    // XP pour adjectifs positifs (cap à 5 par personne)
    const adjCapped = adjectives.slice(0, 5);
    if (adjCapped.length > 0) {
      const adjXp = xp('staff_positive_adj') * adjCapped.length;
      await addXp(conn, 'user', uid,
        Math.round(adjXp * ENTITY_MULTIPLIERS.user * roleMultiplier(memberRole)),
        `staff_adj_job${jobId}_user${uid}`, 'staff_adjectives',
        `${adjCapped.length} adjectif(s) positif(s) (job #${jobId})`, jobId, reviewId,
        { adjectives: adjCapped });
    }
  }

  // ── Trophées ───────────────────────────────────────────────────────────────
  // 5 étoiles globales → trophée review_5star pour tous
  if (o === 5) {
    for (const [userId] of teamMap) {
      await awardTrophy(conn, 'user', userId, 'review_5star', jobId, reviewId);
    }
    if (realizingCompany) {
      await awardTrophy(conn, 'company', realizingCompany, 'review_5star', jobId, reviewId);
    }
    if (creatingCompany && creatingCompany !== realizingCompany) {
      await awardTrophy(conn, 'company', creatingCompany, 'review_5star', jobId, reviewId);
    }

    // Perfect score : tous les critères à 5 ?
    const allPerfect = [team, svc, punct, care].every(v => !v || v === 5);
    if (allPerfect) {
      for (const [userId] of teamMap) {
        await awardTrophy(conn, 'user', userId, 'review_perfect', jobId, reviewId);
      }
      if (realizingCompany) {
        await awardTrophy(conn, 'company', realizingCompany, 'review_perfect', jobId, reviewId);
      }
    }

    // Team spirit : tous les membres notés 5 individuellement
    const allStaff5 = staffRatings.length > 0 && staffRatings.every(s => parseInt(s.rating, 10) === 5);
    if (allStaff5) {
      for (const [userId] of teamMap) {
        await awardTrophy(conn, 'user', userId, 'team_spirit', jobId, reviewId);
      }
    }
  }

  // Note individuelle 5 étoiles → trophée top_team_mention
  for (const sr of staffRatings) {
    if (parseInt(sr.rating, 10) === 5) {
      const uid = parseInt(sr.user_id || sr.id, 10);
      if (uid) await awardTrophy(conn, 'user', uid, 'top_team_mention', jobId, reviewId);
    }
  }

  // Service 5 étoiles → trophée service_excellence
  if (svc === 5 && creatingCompany) {
    await awardTrophy(conn, 'company', creatingCompany, 'service_excellence', jobId, reviewId);
  }

  // ── Mettre à jour les stats du profil gamification ─────────────────────────
  // total_reviews_received, total_5star_reviews, avg_review_overall pour la company
  const statsUpdates = [];
  const statsTargets = new Set();
  if (realizingCompany) statsTargets.add(`company_${realizingCompany}`);
  if (creatingCompany)  statsTargets.add(`company_${creatingCompany}`);

  for (const key of statsTargets) {
    const [type, id] = key.split('_');
    const entityId = parseInt(id, 10);
    await conn.execute(
      `UPDATE gamification_profiles
       SET total_reviews_received = total_reviews_received + 1,
           total_5star_reviews    = total_5star_reviews + IF(? = 5, 1, 0),
           avg_review_overall     = (
             SELECT ROUND(AVG(rating_overall), 2)
             FROM job_reviews
             WHERE company_id = ? AND submitted_at IS NOT NULL
           ),
           updated_at = NOW()
       WHERE entity_type = 'company' AND entity_id = ?`,
      [o, entityId, entityId]
    );
  }

  // ── Marquer la review comme distribuée ─────────────────────────────────────
  await conn.execute(
    'UPDATE job_reviews SET xp_distributed = 1, xp_distributed_at = NOW() WHERE id = ?',
    [reviewId]
  );

  console.log(`[reviewGamification] Rewards distributed for review ${reviewId} (job #${jobId})`);
}

module.exports = { distributeReviewRewards };

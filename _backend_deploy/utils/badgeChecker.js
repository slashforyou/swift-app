'use strict';

/**
 * badgeChecker.js — Évalue et attribue automatiquement les badges à un utilisateur.
 *
 * Usage (fire-and-forget depuis gamificationEngine.js) :
 *   const { checkBadges } = require('./badgeChecker');
 *   await checkBadges(userId, conn);
 *
 * Le `conn` est fourni par le fireAndForget caller — ne pas le fermer ici.
 */

const { sendPushToUser, insertNotification } = require('./pushHelper');

/**
 * Évalue les conditions de tous les badges actifs et attribue ceux que
 * l'utilisateur a débloqués mais n'a pas encore reçus.
 *
 * @param {number} userId
 * @param {import('mysql2/promise').Connection} conn  — connexion existante
 */
async function checkBadges(userId, conn) {
  if (!userId || !conn) return;

  try {
    // ── 1. Charger tous les badges actifs
    const [badges] = await conn.execute(
      'SELECT * FROM gamification_badge_definitions WHERE is_active = 1'
    );
    if (!badges.length) return;

    // ── 2. Charger les badges déjà obtenus
    const [alreadyEarned] = await conn.execute(
      'SELECT badge_code FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedSet = new Set(alreadyEarned.map(r => r.badge_code));

    // ── 3. Stats du profil utilisateur (niveau, streak, five_star, jobs)
    const [[profile]] = await conn.execute(
      `SELECT current_level, current_streak_days,
              total_jobs_completed, total_5star_reviews
       FROM gamification_profiles
       WHERE entity_type = 'user' AND entity_id = ?`,
      [userId]
    );
    if (!profile) return; // Pas encore de profil gamification

    // ── 4. Comptage par rôle (driver / offsider) depuis job_users
    const [[roleStats]] = await conn.execute(
      `SELECT
         COALESCE(SUM(role = 'driver'),   0) AS driver_jobs,
         COALESCE(SUM(role = 'offsider'), 0) AS offsider_jobs
       FROM job_users
       WHERE user_id = ? AND unassigned_at IS NULL`,
      [userId]
    );

    // ── 5. Jobs business (total de l'entreprise de l'utilisateur)
    const [[userRow]] = await conn.execute(
      'SELECT company_id FROM users WHERE id = ?',
      [userId]
    );
    let businessJobs = 0;
    if (userRow?.company_id) {
      const [[bizProfile]] = await conn.execute(
        `SELECT total_jobs_completed
         FROM gamification_profiles
         WHERE entity_type = 'company' AND entity_id = ?`,
        [userRow.company_id]
      );
      businessJobs = bizProfile?.total_jobs_completed ?? 0;
    }

    // ── Dictionnaire de stats évaluables
    const stats = {
      level_reached:   profile.current_level       || 0,
      streak_days:     profile.current_streak_days  || 0,
      five_star_count: profile.total_5star_reviews  || 0,
      jobs_count:      profile.total_jobs_completed  || 0,
      driver_jobs:     parseInt(roleStats?.driver_jobs   || 0, 10),
      offsider_jobs:   parseInt(roleStats?.offsider_jobs || 0, 10),
      business_jobs:   businessJobs,
      // referral_count et perfect_days : non implémentés (extension future)
    };

    // ── 6. Évaluer chaque badge
    for (const badge of badges) {
      if (earnedSet.has(badge.code)) continue;           // Déjà obtenu
      if (badge.requirement_type === 'custom') continue;  // Attribution manuelle uniquement
      if (!badge.requirement_value) continue;

      const current = stats[badge.requirement_type];
      if (current === undefined) continue;               // Type non supporté

      if (current >= badge.requirement_value) {
        // INSERT IGNORE → atomique, pas de doublons grâce au unique_user_badge
        const [result] = await conn.execute(
          `INSERT IGNORE INTO user_badges
             (user_id, badge_code, badge_name, description, earned_at, notified_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [userId, badge.code, badge.name, badge.description]
        );

        if (result.affectedRows > 0) {
          const icon = badge.icon || '🏅';
          // Push + notification in-app (non-bloquant)
          sendPushToUser(conn, userId, `${icon} Nouveau badge débloqué !`, badge.name, {
            type: 'badge_earned',
            badge_code: badge.code,
            screen: 'Badges',
          }).catch(() => {});

          insertNotification(
            conn, userId, 'badge_earned',
            `${icon} Nouveau badge : ${badge.name}`,
            badge.description,
            null, 'normal', { badge_code: badge.code }
          ).catch(() => {});

          console.log(`[badgeChecker] ✅ Badge ${badge.code} → user ${userId}`);
        }
      }
    }
  } catch (err) {
    console.warn('[badgeChecker] Non-blocking error:', err.message);
  }
}

module.exports = { checkBadges };

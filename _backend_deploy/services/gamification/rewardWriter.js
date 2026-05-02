/**
 * Gamification Reward Writer
 * Écritures idempotentes : XP, trophées, badges, level-up
 * 
 * Tables réelles utilisées :
 *   gamification_xp_events     — historique XP (créée par migration 068)
 *   gamification_profiles      — profil XP/level/streak (existante)
 *   gamification_levels        — config levels (existante, enrichie par 068)
 *   gamification_badge_unlocks — badges débloqués (créée par migration 068)
 *   gamification_badge_definitions — catalogue badges (existante)
 *   trophy_events              — historique trophées (existante)
 *   trophy_ledgers             — compteur trophées (existante + colonnes v2 via 068)
 *   level_rewards              — récompenses par level (créée par migration 068)
 *   unlocked_rewards           — récompenses débloquées (créée par migration 068)
 */
const { connect } = require('../../swiftDb');

/**
 * Accorde des XP à une entité (idempotent via source_type + source_id)
 * @returns {Object|null} { xpAdded, leveledUp, newLevel } ou null si doublon
 */
async function awardXP(entityType, entityId, sourceType, sourceId, amount, metadata = {}) {
  let connection;
  try {
    connection = await connect();

    // Insertion idempotente
    const [ins] = await connection.execute(
      `INSERT IGNORE INTO gamification_xp_events (entity_type, entity_id, xp_amount, source_type, source_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entityType, entityId, amount, sourceType, sourceId, JSON.stringify(metadata)]
    );

    if (ins.affectedRows === 0) return null; // doublon

    // S'assurer que le profil existe
    await connection.execute(
      `INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, current_level)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE lifetime_xp = lifetime_xp + ?`,
      [entityType, entityId, amount, amount]
    );

    // Vérifier level-up
    const [[profile]] = await connection.execute(
      `SELECT lifetime_xp, current_level FROM gamification_profiles
       WHERE entity_type = ? AND entity_id = ?`,
      [entityType, entityId]
    );

    const [[nextLevel]] = await connection.execute(
      `SELECT level FROM gamification_levels
       WHERE xp_required <= ? ORDER BY level DESC LIMIT 1`,
      [profile.lifetime_xp]
    );

    const newLevel = nextLevel ? nextLevel.level : 1;
    const leveledUp = newLevel > profile.current_level;

    if (leveledUp) {
      await connection.execute(
        `UPDATE gamification_profiles SET current_level = ? WHERE entity_type = ? AND entity_id = ?`,
        [newLevel, entityType, entityId]
      );
      // Distribuer les récompenses de level
      await _grantLevelRewards(connection, entityType, entityId, profile.current_level + 1, newLevel);
    }

    return { xpAdded: amount, leveledUp, newLevel };
  } catch (err) {
    console.error('[RewardWriter] awardXP error:', err.message);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Accorde des trophées à une entité (idempotent)
 */
async function awardTrophies(entityType, entityId, sourceType, sourceId, amount, periodKey, metadata = {}) {
  let connection;
  try {
    connection = await connect();

    const [ins] = await connection.execute(
      `INSERT IGNORE INTO trophy_events (entity_type, entity_id, trophy_amount, source_type, source_id, season_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entityType, entityId, amount, sourceType, sourceId, periodKey]
    );

    if (ins.affectedRows === 0) return null; // doublon

    // Mettre à jour le ledger — une ligne par période (UNIQUE sur season_key)
    const periods = _getPeriodsFromKey();
    for (const p of periods) {
      await connection.execute(
        `INSERT INTO trophy_ledgers (entity_type, entity_id, season_key, period_type, period_key, trophies, trophies_earned)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE trophies = trophies + ?, trophies_earned = trophies_earned + ?`,
        [entityType, entityId, p.key, p.type, p.key, amount, amount, amount, amount]
      );
    }
    return { trophiesAdded: amount };
  } catch (err) {
    console.error('[RewardWriter] awardTrophies error:', err.message);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Débloque un badge (idempotent)
 * @returns {boolean} true si nouveau badge, false si doublon
 */
async function unlockBadge(entityType, entityId, badgeCode, sourceJobId = null) {
  let connection;
  try {
    connection = await connect();

    // Récupérer badge_id (obligatoire NOT NULL)
    const [[badgeDef]] = await connection.execute(
      `SELECT id FROM gamification_badge_definitions WHERE code = ?`, [badgeCode]
    );
    if (!badgeDef) {
      console.warn(`[RewardWriter] Badge inconnu: ${badgeCode}`);
      return false;
    }

    const [ins] = await connection.execute(
      `INSERT IGNORE INTO gamification_badge_unlocks (entity_type, entity_id, badge_id, badge_code, source_job_id)
       VALUES (?, ?, ?, ?, ?)`,
      [entityType, entityId, badgeDef.id, badgeCode, sourceJobId]
    );

    if (ins.affectedRows === 0) return false; // déjà débloqué

    // Accorder le bonus XP du badge
    const [[badge]] = await connection.execute(
      `SELECT xp_bonus FROM gamification_badge_definitions WHERE code = ? AND is_active = 1`,
      [badgeCode]
    );
    if (badge && badge.xp_bonus > 0) {
      await awardXP(entityType, entityId, 'badge', badgeCode, badge.xp_bonus, { badge_code: badgeCode });
    }

    return true;
  } catch (err) {
    console.error('[RewardWriter] unlockBadge error:', err.message);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * S'assure qu'un profil gamification existe pour l'entité
 */
async function ensureProfile(entityType, entityId) {
  let connection;
  try {
    connection = await connect();
    await connection.execute(
      `INSERT IGNORE INTO gamification_profiles (entity_type, entity_id) VALUES (?, ?)`,
      [entityType, entityId]
    );
  } catch (err) {
    console.error('[RewardWriter] ensureProfile error:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

// ─── HELPERS ────────────────────────────────────────────────

async function _grantLevelRewards(connection, entityType, entityId, fromLevel, toLevel) {
  for (let lvl = fromLevel; lvl <= toLevel; lvl++) {
    const [rewards] = await connection.execute(
      `SELECT id FROM level_rewards WHERE level = ?`, [lvl]
    );
    for (const reward of rewards) {
      await connection.execute(
        `INSERT IGNORE INTO unlocked_rewards (entity_type, entity_id, reward_id) VALUES (?, ?, ?)`,
        [entityType, entityId, reward.id]
      );
    }
  }
}

function _getPeriodsFromKey() {
  // Retourne weekly + monthly + yearly + alltime comme season_key distincts
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const weekNum = _getWeekNumber(now);
  const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
  const monthKey = `${year}-${month}`;
  const yearKey = `${year}`;

  return [
    { type: 'weekly', key: weekKey },
    { type: 'monthly', key: monthKey },
    { type: 'yearly', key: yearKey },
    { type: 'alltime', key: 'alltime' },
  ];
}

function _getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

module.exports = { awardXP, awardTrophies, unlockBadge, ensureProfile };

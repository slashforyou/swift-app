'use strict';
/**
 * utils/questEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Moteur de quêtes Gamification V2.
 *
 * Appelé depuis gamificationEngine.js après chaque action.
 * Met à jour gamification_quest_progress selon les quêtes actives.
 *
 * Exports:
 *   processQuestEvent(entityType, entityId, eventTrigger, conn)
 *   claimQuestReward(entityId, questCode, periodKey, conn) → { ok, xp, trophies }
 */

const { connect } = require('../swiftDb');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Period keys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la clé de période pour un type de quête donné.
 * Format:
 *   daily   → daily_2026-04-25
 *   weekly  → weekly_2026-W17
 *   monthly → monthly_2026-04
 *   intro   → general  (quêtes one-time à vie)
 *   event   → event_<eventId>  (scoped à l'événement)
 *   général → general
 *
 * @param {string} type       Type de quête (daily/weekly/monthly/intro/event)
 * @param {number|null} eventId  ID de l'événement (obligatoire si type === 'event')
 */
function getPeriodKey(type, eventId = null) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');

  if (type === 'daily')   return `daily_${yyyy}-${mm}-${dd}`;
  if (type === 'weekly') {
    // ISO week number
    const jan4 = new Date(yyyy, 0, 4);
    const dayOfYear = Math.floor((now - jan4) / 86400000) + jan4.getDay() + 1;
    const week = String(Math.ceil(dayOfYear / 7)).padStart(2, '0');
    return `weekly_${yyyy}-W${week}`;
  }
  if (type === 'monthly') return `monthly_${yyyy}-${mm}`;
  if (type === 'intro')   return 'general'; // quête one-time, pas de renouvellement
  if (type === 'event')   return eventId ? `event_${eventId}` : 'general';
  return 'general'; // general / onboarding (legacy)
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE — processQuestEvent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pour chaque quête active correspondant à l'event déclenché :
 *   - Crée une entrée dans gamification_quest_progress si elle n'existe pas
 *   - Incrémente current_count
 *   - Marque completed si current_count >= target_count
 *
 * @param {'user'|'company'} entityType
 * @param {number}           entityId
 * @param {string}           eventTrigger  ex: 'job_completed', 'photo_added'
 * @param {object}           conn          connexion DB déjà ouverte
 */
async function processQuestEvent(entityType, entityId, eventTrigger, conn) {
  if (!entityType || !entityId || !eventTrigger) return;

  try {
    // 1. Charger les quêtes actives correspondant à cet event
    const [quests] = await conn.execute(
      `SELECT id, code, type, category, target_count, repeatable, entity_scope, event_id
       FROM quests
       WHERE active = 1
         AND event_trigger = ?
         AND entity_scope = ?`,
      [eventTrigger, entityType]
    );

    if (!quests.length) return;

    for (const quest of quests) {
      const questType = quest.category || quest.type; // category est canonique, type est l'alias
      const periodKey = getPeriodKey(questType, quest.event_id || null);

      // 2. Charger la progression existante pour cette période
      const [rows] = await conn.execute(
        `SELECT id, current_count, target_count, status
         FROM gamification_quest_progress
         WHERE quest_code = ? AND entity_type = ? AND entity_id = ? AND period_key = ?`,
        [quest.code, entityType, entityId, periodKey]
      );

      if (rows.length === 0) {
        // Première fois sur cette quête/période → INSERT
        await conn.execute(
          `INSERT INTO gamification_quest_progress
             (quest_id, quest_code, entity_type, entity_id, period_key, current_count, target_count, status)
           VALUES (?, ?, ?, ?, ?, 1, ?, 'in_progress')
           ON DUPLICATE KEY UPDATE
             current_count = current_count,
             updated_at = NOW()`,
          [quest.id, quest.code, entityType, entityId, periodKey, quest.target_count]
        );

        // Vérifier si déjà complété avec 1 seule action
        if (quest.target_count <= 1) {
          await conn.execute(
            `UPDATE gamification_quest_progress
             SET status = 'completed', completed_at = NOW()
             WHERE quest_code = ? AND entity_type = ? AND entity_id = ? AND period_key = ? AND status = 'in_progress'`,
            [quest.code, entityType, entityId, periodKey]
          );
        }
      } else {
        const progress = rows[0];

        // Ignorer si déjà complété/claimed/expired
        if (progress.status !== 'in_progress') continue;

        const newCount = progress.current_count + 1;

        await conn.execute(
          `UPDATE gamification_quest_progress
           SET current_count = ?, updated_at = NOW()
           WHERE id = ?`,
          [newCount, progress.id]
        );

        if (newCount >= progress.target_count) {
          await conn.execute(
            `UPDATE gamification_quest_progress
             SET status = 'completed', completed_at = NOW()
             WHERE id = ? AND status = 'in_progress'`,
            [progress.id]
          );
        }
      }
    }
  } catch (err) {
    console.error('[questEngine] processQuestEvent error:', eventTrigger, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE — claimQuestReward
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Réclame la récompense d'une quête complétée.
 * Distribue XP via gamification_reward_ledger (idempotent).
 *
 * @returns {{ ok: boolean, xp: number, trophies: number, error?: string }}
 */
async function claimQuestReward(entityId, questCode, periodKey) {
  let conn;
  try {
    conn = await connect();

    // 1. Vérifier que la quête existe et est complétée
    const [rows] = await conn.execute(
      `SELECT gqp.id AS progress_id, gqp.status,
              q.xp_reward, q.trophy_reward, q.title,
              COALESCE(gqe.xp_bonus_multiplier, 1.0) AS xp_bonus_multiplier
       FROM gamification_quest_progress gqp
       JOIN quests q ON q.code = gqp.quest_code
       LEFT JOIN gamification_quest_events gqe ON gqe.id = q.event_id
       WHERE gqp.quest_code = ?
         AND gqp.entity_type = 'user'
         AND gqp.entity_id = ?
         AND gqp.period_key = ?`,
      [questCode, entityId, periodKey]
    );

    if (!rows.length) {
      return { ok: false, error: 'Quest progress not found' };
    }

    const progress = rows[0];

    if (progress.status === 'claimed') {
      return { ok: false, error: 'Already claimed' };
    }
    if (progress.status !== 'completed') {
      return { ok: false, error: 'Quest not completed yet' };
    }

    const xp       = Math.round((progress.xp_reward || 0) * (progress.xp_bonus_multiplier || 1.0));
    const trophies = progress.trophy_reward || 0;
    const claimKey = `quest_claim_${questCode}_${periodKey}_user${entityId}`;

    // 2. Distribuer XP (idempotent via source_code)
    if (xp > 0) {
      const [xpResult] = await conn.execute(
        `INSERT IGNORE INTO gamification_reward_ledger
           (entity_type, entity_id, reward_type, amount,
            source_type, source_code, trigger_event, reason, created_at)
         VALUES ('user', ?, 'xp', ?, 'quest', ?, 'quest_claimed', ?, NOW())`,
        [entityId, xp, claimKey, `Quest claimed: ${progress.title}`]
      );

      if (xpResult.affectedRows > 0) {
        // Sync profile XP
        await conn.execute(
          `INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, updated_at)
           VALUES ('user', ?, ?, NOW())
           ON DUPLICATE KEY UPDATE lifetime_xp = lifetime_xp + VALUES(lifetime_xp), updated_at = NOW()`,
          [entityId, xp]
        );

        // Sync legacy users.experience
        await conn.execute(
          'UPDATE users SET experience = COALESCE(experience, 0) + ? WHERE id = ?',
          [xp, entityId]
        );
      }
    }

    // 3. Distribuer trophées (dans total_trophies de gamification_profiles)
    if (trophies > 0) {
      await conn.execute(
        `INSERT INTO gamification_profiles (entity_type, entity_id, total_trophies, updated_at)
         VALUES ('user', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE total_trophies = COALESCE(total_trophies, 0) + ?, updated_at = NOW()`,
        [entityId, trophies, trophies]
      );
    }

    // 4. Marquer comme claimed
    await conn.execute(
      `UPDATE gamification_quest_progress
       SET status = 'claimed', claimed_at = NOW()
       WHERE id = ? AND status = 'completed'`,
      [progress.progress_id]
    );

    return { ok: true, xp, trophies };
  } catch (err) {
    console.error('[questEngine] claimQuestReward error:', questCode, err.message);
    return { ok: false, error: 'internal' };
  } finally {
    try { conn?.release?.() ?? conn?.end?.(); } catch (_) {}
  }
}

module.exports = { processQuestEvent, getPeriodKey };
module.exports.claimQuestReward = claimQuestReward;

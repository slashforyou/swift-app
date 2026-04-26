/**
 * Trophy Season Cron — Archive les trophées de la saison terminée
 *
 * Runs:
 *   - Jan 1 à 00:05  → archive la saison Été N-1 (jul–déc)
 *   - Jul 1 à 00:05  → archive la saison Hiver N (jan–jun)
 *
 * Usage in index.js:
 *   require('./cron/trophySeasonCron');
 */

const cron = require('node-cron');
const { connect } = require('../swiftDb');
const { sendPushToUser } = require('../utils/pushHelper');

/**
 * Retourne la saison qui vient de se terminer (season_key + meta).
 * Appelé au début de chaque nouvelle saison :
 *  - Jan 1 → on archive season_summer_(année-1)
 *  - Jul 1 → on archive season_winter_(année courante)
 *
 * @param {Date} now
 */
function getPreviousSeason(now = new Date()) {
  const year  = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  if (month === 1) {
    // Début de nouvelle année → on vient de finir l'Été de l'année précédente
    const prevYear = year - 1;
    return {
      key:  `season_summer_${prevYear}`,
      name: `Saison Été ${prevYear}`,
      icon: 'sunny',
    };
  }
  // month === 7 → on vient de finir l'Hiver de l'année courante
  return {
    key:  `season_winter_${year}`,
    name: `Saison Hiver ${year}`,
    icon: 'snowflake',
  };
}

/**
 * Archive la saison terminée :
 *  1. Calcule les rangs via RANK() OVER
 *  2. INSERT INTO trophy_season_archives (IGNORE pour idempotence)
 *  3. Envoie une push à chaque user avec son bilan
 */
async function archivePreviousSeason() {
  const season = getPreviousSeason();
  console.log(`[trophySeasonCron] Archivage de ${season.key}…`);

  let conn;
  try {
    conn = await connect();

    // 1. Calculer les rangs pour entityType = 'user'
    const [rows] = await conn.execute(
      `SELECT
         entity_type,
         entity_id,
         trophies,
         RANK() OVER (PARTITION BY entity_type ORDER BY trophies DESC) AS \`rank\`
       FROM trophy_ledgers
       WHERE season_key = ?
       ORDER BY entity_type, trophies DESC`,
      [season.key]
    );

    if (!rows.length) {
      console.log(`[trophySeasonCron] Aucune entrée dans trophy_ledgers pour ${season.key}, skip.`);
      return;
    }

    // 2. Archiver chaque entrée (INSERT IGNORE pour idempotence)
    for (const row of rows) {
      await conn.execute(
        `INSERT IGNORE INTO trophy_season_archives
           (entity_type, entity_id, season_key, season_name, season_icon, trophies, rank)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.entity_type, row.entity_id, season.key, season.name, season.icon, row.trophies, row.rank]
      );
    }

    console.log(`[trophySeasonCron] ${rows.length} entité(s) archivée(s) pour ${season.key}.`);

    // 3. Push notifications aux users
    const userRows = rows.filter(r => r.entity_type === 'user');
    let notified = 0;

    for (const row of userRows) {
      const title = `Fin de ${season.name}`;
      const body  = `Tu as terminé avec ${row.trophies} trophée${row.trophies > 1 ? 's' : ''} (rang #${row.rank}) !`;
      try {
        await sendPushToUser(conn, row.entity_id, title, body, {
          type:       'trophy_season_archived',
          season_key: season.key,
          trophies:   row.trophies,
          rank:       row.rank,
        });
        notified++;
      } catch (pushErr) {
        console.warn(`[trophySeasonCron] Push échouée user ${row.entity_id}:`, pushErr.message);
      }
    }

    console.log(`[trophySeasonCron] ${notified}/${userRows.length} push envoyées.`);
  } catch (err) {
    console.error('[trophySeasonCron] Erreur archivage saison:', err);
  } finally {
    if (conn) conn.release?.();
  }
}

// ── Planification ──────────────────────────────────────────────────────────
// Jan 1 à 00:05 → archiver saison Été précédente
cron.schedule('5 0 1 1 *', () => {
  console.log('[trophySeasonCron] Jan 1 → archivage saison Été');
  archivePreviousSeason().catch(err => console.error('[trophySeasonCron] Fatal:', err));
});

// Jul 1 à 00:05 → archiver saison Hiver
cron.schedule('5 0 1 7 *', () => {
  console.log('[trophySeasonCron] Jul 1 → archivage saison Hiver');
  archivePreviousSeason().catch(err => console.error('[trophySeasonCron] Fatal:', err));
});

module.exports = { archivePreviousSeason, getPreviousSeason };

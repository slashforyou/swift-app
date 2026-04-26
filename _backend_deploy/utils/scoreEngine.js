/**
 * scoreEngine.js — Génère le scorecard d'un job après sa complétion
 * Critères : photos avant/après, signature client, notes, étapes, équipe, camion
 */

const { connect } = require('../../swiftDb');

/**
 * Génère (ou re-génère) le scorecard d'un job
 * @param {number} jobId
 * @returns {Promise<{total_score, max_score, percentage, checkpoints}>}
 */
const generateScorecard = async (jobId) => {
  let connection;
  try {
    connection = await connect();

    // Charger tous les checkpoints actifs
    const [checkpoints] = await connection.execute(
      'SELECT * FROM job_checkpoints WHERE is_active = 1'
    );

    if (!checkpoints.length) {
      return null;
    }

    // Données du job nécessaires pour les vérifications
    const [[photoRows], [sigRows], [noteRows], [stepRows], [crewRows], [truckRows]] = await Promise.all([
      connection.execute(
        `SELECT image_type, COUNT(*) as cnt
           FROM job_images
          WHERE job_id = ?
          GROUP BY image_type`,
        [jobId]
      ),
      connection.execute(
        `SELECT signature_type FROM job_signatures WHERE job_id = ? AND signature_type = 'client' LIMIT 1`,
        [jobId]
      ),
      connection.execute(
        `SELECT COUNT(*) as cnt FROM job_notes WHERE job_id = ?`,
        [jobId]
      ),
      connection.execute(
        `SELECT COUNT(*) as total, SUM(is_completed) as done
           FROM job_step_history WHERE job_id = ?`,
        [jobId]
      ),
      connection.execute(
        `SELECT COUNT(*) as cnt FROM job_users WHERE job_id = ? AND unassigned_at IS NULL`,
        [jobId]
      ),
      connection.execute(
        `SELECT COUNT(*) as cnt FROM job_trucks WHERE job_id = ? AND unassigned_at IS NULL`,
        [jobId]
      ),
    ]);

    const photoMap = {};
    photoRows.forEach(r => { photoMap[r.image_type] = r.cnt; });

    // Évaluer chaque checkpoint
    const results = [];
    for (const cp of checkpoints) {
      let passed = false;
      let valueText = null;

      switch (cp.code) {
        case 'photo_before': {
          const cnt = (photoMap['before'] || 0);
          passed = cnt >= 1;
          valueText = `${cnt} photo(s)`;
          break;
        }
        case 'photo_after': {
          const cnt = (photoMap['after'] || 0);
          passed = cnt >= 1;
          valueText = `${cnt} photo(s)`;
          break;
        }
        case 'signature_client':
          passed = sigRows.length > 0;
          break;
        case 'note_added':
          passed = (noteRows[0]?.cnt || 0) >= 1;
          valueText = `${noteRows[0]?.cnt || 0} note(s)`;
          break;
        case 'steps_completed': {
          const total = stepRows[0]?.total || 0;
          const done  = stepRows[0]?.done  || 0;
          passed = total > 0 && done >= total;
          valueText = `${done}/${total}`;
          break;
        }
        case 'crew_assigned':
          passed = (crewRows[0]?.cnt || 0) >= 1;
          valueText = `${crewRows[0]?.cnt || 0} membre(s)`;
          break;
        case 'truck_assigned':
          passed = (truckRows[0]?.cnt || 0) >= 1;
          break;
        default:
          passed = false;
      }

      results.push({
        checkpoint_id: cp.id,
        code:          cp.code,
        label_fr:      cp.label_fr,
        label_en:      cp.label_en,
        category:      cp.category,
        weight:        cp.weight,
        passed,
        value_text: valueText,
      });
    }

    // Calcul du score
    const maxScore   = results.reduce((acc, r) => acc + r.weight, 0);
    const totalScore = results.filter(r => r.passed).reduce((acc, r) => acc + r.weight, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Upsert scorecard
    await connection.execute(
      `INSERT INTO job_scorecards (job_id, total_score, max_score, percentage)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_score = VALUES(total_score),
         max_score   = VALUES(max_score),
         percentage  = VALUES(percentage),
         generated_at = NOW()`,
      [jobId, totalScore, maxScore, percentage]
    );

    // Upsert résultats par checkpoint
    for (const r of results) {
      await connection.execute(
        `INSERT INTO job_checkpoint_results (job_id, checkpoint_id, passed, value_text)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           passed     = VALUES(passed),
           value_text = VALUES(value_text),
           checked_at = NOW()`,
        [jobId, r.checkpoint_id, r.passed ? 1 : 0, r.value_text]
      );
    }

    return { total_score: totalScore, max_score: maxScore, percentage, checkpoints: results };

  } catch (err) {
    console.error('[scoreEngine] generateScorecard error:', err.message);
    return null;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { generateScorecard };

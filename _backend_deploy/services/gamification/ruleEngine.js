/**
 * Rule Engine
 * Pipeline central : événement → quêtes → badges → streak → scorecard
 */
const scoreEngine = require('./scoreEngine');
const badgeChecker = require('./badgeChecker');
const rewardWriter = require('./rewardWriter');
const { connect } = require('../../swiftDb');

/**
 * Traite un événement métier gamification
 * Appelé par eventBus via le listener
 */
async function processEvent(event) {
  const entityType = event.entity_type || (event.user_id ? 'user' : 'company');
  const entityId = event.entity_id || event.user_id || event.company_id;

  // S'assurer que le profil existe
  if (entityType && entityId) {
    await rewardWriter.ensureProfile(entityType, entityId);
    if (event.company_id && entityType !== 'company') {
      await rewardWriter.ensureProfile('company', event.company_id);
    }
  }

  // 1. Badges : vérifier conditions de déblocage
  await badgeChecker.checkBadges(event);

  // 2. Streak : mettre à jour si job terminé
  if (event.type === 'job.completed') {
    if (event.user_id) {
      await _updateStreak(event.user_id);
    }
  }

  // 3. Scorecard : générer si job terminé
  if (event.type === 'job.completed' && event.job_id) {
    await scoreEngine.generateScorecard(event.job_id, event.participants || []);
  }

  // 4. Review client : intégrer dans scorecard
  if (event.type === 'client_review.submitted' && event.review_id) {
    await scoreEngine.integrateClientReview(event.review_id);
  }

  // 5. Onboarding complété : XP bonus
  if (event.type === 'onboarding.completed' && event.user_id) {
    await rewardWriter.awardXP('user', event.user_id, 'onboarding', `onboarding_${event.user_id}`, 75, {});
  }

  // 6. Photo ajoutée : XP petit bonus
  if (event.type === 'photo.added' && event.user_id && event.job_id) {
    await rewardWriter.awardXP(
      'user', event.user_id, 'photo', `photo_${event.job_id}_${event.photo_count || Date.now()}`,
      3, { job_id: event.job_id }
    );
  }
}

// ─── STREAK TRACKING ────────────────────────────────────────

async function _updateStreak(userId) {
  let connection;
  try {
    connection = await connect();

    const [[profile]] = await connection.execute(
      `SELECT current_streak_days, longest_streak_days, last_active_date
       FROM gamification_profiles WHERE entity_type = 'user' AND entity_id = ?`,
      [userId]
    );

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (!profile) return;

    const lastActive = profile.last_active_date
      ? new Date(profile.last_active_date).toISOString().split('T')[0]
      : null;

    if (lastActive === today) return; // déjà compté aujourd'hui

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak;
    if (lastActive === yesterdayStr) {
      newStreak = profile.current_streak_days + 1;
    } else {
      newStreak = 1; // streak cassée
    }

    const newLongest = Math.max(newStreak, profile.longest_streak_days || 0);

    await connection.execute(
      `UPDATE gamification_profiles
       SET current_streak_days = ?, longest_streak_days = ?, last_active_date = ?
       WHERE entity_type = 'user' AND entity_id = ?`,
      [newStreak, newLongest, today, userId]
    );

    // Émettre un event streak si seuil atteint (7, 30, 100)
    const milestones = [7, 14, 30, 50, 100];
    if (milestones.includes(newStreak)) {
      // L'event bus appellerait checkBadges, mais on les check directement ici
      await badgeChecker.checkBadges({
        type: 'streak.reached',
        user_id: userId,
        entity_type: 'user',
        entity_id: userId,
        streak_days: newStreak,
      });
    }
  } catch (err) {
    console.error('[RuleEngine] _updateStreak error:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { processEvent };

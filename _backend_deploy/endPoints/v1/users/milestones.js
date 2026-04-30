/**
 * Onboarding Milestones Endpoints
 *
 * GET   /swift-app/v1/users/me/onboarding-milestones        — Liste les milestones débloqués
 * POST  /swift-app/v1/users/me/onboarding-milestones        — Débloque un milestone (idempotent)
 * PATCH /swift-app/v1/users/me/onboarding-milestones/:name/shown — Marque l'animation comme jouée
 *
 * Milestones valides :
 *   first_job_created    → XP bar + trophées visibles sur Home
 *   first_job_started    → Onglet Timer dans JobDetails
 *   first_job_completed  → Badge "First Move"
 *   team_assigned        → Section staffing avancée
 *   stripe_activated     → Onglet Paiement visible
 *
 * Sécurité : user_id et company_id toujours issus de req.user (JWT), jamais du body.
 */

const pool = require('../../../swiftDb');

const VALID_MILESTONES = new Set([
  'first_job_created',
  'first_job_started',
  'first_job_completed',
  'team_assigned',
  'stripe_activated',
]);

// ─── GET /users/me/onboarding-milestones ──────────────────────────────────────

const getOnboardingMilestones = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const [rows] = await pool.execute(
      `SELECT milestone, unlocked_at, shown_at
       FROM user_onboarding_milestones
       WHERE user_id = ?
       ORDER BY unlocked_at ASC`,
      [userId]
    );

    return res.json({
      success: true,
      data: { milestones: rows },
    });
  } catch (error) {
    console.error('[onboarding-milestones] GET error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── POST /users/me/onboarding-milestones ─────────────────────────────────────

const unlockOnboardingMilestone = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;

    if (!userId || !companyId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { milestone } = req.body;

    if (!milestone || !VALID_MILESTONES.has(milestone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid milestone. Valid values: ${[...VALID_MILESTONES].join(', ')}`,
      });
    }

    // Upsert — ignore si déjà existant (UNIQUE KEY uq_user_milestone)
    await pool.execute(
      `INSERT IGNORE INTO user_onboarding_milestones (user_id, company_id, milestone)
       VALUES (?, ?, ?)`,
      [userId, companyId, milestone]
    );

    return res.status(201).json({ success: true, milestone });
  } catch (error) {
    console.error('[onboarding-milestones] POST error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── PATCH /users/me/onboarding-milestones/:name/shown ────────────────────────

const markOnboardingMilestoneShown = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const milestoneName = req.params.name;

    if (!milestoneName || !VALID_MILESTONES.has(milestoneName)) {
      return res.status(400).json({ success: false, error: 'Invalid milestone name' });
    }

    const [result] = await pool.execute(
      `UPDATE user_onboarding_milestones
       SET shown_at = NOW()
       WHERE user_id = ? AND milestone = ? AND shown_at IS NULL`,
      [userId, milestoneName]
    );

    if (result.affectedRows === 0) {
      // Already shown or doesn't exist — not an error
      return res.json({ success: true, alreadyShown: true });
    }

    return res.json({ success: true, milestone: milestoneName });
  } catch (error) {
    console.error('[onboarding-milestones] PATCH shown error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── Helper : débloque un milestone en interne (appelé par d'autres endpoints) ──

/**
 * Débloque un milestone silencieusement depuis un autre endpoint.
 * Ne lève pas d'erreur si le milestone est déjà présent.
 *
 * @param {number} userId
 * @param {number} companyId
 * @param {string} milestone
 */
const unlockMilestone = async (userId, companyId, milestone) => {
  if (!userId || !companyId || !VALID_MILESTONES.has(milestone)) return;
  try {
    await pool.execute(
      `INSERT IGNORE INTO user_onboarding_milestones (user_id, company_id, milestone)
       VALUES (?, ?, ?)`,
      [userId, companyId, milestone]
    );
  } catch (err) {
    // Ne pas faire planter l'endpoint appelant
    console.error(`[unlockMilestone] Failed to unlock ${milestone} for user ${userId}:`, err.message);
  }
};

module.exports = {
  getOnboardingMilestones,
  unlockOnboardingMilestone,
  markOnboardingMilestoneShown,
  unlockMilestone,
};

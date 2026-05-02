/**
 * Gamification V2 — API Endpoints (Phase 1)
 * 
 * GET  /v1/gamification/profile          → Profil XP + level + streak + badges
 * GET  /v1/gamification/xp/history       → Historique XP paginé
 * GET  /v1/gamification/badges           → Badges débloqués + catalogue
 * GET  /v1/gamification/leaderboard      → Classement trophées (weekly)
 * GET  /v1/gamification/scorecard/:jobId → Scorecard d'un job
 * POST /v1/gamification/client-review    → Soumettre une review client
 * GET  /v1/gamification/client-review/:token → Charger form review (public)
 */
const { connect } = require('../../swiftDb');
const { authenticateToken } = require('../../middlewares/auth');
const crypto = require('crypto');

// ─── GET /v1/gamification/profile ────────────────────────────────────────────
const getProfile = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const companyId = req.user.company_id;

      // Profil user
      const [[userProfile]] = await connection.execute(
        `SELECT gp.*, gl.title as level_title
         FROM gamification_profiles gp
         LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
         WHERE gp.entity_type = 'user' AND gp.entity_id = ?`,
        [userId]
      );

      // Profil company
      const [[companyProfile]] = await connection.execute(
        `SELECT gp.*, gl.title as level_title
         FROM gamification_profiles gp
         LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
         WHERE gp.entity_type = 'company' AND gp.entity_id = ?`,
        [companyId]
      );

      // Prochain level XP requis
      const currentLevel = userProfile ? userProfile.current_level : 1;
      const [[nextLevel]] = await connection.execute(
        `SELECT level, xp_required FROM gamification_levels WHERE level = ?`,
        [currentLevel + 1]
      );

      // Badges débloqués (count)
      const [[badgeCount]] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM gamification_badge_unlocks
         WHERE entity_type = 'user' AND entity_id = ?`,
        [userId]
      );

      // League actuelle (basée sur trophées alltime)
      const [[trophyRow]] = await connection.execute(
        `SELECT trophies_earned FROM trophy_ledgers
         WHERE entity_type = 'user' AND entity_id = ? AND period_type = 'alltime'`,
        [userId]
      );
      const totalTrophies = trophyRow ? trophyRow.trophies_earned : 0;
      const [[league]] = await connection.execute(
        `SELECT code, label, icon, color FROM league_tiers
         WHERE min_trophies <= ? ORDER BY min_trophies DESC LIMIT 1`,
        [totalTrophies]
      );

      return res.json({
        success: true,
        profile: {
          user: userProfile || { entity_type: 'user', entity_id: userId, lifetime_xp: 0, current_level: 1, level_title: 'Newcomer' },
          company: companyProfile || { entity_type: 'company', entity_id: companyId, lifetime_xp: 0, current_level: 1, level_title: 'Newcomer' },
          next_level_xp: nextLevel ? nextLevel.xp_required : null,
          badges_unlocked: badgeCount ? badgeCount.cnt : 0,
          total_trophies: totalTrophies,
          league: league || { code: 'unranked', label: 'Unranked', icon: '⚪', color: '#808080' },
        },
      });
    } catch (err) {
      console.error('[GamificationV2] getProfile error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/xp/history ─────────────────────────────────────────
const getXpHistory = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = parseInt(req.query.offset) || 0;

      const [events] = await connection.execute(
        `SELECT xp_amount, source_type, source_id, metadata, created_at
         FROM gamification_xp_events
         WHERE entity_type = 'user' AND entity_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [[total]] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM gamification_xp_events
         WHERE entity_type = 'user' AND entity_id = ?`,
        [userId]
      );

      return res.json({
        success: true,
        events,
        total: total ? total.cnt : 0,
        limit,
        offset,
      });
    } catch (err) {
      console.error('[GamificationV2] getXpHistory error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/badges ─────────────────────────────────────────────
const getBadges = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const companyId = req.user.company_id;

      // Tous les badges actifs
      const [allBadges] = await connection.execute(
        `SELECT badge_code, name, description, icon, category, entity_scope, rarity, xp_bonus, sort_order
         FROM gamification_badges WHERE active = 1 ORDER BY sort_order`
      );

      // Badges débloqués pour user
      const [userUnlocked] = await connection.execute(
        `SELECT badge_code, unlocked_at FROM gamification_badge_unlocks
         WHERE entity_type = 'user' AND entity_id = ?`,
        [userId]
      );

      // Badges débloqués pour company
      const [companyUnlocked] = await connection.execute(
        `SELECT badge_code, unlocked_at FROM gamification_badge_unlocks
         WHERE entity_type = 'company' AND entity_id = ?`,
        [companyId]
      );

      const userUnlockedMap = {};
      userUnlocked.forEach(u => { userUnlockedMap[u.badge_code] = u.unlocked_at; });
      const companyUnlockedMap = {};
      companyUnlocked.forEach(u => { companyUnlockedMap[u.badge_code] = u.unlocked_at; });

      const badges = allBadges.map(b => ({
        ...b,
        unlocked_at_user: userUnlockedMap[b.badge_code] || null,
        unlocked_at_company: companyUnlockedMap[b.badge_code] || null,
        is_unlocked: !!(userUnlockedMap[b.badge_code] || companyUnlockedMap[b.badge_code]),
      }));

      return res.json({ success: true, badges });
    } catch (err) {
      console.error('[GamificationV2] getBadges error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/leaderboard ────────────────────────────────────────
const getLeaderboard = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const companyId = req.user.company_id;
      const periodType = req.query.period || 'weekly';
      const entityType = req.query.entity || 'user';
      const VALID_PERIODS = ['weekly', 'monthly', 'yearly', 'alltime'];
      const VALID_ENTITIES = ['user', 'company'];

      if (!VALID_PERIODS.includes(periodType) || !VALID_ENTITIES.includes(entityType)) {
        return res.status(400).json({ success: false, error: 'Invalid period or entity' });
      }

      // Calcul de la clé de période courante
      const periodKey = _getCurrentPeriodKey(periodType);

      let query;
      let params;

      if (entityType === 'user') {
        // Leaderboard users de la même company
        query = `
          SELECT tl.entity_id as user_id, u.first_name, u.last_name, u.profile_picture,
                 tl.trophies_earned,
                 gp.current_level, gl.title as level_title,
                 RANK() OVER (ORDER BY tl.trophies_earned DESC) as rank_position
          FROM trophy_ledgers tl
          JOIN users u ON u.id = tl.entity_id
          LEFT JOIN gamification_profiles gp ON gp.entity_type = 'user' AND gp.entity_id = tl.entity_id
          LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
          WHERE tl.entity_type = 'user' AND tl.period_type = ? AND tl.period_key = ?
            AND u.company_id = ?
          ORDER BY tl.trophies_earned DESC LIMIT 50`;
        params = [periodType, periodKey, companyId];
      } else {
        // Leaderboard companies (global)
        query = `
          SELECT tl.entity_id as company_id, c.name as company_name,
                 tl.trophies_earned,
                 gp.current_level, gl.title as level_title,
                 RANK() OVER (ORDER BY tl.trophies_earned DESC) as rank_position
          FROM trophy_ledgers tl
          JOIN companies c ON c.id = tl.entity_id
          LEFT JOIN gamification_profiles gp ON gp.entity_type = 'company' AND gp.entity_id = tl.entity_id
          LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
          WHERE tl.entity_type = 'company' AND tl.period_type = ? AND tl.period_key = ?
          ORDER BY tl.trophies_earned DESC LIMIT 50`;
        params = [periodType, periodKey];
      }

      const [rows] = await connection.execute(query, params);

      return res.json({
        success: true,
        leaderboard: rows,
        period_type: periodType,
        period_key: periodKey,
        entity_type: entityType,
      });
    } catch (err) {
      console.error('[GamificationV2] getLeaderboard error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/scorecard/:jobId ────────────────────────────────────
const getJobScorecard = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const jobId = parseInt(req.params.jobId);
      const companyId = req.user.company_id;

      // Vérifier accès au job
      const [[job]] = await connection.execute(
        `SELECT id FROM jobs WHERE id = ? AND company_id = ?`,
        [jobId, companyId]
      );
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

      const [[scorecard]] = await connection.execute(
        `SELECT * FROM job_scorecards WHERE job_id = ?`,
        [jobId]
      );

      const [checkpointResults] = await connection.execute(
        `SELECT jcr.*, jc.code, jc.label, jc.category, jc.xp_reward
         FROM job_checkpoint_results jcr
         JOIN job_checkpoints jc ON jc.id = jcr.checkpoint_id
         WHERE jcr.job_id = ?`,
        [jobId]
      );

      return res.json({
        success: true,
        scorecard: scorecard || null,
        checkpoint_results: checkpointResults,
      });
    } catch (err) {
      console.error('[GamificationV2] getJobScorecard error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── POST /v1/gamification/client-review ─────────────────────────────────────
const submitClientReview = async (req, res) => {
  // Endpoint public (pas d'auth JWT) — authentifié via review_token
  let connection;
  try {
    const { token, overall_rating, time_rating, service_rating, communication_rating,
            price_rating, comment, would_recommend, external_publish_consent } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token required' });
    }
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      return res.status(400).json({ success: false, error: 'overall_rating must be 1-5' });
    }

    connection = await connect();

    // Vérifier le token
    const [[review]] = await connection.execute(
      `SELECT id, job_id, submitted_at FROM client_reviews_v2 WHERE review_token = ?`,
      [token]
    );
    if (!review) return res.status(404).json({ success: false, error: 'Invalid token' });
    if (review.submitted_at) return res.status(409).json({ success: false, error: 'Review already submitted' });

    await connection.execute(
      `UPDATE client_reviews_v2
       SET overall_rating = ?, time_rating = ?, service_rating = ?,
           communication_rating = ?, price_rating = ?, comment = ?,
           would_recommend = ?, external_publish_consent = ?, submitted_at = NOW()
       WHERE id = ?`,
      [overall_rating, time_rating || null, service_rating || null,
       communication_rating || null, price_rating || null,
       comment ? comment.substring(0, 2000) : null,
       would_recommend != null ? (would_recommend ? 1 : 0) : null,
       external_publish_consent ? 1 : 0, review.id]
    );

    // Déclencher l'intégration dans scorecard via eventBus (async)
    try {
      const eventBus = require('../../services/gamification/eventBus');
      eventBus.emit('client_review.submitted', { review_id: review.id, job_id: review.job_id });
    } catch (_) {}

    return res.json({ success: true, message: 'Review submitted. Thank you!' });
  } catch (err) {
    console.error('[GamificationV2] submitClientReview error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET /v1/gamification/client-review/:token ───────────────────────────────
const getClientReviewForm = async (req, res) => {
  let connection;
  try {
    const { token } = req.params;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    connection = await connect();

    const [[review]] = await connection.execute(
      `SELECT cr.id, cr.job_id, cr.submitted_at,
              j.client_name, j.address_from
       FROM client_reviews_v2 cr
       JOIN jobs j ON j.id = cr.job_id
       WHERE cr.review_token = ?`,
      [token]
    );

    if (!review) return res.status(404).json({ success: false, error: 'Invalid or expired token' });

    return res.json({
      success: true,
      already_submitted: !!review.submitted_at,
      job: {
        id: review.job_id,
        client_name: review.client_name,
        address: review.address_from,
      },
    });
  } catch (err) {
    console.error('[GamificationV2] getClientReviewForm error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /v1/gamification/client-review/create ──────────────────────────────
// Créer un lien de review pour un job (app mobile, authentifié)
const createClientReviewLink = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      const { job_id, client_email, client_name } = req.body;
      const companyId = req.user.company_id;

      if (!job_id) return res.status(400).json({ success: false, error: 'job_id required' });

      connection = await connect();

      // Vérifier accès
      const [[job]] = await connection.execute(
        `SELECT id FROM jobs WHERE id = ? AND company_id = ?`,
        [job_id, companyId]
      );
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

      // Créer ou récupérer le token existant
      const [[existing]] = await connection.execute(
        `SELECT id, review_token FROM client_reviews_v2 WHERE job_id = ?`,
        [job_id]
      );

      if (existing) {
        return res.json({
          success: true,
          review_id: existing.id,
          token: existing.review_token,
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const [ins] = await connection.execute(
        `INSERT INTO client_reviews_v2 (job_id, review_token, overall_rating, client_email, client_name)
         VALUES (?, ?, 0, ?, ?)`,
        [job_id, token, client_email || null, client_name || null]
      );

      return res.status(201).json({
        success: true,
        review_id: ins.insertId,
        token,
      });
    } catch (err) {
      console.error('[GamificationV2] createClientReviewLink error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function _getCurrentPeriodKey(periodType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  switch (periodType) {
    case 'weekly': {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    case 'monthly': return `${year}-${month}`;
    case 'yearly': return `${year}`;
    case 'alltime': return 'alltime';
    default: return 'alltime';
  }
}

module.exports = {
  getProfile,
  getXpHistory,
  getBadges,
  getLeaderboard,
  getJobScorecard,
  submitClientReview,
  getClientReviewForm,
  createClientReviewLink,
};

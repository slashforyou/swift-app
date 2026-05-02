'use strict';
/**
 * Gamification V2 — Foundation Endpoints (Phase 1)
 *
 * Routes mountées dans index.js :
 *   GET  /swift-app/v1/gamification/profile
 *   GET  /swift-app/v1/gamification/xp/history
 *   GET  /swift-app/v1/gamification/badges
 *   GET  /swift-app/v1/gamification/leaderboard
 *   GET  /swift-app/v1/gamification/scorecard/:jobId
 *   GET  /swift-app/v1/gamification/client-review/:token
 *   POST /swift-app/v1/gamification/client-review
 *   POST /swift-app/v1/gamification/client-review/create
 */
const { connect } = require('../../swiftDb');
const { authenticateToken } = require('../../middleware/authenticateToken');
const crypto = require('crypto');

// ─── GET /v1/gamification/profile ─────────────────────────────────────────────
const getProfile = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const companyId = req.user.company_id;

      const [[userProfile]] = await connection.execute(
        `SELECT gp.*, gl.title as level_title, gl.xp_required as level_xp_required
         FROM gamification_profiles gp
         LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
         WHERE gp.entity_type = 'user' AND gp.entity_id = ?`,
        [userId]
      );

      const [[companyProfile]] = await connection.execute(
        `SELECT gp.*, gl.title as level_title
         FROM gamification_profiles gp
         LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
         WHERE gp.entity_type = 'company' AND gp.entity_id = ?`,
        [companyId]
      );

      const currentLevel = userProfile ? userProfile.current_level : 1;
      const [[nextLevel]] = await connection.execute(
        `SELECT level, xp_required FROM gamification_levels WHERE level = ?`,
        [currentLevel + 1]
      );

      const [[badgeCount]] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM gamification_badge_unlocks
         WHERE entity_type = 'user' AND entity_id = ?`,
        [userId]
      );

      // Trophées alltime
      const [[trophyRow]] = await connection.execute(
        `SELECT trophies FROM trophy_ledgers
         WHERE entity_type = 'user' AND entity_id = ? AND season_key = 'alltime'`,
        [userId]
      );
      const totalTrophies = trophyRow ? trophyRow.trophies : 0;

      // League courante
      const [[league]] = await connection.execute(
        `SELECT code, label, icon, color FROM league_tiers
         WHERE min_trophies <= ? ORDER BY min_trophies DESC LIMIT 1`,
        [totalTrophies]
      );

      return res.json({
        success: true,
        profile: {
          user: userProfile || {
            entity_type: 'user', entity_id: userId,
            lifetime_xp: 0, current_level: 1, level_title: 'Newcomer',
            current_streak_days: 0, longest_streak_days: 0,
          },
          company: companyProfile || {
            entity_type: 'company', entity_id: companyId,
            lifetime_xp: 0, current_level: 1, level_title: 'Newcomer',
          },
          next_level_xp: nextLevel ? nextLevel.xp_required : null,
          badges_unlocked: badgeCount ? badgeCount.cnt : 0,
          total_trophies: totalTrophies,
          league: league || { code: 'unranked', label: 'Unranked', icon: '⚪', color: '#808080' },
        },
      });
    } catch (err) {
      console.error('[GamV2Foundation] getProfile error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/xp/history ──────────────────────────────────────────
const getXpHistory = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);

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

      return res.json({ success: true, events, total: total ? total.cnt : 0, limit, offset });
    } catch (err) {
      console.error('[GamV2Foundation] getXpHistory error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/badges ──────────────────────────────────────────────
const getBadges = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const userId = req.user.id;
      const companyId = req.user.company_id;

      const [allBadges] = await connection.execute(
        `SELECT code as badge_code, name, description, icon, category, xp_bonus, sort_order
         FROM gamification_badge_definitions
         WHERE is_active = 1 ORDER BY sort_order`
      );

      const [userUnlocked] = await connection.execute(
        `SELECT badge_code, unlocked_at FROM gamification_badge_unlocks
         WHERE entity_type = 'user' AND entity_id = ?`,
        [userId]
      );

      const [companyUnlocked] = await connection.execute(
        `SELECT badge_code, unlocked_at FROM gamification_badge_unlocks
         WHERE entity_type = 'company' AND entity_id = ?`,
        [companyId]
      );

      const userMap = {};
      userUnlocked.forEach(u => { userMap[u.badge_code] = u.unlocked_at; });
      const companyMap = {};
      companyUnlocked.forEach(u => { companyMap[u.badge_code] = u.unlocked_at; });

      const badges = allBadges.map(b => ({
        ...b,
        unlocked_at_user: userMap[b.badge_code] || null,
        unlocked_at_company: companyMap[b.badge_code] || null,
        is_unlocked: !!(userMap[b.badge_code] || companyMap[b.badge_code]),
      }));

      return res.json({ success: true, badges });
    } catch (err) {
      console.error('[GamV2Foundation] getBadges error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/leaderboard ─────────────────────────────────────────
const getLeaderboard = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      connection = await connect();
      const companyId = req.user.company_id;
      const periodType = req.query.period || 'weekly';
      const entityType = req.query.entity || 'user';

      const VALID = ['weekly', 'monthly', 'yearly', 'alltime'];
      if (!VALID.includes(periodType)) {
        return res.status(400).json({ success: false, error: 'Invalid period' });
      }

      const seasonKey = _getSeasonKey(periodType);

      let rows;
      if (entityType === 'user') {
        [rows] = await connection.execute(
          `SELECT tl.entity_id as user_id,
                  u.first_name, u.last_name, u.profile_picture,
                  COALESCE(tl.trophies, 0) as trophies,
                  COALESCE(gp.current_level, 1) as current_level,
                  gl.title as level_title
           FROM trophy_ledgers tl
           JOIN users u ON u.id = tl.entity_id
           LEFT JOIN gamification_profiles gp ON gp.entity_type = 'user' AND gp.entity_id = tl.entity_id
           LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
           WHERE tl.entity_type = 'user' AND tl.season_key = ?
             AND u.company_id = ?
           ORDER BY tl.trophies DESC LIMIT 50`,
          [seasonKey, companyId]
        );
      } else {
        [rows] = await connection.execute(
          `SELECT tl.entity_id as company_id,
                  c.name as company_name,
                  COALESCE(tl.trophies, 0) as trophies,
                  COALESCE(gp.current_level, 1) as current_level,
                  gl.title as level_title
           FROM trophy_ledgers tl
           JOIN companies c ON c.id = tl.entity_id
           LEFT JOIN gamification_profiles gp ON gp.entity_type = 'company' AND gp.entity_id = tl.entity_id
           LEFT JOIN gamification_levels gl ON gl.level = gp.current_level
           WHERE tl.entity_type = 'company' AND tl.season_key = ?
           ORDER BY tl.trophies DESC LIMIT 50`,
          [seasonKey]
        );
      }

      // Ajouter le rang
      const leaderboard = rows.map((r, i) => ({ ...r, rank_position: i + 1 }));

      return res.json({ success: true, leaderboard, period_type: periodType, season_key: seasonKey, entity_type: entityType });
    } catch (err) {
      console.error('[GamV2Foundation] getLeaderboard error:', err.message);
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

      if (!jobId || isNaN(jobId)) return res.status(400).json({ success: false, error: 'Invalid jobId' });

      const [[job]] = await connection.execute(
        `SELECT id FROM jobs WHERE id = ? AND (company_id = ? OR contractor_company_id = ? OR contractee_company_id = ?)`,
        [jobId, companyId, companyId, companyId]
      );
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

      const [[scorecard]] = await connection.execute(
        `SELECT * FROM job_scorecards WHERE job_id = ?`,
        [jobId]
      );

      const [checkpointResults] = await connection.execute(
        `SELECT jcr.checkpoint_id, jcr.passed, jcr.score,
                jc.code, jc.label_fr, jc.label_en, jc.category, jc.xp_reward, jc.weight
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
      console.error('[GamV2Foundation] getJobScorecard error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── GET /v1/gamification/client-review/:token (public) ───────────────────────
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
              CONCAT(COALESCE(j.contact_first_name,''), ' ', COALESCE(j.contact_last_name,'')) as client_name
       FROM client_reviews cr
       JOIN jobs j ON j.id = cr.job_id
       WHERE cr.token = ?`,
      [token]
    );

    if (!review) return res.status(404).json({ success: false, error: 'Invalid or expired token' });

    return res.json({
      success: true,
      already_submitted: !!review.submitted_at,
      job: {
        id: review.job_id,
        client_name: review.client_name ? review.client_name.trim() : '',
      },
    });
  } catch (err) {
    console.error('[GamV2Foundation] getClientReviewForm error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /v1/gamification/client-review (public) ─────────────────────────────
const submitClientReview = async (req, res) => {
  let connection;
  try {
    const { token, overall_rating, service_rating, team_rating, comment } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token required' });
    }
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      return res.status(400).json({ success: false, error: 'overall_rating must be 1-5' });
    }

    connection = await connect();

    const [[review]] = await connection.execute(
      `SELECT id, job_id, submitted_at FROM client_reviews WHERE token = ?`,
      [token]
    );
    if (!review) return res.status(404).json({ success: false, error: 'Invalid token' });
    if (review.submitted_at) return res.status(409).json({ success: false, error: 'Review already submitted' });

    const ip = req.ip || req.connection.remoteAddress || null;
    await connection.execute(
      `UPDATE client_reviews
       SET rating_overall = ?, rating_service = ?, rating_team = ?,
           comment = ?, submitted_at = NOW(), ip_address = ?
       WHERE id = ?`,
      [
        overall_rating,
        service_rating || null,
        team_rating || null,
        comment ? String(comment).substring(0, 2000) : null,
        ip ? ip.substring(0, 45) : null,
        review.id,
      ]
    );

    // Déclencher via eventBus (fire-and-forget)
    try {
      const eventBus = require('../../services/gamification/eventBus');
      eventBus.emit('client_review.submitted', { review_id: review.id, job_id: review.job_id });
    } catch (_) {}

    return res.json({ success: true, message: 'Review submitted. Thank you!' });
  } catch (err) {
    console.error('[GamV2Foundation] submitClientReview error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /v1/gamification/client-review/create (auth) ────────────────────────
const createClientReviewLink = [
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      const { job_id } = req.body;
      const companyId = req.user.company_id;

      if (!job_id) return res.status(400).json({ success: false, error: 'job_id required' });

      connection = await connect();

      const [[job]] = await connection.execute(
        `SELECT id FROM jobs WHERE id = ? AND (company_id = ? OR contractor_company_id = ? OR contractee_company_id = ?)`,
        [job_id, companyId, companyId, companyId]
      );
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

      // Token existant ?
      const [[existing]] = await connection.execute(
        `SELECT id, token FROM client_reviews WHERE job_id = ?`,
        [job_id]
      );
      if (existing) {
        return res.json({ success: true, review_id: existing.id, token: existing.token });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const [ins] = await connection.execute(
        `INSERT INTO client_reviews (job_id, token) VALUES (?, ?)`,
        [job_id, token]
      );

      return res.status(201).json({ success: true, review_id: ins.insertId, token });
    } catch (err) {
      console.error('[GamV2Foundation] createClientReviewLink error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function _getSeasonKey(periodType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  switch (periodType) {
    case 'weekly': {
      const d = new Date(Date.UTC(year, now.getMonth(), now.getDate()));
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
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
  getClientReviewForm,
  submitClientReview,
  createClientReviewLink,
};

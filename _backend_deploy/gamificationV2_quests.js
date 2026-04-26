'use strict';

// endPoints/v1/gamificationV2.js

// Gamification V2 API — profile, leaderboard par periode, historique XP



const { getUserByToken } = require('../database/user');

const { connect } = require('../../swiftDb');

const { getCurrentSeason } = require('../../utils/gamificationEngine');



// ─── GET /swift-app/v1/user/gamification/v2/profile ─────────────────────────

const getV2ProfileEndpoint = async (req, res) => {

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });



  let connection;

  try {

    const userResponse = await getUserByToken(token);

    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });

    const userId = userResponse.user.id;



    connection = await connect();

    const [rows] = await connection.query(`

      SELECT

        gp.total_xp, gp.total_trophies, gp.current_streak_days, gp.longest_streak_days,

        gp.jobs_completed_count, gp.photos_uploaded_count, gp.signatures_collected_count,

        gp.notes_added_count, gp.reviews_received_count,

        gp.last_active_date, gp.updated_at,

        u.level, u.experience,

        gl.label AS level_label, gl.min_xp AS level_min_xp, gl.max_xp AS level_max_xp,

        gr.label AS rank_label, gr.icon_url AS rank_icon

      FROM gamification_profiles gp

      JOIN users u ON u.id = gp.entity_id

      LEFT JOIN gamification_levels gl ON gl.level_number = u.level

      LEFT JOIN gamification_ranks gr ON gr.id = (

        SELECT id FROM gamification_ranks

        WHERE min_trophies <= gp.total_trophies

        ORDER BY min_trophies DESC LIMIT 1

      )

      WHERE gp.entity_type = 'user' AND gp.entity_id = ?

    `, [userId]);



    const profile = rows[0] || {

      total_xp: 0, total_trophies: 0, current_streak_days: 0, longest_streak_days: 0,

      jobs_completed_count: 0, photos_uploaded_count: 0, signatures_collected_count: 0,

      notes_added_count: 0, reviews_received_count: 0

    };

    res.json({ ok: true, data: profile });

  } catch (e) {

    console.error('[gamifV2 profile]', e);

    res.status(500).json({ ok: false, error: 'internal' });

  } finally {

    if (connection) connection.release();

  }

};



// ─── GET /swift-app/v1/user/gamification/v2/leaderboard ─────────────────────

const getV2LeaderboardEndpoint = async (req, res) => {

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });



  const { period = 'all_time' } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);

  const limit = 20;

  const offset = (page - 1) * limit;



  let dateFilter = '';

  if (period === 'weekly')  dateFilter = "AND grl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";

  if (period === 'monthly') dateFilter = "AND grl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";



  let connection;

  try {

    const userResponse = await getUserByToken(token);

    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });



    connection = await connect();

    const [rows] = await connection.query(

      `SELECT

        u.id, u.first_name, u.last_name, u.profile_picture_url,

        COALESCE(SUM(grl.xp_awarded), 0) AS period_xp,

        COALESCE(gp.total_trophies, 0) AS total_trophies,

        COALESCE(gp.current_streak_days, 0) AS current_streak_days,

        COALESCE(u.level, 1) AS level,

        gr.label AS rank_label

      FROM gamification_reward_ledger grl

      JOIN users u ON u.id = grl.entity_id AND grl.entity_type = 'user'

      LEFT JOIN gamification_profiles gp ON gp.entity_type = 'user' AND gp.entity_id = u.id

      LEFT JOIN gamification_ranks gr ON gr.id = (

        SELECT id FROM gamification_ranks

        WHERE min_trophies <= COALESCE(gp.total_trophies, 0)

        ORDER BY min_trophies DESC LIMIT 1

      )

      WHERE 1=1 ` + dateFilter + `

      GROUP BY u.id

      ORDER BY period_xp DESC

      LIMIT ? OFFSET ?`,

    [limit, offset]);



    res.json({ ok: true, data: rows, page, period });

  } catch (e) {

    console.error('[gamifV2 leaderboard]', e);

    res.status(500).json({ ok: false, error: 'internal' });

  } finally {

    if (connection) connection.release();

  }

};



// ─── GET /swift-app/v1/user/gamification/v2/history ─────────────────────────

const getV2HistoryEndpoint = async (req, res) => {

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });



  const page = Math.max(1, parseInt(req.query.page) || 1);

  const limit = 50;

  const offset = (page - 1) * limit;



  let connection;

  try {

    const userResponse = await getUserByToken(token);

    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });

    const userId = userResponse.user.id;



    connection = await connect();

    const [rows] = await connection.query(`

      SELECT action_code, xp_awarded, reference_type, reference_id, created_at

      FROM gamification_reward_ledger

      WHERE entity_type = 'user' AND entity_id = ?

      ORDER BY created_at DESC

      LIMIT ? OFFSET ?

    `, [userId, limit, offset]);

    res.json({ ok: true, data: rows, page });

  } catch (e) {

    console.error('[gamifV2 history]', e);

    res.status(500).json({ ok: false, error: 'internal' });

  } finally {

    if (connection) connection.release();

  }

};




// ─── GET /swift-app/v1/user/gamification/v2/quests ──────────────────────────
const getV2QuestsEndpoint = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  let connection;
  try {
    const userResponse = await getUserByToken(token);
    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    const userId = userResponse.user.id;

    const { getPeriodKey } = require('../../utils/questEngine');
    const dailyKey   = getPeriodKey('daily');
    const weeklyKey  = getPeriodKey('weekly');
    const monthlyKey = getPeriodKey('monthly');

    connection = await connect();
    const [rows] = await connection.query(
      `SELECT
         q.id, q.code, q.title, q.description, q.icon,
         q.type, q.category, q.xp_reward, q.trophy_reward, q.trophy_count,
         q.target_count, q.event_trigger, q.sort_order,
         q.end_date, q.event_id,
         COALESCE(gqp.current_count, 0)  AS current_count,
         COALESCE(gqp.status, 'not_started') AS status,
         gqp.period_key,
         gqp.completed_at, gqp.claimed_at,
         gqe.name  AS event_name,
         gqe.icon  AS event_icon,
         gqe.color AS event_color,
         gqe.xp_bonus_multiplier AS event_xp_mult,
         gqe.end_date AS event_end_date
       FROM quests q
       LEFT JOIN gamification_quest_events gqe
         ON gqe.id = q.event_id
       LEFT JOIN gamification_quest_progress gqp
         ON gqp.quest_code = q.code
        AND gqp.entity_type = 'user'
        AND gqp.entity_id   = ?
        AND gqp.period_key  = CASE q.category
              WHEN 'daily'   THEN ?
              WHEN 'weekly'  THEN ?
              WHEN 'monthly' THEN ?
              WHEN 'intro'   THEN 'general'
              WHEN 'event'   THEN CONCAT('event_', q.event_id)
              ELSE 'general'
            END
       WHERE q.active = 1
       ORDER BY
         FIELD(gqp.status, 'completed', 'in_progress', NULL, 'claimed') ASC,
         q.sort_order ASC`,
      [userId, dailyKey, weeklyKey, monthlyKey]
    );

    // Construire event_info pour chaque quête de type event
    const data = rows.map(row => {
      const quest = {
        id:            row.id,
        code:          row.code,
        title:         row.title,
        description:   row.description,
        icon:          row.icon,
        type:          row.category || row.type,
        category:      row.category || row.type,
        xp_reward:     row.xp_reward,
        trophy_reward: row.trophy_reward,
        trophy_count:  row.trophy_count || 0,
        target_count:  row.target_count,
        event_trigger: row.event_trigger,
        sort_order:    row.sort_order,
        current_count: row.current_count,
        status:        row.status,
        period_key:    row.period_key,
        completed_at:  row.completed_at,
        claimed_at:    row.claimed_at,
        end_date:      row.end_date,
        event_info:    null,
      };

      if (row.event_id && row.event_name) {
        quest.event_info = {
          name:                row.event_name,
          icon:                row.event_icon,
          color:               row.event_color,
          xp_bonus_multiplier: parseFloat(row.event_xp_mult) || 1.0,
          end_date:            row.event_end_date,
        };
      }

      return quest;
    });

    res.json({
      ok: true,
      data,
      periods: { daily: dailyKey, weekly: weeklyKey, monthly: monthlyKey }
    });
  } catch (e) {
    console.error('[gamifV2 quests]', e);
    res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── POST /swift-app/v1/user/gamification/v2/quests/:questCode/claim ─────────
const claimV2QuestEndpoint = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  const { questCode } = req.params;
  const { period_key: periodKey } = req.body;

  if (!questCode) return res.status(400).json({ ok: false, error: 'Missing questCode' });
  if (!periodKey)  return res.status(400).json({ ok: false, error: 'Missing period_key' });

  // Valider le format period_key pour éviter les injections
  if (!/^(daily_\d{4}-\d{2}-\d{2}|weekly_\d{4}-W\d{2}|monthly_\d{4}-\d{2}|general|event_\d+)$/.test(periodKey)) {
    return res.status(400).json({ ok: false, error: 'Invalid period_key format' });
  }

  try {
    const userResponse = await getUserByToken(token);
    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    const userId = userResponse.user.id;

    const { claimQuestReward } = require('../../utils/questEngine');
    const result = await claimQuestReward(userId, questCode, periodKey);

    if (!result.ok) {
      const statusCode = result.error === 'Already claimed' ? 409
                       : result.error === 'Quest not completed yet' ? 422
                       : result.error === 'Quest progress not found' ? 404
                       : 500;
      return res.status(statusCode).json({ ok: false, error: result.error });
    }

    res.json({ ok: true, xp: result.xp, trophies: result.trophies });
  } catch (e) {
    console.error('[gamifV2 claim quest]', e);
    res.status(500).json({ ok: false, error: 'internal' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /v2/trophies — saison courante + archives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /v2/trophies
 * Retourne les trophées de la saison courante + archives des saisons passées.
 */
const getV2TrophiesEndpoint = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  let connection;
  try {
    const userResponse = await getUserByToken(token);
    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    const userId = userResponse.user.id;

    connection = await connect();
    const season = getCurrentSeason();

    const entityType = 'user';
    const entityId   = userId;

    // Trophées saison courante
    const [[ledger]] = await connection.query(
      `SELECT trophies FROM trophy_ledgers
       WHERE entity_type = ? AND entity_id = ? AND season_key = ?`,
      [entityType, entityId, season.key]
    );
    const currentTrophies = ledger ? ledger.trophies : 0;

    // Archives des saisons passées
    const [archiveRows] = await connection.query(
      `SELECT season_key, season_name, season_icon, trophies, rank, archived_at
       FROM trophy_season_archives
       WHERE entity_type = ? AND entity_id = ?
       ORDER BY archived_at DESC
       LIMIT 10`,
      [entityType, entityId]
    );

    const archives = archiveRows.map(r => ({
      code:        r.season_key,
      name:        r.season_name,
      icon:        r.season_icon,
      trophies:    r.trophies,
      rank:        r.rank,
      archived_at: r.archived_at,
    }));

    return res.json({
      ok: true,
      current_season: {
        code:       season.key,
        name:       season.name,
        icon:       season.icon,
        start_date: season.startDate,
        end_date:   season.endDate,
        trophies:   currentTrophies,
      },
      archives,
    });
  } catch (e) {
    console.error('[gamifV2 trophies]', e);
    return res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint, getV2QuestsEndpoint, claimV2QuestEndpoint, getV2TrophiesEndpoint };
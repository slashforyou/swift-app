#!/usr/bin/env python3
"""
Fix gamificationV2.js column name mismatches + getCurrentSeason export.

Issues fixed:
  1. gamificationEngine.js: getCurrentSeason missing from module.exports
  2. gamificationV2.js profile: wrong column names (total_xp, total_trophies, etc.)
  3. gamificationV2.js leaderboard: wrong columns (profile_picture_url, xp_awarded, etc.)
  4. gamificationV2.js history: wrong columns (action_code, xp_awarded)
"""

import subprocess, sys

ENGINE_PATH = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'
V2_PATH     = '/srv/www/htdocs/swiftapp/server/endPoints/v1/gamificationV2.js'

def read_remote(path):
    r = subprocess.run(['ssh', 'sushinari', f'cat {path}'],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print(f'ERROR reading {path}: {r.stderr.decode()}')
        sys.exit(1)
    return r.stdout.decode()

def write_remote(path, content):
    r = subprocess.run(['ssh', 'sushinari', f'cat > {path}'],
                       input=content.encode(),
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print(f'ERROR writing {path}: {r.stderr.decode()}')
        sys.exit(1)

# ─── 1. Fix gamificationEngine.js — export getCurrentSeason ──────────────────
print('1. Fixing gamificationEngine.js exports...')
engine = read_remote(ENGINE_PATH)

OLD_EXPORTS = '''module.exports = {
  processJobCompleted,
  processPhotoAdded,
  processSignatureCollected,
  processNoteAdded,
  processReviewSubmitted,
};'''

NEW_EXPORTS = '''module.exports = {
  processJobCompleted,
  processPhotoAdded,
  processSignatureCollected,
  processNoteAdded,
  processReviewSubmitted,
  getCurrentSeason,
};'''

if OLD_EXPORTS not in engine:
    print('  WARNING: Could not find expected module.exports in gamificationEngine.js')
    print('  Current exports:', engine[engine.find('module.exports'):engine.find('module.exports')+200])
else:
    engine = engine.replace(OLD_EXPORTS, NEW_EXPORTS, 1)
    write_remote(ENGINE_PATH, engine)
    print('  OK — getCurrentSeason added to exports')

# ─── 2. Fix gamificationV2.js ─────────────────────────────────────────────────
print('2. Fixing gamificationV2.js...')
v2 = read_remote(V2_PATH)

# ── 2a. Profile endpoint — SQL query ──
OLD_PROFILE_SQL = '''    const [rows] = await connection.query(`

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

    `, [userId]);'''

NEW_PROFILE_SQL = '''    const [rows] = await connection.query(`
      SELECT
        gp.lifetime_xp AS total_xp,
        (SELECT COALESCE(SUM(trophies), 0) FROM trophy_ledgers WHERE entity_type = 'user' AND entity_id = gp.entity_id) AS total_trophies,
        gp.current_streak_days, gp.longest_streak_days,
        gp.total_jobs_completed AS jobs_completed_count,
        gp.total_photos_uploaded AS photos_uploaded_count,
        gp.total_signatures AS signatures_collected_count,
        0 AS notes_added_count,
        gp.total_reviews_received AS reviews_received_count,
        gp.last_active_date, gp.updated_at,
        u.level, gp.lifetime_xp AS experience,
        gl.title AS level_label, gl.xp_required AS level_min_xp,
        (SELECT xp_required FROM gamification_levels WHERE level = u.level + 1 LIMIT 1) AS level_max_xp,
        gr.name AS rank_label, gr.emoji AS rank_icon
      FROM gamification_profiles gp
      JOIN users u ON u.id = gp.entity_id
      LEFT JOIN gamification_levels gl ON gl.level = u.level
      LEFT JOIN gamification_ranks gr ON gr.id = (
        SELECT id FROM gamification_ranks
        WHERE min_level <= u.level AND is_active = 1
        ORDER BY min_level DESC LIMIT 1
      )
      WHERE gp.entity_type = 'user' AND gp.entity_id = ?
    `, [userId]);'''

if OLD_PROFILE_SQL not in v2:
    print('  WARNING: Could not find profile SQL to replace')
else:
    v2 = v2.replace(OLD_PROFILE_SQL, NEW_PROFILE_SQL, 1)
    print('  OK — profile SQL fixed')

# ── 2b. Leaderboard endpoint — SQL query ──
OLD_LEADERBOARD_SQL = '''    const [rows] = await connection.query(
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

    [limit, offset]);'''

NEW_LEADERBOARD_SQL = '''    const [rows] = await connection.query(
      `SELECT
        u.id, u.first_name, u.last_name, u.avatar_url,
        COALESCE(SUM(grl.amount), 0) AS period_xp,
        COALESCE((SELECT SUM(trophies) FROM trophy_ledgers WHERE entity_type = 'user' AND entity_id = u.id), 0) AS total_trophies,
        COALESCE(gp.current_streak_days, 0) AS current_streak_days,
        COALESCE(u.level, 1) AS level,
        gr.name AS rank_label
      FROM gamification_reward_ledger grl
      JOIN users u ON u.id = grl.entity_id AND grl.entity_type = 'user'
      LEFT JOIN gamification_profiles gp ON gp.entity_type = 'user' AND gp.entity_id = u.id
      LEFT JOIN gamification_ranks gr ON gr.id = (
        SELECT id FROM gamification_ranks
        WHERE min_level <= COALESCE(u.level, 1) AND is_active = 1
        ORDER BY min_level DESC LIMIT 1
      )
      WHERE 1=1 ` + dateFilter + `
      GROUP BY u.id
      ORDER BY period_xp DESC
      LIMIT ? OFFSET ?`,
    [limit, offset]);'''

if OLD_LEADERBOARD_SQL not in v2:
    print('  WARNING: Could not find leaderboard SQL to replace')
else:
    v2 = v2.replace(OLD_LEADERBOARD_SQL, NEW_LEADERBOARD_SQL, 1)
    print('  OK — leaderboard SQL fixed')

# ── 2c. History endpoint — SQL query ──
OLD_HISTORY_SQL = '''    const [rows] = await connection.query(`

      SELECT action_code, xp_awarded, reference_type, reference_id, created_at

      FROM gamification_reward_ledger

      WHERE entity_type = 'user' AND entity_id = ?

      ORDER BY created_at DESC

      LIMIT ? OFFSET ?

    `, [userId, limit, offset]);'''

NEW_HISTORY_SQL = '''    const [rows] = await connection.query(`
      SELECT
        source_code AS action_code,
        amount AS xp_awarded,
        source_type AS reference_type,
        job_id AS reference_id,
        created_at
      FROM gamification_reward_ledger
      WHERE entity_type = 'user' AND entity_id = ?
        AND reward_type = 'xp'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);'''

if OLD_HISTORY_SQL not in v2:
    print('  WARNING: Could not find history SQL to replace')
else:
    v2 = v2.replace(OLD_HISTORY_SQL, NEW_HISTORY_SQL, 1)
    print('  OK — history SQL fixed')

write_remote(V2_PATH, v2)
print('2. gamificationV2.js written.')

# ─── 3. Restart PM2 ───────────────────────────────────────────────────────────
print('3. Restarting PM2...')
r = subprocess.run(['ssh', 'sushinari', 'pm2 restart 17'],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(r.stdout.decode() + r.stderr.decode())
print('Done!')

#!/usr/bin/env python3
"""
Insert new XP reward seeds + deploy cron + new API endpoints + register routes
"""
import subprocess, sys, textwrap, os

SERVER = "sushinari"
DB_USER = "swiftapp_user"
DB_PASS = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME = "swiftapp"
APP_DIR = "/srv/www/htdocs/swiftapp/server"

def ssh(cmd):
    r = subprocess.run(["ssh", SERVER, cmd], capture_output=True)
    out = r.stdout.decode("utf-8", errors="replace")
    err = r.stderr.decode("utf-8", errors="replace")
    print(out, end="")
    if err.strip():
        print("[stderr]", err, end="")
    return r.returncode

def scp(local, remote):
    r = subprocess.run(["scp", local, f"{SERVER}:{remote}"], capture_output=True)
    out = r.stdout.decode("utf-8", errors="replace")
    err = r.stderr.decode("utf-8", errors="replace")
    if out.strip(): print(out)
    if err.strip(): print("[stderr]", err)
    return r.returncode

def write_remote(path, content):
    """Write content to a remote file via scp (write to temp local file first)."""
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".tmp", delete=False, encoding="utf-8") as f:
        f.write(content)
        tmp_path = f.name
    code = scp(tmp_path, path)
    os.unlink(tmp_path)
    return code

# ─────────────────────────────────────────────────────────────────
# STEP 1 – Insert new XP reward seeds
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 1 – Insert XP reward seeds ===")
seeds_sql = """INSERT IGNORE INTO gamification_xp_rewards (action_code, action_name, xp_amount, active) VALUES
  ('review_submitted',         'Review client soumise',                        20,  1),
  ('review_4star_overall',     'Note globale 4 etoiles',                       20,  1),
  ('review_5star_overall',     'Note globale 5 etoiles',                       40,  1),
  ('review_5star_service',     'Service note 5 etoiles',                       15,  1),
  ('review_5star_team',        'Equipe notee 5 etoiles',                       15,  1),
  ('staff_5star_rating',       'Staff note 5 etoiles individuellement',        25,  1),
  ('staff_positive_adjectives','Adjectifs positifs recus',                     10,  1),
  ('photo_milestone_5',        '5 photos sur un job',                          10,  1),
  ('photo_milestone_10',       '10 photos sur un job',                         20,  1),
  ('photo_milestone_20',       '20 photos sur un job',                         40,  1),
  ('photo_total_50',           '50 photos cumulees (lifetime)',                100,  1),
  ('photo_total_100',          '100 photos cumulees (lifetime)',               200,  1),
  ('photo_total_500',          '500 photos cumulees (lifetime)',               500,  1);
"""
rc = write_remote("/tmp/gamif_seeds.sql", seeds_sql)
if rc != 0: sys.exit("SCP seeds.sql failed")

rc = ssh(f"mysql -u{DB_USER} '-p{DB_PASS}' {DB_NAME} 2>/dev/null < /tmp/gamif_seeds.sql && echo 'Seeds OK'")
if rc != 0: sys.exit("seeds INSERT failed")

rc = ssh(f"mysql -u{DB_USER} '-p{DB_PASS}' {DB_NAME} 2>/dev/null -e 'SELECT action_code, xp_amount FROM gamification_xp_rewards ORDER BY id'")
# ─────────────────────────────────────────────────────────────────
# STEP 2 – Deploy cron: gamificationStreakCron.js
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 2 – Deploy streak cron ===")
cron_js = r"""'use strict';
// gamificationStreakCron.js
// Run daily (e.g. at midnight) via cron or PM2 schedule
// crontab: 0 0 * * * /usr/bin/node /srv/www/htdocs/swiftapp/server/cron/gamificationStreakCron.js

const pool = require('../utils/swiftDb');

const STREAK_MILESTONES = [7, 30, 100, 365];

async function runStreakCron() {
  let conn;
  try {
    conn = await pool.connect();
    console.log('[StreakCron] Starting streak check', new Date().toISOString());

    // Reset streak for users who missed yesterday
    const [broken] = await conn.query(`
      UPDATE gamification_profiles
      SET current_streak_days = 0
      WHERE entity_type = 'user'
        AND last_active_date IS NOT NULL
        AND last_active_date < CURDATE() - INTERVAL 1 DAY
        AND current_streak_days > 0
    `);
    console.log('[StreakCron] Broken streaks reset:', broken.affectedRows);

    // Award streak milestone badges for users at milestone streak counts
    for (const days of STREAK_MILESTONES) {
      const code = `streak_${days}`;
      const [rows] = await conn.query(`
        SELECT gp.entity_id AS userId
        FROM gamification_profiles gp
        WHERE gp.entity_type = 'user'
          AND gp.current_streak_days = ?
          AND gp.last_active_date = CURDATE()
      `, [days]);

      for (const row of rows) {
        const idempotencyKey = `${code}:streak:${row.userId}:${new Date().toISOString().slice(0, 10)}`;
        try {
          await conn.query(`
            INSERT IGNORE INTO gamification_reward_ledger
              (entity_type, entity_id, action_code, xp_awarded, reference_type, reference_id, idempotency_key)
            SELECT 'user', ?, ?, xp_amount, 'streak', ?, ?
            FROM gamification_xp_rewards
            WHERE action_code = ? AND active = 1
          `, [row.userId, code, days, idempotencyKey, code]);

          await conn.query(`
            INSERT INTO gamification_profiles (entity_type, entity_id, total_xp)
            SELECT 'user', ?, xp_amount FROM gamification_xp_rewards WHERE action_code = ? AND active = 1
            ON DUPLICATE KEY UPDATE total_xp = total_xp + VALUES(total_xp)
          `, [row.userId, code]);
        } catch (e) {
          console.error('[StreakCron] milestone award error', e.message);
        }
      }
      if (rows.length > 0) console.log(`[StreakCron] streak_${days}: ${rows.length} awards`);
    }

    console.log('[StreakCron] Done');
  } catch (e) {
    console.error('[StreakCron] Fatal error:', e);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    pool.end();
  }
}

runStreakCron();
"""
rc = write_remote(f"{APP_DIR}/cron/gamificationStreakCron.js", cron_js)
if rc != 0: sys.exit("SCP streak cron failed")
rc = ssh(f"node -c {APP_DIR}/cron/gamificationStreakCron.js && echo 'Cron syntax OK'")
if rc != 0: sys.exit("Streak cron syntax check failed")

# ─────────────────────────────────────────────────────────────────
# STEP 3 – Deploy API: gamificationV2.js
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 3 – Deploy gamificationV2 API ===")
api_js = r"""'use strict';
// endPoints/v1/gamificationV2.js
// New gamification V2 endpoints

const express = require('express');
const router = express.Router();
const pool = require('../../utils/swiftDb');
const { verifyToken } = require('../../utils/auth');

// GET /v1/user/gamification/v2/profile
router.get('/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  let conn;
  try {
    conn = await pool.connect();
    const [[profile]] = await conn.query(`
      SELECT
        gp.total_xp, gp.total_trophies, gp.current_streak_days, gp.longest_streak_days,
        gp.jobs_completed_count, gp.photos_uploaded_count, gp.signatures_collected_count,
        gp.notes_added_count, gp.reviews_received_count,
        gp.last_active_date, gp.updated_at,
        u.level, u.experience,
        gl.label AS level_label, gl.min_xp, gl.max_xp,
        gr.label AS rank_label, gr.icon_url AS rank_icon
      FROM gamification_profiles gp
      JOIN users u ON u.id = gp.entity_id
      LEFT JOIN gamification_levels gl ON gl.level_number = u.level
      LEFT JOIN gamification_ranks gr ON gr.id = (
        SELECT id FROM gamification_ranks WHERE min_trophies <= gp.total_trophies ORDER BY min_trophies DESC LIMIT 1
      )
      WHERE gp.entity_type = 'user' AND gp.entity_id = ?
    `, [userId]);

    if (!profile) {
      return res.json({ ok: true, data: { total_xp: 0, total_trophies: 0, current_streak_days: 0 } });
    }
    res.json({ ok: true, data: profile });
  } catch (e) {
    console.error('[gamifV2 profile]', e);
    res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /v1/user/gamification/v2/leaderboard?period=weekly&page=1
router.get('/leaderboard', verifyToken, async (req, res) => {
  const { period = 'all_time' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let dateFilter = '';
  if (period === 'weekly')  dateFilter = "AND grl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  if (period === 'monthly') dateFilter = "AND grl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

  let conn;
  try {
    conn = await pool.connect();
    const [rows] = await conn.query(`
      SELECT
        u.id, u.first_name, u.last_name, u.profile_picture_url,
        SUM(grl.xp_awarded) AS period_xp,
        gp.total_trophies, gp.current_streak_days,
        u.level,
        gr.label AS rank_label
      FROM gamification_reward_ledger grl
      JOIN users u ON u.id = grl.entity_id AND grl.entity_type = 'user'
      JOIN gamification_profiles gp ON gp.entity_type = 'user' AND gp.entity_id = u.id
      LEFT JOIN gamification_ranks gr ON gr.id = (
        SELECT id FROM gamification_ranks WHERE min_trophies <= gp.total_trophies ORDER BY min_trophies DESC LIMIT 1
      )
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id
      ORDER BY period_xp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Find current user rank
    const [[myRank]] = await conn.query(`
      SELECT COUNT(*) + 1 AS rank_position FROM (
        SELECT grl2.entity_id, SUM(xp_awarded) AS xp
        FROM gamification_reward_ledger grl2
        WHERE grl2.entity_type = 'user' ${dateFilter}
        GROUP BY grl2.entity_id
        HAVING xp > (
          SELECT COALESCE(SUM(xp_awarded),0)
          FROM gamification_reward_ledger
          WHERE entity_type = 'user' AND entity_id = ? ${dateFilter}
        )
      ) sub
    `, [req.user.id]);

    res.json({ ok: true, data: rows, my_rank: myRank?.rank_position || null, page, period });
  } catch (e) {
    console.error('[gamifV2 leaderboard]', e);
    res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /v1/user/gamification/v2/history?page=1
router.get('/history', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 30;
  const offset = (page - 1) * limit;
  let conn;
  try {
    conn = await pool.connect();
    const [rows] = await conn.query(`
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
    if (conn) conn.release();
  }
});

module.exports = router;
"""
rc = write_remote(f"{APP_DIR}/endPoints/v1/gamificationV2.js", api_js)
if rc != 0: sys.exit("SCP gamificationV2.js failed")
rc = ssh(f"node -c {APP_DIR}/endPoints/v1/gamificationV2.js && echo 'API syntax OK'")
if rc != 0: sys.exit("gamificationV2.js syntax check failed")

# ─────────────────────────────────────────────────────────────────
# STEP 4 – Register routes in index.js
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 4 – Register routes in index.js ===")
# Check if already registered
rc = ssh(f"grep -c 'gamificationV2' {APP_DIR}/index.js || true")
# Read current index.js content around gamification
rc = ssh(f"grep -n 'gamification\\|require' {APP_DIR}/index.js | head -40")

patch_routes_py = f"""
import subprocess, sys

SERVER = "sushinari"
APP_DIR = "/srv/www/htdocs/swiftapp/server"

r = subprocess.run(["ssh", SERVER, f"cat {APP_DIR}/index.js"], capture_output=True)
content = r.stdout.decode("utf-8", errors="replace")

if "gamificationV2" in content:
    print("Routes already registered, skipping")
    sys.exit(0)

# Find a good injection point: after existing gamification route
import re
# Look for existing gamification require line
m = re.search(r"(const gamification\\s*=.*gamification.*\\n)", content)
if not m:
    # Fallback: look for any v1 route require
    m = re.search(r"(const \\w+\\s*=\\s*require\\('./endPoints/v1/gamification.*\\n)", content)

if m:
    insert_after = m.group(0)
    new_line = "const gamificationV2 = require('./endPoints/v1/gamificationV2');\\n"
    content2 = content.replace(insert_after, insert_after + new_line, 1)
else:
    print("Could not find gamification require, trying generic insertion")
    # Insert at the end of requires block
    m2 = re.search(r"(app\\.use\\(['\"]/v1.*gamification.*\\n)", content)
    content2 = content

# Now find the app.use for gamification and add ours
m3 = re.search(r"(app\\.use\\(['\\"]/v1.*gamification[^V].*\\n)", content2)
if m3:
    route_line = "app.use('/v1/user/gamification/v2', gamificationV2);\\n"
    content2 = content2.replace(m3.group(0), m3.group(0) + route_line, 1)
    print("Route injected successfully")
else:
    # Find app.use('/v1 block and append
    print("Fallback: searching for app.use block")
    m4 = re.search(r"(app\\.use\\(['\\"]/v1)", content2)
    if m4:
        # Insert before first app.use /v1
        idx = content2.find(m4.group(0))
        new_require = "const gamificationV2 = require('./endPoints/v1/gamificationV2');\\n"
        new_route   = "app.use('/v1/user/gamification/v2', gamificationV2);\\n"
        content2 = content2[:idx] + new_require + new_route + content2[idx:]

import tempfile, os
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
    f.write(content2)
    tmp = f.name

r2 = subprocess.run(["scp", tmp, f"{{SERVER}}:{{APP_DIR}}/index.js"], capture_output=True)
os.unlink(tmp)
if r2.returncode != 0:
    print("SCP index.js failed", r2.stderr.decode())
    sys.exit(1)

r3 = subprocess.run(["ssh", SERVER, f"node -c {{APP_DIR}}/index.js && echo 'index.js OK'"], capture_output=True)
print(r3.stdout.decode())
print(r3.stderr.decode())
"""

import tempfile, os
with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
    f.write(patch_routes_py)
    tmp_py = f.name

result = subprocess.run(["python", tmp_py], capture_output=True)
print(result.stdout.decode("utf-8", errors="replace"))
err = result.stderr.decode("utf-8", errors="replace")
if err.strip():
    print("[stderr]", err)
os.unlink(tmp_py)

# ─────────────────────────────────────────────────────────────────
# STEP 5 – PM2 restart
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 5 – PM2 restart ===")
rc = ssh("pm2 restart swiftapp && sleep 2 && pm2 logs swiftapp --lines 10 --nostream")

print("\n=== ALL DONE ===")

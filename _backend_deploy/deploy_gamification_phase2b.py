#!/usr/bin/env python3
"""Patch gamificationEngine.js: fix active -> is_active, then deploy cron + API V2"""
import subprocess, sys, tempfile, os, re

SERVER = "sushinari"
DB_USER = "swiftapp_user"
DB_PASS = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME = "swiftapp"
APP_DIR = "/srv/www/htdocs/swiftapp/server"

def ssh(cmd):
    r = subprocess.run(["ssh", SERVER, cmd], capture_output=True)
    out = r.stdout.decode("utf-8", errors="replace")
    err = r.stderr.decode("utf-8", errors="replace")
    if out.strip(): print(out, end="")
    if err.strip(): print("[stderr]", err, end="")
    return r.returncode

def write_remote(remote_path, content):
    with tempfile.NamedTemporaryFile("w", suffix=".tmp", delete=False, encoding="utf-8") as f:
        f.write(content)
        tmp = f.name
    r = subprocess.run(["scp", tmp, f"{SERVER}:{remote_path}"], capture_output=True)
    os.unlink(tmp)
    if r.returncode != 0:
        print("SCP failed:", r.stderr.decode())
    return r.returncode

def read_remote(remote_path):
    r = subprocess.run(["ssh", SERVER, f"cat {remote_path}"], capture_output=True)
    return r.stdout.decode("utf-8", errors="replace")

# ─────────────────────────────────────────────────────────────────
# STEP 1 – Fix active -> is_active in gamificationEngine.js
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 1 – Fix active -> is_active in engine ===")
engine_content = read_remote(f"{APP_DIR}/utils/gamificationEngine.js")
if "WHERE active = 1" in engine_content:
    engine_content = engine_content.replace("WHERE active = 1", "WHERE is_active = 1")
    rc = write_remote(f"{APP_DIR}/utils/gamificationEngine.js", engine_content)
    if rc != 0: sys.exit("SCP engine failed")
    rc = ssh(f"node -c {APP_DIR}/utils/gamificationEngine.js && echo 'Engine syntax OK'")
    if rc != 0: sys.exit("Engine syntax check failed")
else:
    print("Already fixed or not found, skipping")

# ─────────────────────────────────────────────────────────────────
# STEP 2 – Deploy cron: gamificationStreakCron.js
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 2 – Deploy streak cron ===")
ssh(f"mkdir -p {APP_DIR}/cron")
cron_js = r"""'use strict';
// gamificationStreakCron.js
// Run daily (e.g. at midnight) via cron:
// 0 0 * * * node /srv/www/htdocs/swiftapp/server/cron/gamificationStreakCron.js >> /var/log/gamif_streak.log 2>&1

const pool = require('../utils/swiftDb');

const STREAK_MILESTONES = [7, 30, 100, 365];

async function runStreakCron() {
  let conn;
  try {
    conn = await pool.connect();
    console.log('[StreakCron] Starting streak check', new Date().toISOString());

    // Reset streak for users who missed yesterday (last_active_date < yesterday)
    const [broken] = await conn.query(`
      UPDATE gamification_profiles
      SET current_streak_days = 0
      WHERE entity_type = 'user'
        AND last_active_date IS NOT NULL
        AND last_active_date < CURDATE() - INTERVAL 1 DAY
        AND current_streak_days > 0
    `);
    console.log('[StreakCron] Broken streaks reset:', broken.affectedRows);

    // Promote longest_streak if current_streak > longest_streak
    await conn.query(`
      UPDATE gamification_profiles
      SET longest_streak_days = current_streak_days
      WHERE entity_type = 'user'
        AND current_streak_days > longest_streak_days
    `);

    // Award streak milestone XP for users who hit a milestone today
    for (const days of STREAK_MILESTONES) {
      const code = `streak_${days}`;
      const today = new Date().toISOString().slice(0, 10);
      const [rows] = await conn.query(`
        SELECT entity_id AS userId
        FROM gamification_profiles
        WHERE entity_type = 'user'
          AND current_streak_days = ?
          AND last_active_date = CURDATE()
      `, [days]);

      for (const row of rows) {
        const idempotencyKey = `${code}:${row.userId}:${today}`;
        try {
          await conn.query(`
            INSERT IGNORE INTO gamification_reward_ledger
              (entity_type, entity_id, action_code, xp_awarded, reference_type, reference_id, idempotency_key)
            SELECT 'user', ?, ?, xp_amount, 'streak', ?, ?
            FROM gamification_xp_rewards
            WHERE action_code = ? AND is_active = 1
            LIMIT 1
          `, [row.userId, code, days, idempotencyKey, code]);

          await conn.query(`
            INSERT INTO gamification_profiles (entity_type, entity_id, total_xp)
            SELECT 'user', ?, xp_amount FROM gamification_xp_rewards WHERE action_code = ? AND is_active = 1
            ON DUPLICATE KEY UPDATE total_xp = total_xp + VALUES(total_xp)
          `, [row.userId, code]);

        } catch (e) {
          console.error('[StreakCron] milestone award error', e.message);
        }
      }
      if (rows.length > 0) console.log(`[StreakCron] ${code}: awarded to ${rows.length} users`);
    }

    console.log('[StreakCron] Done', new Date().toISOString());
  } catch (e) {
    console.error('[StreakCron] Fatal error:', e);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    process.exit(process.exitCode || 0);
  }
}

runStreakCron();
"""
rc = write_remote(f"{APP_DIR}/cron/gamificationStreakCron.js", cron_js)
if rc != 0: sys.exit("SCP streak cron failed")
rc = ssh(f"node -c {APP_DIR}/cron/gamificationStreakCron.js && echo 'Cron syntax OK'")
if rc != 0: sys.exit("Streak cron syntax check failed")

# ─────────────────────────────────────────────────────────────────
# STEP 3 – Deploy gamificationV2.js API
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 3 – Deploy gamificationV2.js API ===")
api_js = r"""'use strict';
// endPoints/v1/gamificationV2.js

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

    res.json({ ok: true, data: profile || { total_xp: 0, total_trophies: 0, current_streak_days: 0 } });
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
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id
      ORDER BY period_xp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({ ok: true, data: rows, page, period });
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
  const limit = 50;
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
index_content = read_remote(f"{APP_DIR}/index.js")

if "gamificationV2" in index_content:
    print("Routes already registered, skipping")
else:
    # Find last require of a v1 endpoint to insert after
    m = re.search(r"(const \w+ = require\('./endPoints/v1/[^\n]+\n)", index_content)
    if m:
        last_require = m.group(0)
        # Find ALL requires for v1 endpoints, take the last occurrence
        all_matches = list(re.finditer(r"const \w+ = require\('./endPoints/v1/[^\n]+\n", index_content))
        if all_matches:
            last_m = all_matches[-1]
            insert_pos = last_m.end()
            new_require = "const gamificationV2 = require('./endPoints/v1/gamificationV2');\n"
            index_content = index_content[:insert_pos] + new_require + index_content[insert_pos:]

    # Find all app.use calls for gamification routes, insert after last one
    all_use = list(re.finditer(r"app\.use\(['\"/].*gamification[^\n]+\n", index_content))
    if all_use:
        last_use = all_use[-1]
        insert_pos = last_use.end()
        new_route = "app.use('/v1/user/gamification/v2', gamificationV2);\n"
        index_content = index_content[:insert_pos] + new_route + index_content[insert_pos:]
        print("Route injected after existing gamification route")
    else:
        # Find last app.use('/v1 and insert after
        all_use2 = list(re.finditer(r"app\.use\(['\"/]v1[^\n]+\n", index_content))
        if all_use2:
            last_use2 = all_use2[-1]
            insert_pos = last_use2.end()
            new_route = "app.use('/v1/user/gamification/v2', gamificationV2);\n"
            index_content = index_content[:insert_pos] + new_route + index_content[insert_pos:]
            print("Route injected after last /v1 route")
        else:
            print("WARNING: Could not find suitable injection point in index.js")

    rc = write_remote(f"{APP_DIR}/index.js", index_content)
    if rc != 0: sys.exit("SCP index.js failed")
    rc = ssh(f"node -c {APP_DIR}/index.js && echo 'index.js syntax OK'")
    if rc != 0: sys.exit("index.js syntax check failed")

# Verify route registration
ssh(f"grep -n 'gamificationV2' {APP_DIR}/index.js")

# ─────────────────────────────────────────────────────────────────
# STEP 5 – PM2 restart
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 5 – PM2 restart ===")
ssh("pm2 restart swiftapp && sleep 2 && pm2 logs swiftapp --lines 10 --nostream")

# ─────────────────────────────────────────────────────────────────
# STEP 6 – Setup crontab for streak cron
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 6 – Crontab setup ===")
# Check existing crontab
r = subprocess.run(["ssh", SERVER, "crontab -l 2>/dev/null"], capture_output=True)
crontab = r.stdout.decode("utf-8", errors="replace")
print("Current crontab:", crontab[:500] if crontab.strip() else "(empty)")

cron_line = f"0 0 * * * /usr/bin/node {APP_DIR}/cron/gamificationStreakCron.js >> /var/log/gamif_streak.log 2>&1"
if "gamificationStreakCron" in crontab:
    print("Streak cron already in crontab, skipping")
else:
    new_crontab = (crontab.rstrip() + "\n" + cron_line + "\n").lstrip("\n")
    with tempfile.NamedTemporaryFile("w", suffix=".cron", delete=False, encoding="utf-8") as f:
        f.write(new_crontab)
        tmp_cron = f.name
    rc = subprocess.run(["scp", tmp_cron, f"{SERVER}:/tmp/new_crontab"], capture_output=True).returncode
    os.unlink(tmp_cron)
    if rc == 0:
        rc = ssh("crontab /tmp/new_crontab && crontab -l")
        print("Crontab updated" if rc == 0 else "Crontab update failed")

print("\n=== PHASE 2 BACKEND COMPLETE ===")

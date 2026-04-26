#!/usr/bin/env python3
"""
Final fix: remove authenticateToken from V2 routes, rewrite gamificationV2.js
with getUserByToken pattern (matching existing gamification.js pattern).
"""
import subprocess, sys, tempfile, os

SERVER = "sushinari"
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

def read_remote(path):
    r = subprocess.run(["ssh", SERVER, f"cat {path}"], capture_output=True)
    return r.stdout.decode("utf-8", errors="replace")

# ─────────────────────────────────────────────────────────────────
# STEP 1 – Rewrite gamificationV2.js using getUserByToken pattern
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 1 – Rewrite gamificationV2.js (correct auth) ===")
api_js = r"""'use strict';
// endPoints/v1/gamificationV2.js
// Gamification V2 API — profile, leaderboard par periode, historique XP

const { getUserByToken } = require('../database/user');
const { connect } = require('../../swiftDb');

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

module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint };
"""
rc = write_remote(f"{APP_DIR}/endPoints/v1/gamificationV2.js", api_js)
if rc != 0: sys.exit("SCP gamificationV2.js failed")
rc = ssh(f"node -c {APP_DIR}/endPoints/v1/gamificationV2.js && echo 'V2 API syntax OK'")
if rc != 0: sys.exit("gamificationV2.js syntax check failed")

# ─────────────────────────────────────────────────────────────────
# STEP 2 – Fix index.js: remove authenticateToken from V2 routes
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 2 – Fix index.js routes (remove authenticateToken) ===")
index = read_remote(f"{APP_DIR}/index.js")

old_routes = """// 🎮 Gamification V2
app.get('/swift-app/v1/user/gamification/v2/profile', authenticateToken, (req, res) => {
  const { getV2ProfileEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2ProfileEndpoint(req, res);
});
app.get('/swift-app/v1/user/gamification/v2/leaderboard', authenticateToken, (req, res) => {
  const { getV2LeaderboardEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2LeaderboardEndpoint(req, res);
});
app.get('/swift-app/v1/user/gamification/v2/history', authenticateToken, (req, res) => {
  const { getV2HistoryEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2HistoryEndpoint(req, res);
});"""

new_routes = """// 🎮 Gamification V2
app.get('/swift-app/v1/user/gamification/v2/profile', (req, res) => {
  const { getV2ProfileEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2ProfileEndpoint(req, res);
});
app.get('/swift-app/v1/user/gamification/v2/leaderboard', (req, res) => {
  const { getV2LeaderboardEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2LeaderboardEndpoint(req, res);
});
app.get('/swift-app/v1/user/gamification/v2/history', (req, res) => {
  const { getV2HistoryEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2HistoryEndpoint(req, res);
});"""

if old_routes in index:
    index = index.replace(old_routes, new_routes, 1)
    print("Removed authenticateToken from V2 routes")
else:
    print("Pattern not found exactly, trying partial fix...")
    import re
    index = re.sub(
        r"(app\.get\('/swift-app/v1/user/gamification/v2/[^']+',)\s*authenticateToken,",
        r"\1",
        index
    )
    print("Applied regex fix")

rc = write_remote(f"{APP_DIR}/index.js", index)
if rc != 0: sys.exit("SCP index.js failed")
rc = ssh(f"node -c {APP_DIR}/index.js && echo 'index.js syntax OK'")
if rc != 0: sys.exit("index.js syntax check failed")

ssh(f"grep -n 'gamification/v2' {APP_DIR}/index.js")

# ─────────────────────────────────────────────────────────────────
# STEP 3 – PM2 restart + verify clean startup
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 3 – PM2 restart ===")
ssh("pm2 restart swiftapp && sleep 3 && pm2 logs swiftapp --lines 8 --nostream")

print("\n=== FINAL FIX COMPLETE ===")

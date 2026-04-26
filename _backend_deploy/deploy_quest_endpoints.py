#!/usr/bin/env python3
"""
deploy_quest_endpoints.py
Injecte les endpoints GET /quests et POST /quests/:code/claim dans :
  - endPoints/v1/gamificationV2.js  (fonctions + module.exports)
  - index.js                         (routes app.get/app.post)
"""

import subprocess
import sys

SERVER  = 'sushinari'
GAMIF_V2 = '/srv/www/htdocs/swiftapp/server/endPoints/v1/gamificationV2.js'
INDEX_JS = '/srv/www/htdocs/swiftapp/server/index.js'

# ─────────────────────────────────────────────────────────────────────────────
# Code à ajouter dans gamificationV2.js (avant module.exports)
# ─────────────────────────────────────────────────────────────────────────────
QUEST_FUNCTIONS = r"""
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
         q.type, q.xp_reward, q.trophy_reward,
         q.target_count, q.event_trigger, q.sort_order,
         COALESCE(gqp.current_count, 0)  AS current_count,
         COALESCE(gqp.status, 'not_started') AS status,
         gqp.period_key,
         gqp.completed_at, gqp.claimed_at
       FROM quests q
       LEFT JOIN gamification_quest_progress gqp
         ON gqp.quest_code = q.code
        AND gqp.entity_type = 'user'
        AND gqp.entity_id   = ?
        AND gqp.period_key  = CASE q.type
              WHEN 'daily'   THEN ?
              WHEN 'weekly'  THEN ?
              WHEN 'monthly' THEN ?
              ELSE 'general'
            END
       WHERE q.active = 1
       ORDER BY
         FIELD(gqp.status, 'completed', 'in_progress', NULL, 'claimed') ASC,
         q.sort_order ASC`,
      [userId, dailyKey, weeklyKey, monthlyKey]
    );

    res.json({
      ok: true,
      data: rows,
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
  if (!/^(daily_\d{4}-\d{2}-\d{2}|weekly_\d{4}-W\d{2}|monthly_\d{4}-\d{2}|general)$/.test(periodKey)) {
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

"""

# ─────────────────────────────────────────────────────────────────────────────
# Routes à ajouter dans index.js (après le bloc history)
# ─────────────────────────────────────────────────────────────────────────────
QUEST_ROUTES = r"""
app.get('/swift-app/v1/user/gamification/v2/quests', (req, res) => {
  const { getV2QuestsEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2QuestsEndpoint(req, res);
});

app.post('/swift-app/v1/user/gamification/v2/quests/:questCode/claim', (req, res) => {
  const { claimV2QuestEndpoint } = require('./endPoints/v1/gamificationV2');
  claimV2QuestEndpoint(req, res);
});

"""

def ssh(cmd):
    r = subprocess.run(['ssh', SERVER, cmd], capture_output=True)
    stdout = r.stdout.decode('utf-8', errors='replace').strip()
    stderr = r.stderr.decode('utf-8', errors='replace').strip()
    return r.returncode, stdout, stderr

def scp_to(local, remote):
    r = subprocess.run(['scp', local, f'{SERVER}:{remote}'], capture_output=True)
    return r.returncode

# ─── 1. Lire gamificationV2.js ───────────────────────────────────────────────
print('[1/6] Lecture gamificationV2.js...')
code, out, err = ssh(f'cat {GAMIF_V2}')
if code != 0 or len(out) < 500:
    print(f'ERREUR lecture gamificationV2.js: {err}')
    sys.exit(1)

content = out
print(f'  -> {len(content)} chars lus')

# Vérifier qu'on n'a pas déjà les endpoints
if 'getV2QuestsEndpoint' in content:
    print('  -> Quest endpoints déjà présents, skip gamificationV2.js')
else:
    # Insérer avant module.exports
    MARKER = "module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint };"
    if MARKER not in content:
        print(f'ERREUR: marqueur module.exports introuvable dans gamificationV2.js')
        sys.exit(1)

    new_content = content.replace(
        MARKER,
        QUEST_FUNCTIONS + "module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint, getV2QuestsEndpoint, claimV2QuestEndpoint };"
    )

    # Écrire localement
    local_path = '_backend_deploy/gamificationV2_quests.js'
    with open(local_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'  -> Fichier local: {local_path} ({len(new_content)} chars)')

    # SCP vers serveur
    print('[2/6] Upload gamificationV2.js...')
    rc = scp_to(local_path, GAMIF_V2)
    if rc != 0:
        print('ERREUR SCP gamificationV2.js')
        sys.exit(1)
    print('  -> Upload OK')

# ─── 2. Lire index.js ─────────────────────────────────────────────────────────
print('[3/6] Lecture index.js...')
code, out, err = ssh(f'cat {INDEX_JS}')
if code != 0 or len(out) < 1000:
    print(f'ERREUR lecture index.js: {err}')
    sys.exit(1)

index_content = out
print(f'  -> {len(index_content)} chars lus')

if 'getV2QuestsEndpoint' in index_content:
    print('  -> Routes quests déjà présentes, skip index.js')
else:
    ROUTE_MARKER = "app.get('/swift-app/v1/user/gamification/v2/history', (req, res) => {\n  const { getV2HistoryEndpoint } = require('./endPoints/v1/gamificationV2');\n  getV2HistoryEndpoint(req, res);\n});"
    if ROUTE_MARKER not in index_content:
        # Fallback: chercher une version avec doubles guillemets
        ROUTE_MARKER2 = 'app.get("/swift-app/v1/user/gamification/v2/history"'
        if ROUTE_MARKER2 in index_content:
            # recalculer
            pass
        print(f'ERREUR: marqueur history route introuvable dans index.js')
        print(f'  Checking for getV2HistoryEndpoint presence: {"getV2HistoryEndpoint" in index_content}')
        sys.exit(1)

    new_index = index_content.replace(
        ROUTE_MARKER,
        ROUTE_MARKER + QUEST_ROUTES
    )

    local_index = '_backend_deploy/index_quests_patch.js'
    with open(local_index, 'w', encoding='utf-8') as f:
        f.write(new_index)
    print(f'  -> Fichier local: {local_index} ({len(new_index)} chars)')

    print('[4/6] Upload index.js...')
    rc = scp_to(local_index, INDEX_JS)
    if rc != 0:
        print('ERREUR SCP index.js')
        sys.exit(1)
    print('  -> Upload OK')

# ─── 3. Valider syntax ───────────────────────────────────────────────────────
print('[5/6] Validation syntax...')
code, out, err = ssh(f'node --check {GAMIF_V2} && node --check {INDEX_JS} && echo ALL_OK')
print(f'  -> {out or err}')
if 'ALL_OK' not in out:
    print('ERREUR: syntax check failed!')
    sys.exit(1)

# ─── 4. PM2 restart ──────────────────────────────────────────────────────────
print('[6/6] PM2 restart...')
code, out, err = ssh('pm2 restart swiftapp')
print(f'  -> {out[:100] if out else err[:100]}')
print('\n✅ Deploy quest endpoints terminé!')

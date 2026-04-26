#!/usr/bin/env python3
"""
inject_badges_phase5.py
Injecte dans le serveur swiftapp :
  1. utils/badgeChecker.js  → copie depuis /tmp/
  2. gamificationV2.js      → ajoute getV2BadgesEndpoint + export
  3. gamificationEngine.js  → hooker checkBadges dans processJobCompleted
  4. index.js               → ajoute route GET /v2/badges
"""

import sys
import shutil
import os

SERVER_DIR   = '/srv/www/htdocs/swiftapp/server'
GAMIF_V2     = f'{SERVER_DIR}/endPoints/v1/gamificationV2.js'
GAMIF_ENGINE = f'{SERVER_DIR}/utils/gamificationEngine.js'
INDEX_JS     = f'{SERVER_DIR}/index.js'
BADGE_CHECKER_SRC = '/tmp/badgeChecker.js'
BADGE_CHECKER_DST = f'{SERVER_DIR}/utils/badgeChecker.js'

# ═══════════════════════════════════════════════════════════════════════════════
# 1. Copier badgeChecker.js dans utils/
# ═══════════════════════════════════════════════════════════════════════════════

if os.path.exists(BADGE_CHECKER_SRC):
    shutil.copy2(BADGE_CHECKER_SRC, BADGE_CHECKER_DST)
    print(f'✅ badgeChecker.js copié dans utils/')
elif os.path.exists(BADGE_CHECKER_DST):
    print(f'✅ badgeChecker.js déjà présent dans utils/')
else:
    print(f'❌ badgeChecker.js introuvable: {BADGE_CHECKER_SRC}')
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════════════════════
# 2. gamificationV2.js — ajouter getV2BadgesEndpoint + export
# ═══════════════════════════════════════════════════════════════════════════════

with open(GAMIF_V2, 'r', encoding='utf-8') as f:
    v2_content = f.read()

V2_BADGE_ENDPOINT = """
// ─── GET /swift-app/v1/user/gamification/v2/badges ──────────────────────────
// Returns { ok, data: { earned[], available[], stats } }
const getV2BadgesEndpoint = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  let connection;
  try {
    const userResponse = await getUserByToken(token);
    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    const userId = userResponse.user.id;

    connection = await connect();

    // 1. All active badges
    const [allBadges] = await connection.execute(
      'SELECT * FROM gamification_badge_definitions WHERE is_active = 1 ORDER BY category, sort_order'
    );

    // 2. Earned badges for this user
    const [earnedRows] = await connection.execute(
      'SELECT badge_code, earned_at FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedMap = new Map(earnedRows.map(r => [r.badge_code, r.earned_at]));

    // 3. Profile stats
    const [[profile]] = await connection.execute(
      `SELECT current_level, current_streak_days,
              total_jobs_completed, total_5star_reviews
       FROM gamification_profiles
       WHERE entity_type = 'user' AND entity_id = ?`,
      [userId]
    );

    // 4. Role stats
    const [[roleStats]] = await connection.execute(
      `SELECT
         COALESCE(SUM(role = 'driver'),   0) AS driver_jobs,
         COALESCE(SUM(role = 'offsider'), 0) AS offsider_jobs
       FROM job_users
       WHERE user_id = ? AND unassigned_at IS NULL`,
      [userId]
    );

    // 5. Business jobs (company total)
    const [[userRow]] = await connection.execute(
      'SELECT company_id FROM users WHERE id = ?',
      [userId]
    );
    let businessJobs = 0;
    if (userRow?.company_id) {
      const [[bizProfile]] = await connection.execute(
        `SELECT total_jobs_completed FROM gamification_profiles
         WHERE entity_type = 'company' AND entity_id = ?`,
        [userRow.company_id]
      );
      businessJobs = bizProfile?.total_jobs_completed ?? 0;
    }

    const stats = {
      level_reached:   profile?.current_level       || 0,
      streak_days:     profile?.current_streak_days  || 0,
      five_star_count: profile?.total_5star_reviews  || 0,
      jobs_count:      profile?.total_jobs_completed  || 0,
      driver_jobs:     parseInt(roleStats?.driver_jobs   || 0, 10),
      offsider_jobs:   parseInt(roleStats?.offsider_jobs || 0, 10),
      business_jobs:   businessJobs,
    };

    const earned = [];
    const available = [];

    for (const badge of allBadges) {
      if (badge.is_secret && !earnedMap.has(badge.code)) continue;

      const earnedAt = earnedMap.get(badge.code) ?? null;
      const currentVal = stats[badge.requirement_type] ?? null;

      const badgeOut = {
        code:             badge.code,
        name:             badge.name,
        description:      badge.description,
        icon:             badge.icon,
        category:         badge.category,
        earnedAt:         earnedAt,
        requirementType:  badge.requirement_type,
        requirementValue: badge.requirement_value,
        currentValue:     currentVal,
        xpBonus:          badge.xp_bonus || 0,
      };

      if (earnedAt) {
        earned.push(badgeOut);
      } else {
        available.push(badgeOut);
      }
    }

    return res.json({ ok: true, data: { earned, available, stats } });
  } catch (e) {
    console.error('[gamifV2 badges]', e);
    return res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (connection) connection.release();
  }
};

"""

MODULE_EXPORTS_OLD = "module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint, getV2QuestsEndpoint, claimV2QuestEndpoint, getV2TrophiesEndpoint };"
MODULE_EXPORTS_NEW = "module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint, getV2QuestsEndpoint, claimV2QuestEndpoint, getV2TrophiesEndpoint, getV2BadgesEndpoint };"

if 'getV2BadgesEndpoint' in v2_content:
    print('✅ getV2BadgesEndpoint déjà présent dans gamificationV2.js')
elif MODULE_EXPORTS_OLD not in v2_content:
    print('❌ Ancre module.exports non trouvée dans gamificationV2.js')
    print('   Contenu actuel fin de fichier:')
    print(v2_content[-200:])
    sys.exit(1)
else:
    v2_content = v2_content.replace(
        MODULE_EXPORTS_OLD,
        V2_BADGE_ENDPOINT + MODULE_EXPORTS_NEW,
        1
    )
    with open(GAMIF_V2, 'w', encoding='utf-8') as f:
        f.write(v2_content)
    print('✅ getV2BadgesEndpoint injecté dans gamificationV2.js')

# ═══════════════════════════════════════════════════════════════════════════════
# 3. gamificationEngine.js — hooker checkBadges dans processJobCompleted
# ═══════════════════════════════════════════════════════════════════════════════

with open(GAMIF_ENGINE, 'r', encoding='utf-8') as f:
    engine_content = f.read()

# Ancre : fin du bloc fireAndForget de processJobCompleted (juste avant la fermeture })
# Les trophées company sont la dernière chose avant la fermeture du fireAndForget
BADGE_HOOK_ANCHOR = (
    "      await awardTrophies('company', companyId, 'job', `job_completed_trophy_job${jobId}_comp${companyId}`, 1, jobId, conn);\n"
    "    }\n"
    "  });\n"
    "}\n"
)

BADGE_HOOK_NEW = (
    "      await awardTrophies('company', companyId, 'job', `job_completed_trophy_job${jobId}_comp${companyId}`, 1, jobId, conn);\n"
    "    }\n"
    "\n"
    "    // ── 7. [Phase 5] Vérifier & attribuer les badges\n"
    "    const { checkBadges } = require('./badgeChecker');\n"
    "    await checkBadges(userId, conn);\n"
    "  });\n"
    "}\n"
)

if 'checkBadges' in engine_content:
    print('✅ checkBadges déjà présent dans gamificationEngine.js')
elif BADGE_HOOK_ANCHOR not in engine_content:
    print('❌ Ancre checkBadges non trouvée dans gamificationEngine.js')
    # Debug: show what we have around the area
    idx = engine_content.find("awardTrophies('company', companyId, 'job'")
    if idx >= 0:
        print('   Contenu autour de la zone:')
        print(repr(engine_content[idx:idx+200]))
    sys.exit(1)
else:
    engine_content = engine_content.replace(BADGE_HOOK_ANCHOR, BADGE_HOOK_NEW, 1)
    with open(GAMIF_ENGINE, 'w', encoding='utf-8') as f:
        f.write(engine_content)
    print('✅ checkBadges injecté dans gamificationEngine.js')

# ═══════════════════════════════════════════════════════════════════════════════
# 4. index.js — ajouter route GET /v2/badges
# ═══════════════════════════════════════════════════════════════════════════════

with open(INDEX_JS, 'r', encoding='utf-8') as f:
    index_content = f.read()

V2_BADGE_ROUTE = """
// ── Phase 5 : V2 Badges ─────────────────────────────────────────────
app.get('/swift-app/v1/user/gamification/v2/badges', (req, res) => {
  const { getV2BadgesEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2BadgesEndpoint(req, res);
});
// ── /Phase 5 ────────────────────────────────────────────────────────
"""

PHASE4_END = "// ── /Phase 4 ────────────────────────────────────────────────────────"

if 'getV2BadgesEndpoint' in index_content:
    print('✅ Route V2 badges déjà présente dans index.js')
elif PHASE4_END not in index_content:
    print('❌ Ancre Phase 4 end non trouvée dans index.js')
    sys.exit(1)
else:
    index_content = index_content.replace(
        PHASE4_END,
        PHASE4_END + "\n" + V2_BADGE_ROUTE,
        1
    )
    with open(INDEX_JS, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print('✅ Route V2 badges injectée dans index.js')

print('✅ inject_badges_phase5.py terminé')

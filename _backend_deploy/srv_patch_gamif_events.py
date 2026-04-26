#!/usr/bin/env python3
"""
Server-side patch script — run on sushinari via SSH.
Patches: gamificationEngine.js, startJobById.js, advanceJobStepWithTimer.js,
         uploadPhotoToJob.js, uploadMultipleImages.js, gamificationV2.js
"""
import sys
import subprocess

APP = '/srv/www/htdocs/swiftapp/server'
NODE = '/root/.nvm/versions/node/v16.17.0/bin/node'


def rf(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def wf(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  WRITTEN: {path}')


def node_check(path):
    rc = subprocess.run([NODE, '-c', path],
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if rc.returncode != 0:
        print('  SYNTAX ERROR in {}:\n{}'.format(path, rc.stderr.decode('utf-8', errors='replace')))
        sys.exit(1)
    print('  + syntax OK: {}'.format(path))


# =============================================================================
# STEP 1: gamificationEngine.js
# =============================================================================
print('\n=== STEP 1: gamificationEngine.js ===')
eng = f'{APP}/utils/gamificationEngine.js'
src = rf(eng)

# 1a. Add step_completed to XP_DEFAULTS
if 'step_completed' not in src:
    src = src.replace(
        "  review_submitted:          20,   // pour l'entreprise",
        "  step_completed:             5,   // par etape de job completee\n  review_submitted:          20,   // pour l'entreprise",
        1
    )
    print('  + XP_DEFAULTS: step_completed added')
else:
    print('  ~ step_completed already in XP_DEFAULTS')

# 1b. New functions — injected before module.exports
NEW_FUNCTIONS = (
    "\n"
    "// --- POINT D'ENTREE 6 --- JOB STARTED\n"
    "/**\n"
    " * Declenche la progression des quetes pour 'job_started'.\n"
    " * Pas d'XP direct (first_job_of_day gere dans processJobCompleted).\n"
    " */\n"
    "function processJobStarted(jobId, userId, companyId) {\n"
    "  if (!jobId || !userId) return;\n"
    "  fireAndForget(async (conn) => {\n"
    "    try {\n"
    "      await questEngine.processQuestEvent('user', userId, 'job_started', conn);\n"
    "      if (companyId) await questEngine.processQuestEvent('company', companyId, 'job_started', conn);\n"
    "    } catch (qe) { console.error('[gamificationEngine] quest job_started:', qe.message); }\n"
    "    console.log(`[gamificationEngine] processJobStarted job=${jobId} user=${userId}`);\n"
    "  });\n"
    "}\n"
    "\n"
    "// --- POINT D'ENTREE 7 --- STEP COMPLETED\n"
    "/**\n"
    " * Recompense la completion d'une etape de job.\n"
    " * Anti-spam: max 4 etapes recompensees par job.\n"
    " * @param {number} jobId\n"
    " * @param {number} userId\n"
    " * @param {number|null} companyId\n"
    " * @param {number} stepNumber\n"
    " */\n"
    "function processStepCompleted(jobId, userId, companyId, stepNumber) {\n"
    "  if (!jobId || !userId) return;\n"
    "  fireAndForget(async (conn) => {\n"
    "    const [[stepCount]] = await conn.execute(\n"
    "      `SELECT COUNT(*) as cnt FROM gamification_reward_ledger\n"
    "       WHERE entity_type = 'user' AND entity_id = ?\n"
    "         AND trigger_event = 'step_completed' AND job_id = ?`,\n"
    "      [userId, jobId]\n"
    "    );\n"
    "    if (stepCount.cnt >= 4) return;\n"
    "\n"
    "    const xp = await getXpAmount('step_completed');\n"
    "    const inserted = await awardReward({\n"
    "      entityType: 'user', entityId: userId,\n"
    "      rewardType: 'xp', amount: xp,\n"
    "      sourceType: 'action',\n"
    "      sourceCode: `step_completed_job${jobId}_step${stepNumber}_user${userId}`,\n"
    "      triggerEvent: 'step_completed', jobId,\n"
    "      reason: `Etape ${stepNumber} completee sur job #${jobId}`,\n"
    "    }, conn);\n"
    "    if (inserted) await syncProfileXP('user', userId, xp, conn);\n"
    "\n"
    "    try {\n"
    "      await questEngine.processQuestEvent('user', userId, 'step_completed', conn);\n"
    "    } catch (qe) { console.error('[gamificationEngine] quest step_completed:', qe.message); }\n"
    "    console.log(`[gamificationEngine] processStepCompleted job=${jobId} step=${stepNumber} user=${userId}`);\n"
    "  });\n"
    "}\n"
    "\n"
)

EXPORTS_MARKER = 'module.exports = {'
if 'processJobStarted' not in src:
    src = src.replace(EXPORTS_MARKER, NEW_FUNCTIONS + EXPORTS_MARKER, 1)
    print('  + processJobStarted + processStepCompleted added')
else:
    print('  ~ functions already present')

# 1c. Update module.exports
if 'processJobStarted,' not in src:
    src = src.replace(
        '  processReviewSubmitted,\n}',
        '  processReviewSubmitted,\n  processJobStarted,\n  processStepCompleted,\n}',
        1
    )
    print('  + exports updated')
else:
    print('  ~ exports already updated')

wf(eng, src)
node_check(eng)


# =============================================================================
# STEP 2: startJobById.js
# =============================================================================
print('\n=== STEP 2: startJobById.js ===')
path = f'{APP}/endPoints/v1/startJobById.js'
src = rf(path)

if 'processJobStarted' not in src:
    src = src.replace(
        "const { logJobAction } = require('../../utils/jobActionLogger');",
        "const { logJobAction } = require('../../utils/jobActionLogger');\nconst { processJobStarted } = require('../../utils/gamificationEngine');",
        1
    )
    old_log = "    logJobAction({ jobId, actionType: 'job_started', userId: req.user?.id, companyId: req.user?.company_id, actorRole: req.user?.role || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });"
    new_log = (
        old_log +
        "\n    // [GAMIF V2] Fire-and-forget\n"
        "    processJobStarted(jobId, req.user?.id, req.user?.company_id || null);"
    )
    if old_log in src:
        src = src.replace(old_log, new_log, 1)
        wf(path, src)
        print('  + processJobStarted hook added')
    else:
        print('  ! logJobAction marker not found, skipping')
else:
    print('  ~ already hooked')

node_check(path)


# =============================================================================
# STEP 3: advanceJobStepWithTimer.js
# =============================================================================
print('\n=== STEP 3: advanceJobStepWithTimer.js ===')
path = f'{APP}/endPoints/v1/advanceJobStepWithTimer.js'
src = rf(path)

if 'processStepCompleted' not in src:
    src = src.replace(
        "const { connect, close } = require('../../swiftDb');",
        "const { connect, close } = require('../../swiftDb');\nconst { processStepCompleted } = require('../../utils/gamificationEngine');",
        1
    )
    OLD_RES = "    res.json({\n      success: true,\n      message: 'Job step advanced successfully',"
    NEW_RES = (
        "    // [GAMIF V2] Fire-and-forget\n"
        "    processStepCompleted(job.id, req.user?.id, req.user?.company_id || null, currentStep);\n\n"
        "    res.json({\n      success: true,\n      message: 'Job step advanced successfully',"
    )
    if OLD_RES in src:
        src = src.replace(OLD_RES, NEW_RES, 1)
        wf(path, src)
        print('  + processStepCompleted hook added')
    else:
        print('  ! res.json marker not found, skipping')
else:
    print('  ~ already hooked')

node_check(path)


# =============================================================================
# STEP 4: uploadPhotoToJob.js
# =============================================================================
print('\n=== STEP 4: uploadPhotoToJob.js ===')
path = f'{APP}/endPoints/v1/uploadPhotoToJob.js'
src = rf(path)

if 'processPhotoAdded' not in src:
    src = src.replace(
        "const pool = require('../../swiftDb');",
        "const pool = require('../../swiftDb');\nconst { processPhotoAdded } = require('../../utils/gamificationEngine');",
        1
    )
    OLD_RES = "    res.json({\n      success: true,\n      message: 'Photo uploaded successfully',"
    NEW_RES = (
        "    // [GAMIF V2] Fire-and-forget\n"
        "    if (req.user?.id) processPhotoAdded(jobId, req.user.id, req.user.company_id || null, result.insertId);\n\n"
        "    res.json({\n      success: true,\n      message: 'Photo uploaded successfully',"
    )
    if OLD_RES in src:
        src = src.replace(OLD_RES, NEW_RES, 1)
        wf(path, src)
        print('  + processPhotoAdded hook added')
    else:
        print('  ! res.json marker not found, skipping')
else:
    print('  ~ already hooked')

node_check(path)


# =============================================================================
# STEP 5: uploadMultipleImages.js
# =============================================================================
print('\n=== STEP 5: uploadMultipleImages.js ===')
path = f'{APP}/endPoints/v1/uploadMultipleImages.js'
src = rf(path)

if 'processPhotoAdded' not in src:
    # Add require after last require line
    lines = src.split('\n')
    last_req_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('const ') and 'require(' in line:
            last_req_idx = i
    lines.insert(last_req_idx + 1, "const { processPhotoAdded } = require('../../utils/gamificationEngine');")
    src = '\n'.join(lines)

    # Inject gamif calls after connection.release(), before response building
    OLD_REL = "    await connection.release();\n\n    // Construire la r\u00e9ponse"
    NEW_REL = (
        "    await connection.release();\n\n"
        "    // [GAMIF V2] Fire-and-forget: one call per uploaded image\n"
        "    if (req.user?.id && uploadedImages.length > 0) {\n"
        "      const _gUserId = req.user.id;\n"
        "      const _gCompanyId = req.user.company_id || null;\n"
        "      const _gJobId = parseInt(jobId);\n"
        "      for (const img of uploadedImages) {\n"
        "        processPhotoAdded(_gJobId, _gUserId, _gCompanyId, img.id);\n"
        "      }\n"
        "    }\n\n"
        "    // Construire la r\u00e9ponse"
    )
    if OLD_REL in src:
        src = src.replace(OLD_REL, NEW_REL, 1)
        wf(path, src)
        print('  + processPhotoAdded batch hook added')
    else:
        print('  ! connection.release marker not found, trying fallback')
        # Fallback: inject before success response
        OLD_SUCC = "      success: uploadedImages.length > 0,"
        NEW_SUCC = (
            "    // [GAMIF V2] Fire-and-forget\n"
            "    if (req.user?.id) { for (const img of uploadedImages) processPhotoAdded(parseInt(jobId), req.user.id, req.user.company_id || null, img.id); }\n\n"
            "      success: uploadedImages.length > 0,"
        )
        if OLD_SUCC in src:
            src = src.replace(OLD_SUCC, NEW_SUCC, 1)
            wf(path, src)
            print('  + processPhotoAdded fallback hook added')
        else:
            print('  ! fallback also not found, skipping')
else:
    print('  ~ already hooked')

node_check(path)


# =============================================================================
# STEP 6: gamificationV2.js — add getV2DailyRecapEndpoint
# =============================================================================
print('\n=== STEP 6: gamificationV2.js ===')
path = f'{APP}/endPoints/v1/gamificationV2.js'
src = rf(path)

NEW_ENDPOINT = (
    "\n"
    "// --- GET /v2/daily-recap\n"
    "// Retourne le recap du jour pour l'utilisateur connecte.\n"
    "const getV2DailyRecapEndpoint = async (req, res) => {\n"
    "  const token = req.headers.authorization?.replace('Bearer ', '');\n"
    "  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });\n"
    "\n"
    "  let connection;\n"
    "  try {\n"
    "    const userResponse = await getUserByToken(token);\n"
    "    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });\n"
    "    const userId = userResponse.user.id;\n"
    "\n"
    "    const date = req.query.date || new Date().toISOString().slice(0, 10);\n"
    "    connection = await connect();\n"
    "\n"
    "    // Ensure gamification_daily_recap table exists\n"
    "    await connection.execute(`\n"
    "      CREATE TABLE IF NOT EXISTS gamification_daily_recap (\n"
    "        id INT AUTO_INCREMENT PRIMARY KEY,\n"
    "        user_id INT NOT NULL,\n"
    "        recap_date DATE NOT NULL,\n"
    "        total_xp_gained INT NOT NULL DEFAULT 0,\n"
    "        jobs_completed INT NOT NULL DEFAULT 0,\n"
    "        level_before INT NOT NULL DEFAULT 1,\n"
    "        level_after INT NOT NULL DEFAULT 1,\n"
    "        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
    "        UNIQUE KEY uq_user_date (user_id, recap_date)\n"
    "      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n"
    "    `);\n"
    "\n"
    "    // XP total gagne aujourd'hui\n"
    "    const [[xpRow]] = await connection.execute(\n"
    "      `SELECT COALESCE(SUM(amount), 0) AS total\n"
    "       FROM gamification_reward_ledger\n"
    "       WHERE entity_type = 'user' AND entity_id = ?\n"
    "         AND reward_type = 'xp' AND DATE(created_at) = ?`,\n"
    "      [userId, date]\n"
    "    );\n"
    "\n"
    "    // Jobs completes aujourd'hui\n"
    "    const [[jobsRow]] = await connection.execute(\n"
    "      `SELECT COUNT(DISTINCT source_code) AS cnt\n"
    "       FROM gamification_reward_ledger\n"
    "       WHERE entity_type = 'user' AND entity_id = ?\n"
    "         AND trigger_event = 'job_completed' AND DATE(created_at) = ?`,\n"
    "      [userId, date]\n"
    "    );\n"
    "\n"
    "    // Breakdown par action\n"
    "    const [breakdown] = await connection.execute(\n"
    "      `SELECT trigger_event AS action, COUNT(*) AS cnt, SUM(amount) AS xp\n"
    "       FROM gamification_reward_ledger\n"
    "       WHERE entity_type = 'user' AND entity_id = ?\n"
    "         AND reward_type = 'xp' AND DATE(created_at) = ?\n"
    "       GROUP BY trigger_event ORDER BY xp DESC`,\n"
    "      [userId, date]\n"
    "    );\n"
    "\n"
    "    // Level et XP depuis users (source of truth)\n"
    "    const [[userRow]] = await connection.execute(\n"
    "      'SELECT COALESCE(experience, 0) AS xp, COALESCE(level, 1) AS level FROM users WHERE id = ?',\n"
    "      [userId]\n"
    "    );\n"
    "    const currentXp = userRow?.xp ?? 0;\n"
    "    const currentLevel = userRow?.level ?? 1;\n"
    "    const xpToday = Number(xpRow.total) || 0;\n"
    "    const xpBefore = Math.max(0, currentXp - xpToday);\n"
    "\n"
    "    const [levelsRows] = await connection.execute(\n"
    "      'SELECT level FROM gamification_levels WHERE xp_required <= ? ORDER BY xp_required DESC LIMIT 1',\n"
    "      [xpBefore]\n"
    "    );\n"
    "    const levelBefore = levelsRows[0]?.level ?? 1;\n"
    "\n"
    "    // Recap deja envoye ?\n"
    "    const [[recap]] = await connection.execute(\n"
    "      'SELECT id, sent_at FROM gamification_daily_recap WHERE user_id = ? AND recap_date = ?',\n"
    "      [userId, date]\n"
    "    );\n"
    "\n"
    "    return res.json({\n"
    "      ok: true,\n"
    "      data: {\n"
    "        date,\n"
    "        sent: !!recap,\n"
    "        total_xp_gained: xpToday,\n"
    "        jobs_completed: Number(jobsRow.cnt) || 0,\n"
    "        level_before: levelBefore,\n"
    "        level_after: currentLevel,\n"
    "        level_up: currentLevel > levelBefore,\n"
    "        breakdown,\n"
    "      },\n"
    "    });\n"
    "  } catch (err) {\n"
    "    console.error('[getV2DailyRecapEndpoint] error:', err.message);\n"
    "    return res.status(500).json({ ok: false, error: 'Internal server error' });\n"
    "  } finally {\n"
    "    if (connection) { try { connection.release?.() ?? connection.end?.(); } catch (_) {} }\n"
    "  }\n"
    "};\n"
    "\n"
)

EXPORTS_LINE = 'module.exports = { getV2ProfileEndpoint, getV2LeaderboardEndpoint, getV2HistoryEndpoint, getV2QuestsEndpoint, claimV2QuestEndpoint };'
if 'getV2DailyRecapEndpoint' not in src:
    src = src.replace(EXPORTS_LINE, NEW_ENDPOINT + EXPORTS_LINE.replace('};', ', getV2DailyRecapEndpoint };'), 1)
    wf(path, src)
    print('  + getV2DailyRecapEndpoint added')
else:
    print('  ~ already present')

node_check(path)

print('\n=== ALL PATCHES DONE ===')

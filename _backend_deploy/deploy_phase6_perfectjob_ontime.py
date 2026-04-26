#!/usr/bin/env python3
"""
Phase 6 — Perfect Job + On-Time Job

Implémente deux nouveaux événements de gamification :
  1. processPerfectJob  — job avec photos avant/après + signature client
  2. processJobOnTime   — timer démarré avant la fin de la fenêtre de départ

Changements :
  - gamificationEngine.js  : +2 fonctions, exports mis à jour
  - completeJobById.js      : hooks fire-and-forget
  - badgeChecker.js         : +2 compteurs (perfect_job_count, ontime_job_count)
  - DB                      : ALTER ENUM badges, +4 quêtes, +4 badges
"""

import subprocess, sys, textwrap

ENGINE_PATH   = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'
COMPLETE_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/completeJobById.js'
BADGE_PATH    = '/srv/www/htdocs/swiftapp/server/utils/badgeChecker.js'

def read_remote(path):
    r = subprocess.run(['ssh', 'sushinari', 'cat ' + path],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print(f'ERROR reading {path}: {r.stderr.decode()}')
        sys.exit(1)
    return r.stdout.decode()

def write_remote(path, content):
    r = subprocess.run(['ssh', 'sushinari', 'cat > ' + path],
                       input=content.encode(),
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print(f'ERROR writing {path}: {r.stderr.decode()}')
        sys.exit(1)

def run_remote(cmd):
    r = subprocess.run(['ssh', 'sushinari', cmd],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = r.stdout.decode() + r.stderr.decode()
    return r.returncode, out

# ─── Helpers ─────────────────────────────────────────────────────────────────
def replace_once(content, old, new, label):
    if old not in content:
        print(f'  ERROR: anchor not found for [{label}]')
        print(f'  Looking for: {repr(old[:80])}')
        sys.exit(1)
    print(f'  OK — {label}')
    return content.replace(old, new, 1)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1 — SQL Migration
# ═══════════════════════════════════════════════════════════════════════════
print('\n═══ Step 1 — SQL Migration ═══')

SQL = textwrap.dedent("""\
-- ── 1. ALTER ENUM requirement_type pour supporter les nouveaux types de badges
ALTER TABLE gamification_badge_definitions
  MODIFY COLUMN requirement_type
    ENUM('jobs_count','streak_days','level_reached','rating_count','custom',
         'driver_jobs','offsider_jobs','business_jobs','five_star_count',
         'referral_count','perfect_days','perfect_job_count','ontime_job_count');

-- ── 2. Nouvelles quêtes
INSERT IGNORE INTO quests
  (code, title, description, icon, type, category, entity_scope,
   xp_reward, trophy_reward, trophy_count, target_count, event_trigger,
   repeatable, sort_order, active)
VALUES
  ('DAILY_PERFECT_1',  'Impeccable',
   'Compléter un job parfait (photos avant/après + signature)',
   '⭐', 'daily', 'daily', 'user',
   30, 0, 5, 1, 'perfect_job', 1, 20, 1),

  ('WEEKLY_PERFECT_3', 'Perfectionniste',
   'Compléter 3 jobs parfaits cette semaine',
   '🏆', 'weekly', 'weekly', 'user',
   80, 0, 15, 3, 'perfect_job', 1, 21, 1),

  ('MONTHLY_PERFECT_5','Niveau Excellence',
   'Compléter 5 jobs parfaits ce mois',
   '💎', 'monthly', 'monthly', 'user',
   150, 0, 30, 5, 'perfect_job', 1, 22, 1),

  ('DAILY_ONTIME_1',   'À l heure',
   'Démarrer un job avant la fin de la fenêtre de départ',
   '⏰', 'daily', 'daily', 'user',
   20, 0, 3, 1, 'job_ontime', 1, 25, 1),

  ('WEEKLY_ONTIME_3',  'Ponctuel',
   'Démarrer 3 jobs à l heure cette semaine',
   '🕐', 'weekly', 'weekly', 'user',
   60, 0, 10, 3, 'job_ontime', 1, 26, 1);

-- ── 3. Nouveaux badges
INSERT IGNORE INTO gamification_badge_definitions
  (code, name, description, icon, category, requirement_type, requirement_value,
   xp_bonus, is_active, sort_order)
VALUES
  ('PERFECT_JOB_5',
   'Perfectionniste',
   '5 jobs parfaits complétés (photos avant/après + signature)',
   '⭐', 'special', 'perfect_job_count', 5,   50, 1, 40),

  ('PERFECT_JOB_25',
   'Excellence',
   '25 jobs parfaits complétés',
   '💎', 'special', 'perfect_job_count', 25, 150, 1, 41),

  ('ONTIME_10',
   'Toujours à l''heure',
   '10 jobs démarrés dans la fenêtre prévue',
   '⏰', 'special', 'ontime_job_count', 10,  30, 1, 42),

  ('ONTIME_50',
   'Chrono Master',
   '50 jobs démarrés dans la fenêtre prévue',
   '🏅', 'special', 'ontime_job_count', 50, 100, 1, 43);
""")

# Exécuter via script Python sur le serveur
import tempfile, os
tmpf = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8')
tmpf.write(f'''
import subprocess, tempfile, os
sql = {repr(SQL)}
cnf = tempfile.NamedTemporaryFile(mode='w', suffix='.cnf', delete=False)
cnf.write("[client]\\nuser=swiftapp_user\\npassword=U%Xgxvc54EKUD39PcwNAYvuS\\ndatabase=swiftapp\\n")
cnf.flush()
r = subprocess.run(["mysql", "--defaults-file=" + cnf.name, "-e", sql],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(r.stdout.decode())
if r.stderr.decode(): print("STDERR:", r.stderr.decode())
cnf.close(); os.unlink(cnf.name)
print("SQL migration OK" if r.returncode == 0 else "SQL ERROR")
''')
tmpf.close()

subprocess.run(['scp', tmpf.name, 'sushinari:/tmp/migrate_phase6.py'],
               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
rc, out = run_remote('python3 /tmp/migrate_phase6.py')
print(out.strip())
os.unlink(tmpf.name)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2 — gamificationEngine.js
# ═══════════════════════════════════════════════════════════════════════════
print('\n═══ Step 2 — gamificationEngine.js ═══')

engine = read_remote(ENGINE_PATH)

NEW_FUNCTIONS = '''
// ─────────────────────────────────────────────────────────────────────────────
// POINT D\'ENTRÉE — PERFECT JOB
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Récompense un job "parfait" : photos avant + après + signature client.
 * Déclenche la quête event_trigger = \'perfect_job\'.
 * Idempotent via triggerEvent unique.
 */
function processPerfectJob(jobId, userId, companyId) {
  (async () => {
    const conn = await require(\'../swiftDb\').connect();
    try {
      // Vérifier les conditions du job parfait
      const [[jobData]] = await conn.execute(
        `SELECT
           j.signature_date,
           j.start_window_start,
           (SELECT COUNT(*) FROM job_images WHERE job_id = j.id AND image_type = \'before\' AND deleted_at IS NULL) AS before_count,
           (SELECT COUNT(*) FROM job_images WHERE job_id = j.id AND image_type = \'after\'  AND deleted_at IS NULL) AS after_count
         FROM jobs j WHERE j.id = ?`,
        [jobId]
      );

      if (!jobData) return;

      const isPerfect = (
        jobData.before_count >= 1 &&
        jobData.after_count  >= 1 &&
        jobData.signature_date !== null
      );

      if (!isPerfect) return;

      // +30 XP utilisateur — idempotent
      await awardReward({
        entityType:   \'user\',
        entityId:     userId,
        rewardType:   \'xp\',
        amount:       30,
        sourceType:   \'job\',
        sourceCode:   \'perfect_job\',
        triggerEvent: `perfect_job_job${jobId}_user${userId}`,
        jobId,
      }, conn);

      // Progression quête perfect_job
      const { processQuestEvent } = require(\'./questEngine\');
      await processQuestEvent(\'user\', userId, \'perfect_job\', conn);

      console.log(`[gamificationEngine] processPerfectJob job=${jobId} user=${userId}`);
    } catch (e) {
      console.error(\'[gamificationEngine] processPerfectJob error:\', e.message);
    } finally {
      conn.release();
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D\'ENTRÉE — JOB ON TIME
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Récompense un job démarré dans la fenêtre de départ prévue.
 * "À l\'heure" = timer_started_at <= start_window_end (ou +15 min si pas de fin définie).
 * Déclenche la quête event_trigger = \'job_ontime\'.
 */
function processJobOnTime(jobId, userId, companyId) {
  (async () => {
    const conn = await require(\'../swiftDb\').connect();
    try {
      const [[jobData]] = await conn.execute(
        `SELECT timer_started_at, start_window_start, start_window_end FROM jobs WHERE id = ?`,
        [jobId]
      );

      if (!jobData || !jobData.timer_started_at || !jobData.start_window_start) return;

      const started   = new Date(jobData.timer_started_at);
      const deadline  = jobData.start_window_end
        ? new Date(jobData.start_window_end)
        : new Date(new Date(jobData.start_window_start).getTime() + 15 * 60 * 1000);

      if (started > deadline) return; // Non ponctuel

      // +20 XP utilisateur — idempotent
      await awardReward({
        entityType:   \'user\',
        entityId:     userId,
        rewardType:   \'xp\',
        amount:       20,
        sourceType:   \'job\',
        sourceCode:   \'job_ontime\',
        triggerEvent: `job_ontime_job${jobId}_user${userId}`,
        jobId,
      }, conn);

      // Progression quête job_ontime
      const { processQuestEvent } = require(\'./questEngine\');
      await processQuestEvent(\'user\', userId, \'job_ontime\', conn);

      console.log(`[gamificationEngine] processJobOnTime job=${jobId} user=${userId}`);
    } catch (e) {
      console.error(\'[gamificationEngine] processJobOnTime error:\', e.message);
    } finally {
      conn.release();
    }
  })();
}

'''

# Injecter avant module.exports
OLD_EXPORTS = '''module.exports = {
  processJobCompleted,
  processPhotoAdded,
  processSignatureCollected,
  processNoteAdded,
  processReviewSubmitted,
  getCurrentSeason,
};'''

NEW_EXPORTS = '''module.exports = {
  processJobCompleted,
  processPhotoAdded,
  processSignatureCollected,
  processNoteAdded,
  processReviewSubmitted,
  getCurrentSeason,
  processPerfectJob,
  processJobOnTime,
};'''

engine = replace_once(engine, OLD_EXPORTS, NEW_FUNCTIONS + NEW_EXPORTS,
                      'inject processPerfectJob + processJobOnTime + exports')
write_remote(ENGINE_PATH, engine)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3 — completeJobById.js
# ═══════════════════════════════════════════════════════════════════════════
print('\n═══ Step 3 — completeJobById.js ═══')

complete = read_remote(COMPLETE_PATH)

OLD_HOOK = '''    processJobCompleted(
      jobId, user.id,
      user.company_id || job.contractor_company_id || null
    );'''

NEW_HOOK = '''    processJobCompleted(
      jobId, user.id,
      user.company_id || job.contractor_company_id || null
    );
    // [PHASE 6] Perfect job + On-time bonus
    const { processPerfectJob, processJobOnTime } = require('../../utils/gamificationEngine');
    processPerfectJob(jobId, user.id, user.company_id || job.contractor_company_id || null);
    processJobOnTime(jobId, user.id, user.company_id || job.contractor_company_id || null);'''

complete = replace_once(complete, OLD_HOOK, NEW_HOOK, 'inject phase 6 hooks in completeJobById')
write_remote(COMPLETE_PATH, complete)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4 — badgeChecker.js — ajouter les compteurs perfect_job + ontime
# ═══════════════════════════════════════════════════════════════════════════
print('\n═══ Step 4 — badgeChecker.js ═══')

badge_checker = read_remote(BADGE_PATH)

OLD_STATS = '''    // ── Dictionnaire de stats évaluables
    const stats = {
      level_reached:   profile.current_level       || 0,
      streak_days:     profile.current_streak_days  || 0,
      five_star_count: profile.total_5star_reviews  || 0,
      jobs_count:      profile.total_jobs_completed  || 0,
      driver_jobs:     parseInt(roleStats?.driver_jobs   || 0, 10),
      offsider_jobs:   parseInt(roleStats?.offsider_jobs || 0, 10),
      business_jobs:   businessJobs,
      // referral_count et perfect_days : non implémentés (extension future)
    };'''

NEW_STATS = '''    // ── Comptage perfect_job et ontime depuis le ledger (idempotent)
    const [[ledgerStats]] = await conn.execute(
      `SELECT
         COALESCE(SUM(source_code = 'perfect_job'), 0) AS perfect_job_count,
         COALESCE(SUM(source_code = 'job_ontime'),  0) AS ontime_job_count
       FROM gamification_reward_ledger
       WHERE entity_type = 'user' AND entity_id = ? AND reward_type = 'xp'`,
      [userId]
    );

    // ── Dictionnaire de stats évaluables
    const stats = {
      level_reached:     profile.current_level       || 0,
      streak_days:       profile.current_streak_days  || 0,
      five_star_count:   profile.total_5star_reviews  || 0,
      jobs_count:        profile.total_jobs_completed  || 0,
      driver_jobs:       parseInt(roleStats?.driver_jobs   || 0, 10),
      offsider_jobs:     parseInt(roleStats?.offsider_jobs || 0, 10),
      business_jobs:     businessJobs,
      perfect_job_count: parseInt(ledgerStats?.perfect_job_count || 0, 10),
      ontime_job_count:  parseInt(ledgerStats?.ontime_job_count  || 0, 10),
      // referral_count et perfect_days : non implémentés (extension future)
    };'''

badge_checker = replace_once(badge_checker, OLD_STATS, NEW_STATS, 'add perfect_job_count + ontime_job_count to stats')
write_remote(BADGE_PATH, badge_checker)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5 — Vérification syntaxe + PM2 restart
# ═══════════════════════════════════════════════════════════════════════════
print('\n═══ Step 5 — Syntax check + PM2 restart ═══')

rc, out = run_remote(
    f'node --check {ENGINE_PATH} {COMPLETE_PATH} {BADGE_PATH} && echo SYNTAX_OK'
)
print(out.strip())
if 'SYNTAX_OK' not in out:
    print('SYNTAX ERROR — aborting PM2 restart')
    sys.exit(1)

rc, out = run_remote('pm2 restart 17')
print(out.strip())

print('\n✅ Phase 6 (Perfect Job + On-Time) déployée avec succès !')

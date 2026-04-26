#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix badgeChecker.js — ajout perfect_job_count + ontime_job_count"""
import subprocess, sys

BADGE_PATH = '/srv/www/htdocs/swiftapp/server/utils/badgeChecker.js'

r = subprocess.run(['ssh', 'sushinari', 'cat ' + BADGE_PATH],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
content = r.stdout.decode('utf-8')

# Find the stats block dynamically (avoid encoding issues with special chars)
start_marker = 'const stats = {'
end_marker = '    };\n\n    // ── 6. Évaluer'

if start_marker not in content:
    print('ERROR: start marker not found')
    sys.exit(1)

# Locate where the stats block starts (go back to find the comment line)
idx_stats = content.find(start_marker)
# Go back to find the comment before it
idx_comment = content.rfind('\n', 0, idx_stats)
idx_comment = content.rfind('\n', 0, idx_comment) + 1  # line before
line_before = content[idx_comment:idx_stats]

# Find end of stats block
idx_end = content.find(end_marker, idx_stats)
if idx_end == -1:
    print('ERROR: end marker not found')
    # Try alternative
    idx_end = content.find('// \u2500\u2500 6.', idx_stats)
    if idx_end == -1:
        print('ERROR: fallback end marker not found either')
        sys.exit(1)
    # Walk back to end of stats block
    idx_end = content.rfind('};', idx_stats, idx_end) + 2
    idx_end_full = idx_end
else:
    idx_end_full = idx_end + len('    };\n')

old_block = content[idx_comment:idx_end_full]
print('Replacing block:')
print(repr(old_block[:200]))

new_block = '''    // ── Comptage perfect_job et ontime depuis le ledger (idempotent)
    const [[ledgerStats]] = await conn.execute(
      `SELECT
         COALESCE(SUM(source_code = 'perfect_job'), 0) AS perfect_job_count,
         COALESCE(SUM(source_code = 'job_ontime'),  0) AS ontime_job_count
       FROM gamification_reward_ledger
       WHERE entity_type = 'user' AND entity_id = ? AND reward_type = 'xp'`,
      [userId]
    );

    // -- Dictionnaire de stats evaluables
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
    };
'''

new_content = content[:idx_comment] + new_block + content[idx_end_full:]

r2 = subprocess.run(['ssh', 'sushinari', 'cat > ' + BADGE_PATH],
                    input=new_content.encode('utf-8'),
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if r2.returncode != 0:
    print('ERROR writing:', r2.stderr.decode())
    sys.exit(1)

print('OK - badgeChecker.js updated')

# Syntax check
r3 = subprocess.run(['ssh', 'sushinari', f'node --check {BADGE_PATH} && echo SYNTAX_OK'],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(r3.stdout.decode() + r3.stderr.decode())

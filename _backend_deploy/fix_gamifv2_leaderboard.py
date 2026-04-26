#!/usr/bin/env python3
"""Fix leaderboard SQL in gamificationV2.js (remaining fix from fix_gamifv2_columns.py)"""
import subprocess, sys

V2_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/gamificationV2.js'

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

v2 = read_remote(V2_PATH)

# Find the exact leaderboard query block and replace it line by line
# Using a targeted approach with the actual server content

OLD = (
    '    const [rows] = await connection.query(\n'
    '\n'
    '      `SELECT\n'
    '\n'
    '        u.id, u.first_name, u.last_name, u.profile_picture_url,\n'
    '\n'
    '        COALESCE(SUM(grl.xp_awarded), 0) AS period_xp,\n'
    '\n'
    '        COALESCE(gp.total_trophies, 0) AS total_trophies,\n'
    '\n'
    '        COALESCE(gp.current_streak_days, 0) AS current_streak_days,\n'
    '\n'
    '        COALESCE(u.level, 1) AS level,\n'
    '\n'
    '        gr.label AS rank_label\n'
    '\n'
    '      FROM gamification_reward_ledger grl\n'
    '\n'
    '      JOIN users u ON u.id = grl.entity_id AND grl.entity_type = \'user\'\n'
    '\n'
    '      LEFT JOIN gamification_profiles gp ON gp.entity_type = \'user\' AND gp.entity_id = u.id\n'
    '\n'
    '      LEFT JOIN gamification_ranks gr ON gr.id = (\n'
    '\n'
    '        SELECT id FROM gamification_ranks\n'
    '\n'
    '        WHERE min_trophies <= COALESCE(gp.total_trophies, 0)\n'
    '\n'
    '        ORDER BY min_trophies DESC LIMIT 1\n'
    '\n'
    '      )\n'
    '\n'
    '      WHERE 1=1 ` + dateFilter + `\n'
    '\n'
    '      GROUP BY u.id\n'
    '\n'
    '      ORDER BY period_xp DESC\n'
    '\n'
    '      LIMIT ? OFFSET ?`,\n'
    '\n'
    '    [limit, offset]);'
)

NEW = (
    '    const [rows] = await connection.query(\n'
    '      `SELECT\n'
    '        u.id, u.first_name, u.last_name, u.avatar_url,\n'
    '        COALESCE(SUM(grl.amount), 0) AS period_xp,\n'
    '        COALESCE((SELECT SUM(trophies) FROM trophy_ledgers WHERE entity_type = \'user\' AND entity_id = u.id), 0) AS total_trophies,\n'
    '        COALESCE(gp.current_streak_days, 0) AS current_streak_days,\n'
    '        COALESCE(u.level, 1) AS level,\n'
    '        gr.name AS rank_label\n'
    '      FROM gamification_reward_ledger grl\n'
    '      JOIN users u ON u.id = grl.entity_id AND grl.entity_type = \'user\'\n'
    '      LEFT JOIN gamification_profiles gp ON gp.entity_type = \'user\' AND gp.entity_id = u.id\n'
    '      LEFT JOIN gamification_ranks gr ON gr.id = (\n'
    '        SELECT id FROM gamification_ranks\n'
    '        WHERE min_level <= COALESCE(u.level, 1) AND is_active = 1\n'
    '        ORDER BY min_level DESC LIMIT 1\n'
    '      )\n'
    '      WHERE 1=1 ` + dateFilter + `\n'
    '      GROUP BY u.id\n'
    '      ORDER BY period_xp DESC\n'
    '      LIMIT ? OFFSET ?`,\n'
    '    [limit, offset]);'
)

if OLD not in v2:
    print('ERROR: Could not find leaderboard SQL block!')
    # Print what we find around profile_picture_url for debugging
    idx = v2.find('profile_picture_url')
    if idx >= 0:
        print('Context around profile_picture_url:')
        print(repr(v2[idx-200:idx+200]))
    sys.exit(1)

v2 = v2.replace(OLD, NEW, 1)
write_remote(V2_PATH, v2)
print('OK — leaderboard SQL fixed')

# Restart PM2
print('Restarting PM2...')
r = subprocess.run(['ssh', 'sushinari', 'pm2 restart 17'],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(r.stdout.decode() + r.stderr.decode())
print('Done!')

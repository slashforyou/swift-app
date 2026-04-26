#!/usr/bin/env python3
import subprocess

SERVER  = 'sushinari'
DB_USER = 'swiftapp_user'
DB_PASS = 'U%Xgxvc54EKUD39PcwNAYvuS'
DB_NAME = 'swiftapp'

sql = (
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS "
    "WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='quests' "
    "AND COLUMN_NAME IN ('category','end_date','event_id','trophy_count');"
    "SHOW TABLES LIKE 'gamification_quest_events';"
    "SELECT category, COUNT(*) n FROM quests GROUP BY category;"
)

# Write SQL to local file then push and exec on server
with open('_check_migration.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

subprocess.run(['scp', '_check_migration.sql', f'{SERVER}:/tmp/_check_migration.sql'], check=True)

r = subprocess.run(
    ['ssh', SERVER, f'mysql -u {DB_USER} -p{DB_PASS} {DB_NAME} < /tmp/_check_migration.sql'],
    capture_output=True, text=True, errors='replace'
)
print(r.stdout)
if r.stderr:
    lines = [l for l in r.stderr.splitlines() if 'password' not in l.lower()]
    if lines: print('\n'.join(lines))

#!/usr/bin/env python3
"""Check structure of existing gamification tables."""
import subprocess

SERVER = 'sushinari'
DB_USER = 'swiftapp_user'
DB_PASS = 'U%Xgxvc54EKUD39PcwNAYvuS'
DB_NAME = 'swiftapp'

tables = ['gamification_quest_progress', 'gamification_badge_definitions']

for t in tables:
    sql = f"DESCRIBE {t};"
    cmd = f"mysql -u {DB_USER} -p{DB_PASS} {DB_NAME} -e '{sql}'"
    result = subprocess.run(['ssh', SERVER, cmd], capture_output=True, text=True)
    print(f"\n=== {t} ===")
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr[:200])

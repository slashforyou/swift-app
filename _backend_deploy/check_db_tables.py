#!/usr/bin/env python3
"""Check existing DB tables for gamification system."""
import subprocess

SERVER = 'sushinari'
DB_USER = 'swiftapp_user'
DB_PASS = 'U%Xgxvc54EKUD39PcwNAYvuS'
DB_NAME = 'swiftapp'

sql = "SHOW TABLES;"

cmd = f"mysql -u {DB_USER} -p{DB_PASS} {DB_NAME} -e '{sql}'"
result = subprocess.run(['ssh', SERVER, cmd], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:500])

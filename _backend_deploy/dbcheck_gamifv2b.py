#!/usr/bin/env python3
import subprocess, tempfile, os

cnf = tempfile.NamedTemporaryFile(mode='w', suffix='.cnf', delete=False)
cnf.write('[client]\nuser=swiftapp_user\npassword=U%Xgxvc54EKUD39PcwNAYvuS\ndatabase=swiftapp\n')
cnf.flush()

def q(sql):
    r = subprocess.run(
        ['mysql', '--defaults-file=' + cnf.name, '-e', sql],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    print(r.stdout.decode() or r.stderr.decode())

print("=== gamification_reward_ledger columns ===")
q("SHOW COLUMNS FROM gamification_reward_ledger;")

print("=== users picture columns ===")
q("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='users' AND COLUMN_NAME LIKE '%pic%' OR COLUMN_NAME LIKE '%photo%' OR COLUMN_NAME LIKE '%avatar%';")

print("=== users picture/avatar columns (correct query) ===")
q("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='users' AND (COLUMN_NAME LIKE '%pic%' OR COLUMN_NAME LIKE '%photo%' OR COLUMN_NAME LIKE '%avatar%' OR COLUMN_NAME LIKE '%image%');")

print("=== trophy-related tables ===")
q("SHOW TABLES LIKE '%trophy%';")

print("=== gamification_profiles sample row ===")
q("SELECT * FROM gamification_profiles LIMIT 1;")

cnf.close()
os.unlink(cnf.name)

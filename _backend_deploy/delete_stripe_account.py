#!/usr/bin/env python3
"""
Delete Stripe account for company_id=12 from the database.
This allows the user to recreate it with business_type='individual'.

Usage: scp this to server then run: python3 /tmp/delete_stripe_account.py
"""
import subprocess
import sys

MYSQL_CMD = ['mysql', '-u', 'swiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def run_sql(sql):
    result = subprocess.run(MYSQL_CMD + ['-Bse', sql], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr.decode().strip()}")
        return None
    return result.stdout.decode().strip()

# 1. Find the Stripe account table
print("=== Step 1: Find Stripe tables ===")
tables = run_sql("SHOW TABLES")
if tables:
    stripe_tables = [t for t in tables.split('\n') if 'stripe' in t.lower()]
    print(f"  Stripe-related tables: {stripe_tables}")
else:
    print("  No tables found, trying different approach...")
    tables = run_sql("SHOW TABLES LIKE '%stripe%'")
    print(f"  Result: {tables}")

# 2. Check companies table for stripe_account_id
print("\n=== Step 2: Check companies table ===")
cols = run_sql("SHOW COLUMNS FROM companies")
if cols:
    stripe_cols = [c.split('\t')[0] for c in cols.split('\n') if 'stripe' in c.lower()]
    print(f"  Stripe columns in companies: {stripe_cols}")

# 3. Find current stripe account for company 12
print("\n=== Step 3: Find company 12 stripe account ===")
result = run_sql("SELECT id, name, stripe_account_id FROM companies WHERE id = 12")
if result:
    print(f"  Company 12: {result}")
else:
    # Try without stripe_account_id
    result = run_sql("SELECT id, name FROM companies WHERE id = 12")
    print(f"  Company 12: {result}")

# 4. Check if there's a separate stripe table
for tbl in (stripe_tables if 'stripe_tables' in dir() and stripe_tables else []):
    print(f"\n=== Checking table: {tbl} ===")
    data = run_sql(f"SELECT * FROM {tbl} WHERE company_id = 12 LIMIT 5")
    if data:
        print(f"  Data: {data}")
    else:
        data = run_sql(f"SELECT * FROM {tbl} LIMIT 2")
        if data:
            print(f"  Sample data: {data}")

# 5. Delete the stripe account id
print("\n=== Step 4: Delete stripe account ===")
if stripe_cols:
    for col in stripe_cols:
        old_val = run_sql(f"SELECT {col} FROM companies WHERE id = 12")
        print(f"  Current {col}: {old_val}")
    
    # Set stripe_account_id to NULL
    run_sql("UPDATE companies SET stripe_account_id = NULL WHERE id = 12")
    new_val = run_sql("SELECT stripe_account_id FROM companies WHERE id = 12")
    print(f"  After delete - stripe_account_id: {new_val}")

# Also delete from any stripe-specific tables
if 'stripe_tables' in dir() and stripe_tables:
    for tbl in stripe_tables:
        count = run_sql(f"SELECT COUNT(*) FROM {tbl} WHERE company_id = 12")
        if count and int(count) > 0:
            print(f"  Deleting {count} rows from {tbl}...")
            run_sql(f"DELETE FROM {tbl} WHERE company_id = 12")
            print(f"  Deleted from {tbl}")

print("\n=== DONE ===")
print("Company 12 can now recreate a Stripe account with business_type='individual'")

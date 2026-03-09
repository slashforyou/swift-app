"""Migration: add counter_proposed_price to jobs and proposed_price to job_counter_proposals"""
import subprocess

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def sql(query):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(query.encode())
    return out.decode().strip(), err.decode().strip()

# jobs table
out, err = sql("""
SELECT COUNT(*) as c FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='jobs' AND COLUMN_NAME='counter_proposed_price';
""")
if '0' in out:
    _, err2 = sql("ALTER TABLE jobs ADD COLUMN counter_proposed_price DECIMAL(10,2) DEFAULT NULL AFTER counter_proposed_end;")
    print('jobs.counter_proposed_price:', 'OK' if not err2 else err2)
else:
    print('jobs.counter_proposed_price: already exists')

# job_counter_proposals table
out2, err2 = sql("""
SELECT COUNT(*) as c FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='job_counter_proposals' AND COLUMN_NAME='proposed_price';
""")
if '0' in out2:
    _, err3 = sql("ALTER TABLE job_counter_proposals ADD COLUMN proposed_price DECIMAL(10,2) DEFAULT NULL AFTER proposed_end;")
    print('job_counter_proposals.proposed_price:', 'OK' if not err3 else err3)
else:
    print('job_counter_proposals.proposed_price: already exists')

print('Done.')

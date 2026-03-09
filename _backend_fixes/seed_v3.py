import subprocess
import os

# Read credentials from .env to avoid hardcoding special characters
ENV_FILE = '/srv/www/htdocs/swiftapp/server/.env'
env = {}
with open(ENV_FILE) as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

DB_USER = env.get('DB_USER', 'swiftapp_user')
DB_PASS = env.get('DB_PASS', '')
DB_NAME = env.get('DB_DATABASE', 'swiftapp')

print('Connecting as: %s to DB: %s' % (DB_USER, DB_NAME))

# Write a temp .my.cnf to avoid any shell quoting issues
CNF = '/tmp/.my_swift.cnf'
with open(CNF, 'w') as f:
    f.write('[client]\nuser=%s\npassword=%s\nhost=localhost\n' % (DB_USER, DB_PASS))
os.chmod(CNF, 0o600)

def sql(query):
    r = subprocess.run(
        ['mysql', '--defaults-file=' + CNF, DB_NAME, '-e', query],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    out = r.stdout.decode().strip()
    err = r.stderr.decode().strip()
    if err and 'Warning' not in err:
        print('SQL ERR:', err[:300])
    return out

# Test connection
print('\n=== CONNECTION TEST ===')
print(sql('SELECT 1 AS ok;'))

# Trucks schema
print('\n=== TRUCKS SCHEMA ===')
print(sql('DESCRIBE trucks;'))

# Jobs with contractor
print('\n=== JOBS WITH CONTRACTOR ===')
print(sql('SELECT id,code,status,contractor_company_id FROM jobs WHERE contractor_company_id IS NOT NULL LIMIT 20;'))

# All transfers
print('\n=== ALL TRANSFERS ===')
print(sql('SELECT id,job_id,status,sender_company_id,recipient_company_id,requested_drivers,requested_offsiders,pricing_amount,pricing_type FROM job_transfers;'))

# Get truck IDs
trucks_raw = sql('SELECT id FROM trucks LIMIT 15;')
truck_ids = [int(line.strip()) for line in trucks_raw.split('\n') if line.strip().isdigit()]
print('\nTruck IDs:', truck_ids)

# Get transfer IDs
rows_raw = sql('SELECT id FROM job_transfers;')
ids = [line.strip() for line in rows_raw.strip().split('\n') if line.strip().isdigit()]
print('%d transfers found: %s' % (len(ids), ids))

if not ids:
    print('No transfers to update.')
    os.remove(CNF)
    exit(0)

# Resource scenarios
scenarios = [
    {'drivers': 1, 'offsiders': 0, 'use_truck': True,  'note': '1 chauffeur + camion requis'},
    {'drivers': 2, 'offsiders': 1, 'use_truck': True,  'note': '2 chauffeurs + 1 offsider'},
    {'drivers': 1, 'offsiders': 2, 'use_truck': True,  'note': 'Demenagement complet - equipe complete'},
    {'drivers': 0, 'offsiders': 2, 'use_truck': False, 'note': 'Equipe manutention (2 packers)'},
    {'drivers': 1, 'offsiders': 1, 'use_truck': True,  'note': 'Livraison standard'},
    {'drivers': 2, 'offsiders': 0, 'use_truck': True,  'note': '2 chauffeurs + 1 packer'},
    {'drivers': 1, 'offsiders': 3, 'use_truck': True,  'note': 'Equipe offsider requise (3)'},
    {'drivers': 0, 'offsiders': 1, 'use_truck': False, 'note': 'Emballage prioritaire (3 packers)'},
]
pricing_options = [
    {'amount': 120,  'type': 'hourly'},
    {'amount': 850,  'type': 'flat'},
    {'amount': 95,   'type': 'hourly'},
    {'amount': 1200, 'type': 'flat'},
    {'amount': 680,  'type': 'daily'},
    {'amount': 110,  'type': 'hourly'},
    {'amount': 1500, 'type': 'flat'},
    {'amount': 750,  'type': 'daily'},
]

print('\n=== UPDATING TRANSFERS ===')
for i, tid in enumerate(ids):
    sc = scenarios[i % len(scenarios)]
    pr = pricing_options[i % len(pricing_options)]
    truck_id = 'NULL'
    if sc['use_truck'] and truck_ids:
        truck_id = str(truck_ids[i % len(truck_ids)])
    note = sc['note']
    update = (
        "UPDATE job_transfers SET "
        "requested_drivers = " + str(sc['drivers']) + ", "
        "requested_offsiders = " + str(sc['offsiders']) + ", "
        "pricing_amount = " + str(pr['amount']) + ", "
        "pricing_type = '" + pr['type'] + "', "
        "preferred_truck_id = " + truck_id + ", "
        "resource_note = '" + note + "' "
        "WHERE id = " + str(tid) + ";"
    )
    result = sql(update)
    print('Transfer %s: d=%s o=%s truck=%s price=%s %s => %s' % (
        tid, sc['drivers'], sc['offsiders'], truck_id, pr['amount'], pr['type'], result or 'OK'))

print('\n=== FINAL STATE ===')
print(sql('SELECT id, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers;'))

os.remove(CNF)
print('\nDONE')

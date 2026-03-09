import subprocess

PW = 'U%Xgxvc54EKUD39PcwNAYvuS'

def sql(query):
    r = subprocess.run(
        ['mysql', '-u', 'swiftapp_user', '-p' + PW, 'swiftapp', '-e', query],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    out = r.stdout.decode().strip()
    err = r.stderr.decode().strip()
    if err and 'Warning' not in err:
        print('SQL ERR:', err[:200])
    return out

print('=== TRUCKS SCHEMA ===')
print(sql('DESCRIBE trucks;'))

print('\n=== JOBS WITH CONTRACTOR ===')
print(sql('SELECT id,code,status,contractor_company_id FROM jobs WHERE contractor_company_id IS NOT NULL LIMIT 15;'))

print('\n=== ALL TRANSFERS ===')
print(sql('SELECT id,job_id,status,sender_company_id,recipient_company_id FROM job_transfers;'))

trucks_raw = sql('SELECT id FROM trucks LIMIT 10;')
print('\n=== TRUCK IDs ===\n' + trucks_raw)
truck_ids = [int(line.strip()) for line in trucks_raw.split('\n') if line.strip().isdigit()]
print('Parsed truck IDs:', truck_ids)

rows_raw = sql('SELECT id FROM job_transfers;')
ids = [line.strip() for line in rows_raw.strip().split('\n') if line.strip().isdigit()]
print('\n=== %d TRANSFERS FOUND ===' % len(ids), ids)

scenarios = [
    {'drivers': 1, 'offsiders': 0, 'use_truck': True,  'note': '1 chauffeur + camion requis'},
    {'drivers': 2, 'offsiders': 1, 'use_truck': True,  'note': '2 chauffeurs + 1 offsider'},
    {'drivers': 1, 'offsiders': 2, 'use_truck': True,  'note': 'Demenagement complet - equipe complete'},
    {'drivers': 0, 'offsiders': 2, 'use_truck': False, 'note': 'Equipe manutention (2 packers)'},
    {'drivers': 1, 'offsiders': 1, 'use_truck': True,  'note': 'Livraison standard'},
    {'drivers': 2, 'offsiders': 0, 'use_truck': True,  'note': '2 chauffeurs + 1 packer'},
    {'drivers': 1, 'offsiders': 3, 'use_truck': True,  'note': 'Equipe offsider requise'},
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

for i, tid in enumerate(ids):
    sc = scenarios[i % len(scenarios)]
    pr = pricing_options[i % len(pricing_options)]
    truck_id = 'NULL'
    if sc['use_truck'] and truck_ids:
        truck_id = str(truck_ids[i % len(truck_ids)])
    note = sc['note']
    update = (
        'UPDATE job_transfers SET '
        'requested_drivers = %s, '
        'requested_offsiders = %s, '
        'pricing_amount = %s, '
        'pricing_type = \'%s\', '
        'preferred_truck_id = %s, '
        'resource_note = \'%s\' '
        'WHERE id = %s;' % (sc['drivers'], sc['offsiders'], pr['amount'], pr['type'], truck_id, note, tid)
    )
    result = sql(update)
    print('Transfer %s: d=%s o=%s truck=%s price=%s %s => %s' % (tid, sc['drivers'], sc['offsiders'], truck_id, pr['amount'], pr['type'], result or 'OK'))

print('\n=== FINAL STATE ===')
print(sql('SELECT id, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers;'))
print('\nDONE')

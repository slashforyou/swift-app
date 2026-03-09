"""
Seed job_transfers with realistic resource requests (vehicle, drivers, offsiders, packers).
Each transfer will get a randomized but coherent set of requested resources.
"""
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

# 1. Check trucks schema
print('=== TRUCKS SCHEMA ===')
print(sql('DESCRIBE trucks;'))

# 2. Check jobs
print('\n=== JOBS WITH CONTRACTOR ===')
print(sql('SELECT id,code,status,contractor_company_id FROM jobs WHERE contractor_company_id IS NOT NULL LIMIT 15;'))

# 3. All transfers
print('\n=== ALL TRANSFERS ===')
print(sql('SELECT id,job_id,status,sender_company_id,recipient_company_id FROM job_transfers;'))

# 4. Truck IDs
trucks_raw = sql('SELECT id FROM trucks LIMIT 10;')
print('\n=== TRUCK IDs ===')
print(trucks_raw)
truck_ids = [int(line.strip()) for line in trucks_raw.split('\n') if line.strip().isdigit()]
print('Parsed truck IDs:', truck_ids)

# 5. Get all transfer IDs
rows_raw = sql('SELECT id FROM job_transfers;')
ids = [line.strip() for line in rows_raw.strip().split('\n') if line.strip().isdigit()]
print(f'\n=== {len(ids)} TRANSFERS FOUND ===', ids)

# 6. Resource scenarios (cycling)
scenarios = [
    {'drivers': 1, 'offsiders': 0, 'use_truck': True,  'note': '1 chauffeur + camion requis'},
    {'drivers': 2, 'offsiders': 1, 'use_truck': True,  'note': '2 chauffeurs + 1 offsider'},
    {'drivers': 1, 'offsiders': 2, 'use_truck': True,  'note': 'Demenagement complet - equipe complète'},
    {'drivers': 0, 'offsiders': 2, 'use_truck': False, 'note': 'Equipe manutention sans chauffeur (2 packers)'},
    {'drivers': 1, 'offsiders': 1, 'use_truck': True,  'note': 'Livraison standard'},
    {'drivers': 2, 'offsiders': 0, 'use_truck': True,  'note': '2 chauffeurs + 1 packer'},
    {'drivers': 1, 'offsiders': 3, 'use_truck': True,  'note': 'Bonne equipe offsider requise'},
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

# 7. Update each transfer
for i, tid in enumerate(ids):
    sc = scenarios[i % len(scenarios)]
    pr = pricing_options[i % len(pricing_options)]
    truck_id = 'NULL'
    if sc['use_truck'] and truck_ids:
        truck_id = str(truck_ids[i % len(truck_ids)])

    note = sc['note'].replace("'", "\\'")
    update = (
        f"UPDATE job_transfers SET "
        f"requested_drivers = {sc['drivers']}, "
        f"requested_offsiders = {sc['offsiders']}, "
        f"pricing_amount = {pr['amount']}, "
        f"pricing_type = '{pr['type']}', "
        f"preferred_truck_id = {truck_id}, "
        f"resource_note = '{note}' "
        f"WHERE id = {tid};"
    )
    result = sql(update)
    print(f"Transfer {tid}: drivers={sc['drivers']} offsiders={sc['offsiders']} truck={truck_id} price={pr['amount']} {pr['type']} note='{sc['note'][:40]}' => {result or 'OK'}")

# 8. Final verification
print('\n=== FINAL STATE ===')
print(sql('SELECT id, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers;'))
print('\nDONE')


# 1. Check schema
print('=== SCHEMA ===')
print(sql('DESCRIBE job_transfers;'))

# 2. Check existing transfers
print('\n=== EXISTING TRANSFERS ===')
print(sql('SELECT id, job_id, assignment_status, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers LIMIT 20;'))

# 3. Get available trucks
print('\n=== TRUCKS ===')
trucks_raw = sql('SELECT id, plate FROM trucks LIMIT 10;')
print(trucks_raw)

# 4. Get all transfer IDs
rows_raw = sql('SELECT id FROM job_transfers;')
ids = [line.strip() for line in rows_raw.strip().split('\n') if line.strip().isdigit()]
print(f'\n=== {len(ids)} TRANSFERS FOUND ===')

# Parse truck IDs
truck_ids = []
for line in trucks_raw.split('\n'):
    parts = line.split('\t')
    if len(parts) >= 1 and parts[0].strip().isdigit():
        truck_ids.append(int(parts[0].strip()))

print(f'Truck IDs available: {truck_ids}')

# 5. Resource scenarios
scenarios = [
    {'drivers': 1, 'offsiders': 0, 'packers': 0, 'use_truck': True,  'note': '1 chauffeur + camion requis'},
    {'drivers': 2, 'offsiders': 1, 'packers': 0, 'use_truck': True,  'note': '2 chauffeurs + 1 offsider'},
    {'drivers': 1, 'offsiders': 2, 'packers': 1, 'use_truck': True,  'note': 'Déménagement complet - équipe au complet'},
    {'drivers': 0, 'offsiders': 2, 'packers': 2, 'use_truck': False, 'note': 'Équipe de manutention sans chauffeur'},
    {'drivers': 1, 'offsiders': 1, 'packers': 0, 'use_truck': True,  'note': 'Livraison standard'},
    {'drivers': 2, 'offsiders': 0, 'packers': 1, 'use_truck': True,  'note': '2 chauffeurs + 1 packer'},
    {'drivers': 1, 'offsiders': 3, 'packers': 0, 'use_truck': True,  'note': 'Bonne équipe offsider requise'},
    {'drivers': 0, 'offsiders': 1, 'packers': 3, 'use_truck': False, 'note': 'Emballage prioritaire'},
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

# 6. Update each transfer
for i, tid in enumerate(ids):
    sc = scenarios[i % len(scenarios)]
    pr = pricing_options[i % len(pricing_options)]
    truck_id = 'NULL'
    if sc['use_truck'] and truck_ids:
        truck_id = truck_ids[i % len(truck_ids)]

    # Build resource_note including packers info
    note = sc['note']
    if sc['packers'] > 0:
        note += f" ({sc['packers']} packer{'s' if sc['packers']>1 else ''})"

    update = (
        f"UPDATE job_transfers SET "
        f"requested_drivers = {sc['drivers']}, "
        f"requested_offsiders = {sc['offsiders']}, "
        f"pricing_amount = {pr['amount']}, "
        f"pricing_type = '{pr['type']}', "
        f"preferred_truck_id = {truck_id}, "
        f"resource_note = '{note}' "
        f"WHERE id = {tid};"
    )
    result = sql(update)
    print(f"Transfer {tid}: drivers={sc['drivers']} offsiders={sc['offsiders']} packers={sc['packers']} truck={truck_id} price={pr['amount']} {pr['type']} ... {result or 'OK'}")

# 7. Verify
print('\n=== VERIFICATION ===')
print(sql('SELECT id, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers;'))
print('\nDONE')

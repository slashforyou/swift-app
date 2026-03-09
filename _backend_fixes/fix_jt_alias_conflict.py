"""
Fix alias conflict: jt is already used for job_trucks.
Rename our job_transfers alias from jt -> jtransfers.
"""
import shutil
from datetime import datetime

path = '/srv/www/htdocs/swiftapp/server/endPoints/calendarDays.js'
with open(path, 'r') as f:
    content = f.read()

print('job_trucks jt present:', 'LEFT JOIN job_trucks jt' in content)
print('job_transfers jt present:', 'LEFT JOIN job_transfers jt' in content)
print('jtransfers already used:', 'jtransfers' in content)

if 'LEFT JOIN job_transfers jt' not in content:
    print('No job_transfers jt alias found — nothing to fix.')
    exit(0)

if 'jtransfers' in content:
    print('Already renamed to jtransfers — nothing to do.')
    exit(0)

backup = path + f'.bak_alias_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)
print(f'Backup: {backup}')

# Rename the new alias references (NOT touching jt.role which belongs to job_trucks)
# Our references: jt.requested_drivers, jt.requested_offsiders, jt.pricing_amount, jt.message AS transfer_message
# And the JOIN itself: LEFT JOIN job_transfers jt ON jt.job_id = j.id

replacements = [
    ('LEFT JOIN job_transfers jt ON jt.job_id = j.id', 'LEFT JOIN job_transfers jtransfers ON jtransfers.job_id = j.id'),
    ('jtransfers.job_id = j.id AND jt.status', 'jtransfers.job_id = j.id AND jtransfers.status'),
    ('jt.requested_drivers', 'jtransfers.requested_drivers'),
    ('jt.requested_offsiders', 'jtransfers.requested_offsiders'),
    ('jt.pricing_amount', 'jtransfers.pricing_amount'),
    ('jt.message AS transfer_message', 'jtransfers.message AS transfer_message'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'  Replaced: {old[:60]}')
    else:
        print(f'  Not found: {old[:60]}')

with open(path, 'w') as f:
    f.write(content)

print('\nDone. Verifying:')
print('  job_trucks jt:', 'LEFT JOIN job_trucks jt' in content)
print('  job_transfers jtransfers:', 'LEFT JOIN job_transfers jtransfers' in content)
print('  jtransfers.requested_drivers:', 'jtransfers.requested_drivers' in content)
print('  NO stale jt.requested:', 'jt.requested_drivers' not in content)

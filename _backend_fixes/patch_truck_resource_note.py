"""
Patch calendarDays.js to add preferred_truck_id and resource_note to the SELECT and response.
"""
import re

FILE = '/srv/www/htdocs/swiftapp/server/endPoints/calendarDays.js'

with open(FILE, 'r') as f:
    content = f.read()

# PATCH 1 — Add preferred_truck_id + resource_note to SELECT (after pricing_type line)
old1 = 'jtransfers.pricing_amount, jtransfers.pricing_type,\n            jtransfers.message AS transfer_message,'
new1 = 'jtransfers.pricing_amount, jtransfers.pricing_type,\n            jtransfers.preferred_truck_id, jtransfers.resource_note,\n            jtransfers.message AS transfer_message,'

if old1 in content:
    content = content.replace(old1, new1, 1)
    print('PATCH 1 OK: preferred_truck_id + resource_note added to SELECT')
else:
    print('PATCH 1 SKIP: anchor not found, checking alternatives...')
    # Try alternative spacing
    old1b = 'jtransfers.pricing_amount, jtransfers.pricing_type,'
    idx = content.find(old1b)
    if idx != -1:
        print(f'  Found partial anchor at char {idx}')
        print('  Context:', repr(content[idx:idx+200]))
    else:
        print('  anchor not found at all')

# PATCH 2 — Add to response mapping (after transfer_message line)
old2 = 'transfer_message: row.transfer_message || null'
new2 = 'transfer_message: row.transfer_message || null,\n                        preferred_truck_id: row.preferred_truck_id != null ? row.preferred_truck_id : null,\n                        resource_note: row.resource_note || null'

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('PATCH 2 OK: preferred_truck_id + resource_note added to response mapping')
else:
    print('PATCH 2 SKIP: anchor not found')
    idx2 = content.find('transfer_message')
    print(f'  transfer_message found at: {idx2}')

with open(FILE, 'w') as f:
    f.write(content)

print('DONE')

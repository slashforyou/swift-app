"""
Patch calendarDays.js JOUR return object to include contractor/transfer fields.
Also adds LEFT JOIN companies c_contractee to get the company name.

Patches:
1. SQL SELECT: add c_contractee.name AS contractee_company_name
2. SQL FROM: add LEFT JOIN companies c_contractee ON ...
3. JOUR return object: add assignment_status, contractee, contractor, transfer fields
"""

import os
import shutil
from datetime import datetime

path = '/srv/www/htdocs/swiftapp/server/endPoints/calendarDays.js'

with open(path, 'r') as f:
    content = f.read()

# ── Idempotency check ────────────────────────────────────────────────────────
if 'assignment_status: row.assignment_status' in content:
    print('✅ Déjà patché (return object) – rien à faire.')
    exit(0)

backup = path + f'.bak_retobj_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)
print(f'📦 Backup : {backup}')

original = content

# ─────────────────────────────────────────────────────────────────────────────
# PATCH 1: Add contractee company name to SELECT
# Anchor: "j.contractor_company_id, -- [PATCH] contractor_calendar"
# ─────────────────────────────────────────────────────────────────────────────

old_select_tail = 'j.contractor_company_id, -- [PATCH] contractor_calendar'
new_select_tail = 'j.contractor_company_id, c_contractee.name AS contractee_company_name, -- [PATCH] contractor_calendar'

if old_select_tail in content:
    content = content.replace(old_select_tail, new_select_tail, 1)
    print('✅ PATCH 1 : contractee_company_name ajouté au SELECT')
elif 'c_contractee.name AS contractee_company_name' in content:
    print('✅ PATCH 1 : contractee_company_name déjà présent')
else:
    print('⚠️  PATCH 1 : anchor SELECT non trouvé')
    print('Context:', repr(content[content.find('contractor_company_id'):content.find('contractor_company_id')+200]))

# ─────────────────────────────────────────────────────────────────────────────
# PATCH 2: Add LEFT JOIN companies c_contractee to the FROM block
# Anchor: insert after "LEFT JOIN trucks t ON jt.truck_id = t.id"
# but BEFORE the jtransfers JOIN
# ─────────────────────────────────────────────────────────────────────────────

join_anchor = 'LEFT JOIN trucks t ON jt.truck_id = t.id\n\n            LEFT JOIN job_transfers jtransfers'
join_anchor_alt = 'LEFT JOIN trucks t ON jt.truck_id = t.id\n            LEFT JOIN job_transfers jtransfers'
new_join = ('LEFT JOIN trucks t ON jt.truck_id = t.id\n'
            '                    LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id\n'
            '\n            LEFT JOIN job_transfers jtransfers')
new_join_alt = ('LEFT JOIN trucks t ON jt.truck_id = t.id\n'
                '                    LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id\n'
                '            LEFT JOIN job_transfers jtransfers')

if 'c_contractee ON c_contractee.id' in content:
    print('✅ PATCH 2 : companies JOIN déjà présent')
elif join_anchor in content:
    content = content.replace(join_anchor, new_join, 1)
    print('✅ PATCH 2 : LEFT JOIN companies c_contractee ajouté (variant A)')
elif join_anchor_alt in content:
    content = content.replace(join_anchor_alt, new_join_alt, 1)
    print('✅ PATCH 2 : LEFT JOIN companies c_contractee ajouté (variant B)')
else:
    # Try to find the trucks join more broadly
    idx = content.find('LEFT JOIN trucks t ON jt.truck_id = t.id')
    if idx != -1:
        print(f'⚠️  PATCH 2 : anchor trucks found at {idx}, context:')
        print(repr(content[idx:idx+200]))
    else:
        print('❌ PATCH 2 : trucks JOIN non trouvé – patch manuel requis')

# ─────────────────────────────────────────────────────────────────────────────
# PATCH 3: Add contractor/transfer fields to the JOUR return object
# Anchor: the closing "created_at: row.created_at\n                    };\n"
# that is followed by "} else if (detailLevel === 'MOIS')"
# ─────────────────────────────────────────────────────────────────────────────

old_return_end = (
    "                        created_at: row.created_at\n"
    "                    };\n"
    "                } else if (detailLevel === 'MOIS')"
)

new_return_end = (
    "                        created_at: row.created_at,\n"
    "                        // Contractor assignment info [PATCH]\n"
    "                        assignment_status: row.assignment_status || 'none',\n"
    "                        contractee: row.contractee_company_id ? {\n"
    "                            company_id: row.contractee_company_id,\n"
    "                            company_name: row.contractee_company_name || ''\n"
    "                        } : null,\n"
    "                        contractor: row.contractor_company_id ? {\n"
    "                            company_id: row.contractor_company_id,\n"
    "                            company_name: ''\n"
    "                        } : null,\n"
    "                        // Transfer details [PATCH]\n"
    "                        requested_drivers: row.requested_drivers != null ? row.requested_drivers : null,\n"
    "                        requested_offsiders: row.requested_offsiders != null ? row.requested_offsiders : null,\n"
    "                        pricing_amount: row.pricing_amount != null ? row.pricing_amount : null,\n"
    "                        transfer_message: row.transfer_message || null\n"
    "                    };\n"
    "                } else if (detailLevel === 'MOIS')"
)

if old_return_end in content:
    content = content.replace(old_return_end, new_return_end, 1)
    print('✅ PATCH 3 : return object étendu avec contractor/transfer fields')
else:
    # Try to find a close match
    idx = content.find("created_at: row.created_at")
    print(f'⚠️  PATCH 3 : anchor exact non trouvé. created_at at {idx}')
    if idx != -1:
        print('Context:')
        print(repr(content[idx:idx+300]))

# ─────────────────────────────────────────────────────────────────────────────
# Save and verify
# ─────────────────────────────────────────────────────────────────────────────
if content != original:
    with open(path, 'w') as f:
        f.write(content)
    print('\n✅ Fichier mis à jour.')
else:
    print('\n⚠️  Aucune modification.')

print('\n── Vérification finale ──')
with open(path, 'r') as f:
    final = f.read()

checks = [
    'contractee_company_name',
    'c_contractee ON c_contractee.id',
    'assignment_status: row.assignment_status',
    'requested_drivers: row.requested_drivers',
    'transfer_message: row.transfer_message',
]
for c in checks:
    found = c in final
    print(f'  {"✅" if found else "❌"} {c}')

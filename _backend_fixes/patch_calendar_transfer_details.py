"""
Patch calendarDays.js to include job_transfers details in the JOUR (day view) query.

Adds:
  - jt.requested_drivers, jt.requested_offsiders, jt.pricing_amount, jt.message
    to the SELECT (after j.contractee_company_id)
  - LEFT JOIN job_transfers jt ON jt.job_id = j.id AND jt.status IN (...)
    inserted into the FROM block

Only patches the JOUR query (not MOIS). Idempotent.
"""

import os
import shutil
from datetime import datetime

CANDIDATES = [
    '/srv/www/htdocs/swiftapp/server/endPoints/calendarDays.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendar-days.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendarDays.js',
]

path = None
for c in CANDIDATES:
    if os.path.exists(c):
        path = c
        break

if not path:
    base = '/srv/www/htdocs/swiftapp/server/endPoints/v1'
    print('❌ calendar-days.js introuvable. Fichiers disponibles:')
    for f in sorted(os.listdir(base)):
        print(f'   {f}')
    exit(1)

print(f'✅ Fichier trouvé : {path}')

with open(path, 'r') as f:
    content = f.read()

# ── Idempotency check ────────────────────────────────────────────────────────
if 'jt.requested_drivers' in content:
    print('✅ Déjà patché (jt.requested_drivers trouvé) – rien à faire.')
    exit(0)

# ── Diagnostic: print lines around contractee_company_id ────────────────────
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'contractee_company_id' in line:
        start = max(0, i - 3)
        end = min(len(lines), i + 10)
        print(f'\n--- Contexte autour de contractee_company_id (ligne {i+1}) ---')
        for j in range(start, end):
            print(f'{j+1:4d} | {lines[j]}')
        print('---')
        break

# ── Backup ──────────────────────────────────────────────────────────────────
backup = path + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)
print(f'📦 Backup : {backup}')

original = content

# ─────────────────────────────────────────────────────────────────────────────
# PATCH 1 : Extend SELECT with jt.* fields
# We look for j.contractee_company_id in ANY format and add the jt fields after.
# We try multiple variants to be robust.
# ─────────────────────────────────────────────────────────────────────────────

# Try variant A: inline, no trailing comma
variant_a = 'j.contractee_company_id\n'
if variant_a in content:
    content = content.replace(
        variant_a,
        'j.contractee_company_id,\n'
        '            jt.requested_drivers,\n'
        '            jt.requested_offsiders,\n'
        '            jt.pricing_amount,\n'
        '            jt.message AS transfer_message\n',
        1
    )
    print('✅ PATCH 1A : SELECT fields ajoutés (variant A)')

# Try variant B: with comma already at end of line  
elif 'j.contractee_company_id,' in content:
    content = content.replace(
        'j.contractee_company_id,',
        'j.contractee_company_id,\n'
        '            jt.requested_drivers,\n'
        '            jt.requested_offsiders,\n'
        '            jt.pricing_amount,\n'
        '            jt.message AS transfer_message,',
        1
    )
    print('✅ PATCH 1B : SELECT fields ajoutés (variant B)')

else:
    # Generic: find first occurrence of contractee_company_id and show context
    idx = content.find('contractee_company_id')
    print(f'⚠️  Pattern non trouvé. Contexte brut (idx={idx}):')
    print(repr(content[max(0, idx-50):idx+200]))
    print('❌ PATCH 1 échoué – correction manuelle requise')
    exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# PATCH 2 : Add LEFT JOIN job_transfers
# Strategy: find the WHERE clause that follows the SELECT we just patched,
# and insert the LEFT JOIN just before it.
# We anchor to `jt.requested_drivers` added above to find the right section,
# then scan forward for the WHERE.
# ─────────────────────────────────────────────────────────────────────────────

JOIN_LINE = (
    '\n            LEFT JOIN job_transfers jt'
    ' ON jt.job_id = j.id'
    ' AND jt.status IN (\'pending\', \'accepted\', \'negotiating\')'
)

# Find the position just before the first WHERE after our patched SELECT
anchor_idx = content.find('jt.requested_drivers')
if anchor_idx == -1:
    print('❌ PATCH 2 : Impossible de trouver le bloc SELECT patché.')
    exit(1)

# Scan forward from anchor to find the JOIN block or WHERE
search_from = anchor_idx
# We want to insert the JOIN right before the WHERE keyword
# But first, look for existing JOINs to place after the last JOIN  
# Simple approach: find the WHERE that comes next
where_idx = content.find('\n            WHERE ', search_from)
if where_idx == -1:
    where_idx = content.find('\n        WHERE ', search_from)
if where_idx == -1:
    where_idx = content.find('\nWHERE ', search_from)
if where_idx == -1:
    where_idx = content.find(' WHERE ', search_from)

if where_idx == -1:
    print('❌ PATCH 2 : WHERE introuvable après le SELECT patché.')
    # Try to show what comes after anchor
    print('Contexte après anchor:')
    print(repr(content[anchor_idx:anchor_idx+500]))
    exit(1)

print(f'✅ WHERE trouvé à index {where_idx}')

# Check if there's already a LEFT JOIN right before WHERE (from last few chars)
before_where = content[anchor_idx:where_idx]
print(f'Bloc entre SELECT et WHERE:\n{before_where[:300]}')

# Insert the LEFT JOIN just before the WHERE
content = content[:where_idx] + JOIN_LINE + content[where_idx:]
print('✅ PATCH 2 : LEFT JOIN job_transfers inséré')

# ─────────────────────────────────────────────────────────────────────────────
# Write result
# ─────────────────────────────────────────────────────────────────────────────
if content == original:
    print('⚠️  Aucune modification apportée.')
else:
    with open(path, 'w') as f:
        f.write(content)
    print('✅ Fichier mis à jour avec succès.')

# ─────────────────────────────────────────────────────────────────────────────
# Verify final result
# ─────────────────────────────────────────────────────────────────────────────
with open(path, 'r') as f:
    final = f.read()

checks = [
    ('jt.requested_drivers', 'SELECT jt.requested_drivers'),
    ('job_transfers jt', 'LEFT JOIN job_transfers jt'),
    ('jt.pricing_amount', 'SELECT jt.pricing_amount'),
]
print('\n── Vérification ──')
for needle, label in checks:
    found = needle in final
    print(f'  {"✅" if found else "❌"} {label} : {"OK" if found else "MANQUANT"}')

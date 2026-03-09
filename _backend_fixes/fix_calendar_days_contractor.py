"""
Patch calendar-days.js pour inclure les jobs où l'entreprise connectée
est CONTRACTOR (et pas seulement CONTRACTEE / owner).

Problème : calendar-days ne retourne que les jobs dont l'entreprise est
propriétaire (contractee_company_id). Les jobs assignés en tant que
prestataire (contractor_company_id) ne sont pas visibles.

Fix : ajouter une condition OR sur contractor_company_id dans le WHERE
principal, et s'assurer que les champs contractee/contractor sont bien
inclus dans le SELECT.
"""

import re
import os
import shutil
from datetime import datetime

# ── Trouver le fichier ──────────────────────────────────────────────────────
CANDIDATES = [
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendar-days.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendarDays.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendardays.js',
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

# ── Backup ──────────────────────────────────────────────────────────────────
backup = path + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)
print(f'📦 Backup : {backup}')

original = content

# ── Patterns à patcher ──────────────────────────────────────────────────────
# On cherche plusieurs variantes courantes du filtre company dans le WHERE

patches_applied = []

# Pattern 1 : WHERE ... contractee_company_id = ?  (sans contractor)
p1_old = r'(WHERE\s+[^\n]*?)(\bcontractee_company_id\s*=\s*\?)'
p1_new = r'\1(contractee_company_id = ? OR contractor_company_id = ?)'

# Pattern 2 : WHERE ... j.company_id = ?  (ancien nom du champ)
p2_old = r'(WHERE\s+[^\n]*?)(\bj\.company_id\s*=\s*\?)'
p2_new = r'\1(j.contractee_company_id = ? OR j.contractor_company_id = ?)'

# Pattern 3 : company_id = userCompanyId  (bindings JS)
p3_old = r'(contractee_company_id\s*[=:]\s*)(userCompanyId|companyId|company_id)'
p3_new = r'(contractee_company_id = ? OR contractor_company_id = ?)'  # handled below

for label, old, new in [
    ('contractee_company_id sans OR', p1_old, p1_new),
    ('j.company_id sans OR', p2_old, p2_new),
]:
    match = re.search(old, content, re.IGNORECASE)
    if match:
        # Vérifier que le patch n'est pas déjà appliqué
        if 'contractor_company_id' in match.group(0):
            print(f'✅ {label} — déjà patché, skip')
        else:
            content = re.sub(old, new, content, count=1, flags=re.IGNORECASE)
            patches_applied.append(label)
            print(f'✅ Patché : {label}')

# ── Cas spécial : bindings SQL (array de paramètres) ────────────────────────
# Quand on ajoute OR contractor_company_id = ? on doit doubler le paramètre
# dans le tableau de bindings. On cherche le pattern [userCompanyId, startDate, endDate]
# ou similaire et on insère le doublon.

binding_patterns = [
    # [companyId, startDate, endDate]  →  [companyId, companyId, startDate, endDate]
    (r'(\[\s*)(userCompanyId|companyId)(\s*,\s*startDate)',
     r'\1\2, \2\3'),
    (r'(\[\s*)(userCompanyId|companyId)(\s*,\s*start)',
     r'\1\2, \2\3'),
    # [companyId, start, end]
    (r'(\[\s*)(company_id)(\s*,\s*start)',
     r'\1\2, \2\3'),
]

for old, new in binding_patterns:
    match = re.search(old, content)
    if match:
        content = re.sub(old, new, content, count=1)
        patches_applied.append(f'binding doublon: {old[:40]}')
        print(f'✅ Binding patché')
        break

# ── Résultat ────────────────────────────────────────────────────────────────
if not patches_applied:
    print('\n⚠️  AUCUN PATTERN RECONNU — affichage du contenu complet pour diagnostic manuel:\n')
    # Afficher les 60 lignes autour du premier SELECT/WHERE
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        if any(kw in line.upper() for kw in ['SELECT', 'WHERE', 'COMPANY', 'CONTRACTOR']):
            start = max(0, i - 3)
            end   = min(len(lines), i + 3)
            for j in range(start, end):
                print(f'  {j+1:4d} | {lines[j]}')
            print('  ...')
    exit(1)

# Écrire uniquement si des changements ont été faits
if content != original:
    with open(path, 'w') as f:
        f.write(content)
    print(f'\n✅ Fichier mis à jour. Patches: {patches_applied}')
    print('🔄 Redémarre le serveur Node.js pour appliquer les changements.')
else:
    print('\nℹ️  Aucune modification écrite (contenu identique).')

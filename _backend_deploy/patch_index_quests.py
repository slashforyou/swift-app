#!/usr/bin/env python3
"""
patch_index_quests.py  — injecte les routes quest dans index.js
"""
import sys

INDEX_JS = '/srv/www/htdocs/swiftapp/server/index.js'

ROUTES_TO_ADD = """
app.get('/swift-app/v1/user/gamification/v2/quests', (req, res) => {
  const { getV2QuestsEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2QuestsEndpoint(req, res);
});

app.post('/swift-app/v1/user/gamification/v2/quests/:questCode/claim', (req, res) => {
  const { claimV2QuestEndpoint } = require('./endPoints/v1/gamificationV2');
  claimV2QuestEndpoint(req, res);
});

"""

# Lire le fichier en bytes pour gérer tous types de newlines
raw = open(INDEX_JS, 'rb').read()
content = raw.decode('utf-8', errors='replace')

if 'getV2QuestsEndpoint' in content:
    print('[patch_index_quests] Routes quests deja presentes - skip')
    sys.exit(0)

# Chercher le marqueur de la route history
marker = "getV2HistoryEndpoint(req, res);"
idx = content.find(marker)
if idx == -1:
    print('[patch_index_quests] ERREUR: marqueur getV2HistoryEndpoint introuvable')
    sys.exit(1)

# Trouver le }); suivant
close_idx = content.find('});', idx)
if close_idx == -1:
    print('[patch_index_quests] ERREUR: fermeture }); introuvable')
    sys.exit(1)

insert_pos = close_idx + len('});')
print(f'[patch_index_quests] Insertion a position {insert_pos}')

new_content = content[:insert_pos] + ROUTES_TO_ADD + content[insert_pos:]

# Écrire en garder les newlines d'origine
open(INDEX_JS, 'wb').write(new_content.encode('utf-8'))
print(f'[patch_index_quests] index.js mis a jour ({len(new_content)} chars)')
print('[patch_index_quests] OK')

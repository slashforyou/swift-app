"""
Diagnostic : affiche le contenu du fichier calendar-days.js pour identifier
la requête SQL à patcher.
"""

import os

CANDIDATES = [
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendar-days.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendarDays.js',
    '/srv/www/htdocs/swiftapp/server/endPoints/v1/calendardays.js',
]

for path in CANDIDATES:
    if os.path.exists(path):
        print(f'=== FOUND: {path} ===')
        with open(path, 'r') as f:
            content = f.read()
        print(content)
        break
else:
    # Lister les fichiers du dossier pour trouver le bon nom
    base = '/srv/www/htdocs/swiftapp/server/endPoints/v1'
    if os.path.isdir(base):
        print(f'Files in {base}:')
        for f in sorted(os.listdir(base)):
            print(f'  {f}')
    else:
        print(f'Directory not found: {base}')

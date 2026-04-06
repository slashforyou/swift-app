"""
Replace all altivo.fr references with cobbr-app.com in server files.
Handles both 'altivo.fr' and 'swiftapp.altivo.fr' patterns.
"""
import os
import shutil
import datetime
import re

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
BACKUP_SUFFIX = '.bak_altivo_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

# Patterns to replace
REPLACEMENTS = [
    ('swiftapp.altivo.fr', 'cobbr-app.com'),
    ('cobbr.altivo.fr', 'cobbr-app.com'),
    ('altivo.fr/swift-app', 'cobbr-app.com/swift-app'),
    ('altivo.fr', 'cobbr-app.com'),
]

# Files to process (skip backups, node_modules, .env)
SKIP_DIRS = {'node_modules', '.git', 'logs'}
SKIP_EXTENSIONS = {'.bak', '.log', '.env'}

def should_process(filepath):
    base = os.path.basename(filepath)
    _, ext = os.path.splitext(base)
    if ext in SKIP_EXTENSIONS:
        return False
    if '.backup_' in base or '.bak_' in base:
        return False
    return ext in {'.js', '.json', '.py', '.md', '.txt', '.html', '.css', ''}

changed_files = []

for root, dirs, files in os.walk(SERVER_DIR):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fname in files:
        fpath = os.path.join(root, fname)
        if not should_process(fpath):
            continue
        try:
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            continue

        if 'altivo.fr' not in content:
            continue

        new_content = content
        for old, new in REPLACEMENTS:
            new_content = new_content.replace(old, new)

        if new_content != content:
            # Backup
            shutil.copy2(fpath, fpath + BACKUP_SUFFIX)
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            rel = os.path.relpath(fpath, SERVER_DIR)
            count = content.count('altivo.fr')
            changed_files.append((rel, count))
            print('Updated: {} ({} replacements)'.format(rel, count))

print('\nTotal: {} files updated'.format(len(changed_files)))

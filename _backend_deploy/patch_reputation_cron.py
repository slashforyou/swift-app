#!/usr/bin/env python3
import sys

INDEX_PATH = '/srv/www/htdocs/swiftapp/server/index.js'

OLD = "require('./cron/storageBillingCron');"
NEW = """require('./cron/storageBillingCron');

  // [Phase 3 JQS] Reputation score daily cron
  const { startReputationCron } = require('./utils/reputationCron');
  startReputationCron();"""

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

if 'startReputationCron' in content:
    print('ALREADY_PATCHED — nothing to do')
    sys.exit(0)

if OLD not in content:
    print('ERROR: anchor not found in index.js', file=sys.stderr)
    sys.exit(1)

content = content.replace(OLD, NEW, 1)

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print('PATCHED — startReputationCron injected after storageBillingCron')

#!/usr/bin/env python3
"""Injecte le require trialExpirationCron dans index.js après storageBillingCron."""

path = '/srv/www/htdocs/swiftapp/server/index.js'

with open(path, 'r') as f:
    content = f.read()

OLD = "require('./cron/storageBillingCron');"
NEW = "require('./cron/storageBillingCron');\n  require('./cron/trialExpirationCron');"

if 'trialExpirationCron' in content:
    print('[inject_trial_cron] ALREADY PRESENT — nothing to do')
elif OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open(path, 'w') as f:
        f.write(content)
    print('[inject_trial_cron] INSERTED OK')
else:
    print('[inject_trial_cron] ERROR — target string not found in index.js')
    exit(1)

#!/usr/bin/env python3
target = "/srv/www/htdocs/swiftapp/server/index.js"
marker = "  require('./cron/storageBillingCron');"
inject = "  require('./cron/trialExpirationCron');"

with open(target, 'r') as f:
    content = f.read()

if inject in content:
    print("ALREADY_PRESENT")
else:
    new_content = content.replace(marker, marker + "\n" + inject)
    if new_content == content:
        print("MARKER_NOT_FOUND — searched for:")
        print(repr(marker))
    else:
        with open(target, 'w') as f:
            f.write(new_content)
        print("INJECTED_OK")

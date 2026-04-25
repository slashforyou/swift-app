import sys

FILE = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILE, "r") as f:
    content = f.read()

old = "  require('./cron/dailyRecapCron');"
new = "  require('./cron/dailyRecapCron');\n  require('./cron/storageBillingCron');"

if "storageBillingCron" in content:
    print("SKIP: storageBillingCron already registered")
elif old in content:
    content = content.replace(old, new)
    with open(FILE, "w") as f:
        f.write(content)
    print("OK: storageBillingCron added to index.js")
else:
    print("ERROR: pattern not found")
    sys.exit(1)

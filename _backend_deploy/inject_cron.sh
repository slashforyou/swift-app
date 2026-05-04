#!/bin/bash
sed -i "/require\('\.\/cron\/storageBillingCron'\)/a\\  require('./cron/trialExpirationCron');" /srv/www/htdocs/swiftapp/server/index.js
echo "--- Verification ---"
grep -n "trialExpir\|storageBilling" /srv/www/htdocs/swiftapp/server/index.js
echo "INJECTION_OK"

"""
Fix: Add stripe_mode to INSERT INTO stripe_connected_accounts in onboarding.js
"""
import sys

filepath = "/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

with open(filepath, "r") as f:
    content = f.read()

# Fix the params array to include req.stripeMode
old_params = "[companyId, account.id, account.type || accountType, company[0].email]"
new_params = "[companyId, account.id, (req.stripeMode || 'live'), account.type || accountType, company[0].email]"

if old_params in content:
    content = content.replace(old_params, new_params)
    print("Fixed params array")
else:
    print("Params already fixed or not found")

with open(filepath, "w") as f:
    f.write(content)

print("Done")

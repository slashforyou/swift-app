#!/usr/bin/env python3
"""Fix StripeGate + DashboardPage to recognize 'pending_verification' status"""
import sys

FILES = {
    "StripeGate": "/srv/www/htdocs/cobbr-app.com/dist/assets/StripeGate-caUAzh2w.js",
    "DashboardPage": "/srv/www/htdocs/cobbr-app.com/dist/assets/DashboardPage-aTV9KLJ5.js",
}

# Pattern: add pending_verification to the "active" status group
old = 't==="active"||t==="connected"||t==="enabled"||t==="complete"'
new = 't==="active"||t==="connected"||t==="enabled"||t==="complete"||t==="pending_verification"'

# DashboardPage uses 'p' instead of 't' as the variable name
old_p = 'p==="active"||p==="connected"||p==="enabled"||p==="complete"'
new_p = 'p==="active"||p==="connected"||p==="enabled"||p==="complete"||p==="pending_verification"'

for name, path in FILES.items():
    with open(path, "r") as f:
        content = f.read()

    # Backup
    with open(path + ".bak", "w") as f:
        f.write(content)

    patched = False
    if old in content:
        content = content.replace(old, new)
        patched = True
    if old_p in content:
        content = content.replace(old_p, new_p)
        patched = True

    if patched:
        with open(path, "w") as f:
            f.write(content)
        print(f"OK: patched {name}")
    else:
        print(f"SKIP: {name} - pattern not found (may already be patched)")


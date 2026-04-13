#!/usr/bin/env python3
"""
Patch /persons endpoint to use person_token for create/update instead of
setting relationship params directly (required when person was originally
created with a token).
"""
import re, sys

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

with open(FILE, "r") as f:
    content = f.read()

# ──────────────────────────────────────────────────────────────────────
# 1. In SINGLE PERSON MODE — UPDATE existing person block:
#    Replace direct updatePerson({ relationship }) with person_token usage
# ──────────────────────────────────────────────────────────────────────

old_update = """        // ⭐ UPDATE existing person with all roles
        console.log(`🔄 [Persons] Updating existing person ${existingPerson.id} with combined roles`);
        try {
          const updatedPerson = await stripe.accounts.updatePerson(
            stripeAccountId,
            existingPerson.id,
            { relationship: combinedRelationship }
          );"""

new_update = """        // ⭐ UPDATE existing person with all roles (use person_token if available)
        console.log(`🔄 [Persons] Updating existing person ${existingPerson.id} with combined roles`);
        try {
          const updateParams = person_token
            ? { person_token }
            : { relationship: combinedRelationship };
          const updatedPerson = await stripe.accounts.updatePerson(
            stripeAccountId,
            existingPerson.id,
            updateParams
          );"""

if old_update not in content:
    print("ERROR: Could not find UPDATE existing person block")
    sys.exit(1)

content = content.replace(old_update, new_update)
print("✅ Patched UPDATE existing person to use person_token")

# ──────────────────────────────────────────────────────────────────────
# 2. In SINGLE PERSON MODE — CREATE new person block:
#    Replace direct createPerson(payload) with person_token usage
# ──────────────────────────────────────────────────────────────────────

old_create = """        // ⭐ CREATE new person with all roles
        console.log(`➕ [Persons] Creating new person with combined roles`);
        try {
          const payload = buildPersonPayload(personData, combinedRelationship);
          const newPerson = await stripe.accounts.createPerson(stripeAccountId, payload);"""

new_create = """        // ⭐ CREATE new person with all roles (use person_token if available)
        console.log(`➕ [Persons] Creating new person with combined roles`);
        try {
          const createParams = person_token
            ? { person_token }
            : buildPersonPayload(personData, combinedRelationship);
          const newPerson = await stripe.accounts.createPerson(stripeAccountId, createParams);"""

if old_create not in content:
    print("ERROR: Could not find CREATE new person block")
    sys.exit(1)

content = content.replace(old_create, new_create)
print("✅ Patched CREATE new person to use person_token")

# ──────────────────────────────────────────────────────────────────────
# 3. Extract person_token from req.body at the top of the function
#    (add it to the destructuring)
# ──────────────────────────────────────────────────────────────────────

old_destructure = "const { representative, owners, directors, executives, no_owners, single_person_mode } = req.body;"
new_destructure = "const { representative, owners, directors, executives, no_owners, single_person_mode, person_token } = req.body;"

if old_destructure not in content:
    print("ERROR: Could not find destructuring line")
    sys.exit(1)

content = content.replace(old_destructure, new_destructure)
print("✅ Patched destructuring to include person_token")

with open(FILE, "w") as f:
    f.write(content)

print("✅ All patches applied successfully")

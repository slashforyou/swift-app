#!/usr/bin/env python3
"""Fix: document upload must use person_token for persons created with tokens."""

import sys

filepath = sys.argv[1] if len(sys.argv) > 1 else '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'

with open(filepath, 'r') as f:
    content = f.read()

old = """      await stripeInstance.accounts.updatePerson(stripeAccountId, targetPersonId, {
        verification: {
          document: mergedDocument
        }
      });"""

new = """      // Person created with token -> must update via person_token
      const docPersonToken = await stripeInstance.tokens.create({
        person: {
          verification: {
            document: mergedDocument
          }
        }
      }, {
        stripeAccount: stripeAccountId
      });

      await stripeInstance.accounts.updatePerson(stripeAccountId, targetPersonId, {
        person_token: docPersonToken.id
      });"""

if old in content:
    content = content.replace(old, new, 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print('OK - replacement done')
else:
    print('ERROR - old text not found')
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'mergedDocument' in line:
            start = max(0, i - 5)
            end = min(len(lines), i + 5)
            for j in range(start, end):
                print(f'{j+1}: {lines[j]}')
            print('---')

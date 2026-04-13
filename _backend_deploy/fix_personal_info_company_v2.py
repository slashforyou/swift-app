import re
import sys

filepath = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'

with open(filepath, 'r') as f:
    content = f.read()

old_block = '''    // Personal info always goes to individual (representative for company, or person for individual)
    const individualPayload = {
      individual: {
        first_name,
        last_name,
        dob: {
          day: parseInt(day, 10),
          month: parseInt(month, 10),
          year: parseInt(year, 10)
        },
        email,
        phone
      }
    };

    // Merge: if company data was set above, combine with individual data
    if (updatePayload) {
      updatePayload = { ...updatePayload, ...individualPayload };
    } else {
      updatePayload = individualPayload;
    }

    savedPayload = { first_name, last_name, dob, email, phone };

    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);'''

new_block = '''    const personData = {
      first_name,
      last_name,
      dob: {
        day: parseInt(day, 10),
        month: parseInt(month, 10),
        year: parseInt(year, 10)
      },
      email,
      phone
    };

    savedPayload = { first_name, last_name, dob, email, phone };

    if (businessType === 'company') {
      // Company accounts: use Persons API (cannot send 'individual' on company accounts)
      // Find or create the representative person
      const existingPersons = await stripe.accounts.listPersons(stripeAccountId, { limit: 10 });
      const representative = existingPersons.data.find(p => p.relationship?.representative);

      if (representative) {
        console.log(`\\u{1f4dd} [Stripe Onboarding] Updating existing representative person: ${representative.id}`);
        await stripe.accounts.updatePerson(stripeAccountId, representative.id, {
          ...personData,
          relationship: { representative: true }
        });
      } else {
        console.log(`\\u{2795} [Stripe Onboarding] Creating new representative person`);
        await stripe.accounts.createPerson(stripeAccountId, {
          ...personData,
          relationship: { representative: true }
        });
      }

      // Also update company data if provided
      if (updatePayload) {
        await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);
      }
    } else {
      // Individual accounts: use individual on account update as normal
      const individualPayload = {
        individual: personData
      };
      await updateStripeAccount(connection, companyId, stripeAccountId, individualPayload);
    }'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(filepath, 'w') as f:
        f.write(content)
    print("OK: Patched successfully")
else:
    print("ERROR: Old block not found. Searching for partial matches...")
    lines = old_block.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped and stripped not in content:
            print(f"  Missing line {i}: {repr(stripped[:80])}")
    idx = content.find('Personal info always')
    if idx >= 0:
        print(f"\nFound 'Personal info always' at position {idx}")
        print("Context:")
        print(content[idx-50:idx+500])
    else:
        print("'Personal info always' not found in file")
    sys.exit(1)

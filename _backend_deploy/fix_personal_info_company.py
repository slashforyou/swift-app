"""
Patch: Fix personal-info endpoint for company accounts.
For company accounts, personal-info should accept individual data (first_name, last_name, dob, email, phone)
and send it to Stripe as the representative (individual), same as for individual accounts.
Company.name is handled separately by the company-details endpoint.
"""
import sys

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

# Old code: company branch requires company.name and rejects personal info
OLD = """    if (businessType === 'company') {
      if (!company || !company.name) {
        return sendValidationError(
          res,
          'Flow company: champ requis manquant',
          ['company.name'],
          {
            accountBusinessType: 'company',
            expectedPayload: {
              company: {
                name: 'string',
                tax_id: 'string (optional)',
                phone: 'string (optional)',
                registration_number: 'string (optional for AU)'
              }
            }
          }
        );
      }

      // ⭐ Include company.phone and company.registration_number if provided"""

# New code: company branch accepts individual data, optionally company data
NEW = """    if (businessType === 'company') {
      // Company accounts: personal info goes to individual (representative)
      // Company name/details handled by company-details endpoint"""

# Also need to replace the company-only payload with individual-style payload for company accounts
OLD2 = """      updatePayload = {
        company: {
          name: company.name,
          tax_id: company.tax_id || undefined,
          phone: company.phone || undefined,
          registration_number: company.registration_number || undefined
        }
      };

      savedPayload = {
        company: {
          name: company.name,
          tax_id: company.tax_id || null,
          phone: company.phone || null,
          registration_number: company.registration_number || null
        }
      };
    } else {
      if (!first_name || !last_name || !dob || !email || !phone) {
        return sendValidationError(
          res,
          'Flow individual: champs requis manquants',
          ['first_name', 'last_name', 'dob', 'email', 'phone'],
          {
            accountBusinessType: 'individual'
          }
        );
      }

      const [year, month, day] = (dob || '').split('-');

      if (!year || !month || !day) {
        return sendValidationError(
          res,
          'Format DOB invalide, attendu YYYY-MM-DD',
          ['dob'],
          {
            field: 'dob'
          }
        );
      }

      updatePayload = {
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

      savedPayload = { first_name, last_name, dob, email, phone };
    }"""

NEW2 = """      // For company accounts, also update company info if provided
      if (company && company.name) {
        updatePayload = {
          company: {
            name: company.name,
            tax_id: company.tax_id || undefined,
            phone: company.phone || undefined,
            registration_number: company.registration_number || undefined
          }
        };
      }
    }

    // Both individual and company accounts: validate and send personal info
    if (!first_name || !last_name || !dob || !email || !phone) {
      return sendValidationError(
        res,
        'Champs requis manquants: first_name, last_name, dob, email, phone',
        ['first_name', 'last_name', 'dob', 'email', 'phone'],
        {
          accountBusinessType: businessType
        }
      );
    }

    const [year, month, day] = (dob || '').split('-');

    if (!year || !month || !day) {
      return sendValidationError(
        res,
        'Format DOB invalide, attendu YYYY-MM-DD',
        ['dob'],
        {
          field: 'dob'
        }
      );
    }

    // Personal info always goes to individual (representative for company, or person for individual)
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

    savedPayload = { first_name, last_name, dob, email, phone };"""


with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if OLD not in content:
    print("FAIL: Could not find OLD block 1 in file")
    sys.exit(1)

if OLD2 not in content:
    print("FAIL: Could not find OLD block 2 in file")
    sys.exit(1)

content = content.replace(OLD, NEW, 1)
content = content.replace(OLD2, NEW2, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: Patched personal-info endpoint for company accounts")
print("  - Company accounts now accept individual data (first_name, last_name, dob, email, phone)")
print("  - Company name/details are optional at this step (handled by company-details endpoint)")

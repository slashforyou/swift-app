path = '/srv/www/htdocs/swiftapp/server/endPoints/subscribe.js'
with open(path) as f:
    content = f.read()

# 1. Mettre a jour la validation: abn_contractor n'a pas besoin de companyName obligatoire
old1 = "  const isBusinessOwner = accountType !== 'employee';\n\n  if (!mail || !firstName || !lastName || !password)\n    return { success: false, message: 'Mail, firstName, lastName, and password are required' };\n\n  if (isBusinessOwner && (!companyName || companyName.trim().length < 2))\n    return { success: false, message: 'Company name must be at least 2 characters long' };"
new1 = "  const isCompanyAccount = accountType === 'business_owner' || accountType === 'abn_contractor';\n  const isAbnContractor = accountType === 'abn_contractor';\n\n  if (!mail || !firstName || !lastName || !password)\n    return { success: false, message: 'Mail, firstName, lastName, and password are required' };\n\n  // business_owner requires companyName; abn_contractor uses firstName+lastName if not provided\n  if (accountType === 'business_owner' && (!companyName || companyName.trim().length < 2))\n    return { success: false, message: 'Company name must be at least 2 characters long' };"

# 2. Mettre a jour la branche isBusinessOwner pour utiliser isCompanyAccount + account_type
old2 = "    if (isBusinessOwner) {\n      // Business owner: create company + user as patron\n      const companyCode = crypto.randomBytes(4).toString('hex').toUpperCase();\n      await connection.execute(\n        'INSERT INTO companies (name, company_code) VALUES (?, ?)',\n        [companyName.trim(), companyCode]\n      );\n      const companyId = (await connection.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;\n      console.log('[SUBSCRIBE] Company created:', { companyId, companyName, companyCode });\n\n      await connection.execute(\n        'INSERT INTO users (email, first_name, last_name, password_hash, company_id, company_role) VALUES (?, ?, ?, ?, ?, ?)',\n        [mail, firstName, lastName, password_hash, companyId, 'patron']\n      );"
new2 = "    if (isCompanyAccount) {\n      // Business owner / ABN contractor: create company + user as patron\n      const resolvedCompanyName = (companyName && companyName.trim().length >= 2)\n        ? companyName.trim()\n        : `${firstName.trim()} ${lastName.trim()}`;\n      const resolvedAccountType = isAbnContractor ? 'abn_contractor' : 'business_owner';\n      const companyCode = crypto.randomBytes(4).toString('hex').toUpperCase();\n      await connection.execute(\n        'INSERT INTO companies (name, company_code) VALUES (?, ?)',\n        [resolvedCompanyName, companyCode]\n      );\n      const companyId = (await connection.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;\n      console.log('[SUBSCRIBE] Company created:', { companyId, resolvedCompanyName, companyCode, resolvedAccountType });\n\n      await connection.execute(\n        'INSERT INTO users (email, first_name, last_name, password_hash, company_id, company_role, account_type) VALUES (?, ?, ?, ?, ?, ?, ?)',\n        [mail, firstName, lastName, password_hash, companyId, 'patron', resolvedAccountType]\n      );"

# 3. Mettre a jour le retour de la branche company
old3 = "        success: true,\n        user: { id: userId, mail, firstName, lastName, company_id: companyId, company_role: 'patron' }\n      };\n    } else {\n      // Employee: create user without company"
new3 = "        success: true,\n        user: { id: userId, mail, firstName, lastName, company_id: companyId, company_role: 'patron', account_type: resolvedAccountType }\n      };\n    } else {\n      // Employee: create user without company"

# 4. Mettre a jour la branche employee pour stocker account_type
old4 = "      await connection.execute(\n        'INSERT INTO users (email, first_name, last_name, password_hash, company_role) VALUES (?, ?, ?, ?, ?)',\n        [mail, firstName, lastName, password_hash, 'employee']\n      );"
new4 = "      await connection.execute(\n        'INSERT INTO users (email, first_name, last_name, password_hash, company_role, account_type) VALUES (?, ?, ?, ?, ?, ?)',\n        [mail, firstName, lastName, password_hash, 'employee', 'employee']\n      );"

# 5. Mettre a jour le retour de la branche employee
old5 = "        user: { id: userId, mail, firstName, lastName, company_id: null, company_role: 'employee' }"
new5 = "        user: { id: userId, mail, firstName, lastName, company_id: null, company_role: 'employee', account_type: 'employee' }"

changed = False
for old, new in [(old1, new1), (old2, new2), (old3, new3), (old4, new4), (old5, new5)]:
    if old in content:
        content = content.replace(old, new)
        changed = True
        print("OK patch applied")
    else:
        print("SKIP not found:", repr(old[:60]))

if changed:
    with open(path, 'w') as f:
        f.write(content)
    print("OK subscribe.js saved")

#!/usr/bin/env python3
"""Patch assignCrewToJobById.js to allow patron/contractor-company users to assign crew"""

path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/assignCrewToJobById.js'
with open(path, 'r') as f:
    content = f.read()

# 1. Add contractor_company_id to job SELECT
old1 = "SELECT j.id, j.code, j.status, j.client_id,\n              c.first_name as client_first_name, c.last_name as client_last_name"
new1 = "SELECT j.id, j.code, j.status, j.client_id, j.contractor_company_id,\n              c.first_name as client_first_name, c.last_name as client_last_name"
if old1 in content:
    content = content.replace(old1, new1)
    print("✅ Patched job SELECT query")
else:
    print("⚠️  Job SELECT not found (may already be patched)")

# 2. Add company_id to userRows SELECT
old2 = "      'SELECT role FROM users WHERE id = ?',"
new2 = "      'SELECT role, company_id FROM users WHERE id = ?',"
if old2 in content:
    content = content.replace(old2, new2)
    print("✅ Patched userRows SELECT query")
else:
    print("⚠️  userRows SELECT not found (may already be patched)")

# 3. Update permission - allow patron and contractor company owner
old3 = "    // Admin et Manager peuvent toujours assigner\n    if (['admin', 'manager'].includes(userRole)) {\n      hasPermission = true;\n      permissionReason = `User role: ${userRole}`;\n    } else {"
new3 = "    // Admin, Manager et Patron (company owner) peuvent assigner\n    // Patron peut assigner si leur company est contractante pour ce job\n    if (['admin', 'manager', 'patron'].includes(userRole)) {\n      hasPermission = true;\n      permissionReason = `User role: ${userRole}`;\n    } else if (userRows[0].company_id && job.contractor_company_id && userRows[0].company_id === job.contractor_company_id) {\n      hasPermission = true;\n      permissionReason = 'Contractor company member';\n    } else {"
if old3 in content:
    content = content.replace(old3, new3)
    print("✅ Patched permission check")
else:
    print("⚠️  Permission check not found - checking alternate pattern")
    # Try without the comment
    old3b = "    if (['admin', 'manager'].includes(userRole)) {\n      hasPermission = true;\n      permissionReason = `User role: ${userRole}`;\n    } else {"
    new3b = "    if (['admin', 'manager', 'patron'].includes(userRole)) {\n      hasPermission = true;\n      permissionReason = `User role: ${userRole}`;\n    } else if (userRows[0].company_id && job.contractor_company_id && userRows[0].company_id === job.contractor_company_id) {\n      hasPermission = true;\n      permissionReason = 'Contractor company member';\n    } else {"
    if old3b in content:
        content = content.replace(old3b, new3b)
        print("✅ Patched permission check (alt)")
    else:
        print("❌ Could not find permission check")

with open(path, 'w') as f:
    f.write(content)

print("Done writing file")

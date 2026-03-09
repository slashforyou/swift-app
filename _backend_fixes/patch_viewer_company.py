#!/usr/bin/env python3
"""Patch getFullJobById.js to return viewer_company_id in the response"""

path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/getFullJobById.js'
with open(path, 'r') as f:
    content = f.read()

# Add viewer_company_id to the response data block
old = "        contractor_company: { id: job.contractor_company_id, name: job.contractor_company_name },\n        contractee_company: { id: job.contractee_company_id, name: job.contractee_company_name },"
new = "        contractor_company: { id: job.contractor_company_id, name: job.contractor_company_name },\n        contractee_company: { id: job.contractee_company_id, name: job.contractee_company_name },\n        viewer_company_id: user.company_id,"

if old in content:
    content = content.replace(old, new)
    print("✅ Patched response to include viewer_company_id")
else:
    print("⚠️  Target not found - checking structure...")
    if 'contractor_company:' in content and 'contractee_company:' in content:
        print("   Fields exist but format differs - check manually")
    else:
        print("   Fields not found at all")

with open(path, 'w') as f:
    f.write(content)
print("Done")

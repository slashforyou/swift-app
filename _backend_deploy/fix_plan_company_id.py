#!/usr/bin/env python3
# Fix plan.js: replace "WHERE company_id = ?" with "WHERE contractee_company_id = ?" in jobs query
target = "/srv/www/htdocs/swiftapp/server/endPoints/v1/companies/plan.js"
old = "       WHERE company_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
new = "       WHERE contractee_company_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"

with open(target, 'r') as f:
    content = f.read()

if new in content:
    print("ALREADY_FIXED")
elif old in content:
    with open(target, 'w') as f:
        f.write(content.replace(old, new))
    print("FIXED_OK")
else:
    print("PATTERN_NOT_FOUND")
    # Print context to help debug
    for i, line in enumerate(content.split('\n')):
        if 'company_id' in line.lower() and 'jobs' in content.split('\n')[max(0,i-3):i+1][-1].lower() if i > 0 else False:
            print(f"  Line {i+1}: {repr(line)}")

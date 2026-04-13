"""Fix postcode-lookup route require paths in index.js"""
INDEX = '/srv/www/htdocs/swiftapp/server/index.js'

with open(INDEX, 'r') as f:
    content = f.read()

content = content.replace(
    "require('/middleware/authenticateToken')",
    "require('./middleware/authenticateToken')"
)
content = content.replace(
    "require('/endPoints/v1/companies/abnLookup')",
    "require('./endPoints/v1/companies/abnLookup')"
)

with open(INDEX, 'w') as f:
    f.write(content)

print('FIXED')
# Verify
with open(INDEX, 'r') as f:
    for line in f:
        if 'postcode-lookup' in line:
            print(line.rstrip())

#!/usr/bin/env python3
"""Inject company logo upload route into index.js"""

INDEX = '/srv/www/htdocs/swiftapp/server/index.js'

with open(INDEX, 'r') as f:
    content = f.read()

# Check if route already exists
if 'uploadCompanyLogo' in content:
    print('Route already exists - skipping')
    exit(0)

# Insert before 404 handler
MARKER = '// 404 HANDLER (doit'
ROUTE = """// 📸 [POST] Upload company logo
const uploadLogoMiddleware = require('./middleware/uploadImage');
app.post('/swift-app/v1/company/:companyId/logo', require('./middleware/authenticateToken').authenticateToken, uploadLogoMiddleware.single('logo'), (req, res) => {
  const { uploadCompanyLogoEndpoint } = require('./endPoints/v1/uploadCompanyLogo');
  uploadCompanyLogoEndpoint(req, res);
});

"""

if MARKER not in content:
    print('ERROR: Could not find 404 HANDLER marker')
    exit(1)

content = content.replace(MARKER, ROUTE + MARKER)

with open(INDEX, 'w') as f:
    f.write(content)

print('OK - company logo upload route injected')

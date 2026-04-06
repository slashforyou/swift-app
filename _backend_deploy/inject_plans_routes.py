"""
Inject plan-related routes into server/index.js:
  GET  /swift-app/v1/plans           (public, no auth)
  GET  /swift-app/v1/company/plan    (authenticated)
  POST /swift-app/v1/admin/company/plan (admin secret)
"""
import shutil
import datetime

path = '/srv/www/htdocs/swiftapp/server/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

# Idempotent check
if 'getPlansEndpoint' in content:
    print('Plans routes already present, skipping')
    exit(0)

# 1. Find the 404 handler as anchor — insert routes just before it
route_anchor = "// 404 HANDLER"
new_routes = """// Plans endpoints
app.get('/swift-app/v1/plans', (req, res) => {
  const { getPlansEndpoint } = require('./endPoints/v1/plans');
  getPlansEndpoint(req, res);
});

app.get('/swift-app/v1/company/plan', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { getCompanyPlanEndpoint } = require('./endPoints/v1/companies/plan');
  getCompanyPlanEndpoint(req, res);
});

app.post('/swift-app/v1/admin/company/plan', (req, res) => {
  const { setCompanyPlanEndpoint } = require('./endPoints/v1/adminSetPlan');
  setCompanyPlanEndpoint(req, res);
});

"""

if route_anchor not in content:
    print('ERROR: Could not find 404 handler anchor')
    exit(1)

content = content.replace(route_anchor, new_routes + route_anchor, 1)

with open(path, 'w') as f:
    f.write(content)

print('OK - Routes injected successfully')
print('Backup: ' + backup)

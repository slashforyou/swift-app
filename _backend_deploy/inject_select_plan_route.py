"""
Inject select-plan route into server/index.js:
  POST /swift-app/v1/company/select-plan (authenticated)
"""
import shutil
import datetime

path = '/srv/www/htdocs/swiftapp/server/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

# Idempotent check
if 'selectPlanEndpoint' in content:
    print('select-plan route already present, skipping')
    exit(0)

# Insert after the existing company/plan GET route
anchor = "app.get('/swift-app/v1/company/plan'"

new_route = """

app.post('/swift-app/v1/company/select-plan', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { selectPlanEndpoint } = require('./endPoints/v1/companies/selectPlan');
  selectPlanEndpoint(req, res);
});
"""

if anchor not in content:
    # Fallback: insert before 404 handler
    anchor = "// 404 HANDLER"
    if anchor not in content:
        print('ERROR: Could not find route anchor')
        exit(1)
    content = content.replace(anchor, new_route + '\n' + anchor, 1)
else:
    # Find the end of the existing route line (next });)
    idx = content.index(anchor)
    # Find the closing }); of that route
    end_idx = content.index('});', idx)
    end_idx = content.index('\n', end_idx) + 1
    content = content[:end_idx] + new_route + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print('✅ select-plan route injected successfully')

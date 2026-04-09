"""
Inject ABN lookup routes into server/index.js:
  GET /swift-app/v1/companies/abn-lookup   (authenticated)
  GET /swift-app/v1/companies/abn-search   (authenticated)

Also injects ABR_GUID into .env if not already present.
"""
import shutil
import datetime
import os

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
INDEX_PATH = os.path.join(SERVER_DIR, 'index.js')
ENV_PATH = os.path.join(SERVER_DIR, '.env')

# ── 1. Inject ABR_GUID into .env ──────────────────────────
with open(ENV_PATH, 'r') as f:
    env_content = f.read()

if 'ABR_GUID' not in env_content:
    with open(ENV_PATH, 'a') as f:
        f.write('\n# Australian Business Register API\nABR_GUID=9bfef383-f6b9-4fcc-8b2b-773f9c6e2841\n')
    print('OK - ABR_GUID added to .env')
else:
    print('ABR_GUID already in .env, skipping')

# ── 2. Inject routes into index.js ────────────────────────
backup = INDEX_PATH + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(INDEX_PATH, backup)

with open(INDEX_PATH, 'r') as f:
    content = f.read()

if 'abnLookupEndpoint' in content:
    print('ABN routes already present, skipping')
    exit(0)

route_anchor = "// 404 HANDLER"
new_routes = """// ABN Lookup endpoints (ABR API proxy)
app.get('/swift-app/v1/companies/abn-lookup', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { abnLookupEndpoint } = require('./endPoints/v1/companies/abnLookup');
  abnLookupEndpoint(req, res);
});

app.get('/swift-app/v1/companies/abn-search', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { abnSearchEndpoint } = require('./endPoints/v1/companies/abnLookup');
  abnSearchEndpoint(req, res);
});

"""

if route_anchor not in content:
    print('ERROR: Could not find 404 handler anchor')
    exit(1)

content = content.replace(route_anchor, new_routes + route_anchor, 1)

with open(INDEX_PATH, 'w') as f:
    f.write(content)

print('OK - ABN routes injected into index.js')
print('Backup: ' + backup)

"""
Inject client search route into SwiftApp backend (index.js)
and deploy updated storage.js
Run on server: python3 /tmp/inject_client_search.py
"""
import sys

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"
STORAGE_SRC = "/tmp/storage.js"
STORAGE_DST = "/srv/www/htdocs/swiftapp/server/endPoints/v1/storage.js"

# 1) Copy updated storage.js
import shutil
shutil.copy(STORAGE_SRC, STORAGE_DST)
print("✅ Copied storage.js to server")

# 2) Add route to index.js if not already present
ROUTE = 'app.get("/swift-app/v1/storage/clients/search", authenticateToken, storage.searchClients);'

with open(INDEX_PATH, "r") as f:
    content = f.read()

if "storage.searchClients" in content:
    print("Client search route already present in index.js")
else:
    # Insert before the lots routes
    marker = 'app.get("/swift-app/v1/storage/lots"'
    if marker in content:
        content = content.replace(marker, ROUTE + "\n" + marker)
        with open(INDEX_PATH, "w") as f:
            f.write(content)
        print("✅ Injected client search route into index.js")
    else:
        print("ERROR: Could not find lots route marker")
        sys.exit(1)

# 3) Restart PM2
import subprocess
result = subprocess.run(["pm2", "restart", "swiftapp"], capture_output=True, text=True)
print(result.stdout)
if result.returncode != 0:
    print("PM2 restart error:", result.stderr)
else:
    print("✅ PM2 restarted")

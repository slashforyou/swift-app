#!/usr/bin/env python3
"""
patch_index_staff_requests.py
────────────────────────────────
Enregistre la route POST /v1/jobs/:jobId/staff-requests dans index.js

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/patch_index_staff_requests.py
"""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILE, "r") as f:
    content = f.read()

MARKER = "// [PATCH] staff_requests_route"
if MARKER in content:
    print("Already patched — skipping.")
    exit(0)

# ── Step 1: add require for staffRequests endpoint ────────────────────────────
# Find a nearby require to anchor on (counterProposal or any jobs endpoint)
REQUIRE_ANCHORS = [
    "counterProposal",
    "pendingAssignments",
    "transfers",
]

require_anchor_line = None
for anchor in REQUIRE_ANCHORS:
    # look for a require line containing this keyword
    for line in content.split("\n"):
        if "require(" in line and anchor in line and "endPoints" in line:
            require_anchor_line = line
            break
    if require_anchor_line:
        break

if not require_anchor_line:
    print("ERROR: could not find a require anchor line in index.js near jobs endpoints")
    print("Manually add:")
    print("  const { staffRequestsEndpoint } = require('./endPoints/v1/jobs/staffRequests');")
    exit(1)

NEW_REQUIRE = (
    require_anchor_line
    + "\n  // [PATCH] staff_requests_route\n"
    + "  const { staffRequestsEndpoint } = require('./endPoints/v1/jobs/staffRequests');"
)
content = content.replace(require_anchor_line, NEW_REQUIRE, 1)

# ── Step 2: add the route registration ───────────────────────────────────────
ROUTE_ANCHORS = [
    "/swift-app/v1/jobs/:jobId/counter_proposal",
    "/swift-app/v1/jobs/pending-assignments",
    "/swift-app/v1/jobs",
]

route_anchor_line = None
for anchor in ROUTE_ANCHORS:
    for line in content.split("\n"):
        if anchor in line and ("app.post" in line or "app.get" in line or "app.put" in line):
            route_anchor_line = line
            break
    if route_anchor_line:
        break

if not route_anchor_line:
    print("ERROR: could not find a route anchor line in index.js")
    print("Manually add:")
    print("  app.post('/swift-app/v1/jobs/:jobId/staff-requests', authenticateToken, staffRequestsEndpoint);")
    exit(1)

NEW_ROUTE = (
    route_anchor_line
    + "\n  app.post('/swift-app/v1/jobs/:jobId/staff-requests', authenticateToken, staffRequestsEndpoint);"
)
content = content.replace(route_anchor_line, NEW_ROUTE, 1)

# ── Step 3: write back with backup ───────────────────────────────────────────
ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
with open(FILE, "w") as f:
    f.write(content)

print(f"OK — staff-requests route registered in index.js (backup: {FILE}.bak_{ts})")

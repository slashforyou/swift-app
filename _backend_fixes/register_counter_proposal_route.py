#!/usr/bin/env python3
"""
Enregistre la route POST /swift-app/v1/jobs/:jobId/counter_proposal dans index.js
"""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILE, "r") as f:
    content = f.read()

MARKER = "counterProposal"
if MARKER in content:
    print("Route already registered in index.js, skipping.")
    exit(0)

# Insert require near the other v1/jobs requires
REQUIRE_ANCHOR = "  const jobTransfers    = require('./endPoints/v1/jobs/transfers');"
if REQUIRE_ANCHOR not in content:
    print("ERROR: require anchor not found")
    exit(1)

NEW_REQUIRE = """  const jobTransfers    = require('./endPoints/v1/jobs/transfers');
  const counterProposal = require('./endPoints/v1/jobs/counterProposal');"""
content = content.replace(REQUIRE_ANCHOR, NEW_REQUIRE, 1)

# Insert route near the other transfer routes
ROUTE_ANCHOR = "  console.log('✅ [Routes] B2B Transfer routes registered');"
if ROUTE_ANCHOR not in content:
    # Try alternative
    ROUTE_ANCHOR = "console.log('✅ [Routes] B2B Transfer routes registered');"
    if ROUTE_ANCHOR not in content:
        print("ERROR: route anchor not found")
        exit(1)

NEW_ROUTE = """
  // Contre-proposition contracteur
  app.post('/swift-app/v1/jobs/:jobId/counter_proposal', authenticateToken, counterProposal.counterProposalEndpoint);

  """ + ROUTE_ANCHOR

content = content.replace(ROUTE_ANCHOR, NEW_ROUTE, 1)

ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
with open(FILE, "w") as f:
    f.write(content)
print("OK — counter_proposal route registered in index.js")

#!/usr/bin/env python3
"""Inject jobReviews routes into index.js BEFORE Phase 4 Scorecard section."""

import sys

path = '/srv/www/htdocs/swiftapp/server/index.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'review-request' in content:
    print('SKIP: routes jobReviews already present')
    sys.exit(0)

routes_to_inject = (
    "\n"
    "// -- Job Reviews\n"
    "app.post('/swift-app/v1/jobs/:jobId/review-request', authenticateToken, (req, res) => {\n"
    "  const { requestReview } = require('./endPoints/v1/jobReviews');\n"
    "  requestReview(req, res);\n"
    "});\n"
    "\n"
    "app.post('/swift-app/v1/reviews/submit', (req, res) => {\n"
    "  const { submitReview } = require('./endPoints/v1/jobReviews');\n"
    "  submitReview(req, res);\n"
    "});\n"
    "\n"
    "app.get('/swift-app/v1/reviews', authenticateToken, (req, res) => {\n"
    "  const { listReviews } = require('./endPoints/v1/jobReviews');\n"
    "  listReviews(req, res);\n"
    "});\n"
    "\n"
    "app.get('/swift-app/v1/jobs/:jobId/review', authenticateToken, (req, res) => {\n"
    "  const { getJobReview } = require('./endPoints/v1/jobReviews');\n"
    "  getJobReview(req, res);\n"
    "});\n"
    "\n"
)

# Find the Phase 4 marker (handles box-drawing chars or plain dashes)
marker = None
for candidate in [
    '// \u2500\u2500 Phase 4 : Scorecard & Reviews',
    '// -- Phase 4 : Scorecard & Reviews',
    '// ── Phase 4 : Scorecard',
]:
    if candidate in content:
        marker = candidate
        break

if marker is None:
    # Fallback: inject after the closing }); of completeJobById
    target = 'completeJobByIdEndpoint(req, res);\n\n\n});\n'
    if target not in content:
        print('ERROR: could not find injection anchor')
        sys.exit(1)
    new_content = content.replace(target, target + routes_to_inject, 1)
else:
    new_content = content.replace(marker, routes_to_inject + marker, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('OK: jobReviews routes injected successfully')

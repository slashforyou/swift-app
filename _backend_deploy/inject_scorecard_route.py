#!/usr/bin/env python3
"""
inject_scorecard_route.py
Injecte dans index.js :
  - Routes GET /swift-app/v1/jobs/:id/scorecard
  - Routes POST /swift-app/v1/jobs/:id/review-request
  - Routes GET/POST /swift-app/v1/review/:token
Et injecte generateScorecard dans completeJobById.js (fire-and-forget après processJobCompleted)
"""

import re
import sys

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
INDEX_JS   = f'{SERVER_DIR}/index.js'
COMPLETE_JS = f'{SERVER_DIR}/endPoints/v1/completeJobById.js'

# ─── 1. index.js — ajouter les routes scorecard ───────────────────────────────

with open(INDEX_JS, 'r', encoding='utf-8') as f:
    index_content = f.read()

SCORECARD_ROUTES = """
// ── Phase 4 : Scorecard & Reviews ──────────────────────────────────
app.get('/swift-app/v1/jobs/:id/scorecard', (req, res) => {
  const { getJobScorecardEndpoint } = require('./endPoints/v1/jobScorecard');
  getJobScorecardEndpoint(req, res);
});

app.post('/swift-app/v1/jobs/:id/review-request', (req, res) => {
  const { sendReviewRequestEndpoint } = require('./endPoints/v1/clientReview');
  sendReviewRequestEndpoint(req, res);
});

app.get('/swift-app/v1/review/:token', (req, res) => {
  const { getReviewPageEndpoint } = require('./endPoints/v1/clientReview');
  getReviewPageEndpoint(req, res);
});

app.post('/swift-app/v1/review/:token', (req, res) => {
  const { submitReviewEndpoint } = require('./endPoints/v1/clientReview');
  submitReviewEndpoint(req, res);
});
// ── /Phase 4 ────────────────────────────────────────────────────────
"""

# Injecter après la route completeJobById (ligne ~3515)
ANCHOR = "completeJobByIdEndpoint(req, res);\n\n\n});"

if SCORECARD_ROUTES.strip() in index_content:
    print("✅ Routes scorecard déjà présentes dans index.js")
elif ANCHOR not in index_content:
    print("❌ Ancre non trouvée dans index.js :", ANCHOR)
    sys.exit(1)
else:
    index_content = index_content.replace(
        ANCHOR,
        ANCHOR + "\n" + SCORECARD_ROUTES,
        1
    )
    with open(INDEX_JS, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print("✅ Routes scorecard injectées dans index.js")

# ─── 2. completeJobById.js — hooker generateScorecard ─────────────────────────

with open(COMPLETE_JS, 'r', encoding='utf-8') as f:
    complete_content = f.read()

GAMIF_HOOK = "processJobCompleted("

SCORECARD_HOOK = """
    // [PHASE 4] Générer le scorecard — fire-and-forget
    try {
      const { generateScorecard } = require('../../utils/scoreEngine');
      generateScorecard(jobId).catch(e => console.error('[scoreEngine] error:', e.message));
    } catch (_) {}
"""

if 'generateScorecard' in complete_content:
    print("✅ Hook generateScorecard déjà présent dans completeJobById.js")
elif GAMIF_HOOK not in complete_content:
    print("❌ Ancre processJobCompleted non trouvée dans completeJobById.js")
    sys.exit(1)
else:
    # Injecter AVANT l'appel processJobCompleted
    complete_content = complete_content.replace(
        GAMIF_HOOK,
        SCORECARD_HOOK + "    " + GAMIF_HOOK,
        1
    )
    with open(COMPLETE_JS, 'w', encoding='utf-8') as f:
        f.write(complete_content)
    print("✅ Hook generateScorecard injecté dans completeJobById.js")

print("✅ inject_scorecard_route.py terminé")

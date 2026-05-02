#!/usr/bin/env python3
"""
inject_complete_job_route.py — Ajoute dans index.js (serveur) :

  POST /swift-app/v1/jobs/:id/complete → completeJobByIdEndpoint
  (route déclenchant le trigger email review + gamification)

Ce script s'exécute sur le serveur (copié via SCP puis run via SSH).
"""
import shutil
import datetime

INDEX = '/srv/www/htdocs/swiftapp/server/index.js'
backup = INDEX + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(INDEX, backup)
print('Backup:', backup)

with open(INDEX, 'r', encoding='utf-8') as f:
    content = f.read()

changed = False

# ── 1. Route POST /jobs/:id/complete ────────────────────────────────────────
# On injecte juste avant la route startJobById (logique proche)
ROUTE_ANCHOR_OPTIONS = [
    "app.post('/swift-app/v1/jobs/start",
    "app.post('/swift-app/v1/jobs/:id/start",
    # fallback : chercher la section des routes de jobs
    "app.put('/swift-app/v1/jobs/:id",
]

COMPLETE_ROUTE = """app.post('/swift-app/v1/jobs/:id/complete', authenticateToken, (req, res) => {
  const { completeJobByIdEndpoint } = require('./endPoints/v1/completeJobById');
  completeJobByIdEndpoint(req, res);
});

"""

if 'completeJobByIdEndpoint' in content:
    print('SKIP: route /complete deja presente dans index.js')
else:
    anchor_found = None
    for anchor in ROUTE_ANCHOR_OPTIONS:
        if anchor in content:
            anchor_found = anchor
            break

    if anchor_found is None:
        print('ERROR: aucune ancre trouvee pour injecter la route complete.')
        print('       Ajoutez manuellement dans index.js :')
        print(COMPLETE_ROUTE)
        exit(1)
    else:
        content = content.replace(anchor_found, COMPLETE_ROUTE + anchor_found, 1)
        print(f'OK: route /complete injectee avant "{anchor_found}"')
        changed = True

# ── 2. Route POST /reviews/submit (si pas encore présente) ──────────────────
# jobReviews.js gère 4 routes, on vérifie qu'elles sont bien enregistrées

REVIEWS_ANCHOR_OPTIONS = [
    "app.post('/swift-app/v1/jobs/:jobId/review-request",
    "app.post('/swift-app/v1/reviews/submit",
]

REVIEWS_ROUTES = """app.post('/swift-app/v1/jobs/:jobId/review-request', authenticateToken, (req, res) => {
  const { requestReview } = require('./endPoints/v1/jobReviews');
  requestReview(req, res);
});

app.post('/swift-app/v1/reviews/submit', (req, res) => {
  // Route publique — sans authenticateToken
  const { submitReview } = require('./endPoints/v1/jobReviews');
  submitReview(req, res);
});

app.get('/swift-app/v1/reviews', authenticateToken, (req, res) => {
  const { listReviews } = require('./endPoints/v1/jobReviews');
  listReviews(req, res);
});

app.get('/swift-app/v1/jobs/:jobId/review', authenticateToken, (req, res) => {
  const { getJobReview } = require('./endPoints/v1/jobReviews');
  getJobReview(req, res);
});

"""

reviews_already_present = any(a in content for a in REVIEWS_ANCHOR_OPTIONS)

if reviews_already_present:
    print('SKIP: routes jobReviews deja presentes dans index.js')
else:
    # Injecter avant la route complete (qu'on vient d'ajouter) ou une ancre générique
    for fallback_anchor in [
        'completeJobByIdEndpoint',
        "app.post('/swift-app/v1/jobs",
    ]:
        if fallback_anchor in content:
            content = content.replace(fallback_anchor, REVIEWS_ROUTES + fallback_anchor, 1)
            print(f'OK: routes jobReviews injectees avant "{fallback_anchor}"')
            changed = True
            break
    else:
        print('WARNING: impossible d\'injecter les routes jobReviews automatiquement.')
        print('         Ajoutez manuellement :')
        print(REVIEWS_ROUTES)

if changed:
    with open(INDEX, 'w', encoding='utf-8') as f:
        f.write(content)
    print('index.js mis a jour avec succes')
else:
    print('Aucune modification necessaire')

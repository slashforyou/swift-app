"""
inject_stripe_webhook_route.py
===============================
Injecte la route Stripe webhook dans index.js avec le middleware express.raw().

SÉCURITÉ CRITIQUE :
  - express.raw() doit être appliqué UNIQUEMENT sur /stripe/webhooks
  - Le body JSON parsé (express.json()) ne peut PAS être utilisé pour
    stripe.webhooks.constructEvent() — Stripe vérifie la signature sur
    le body RAW (Buffer), pas sur l'objet JSON reconstruit.
  - La route webhook est enregistrée AVANT app.use(express.json()) pour
    garantir que le body parser JSON ne consomme pas le body brut.

Ce script est idempotent : il ne modifie pas index.js si la route existe déjà.
"""

import shutil
import datetime

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
path = f'{SERVER_DIR}/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)
print(f'[INFO] Backup created: {backup}')

with open(path, 'r') as f:
    content = f.read()

# ── Idempotent check ──────────────────────────────────────────────────────────
if 'stripe/webhooks' in content and 'express.raw' in content:
    print('[SKIP] Stripe webhook route already injected with express.raw()')
    exit(0)

# ── Route à injecter ──────────────────────────────────────────────────────────
# La route webhook doit être déclarée AVANT le middleware express.json() global,
# ou avec express.raw() explicitement sur cette route uniquement.
# On cherche le marqueur le plus tôt possible dans index.js.

WEBHOOK_ROUTE = """
  // ============================================================
  // STRIPE WEBHOOKS — RAW BODY OBLIGATOIRE pour la signature
  // ============================================================
  // IMPORTANT : express.raw() est appliqué ICI, sur cette route uniquement.
  // Ne pas déplacer ce bloc après app.use(express.json()) global.
  // stripe.webhooks.constructEvent() exige le Buffer brut, pas le JSON parsé.
  const { handleWebhook: stripeHandleWebhook } = require('./endPoints/v1/stripe/webhooks');
  app.post(
    '/swift-app/v1/stripe/webhooks',
    express.raw({ type: 'application/json' }),
    stripeHandleWebhook
  );

"""

# ── Ancres de recherche (du plus spécifique au plus générique) ───────────────
ANCHORS = [
    "logger.info('STRIPE', 'Routes Stripe activées');",
    "// ═══════════ STRIPE ROUTES ═══════════",
    "// STRIPE",
    "app.use(express.json())",
    "app.use(express.urlencoded",
    "// 404 HANDLER",
]

injected = False
for anchor in ANCHORS:
    if anchor in content:
        # Insérer AVANT l'ancre (body parser ou premier bloc Stripe)
        if anchor in ("app.use(express.json())", "app.use(express.urlencoded"):
            # Insérer avant le body parser JSON global
            content = content.replace(anchor, WEBHOOK_ROUTE + anchor, 1)
        else:
            # Insérer après l'ancre (bloc Stripe existant ou 404 handler)
            content = content.replace(anchor, anchor + WEBHOOK_ROUTE, 1)
        injected = True
        print(f'[OK] Route injectée via ancre : {anchor!r}')
        break

if not injected:
    print('[ERROR] Aucune ancre trouvée dans index.js — injection manuelle requise')
    print('        Ajouter manuellement le bloc suivant AVANT express.json() :')
    print(WEBHOOK_ROUTE)
    exit(1)

with open(path, 'w') as f:
    f.write(content)

print('[OK] index.js mis à jour')
print('')
print('VÉRIFICATION REQUISE :')
print('  1. La route /swift-app/v1/stripe/webhooks doit apparaître AVANT express.json()')
print('  2. Redémarrer PM2 : pm2 restart swift-app --update-env')
print('  3. Tester : stripe trigger customer.subscription.created (Stripe CLI)')

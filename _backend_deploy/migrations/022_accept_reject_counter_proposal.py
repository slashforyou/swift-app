"""
Enregistrement des routes d'acceptation / rejet de contre-proposition.

Ajoute dans le router :
  POST /v1/jobs/:jobId/accept_counter_proposal
  POST /v1/jobs/:jobId/reject_counter_proposal

Aucune migration DB requise — utilise les colonnes ajoutées par 021_counter_proposal.py.
"""

import os
import shutil
from datetime import datetime

# ── Config ───────────────────────────────────────────────────────────────────
SERVER_DIR = '/srv/www/htdocs/swiftapp/server'

ROUTER_CANDIDATES = [
    os.path.join(SERVER_DIR, 'router.js'),
    os.path.join(SERVER_DIR, 'app.js'),
    os.path.join(SERVER_DIR, 'index.js'),
    os.path.join(SERVER_DIR, 'routes.js'),
]

# ── Enregistrement des routes ─────────────────────────────────────────────────
print('===== Enregistrement des routes accept/reject counter proposal =====')

router_path = None
for c in ROUTER_CANDIDATES:
    if os.path.exists(c):
        router_path = c
        break

if not router_path:
    print('⚠️  Router non trouvé — ajoutez manuellement dans votre fichier de routes :')
    print("    const { acceptCounterProposalEndpoint } = require('./endPoints/v1/jobs/acceptCounterProposal');")
    print("    const { rejectCounterProposalEndpoint } = require('./endPoints/v1/jobs/rejectCounterProposal');")
    print("    router.post('/v1/jobs/:jobId/accept_counter_proposal', auth, acceptCounterProposalEndpoint);")
    print("    router.post('/v1/jobs/:jobId/reject_counter_proposal', auth, rejectCounterProposalEndpoint);")
else:
    with open(router_path, 'r') as f:
        router_content = f.read()

    if 'acceptCounterProposalEndpoint' in router_content:
        print('✅ Routes déjà enregistrées — skip')
    else:
        backup = router_path + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        shutil.copy2(router_path, backup)
        print(f'📦 Backup : {backup}')

        requires = (
            "\nconst { acceptCounterProposalEndpoint } = require('./endPoints/v1/jobs/acceptCounterProposal');"
            "\nconst { rejectCounterProposalEndpoint } = require('./endPoints/v1/jobs/rejectCounterProposal');"
        )
        routes = (
            "\nrouter.post('/v1/jobs/:jobId/accept_counter_proposal', auth, acceptCounterProposalEndpoint);"
            "\nrouter.post('/v1/jobs/:jobId/reject_counter_proposal', auth, rejectCounterProposalEndpoint);\n"
        )

        # Insérer les routes après la route counter_proposal
        anchor_route = "'/v1/jobs/:jobId/counter_proposal'"
        alt_anchor   = '"/v1/jobs/:jobId/counter_proposal"'
        anchor = anchor_route if anchor_route in router_content else (alt_anchor if alt_anchor in router_content else None)

        if anchor:
            idx = router_content.find(anchor)
            eol = router_content.find('\n', idx) + 1
            router_content = router_content[:eol] + routes + router_content[eol:]
        else:
            router_content += routes

        # Insérer les requires après le require counterProposal
        require_anchor = "require('./endPoints/v1/jobs/counterProposal')"
        if require_anchor in router_content:
            router_content = router_content.replace(
                require_anchor, require_anchor + requires
            )
        else:
            router_content = requires + '\n' + router_content

        with open(router_path, 'w') as f:
            f.write(router_content)

        print(f'✅ Routes enregistrées dans {router_path}')

print('\n✅ Terminé. Lance: pm2 restart all')

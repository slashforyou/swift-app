import shutil, datetime

path = '/srv/www/htdocs/swiftapp/server/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

if 'acceptCounterProposalEndpoint' in content:
    print('Routes deja presentes, skip')
    exit(0)

# 1. Requires apres le require counterProposal
req_anchor = "require('./endPoints/v1/jobs/counterProposal')"
new_requires = (
    "\n  const acceptCounterProposal = require('./endPoints/v1/jobs/acceptCounterProposal');"
    "\n  const rejectCounterProposal = require('./endPoints/v1/jobs/rejectCounterProposal');"
)
content = content.replace(req_anchor, req_anchor + new_requires, 1)

# 2. Routes apres la route counter_proposal
route_anchor = "counterProposal.counterProposalEndpoint);"
new_routes = (
    "\n  app.post('/swift-app/v1/jobs/:jobId/accept_counter_proposal', authenticateToken, acceptCounterProposal.acceptCounterProposalEndpoint);"
    "\n  app.post('/swift-app/v1/jobs/:jobId/reject_counter_proposal', authenticateToken, rejectCounterProposal.rejectCounterProposalEndpoint);"
)
content = content.replace(route_anchor, route_anchor + new_routes, 1)

with open(path, 'w') as f:
    f.write(content)

print('OK - injected - backup: ' + backup)

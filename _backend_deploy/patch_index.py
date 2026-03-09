import re
FILE = '/srv/www/htdocs/swiftapp/server/index.js'
with open(FILE, 'r') as f:
    c = f.read()

# Add require
old1 = "const counterProposal = require('./endPoints/v1/jobs/counterProposal');"
new1 = old1 + "\n  const pendingAssignments = require('./endPoints/v1/jobs/pendingAssignments');"
c = c.replace(old1, new1, 1)

# Add route
old2 = "  app.post('/swift-app/v1/jobs/:jobId/counter_proposal', authenticateToken, counterProposal.counterProposalEndpoint);"
new2 = old2 + "\n  app.get('/swift-app/v1/jobs/pending-assignments', authenticateToken, pendingAssignments.pendingAssignmentsEndpoint);"
c = c.replace(old2, new2, 1)

with open(FILE, 'w') as f:
    f.write(c)
print('DONE')

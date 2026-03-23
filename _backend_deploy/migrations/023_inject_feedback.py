import shutil, datetime

path = '/srv/www/htdocs/swiftapp/server/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

if 'feedbackEndpoint' in content:
    print('Route feedback deja presente, skip')
    exit(0)

# 1. Require après le dernier require connu (rejectCounterProposal)
req_anchor = "require('./endPoints/v1/jobs/rejectCounterProposal');"
new_require = (
    "\n  const feedback = require('./endPoints/v1/feedback');"
)
content = content.replace(req_anchor, req_anchor + new_require, 1)

# 2. Route après la route reject_counter_proposal
route_anchor = "rejectCounterProposal.rejectCounterProposalEndpoint);"
new_route = (
    "\n  app.post('/swift-app/v1/feedback', authenticateToken, feedback.feedbackEndpoint);"
)
content = content.replace(route_anchor, route_anchor + new_route, 1)

with open(path, 'w') as f:
    f.write(content)

print('OK - feedback route injected - backup: ' + backup)

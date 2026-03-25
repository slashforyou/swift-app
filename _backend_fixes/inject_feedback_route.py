#!/usr/bin/env python3
"""Inject feedback route into index.js before 404 handler."""

path = '/srv/www/htdocs/swiftapp/server/index.js'

with open(path, 'r') as f:
    content = f.read()

if 'feedbackEndpoint' in content:
    print('Route feedback already present, skip')
    exit(0)

anchor = '// 404 HANDLER (doit'

route_block = """// ✅ [POST] User Feedback
app.post('/swift-app/v1/feedback', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  console.log('[ Feedback endpoint called ]');
  const { feedbackEndpoint } = require('./endPoints/v1/feedback');
  feedbackEndpoint(req, res);
});

"""

content = content.replace(anchor, route_block + anchor, 1)

with open(path, 'w') as f:
    f.write(content)

print('OK - feedback route injected')

"""
Inject admin send-notification route into server/index.js:
  POST /swift-app/v1/admin/send-notification  (JWT authenticated, patron role)
"""
import shutil
import datetime

path = '/srv/www/htdocs/swiftapp/server/index.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

# Idempotent check
if 'adminSendNotificationEndpoint' in content:
    print('adminSendNotification route already present, skipping')
    exit(0)

# Find the admin plan route as anchor — insert right after it
anchor = "app.post('/swift-app/v1/admin/company/plan'"
if anchor not in content:
    # Fallback: insert before the 404 handler
    anchor = "// 404 HANDLER"

new_route = """
app.post('/swift-app/v1/admin/send-notification', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { adminSendNotificationEndpoint } = require('./endPoints/v1/adminSendNotification');
  adminSendNotificationEndpoint(req, res);
});

"""

# Insert after the anchor line's block (find next semicolon after anchor)
anchor_pos = content.find(anchor)
if anchor_pos == -1:
    print(f'Anchor not found: {anchor}')
    exit(1)

# Find end of the anchor statement (next });)
end_pos = content.find('});', anchor_pos)
if end_pos == -1:
    print('Could not find end of anchor block')
    exit(1)
end_pos = end_pos + 3  # include '});'

content = content[:end_pos] + '\n' + new_route + content[end_pos:]

with open(path, 'w') as f:
    f.write(content)

print('adminSendNotification route injected successfully')
print(f'Backup: {backup}')

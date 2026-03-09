import shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILE, "r") as f:
    content = f.read()

# Replace the 4 patched routes to use inline require instead of the
# out-of-scope `authenticateToken` variable
REPLACEMENTS = [
    (
        "app.post('/swift-app/v1/job/:id/accept', authenticateToken, (req, res) => { // [PATCHED]",
        "app.post('/swift-app/v1/job/:id/accept', require('./middleware/authenticateToken').authenticateToken, (req, res) => {"
    ),
    (
        "app.post('/swift-app/v1/jobs/:id/accept', authenticateToken, (req, res) => { // [PATCHED]",
        "app.post('/swift-app/v1/jobs/:id/accept', require('./middleware/authenticateToken').authenticateToken, (req, res) => {"
    ),
    (
        "app.post('/swift-app/v1/jobs/:id/decline', authenticateToken, (req, res) => { // [PATCHED]",
        "app.post('/swift-app/v1/jobs/:id/decline', require('./middleware/authenticateToken').authenticateToken, (req, res) => {"
    ),
    (
        "app.post('/swift-app/v1/job/:id/decline', authenticateToken, (req, res) => { // [PATCHED]",
        "app.post('/swift-app/v1/job/:id/decline', require('./middleware/authenticateToken').authenticateToken, (req, res) => {"
    ),
]

count = 0
for old, new in REPLACEMENTS:
    if old in content:
        content = content.replace(old, new, 1)
        count += 1
    else:
        print(f"  WARN: pattern not found: {old[:60]}")

print(f"  Replaced {count}/4 patterns")

ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
with open(FILE, "w") as f:
    f.write(content)

print("OK — inline require used, no more TDZ error")

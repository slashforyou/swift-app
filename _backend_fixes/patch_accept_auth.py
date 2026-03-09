import shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILE, "r") as f:
    content = f.read()

if "// [PATCHED] auth accept/decline" in content:
    print("Already patched.")
    exit(0)

OLD = """// ✅ [POST] Accept Job by ID (contractor accepte le job)
app.post('/swift-app/v1/job/:id/accept', (req, res) => {
  console.log('[ Accept Job by ID endpoint called ]');
  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');
  acceptJobEndpoint(req, res);
});
// ✅ [POST] Accept/Decline Job — plural URL alias (frontend uses /v1/jobs/:id/ac
cept)
app.post('/swift-app/v1/jobs/:id/accept', (req, res) => {
  console.log('[ Accept Job (plural URL) ]');
  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');
  acceptJobEndpoint(req, res);
});

app.post('/swift-app/v1/jobs/:id/decline', (req, res) => {
  console.log('[ Decline Job (plural URL) ]');
  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');
  declineJobEndpoint(req, res);
});

// ❌ [POST] Decline Job by ID (contractor refuse le job)
app.post('/swift-app/v1/job/:id/decline', (req, res) => {
  console.log('[ Decline Job by ID endpoint called ]');
  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');
  declineJobEndpoint(req, res);
});"""

NEW = """// [PATCHED] auth accept/decline — added authenticateToken middleware
app.post('/swift-app/v1/job/:id/accept',  authenticateToken, (req, res) => {
  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');
  acceptJobEndpoint(req, res);
});
app.post('/swift-app/v1/jobs/:id/accept', authenticateToken, (req, res) => {
  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');
  acceptJobEndpoint(req, res);
});
app.post('/swift-app/v1/jobs/:id/decline', authenticateToken, (req, res) => {
  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');
  declineJobEndpoint(req, res);
});
app.post('/swift-app/v1/job/:id/decline',  authenticateToken, (req, res) => {
  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');
  declineJobEndpoint(req, res);
});"""

if OLD not in content:
    # Try flexible match line by line
    print("Exact match failed, trying line-by-line replacement...")
    lines = content.split('\n')
    new_lines = []
    i = 0
    replaced = 0
    while i < len(lines):
        line = lines[i]
        # Replace singular accept route
        if "app.post('/swift-app/v1/job/:id/accept'" in line and 'authenticateToken' not in line:
            new_lines.append(line.replace(
                "app.post('/swift-app/v1/job/:id/accept', (req, res) => {",
                "app.post('/swift-app/v1/job/:id/accept', authenticateToken, (req, res) => { // [PATCHED]"
            ))
            replaced += 1
        # Replace plural accept route
        elif "app.post('/swift-app/v1/jobs/:id/accept'" in line and 'authenticateToken' not in line:
            new_lines.append(line.replace(
                "app.post('/swift-app/v1/jobs/:id/accept', (req, res) => {",
                "app.post('/swift-app/v1/jobs/:id/accept', authenticateToken, (req, res) => { // [PATCHED]"
            ))
            replaced += 1
        # Replace plural decline route
        elif "app.post('/swift-app/v1/jobs/:id/decline'" in line and 'authenticateToken' not in line:
            new_lines.append(line.replace(
                "app.post('/swift-app/v1/jobs/:id/decline', (req, res) => {",
                "app.post('/swift-app/v1/jobs/:id/decline', authenticateToken, (req, res) => { // [PATCHED]"
            ))
            replaced += 1
        # Replace singular decline route
        elif "app.post('/swift-app/v1/job/:id/decline'" in line and 'authenticateToken' not in line:
            new_lines.append(line.replace(
                "app.post('/swift-app/v1/job/:id/decline', (req, res) => {",
                "app.post('/swift-app/v1/job/:id/decline', authenticateToken, (req, res) => { // [PATCHED]"
            ))
            replaced += 1
        else:
            new_lines.append(line)
        i += 1
    content = '\n'.join(new_lines)
    print(f"  Replaced {replaced} route(s)")
else:
    content = content.replace(OLD, NEW, 1)
    print("  Exact match replaced")

ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
with open(FILE, "w") as f:
    f.write(content)
print("OK — authenticateToken added to accept/decline routes")

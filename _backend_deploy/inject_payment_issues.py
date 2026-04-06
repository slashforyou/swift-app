"""Inject payment-issues routes into index.js"""
import sys

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"

REQUIRE_LINE = 'const { reportPaymentIssue, getPaymentIssues, resolvePaymentIssue } = require("./endPoints/v1/paymentIssues");'
ROUTES = [
    'app.post("/swift-app/v1/jobs/:jobId/payment-issues", authenticateToken, reportPaymentIssue);',
    'app.get("/swift-app/v1/jobs/:jobId/payment-issues", authenticateToken, getPaymentIssues);',
    'app.patch("/swift-app/v1/payment-issues/:id/resolve", authenticateToken, resolvePaymentIssue);',
]

BLOCK = "\n// Payment Issues\n" + REQUIRE_LINE + "\n" + "\n".join(ROUTES) + "\n"
MARKER = "// Time Breakdown"

with open(INDEX_PATH, "r") as f:
    content = f.read()

if "paymentIssues" in content:
    print("Already injected, skipping.")
    sys.exit(0)

if MARKER not in content:
    print(f"ERROR: Marker '{MARKER}' not found!")
    sys.exit(1)

content = content.replace(MARKER, BLOCK + "\n" + MARKER)

with open(INDEX_PATH, "w") as f:
    f.write(content)

print("OK — 3 payment-issues routes injected.")

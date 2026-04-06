#!/usr/bin/env python3
"""
Inject forgot-password and reset-password routes into index.js
"""
import re

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"

with open(INDEX_PATH, "r") as f:
    content = f.read()

# Check if already injected
if "auth/forgot-password" in content:
    print("✅ Routes already exist, skipping")
    exit(0)

# Find the auth/refresh route block end
# We'll insert after the closing of the refresh route handler
# Pattern: find "auth/refresh" route and its closing brackets

ROUTES_CODE = """
// 🔐 [POST] /swift-app/auth/forgot-password (Rate Limited)
app.post('/swift-app/auth/forgot-password', rateLimitPresets.auth, async (req, res) => {
  try {
    const { forgotPasswordEndpoint } = require('./endPoints/auth/forgotPassword');
    const result = await forgotPasswordEndpoint(req);
    return res.status(result.status).json(result.json);
  } catch (error) {
    console.error('❌ [FORGOT PASSWORD] Route error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔐 [POST] /swift-app/auth/reset-password (Rate Limited)
app.post('/swift-app/auth/reset-password', rateLimitPresets.auth, async (req, res) => {
  try {
    const { resetPasswordEndpoint } = require('./endPoints/auth/resetPassword');
    const result = await resetPasswordEndpoint(req);
    return res.status(result.status).json(result.json);
  } catch (error) {
    console.error('❌ [RESET PASSWORD] Route error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
"""

# Find the auth/me route (line 358) and insert before it
marker = "app.get('/swift-app/auth/me'"
if marker in content:
    # Find the comment line above it
    idx = content.index(marker)
    # Go back to find the comment
    line_start = content.rfind('\n', 0, idx)
    comment_start = content.rfind('\n', 0, line_start)
    
    # Insert before the auth/me block
    insert_pos = comment_start
    content = content[:insert_pos] + ROUTES_CODE + content[insert_pos:]
    
    with open(INDEX_PATH, "w") as f:
        f.write(content)
    print("✅ Routes injected successfully before auth/me")
else:
    # Fallback: find after auth/refresh closing
    # Search for the pattern after "refreshEndpoint"
    match = re.search(r"(refreshEndpoint.*?\n\s*\}\s*\n\s*\}\s*\)\s*;)", content, re.DOTALL)
    if match:
        insert_pos = match.end()
        content = content[:insert_pos] + ROUTES_CODE + content[insert_pos:]
        with open(INDEX_PATH, "w") as f:
            f.write(content)
        print("✅ Routes injected after auth/refresh")
    else:
        print("❌ Could not find insertion point")
        exit(1)

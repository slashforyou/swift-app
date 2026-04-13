"""
Add draft save/load endpoints for Stripe onboarding auto-save.
1. Add draft_data JSON column to stripe_connected_accounts
2. Add saveDraft and getDraft functions to onboarding.js
3. Export them
"""
import subprocess
import sys
import os

# ── Step 1: Add draft_data column ──
print("Step 1: Adding draft_data column...")
sql = "ALTER TABLE stripe_connected_accounts ADD COLUMN IF NOT EXISTS onboarding_draft JSON DEFAULT NULL AFTER onboarding_progress;"
result = subprocess.run(
    ['mysql', '-u', 'root', '-pRemember_this1', 'swiftapp', '-e', sql],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
if result.returncode == 0:
    print("  ✅ Column added (or already exists)")
else:
    print(f"  ⚠️ MySQL: {result.stderr.strip()}")

# ── Step 2: Add saveDraft and getDraft endpoints ──
print("Step 2: Adding saveDraft and getDraft endpoints...")

filepath = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(filepath, 'r') as f:
    content = f.read()

# Check if already added
if 'saveDraft' in content:
    print("  ⚠️ saveDraft already exists, skipping")
else:
    # Add the functions before module.exports
    draft_code = '''
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Draft Auto-Save (field-level persistence)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /v1/stripe/onboarding/save-draft
 * Save partial form data as draft (auto-save on blur)
 * Body: { step: "CompanyDetails"|"Representative"|..., data: { ...formFields } }
 */
async function saveDraft(req, res) {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: 'No company_id' });

    const { step, data } = req.body;
    if (!step || !data) return res.status(400).json({ success: false, error: 'step and data required' });

    connection = await connect();
    
    // Get current draft
    const [rows] = await connection.query(
      'SELECT onboarding_draft FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL',
      [companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No Stripe account found' });
    }

    let draft = {};
    try {
      draft = rows[0].onboarding_draft ? (typeof rows[0].onboarding_draft === 'string' ? JSON.parse(rows[0].onboarding_draft) : rows[0].onboarding_draft) : {};
    } catch { draft = {}; }

    // Merge step data
    draft[step] = { ...draft[step], ...data, _updated: new Date().toISOString() };

    await connection.query(
      'UPDATE stripe_connected_accounts SET onboarding_draft = ? WHERE company_id = ? AND disconnected_at IS NULL',
      [JSON.stringify(draft), companyId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[saveDraft] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await close(connection);
  }
}

/**
 * GET /v1/stripe/onboarding/get-draft?step=CompanyDetails
 * Load saved draft data for a specific step (or all steps if no step param)
 */
async function getDraft(req, res) {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: 'No company_id' });

    connection = await connect();
    
    const [rows] = await connection.query(
      'SELECT onboarding_draft FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL',
      [companyId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, draft: {} });
    }

    let draft = {};
    try {
      draft = rows[0].onboarding_draft ? (typeof rows[0].onboarding_draft === 'string' ? JSON.parse(rows[0].onboarding_draft) : rows[0].onboarding_draft) : {};
    } catch { draft = {}; }

    const step = req.query.step;
    if (step) {
      return res.json({ success: true, draft: draft[step] || {} });
    }
    return res.json({ success: true, draft });
  } catch (err) {
    console.error('[getDraft] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await close(connection);
  }
}

'''

    # Insert before module.exports
    content = content.replace('module.exports = {', draft_code + 'module.exports = {')
    
    # Add to exports
    content = content.replace(
        "  upload\n};",
        "  upload,\n  saveDraft,\n  getDraft\n};"
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    print("  ✅ saveDraft and getDraft added")

# ── Step 3: Register routes in index.js ──
print("Step 3: Registering routes in index.js...")

indexpath = '/srv/www/htdocs/swiftapp/server/index.js'
with open(indexpath, 'r') as f:
    idx = f.read()

if 'save-draft' in idx:
    print("  ⚠️ Routes already registered, skipping")
else:
    # Find where onboarding routes are registered
    # Look for the onboarding start route
    import re
    # Find the pattern where onboarding/start is defined
    match = re.search(r"(app\.post\(['\"].*onboarding/start['\"].*?\n)", idx)
    if match:
        insert_pos = match.end()
        route_code = """
  // Draft auto-save routes
  app.post('/swift-app/v1/stripe/onboarding/save-draft', authenticateToken, stripeOnboarding.saveDraft);
  app.get('/swift-app/v1/stripe/onboarding/get-draft', authenticateToken, stripeOnboarding.getDraft);
"""
        idx = idx[:insert_pos] + route_code + idx[insert_pos:]
        with open(indexpath, 'w') as f:
            f.write(idx)
        print("  ✅ Routes registered in index.js")
    else:
        # Try alternative approach - find where onboarding routes are
        if 'stripeOnboarding.startOnboarding' in idx:
            match2 = re.search(r"(.*stripeOnboarding\.startOnboarding.*\n)", idx)
            if match2:
                insert_pos = match2.end()
                route_code = """  // Draft auto-save routes
  app.post('/swift-app/v1/stripe/onboarding/save-draft', authenticateToken, stripeOnboarding.saveDraft);
  app.get('/swift-app/v1/stripe/onboarding/get-draft', authenticateToken, stripeOnboarding.getDraft);
"""
                idx = idx[:insert_pos] + route_code + idx[insert_pos:]
                with open(indexpath, 'w') as f:
                    f.write(idx)
                print("  ✅ Routes registered in index.js (alt)")
            else:
                print("  ❌ Could not find insertion point")
        else:
            print("  ❌ Could not find stripeOnboarding routes in index.js")

# ── Step 4: Verify syntax ──
print("Step 4: Verifying syntax...")
result = subprocess.run(
    ['node', '-c', filepath],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
if result.returncode == 0:
    print("  \u2705 onboarding.js syntax OK")
else:
    print("  \u274c Syntax error: " + result.stderr.decode().strip())

result = subprocess.run(
    ['node', '-c', indexpath],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
if result.returncode == 0:
    print("  \u2705 index.js syntax OK")
else:
    print("  \u274c index.js syntax error: " + result.stderr.decode().strip())

print("\nDone! Restart PM2 to apply changes.")

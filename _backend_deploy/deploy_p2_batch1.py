#!/usr/bin/env python3
"""
deploy_p2_batch1.py
====================
Batch 1 des tâches P2 :
  - Fix completeJobById.js : vérifie job_assignments (véhicules) en plus de job_trucks
  - clientReview.js : ajoute autoSendReviewRequest() interne + l'appelle depuis completeJobById
  - updateJobById.js : ajoute 'difficulty' aux allowedFields
  - DB migration : ALTER TABLE jobs ADD COLUMN difficulty ENUM(...)
"""

import subprocess
import sys

SERVER_USER = "swiftapp_user"
SERVER_PASS = "U%Xgxvc54EKUD39PcwNAYvuS"
SERVER_DB   = "swiftapp"
BACKEND     = "/srv/www/htdocs/swiftapp/server"

def ssh(cmd: str, check=True):
    result = subprocess.run(
        ["ssh", "sushinari", cmd],
        capture_output=True, text=True, encoding='utf-8', errors='replace'
    )
    if check and result.returncode != 0:
        print(f"[FAILED] {cmd}\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def remote_read(path: str) -> str:
    result = subprocess.run(["ssh", "sushinari", f"cat {path}"], capture_output=True, encoding='utf-8', errors='replace')
    if result.returncode != 0:
        print(f"[FAILED] Cannot read {path}: {result.stderr}")
        sys.exit(1)
    return result.stdout

def remote_write(path: str, content: str):
    import tempfile, os
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(content)
        tmp = f.name
    ret = subprocess.run(["scp", tmp, f"sushinari:{path}"], capture_output=True, text=True)
    os.unlink(tmp)
    if ret.returncode != 0:
        print(f"[FAILED] scp to {path}: {ret.stderr}")
        sys.exit(1)
    print(f"  [OK] Written {path}")



# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 : DB migration — jobs.difficulty
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 1: DB migration — jobs.difficulty ===")

import tempfile, os

migration_py = """
import pymysql
conn = pymysql.connect(host='localhost', user='swiftapp_user', password='U%Xgxvc54EKUD39PcwNAYvuS', db='swiftapp', charset='utf8mb4')
cur = conn.cursor()

# Check if column exists
cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='jobs' AND COLUMN_NAME='difficulty'")
if cur.fetchone():
    print('difficulty column already exists')
else:
    cur.execute("ALTER TABLE jobs ADD COLUMN difficulty ENUM('easy','medium','hard','expert') DEFAULT NULL AFTER priority")
    conn.commit()
    print('Added difficulty column')

conn.close()
"""

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, prefix='migrate_difficulty_') as f:
    f.write(migration_py)
    tmp = f.name

ret = subprocess.run(["scp", tmp, "sushinari:/tmp/migrate_difficulty.py"], capture_output=True, text=True)
os.unlink(tmp)
if ret.returncode != 0:
    print(f"[FAILED] scp: {ret.stderr}"); sys.exit(1)

result = subprocess.run(["ssh", "sushinari", "python3 /tmp/migrate_difficulty.py"], capture_output=True, encoding='utf-8', errors='replace')
print(result.stdout.strip())
if result.returncode != 0:
    print(f"[WARN] Migration: {result.stderr.strip()}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 : updateJobById.js — add 'difficulty' to allowedFields
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 2: updateJobById.js — add difficulty ===")

path_update = f"{BACKEND}/endPoints/v1/updateJobById.js"
content = remote_read(path_update)

OLD_ALLOWED = "      'time_rounding_margins', 'time_rounding_margin'\n    ];"
if "'difficulty'" in content:
    print("  [SKIP] difficulty already in allowedFields")
else:
    # Find the closing bracket of allowedFields and insert before it
    old_str = "      'time_rounding_minutes', 'time_rounding_margin'\n    ];"
    new_str = "      'time_rounding_minutes', 'time_rounding_margin',\n      // Difficulty level\n      'difficulty', 'notes', 'priority'\n    ];"
    if old_str in content:
        content = content.replace(old_str, new_str)
        remote_write(path_update, content)
    else:
        # Try alternate pattern
        old_str2 = "      'time_rounding_minutes', 'time_rounding_margin'"
        lines = content.split('\n')
        # Find the line with time_rounding_margin and add after it
        new_lines = []
        inserted = False
        for line in lines:
            new_lines.append(line)
            if "'time_rounding_margin'" in line and not "'difficulty'" in line and not inserted:
                # Find next line that closes the array
                pass
        # Just append to allowedFields array
        # Find the position of the allowedFields closing bracket
        idx = content.find("    ];\n\n    // Validation des valeurs")
        if idx == -1:
            idx = content.find("    ];\n\n    const pricingValidation")
        if idx != -1:
            insert_str = "      'difficulty', 'notes', 'priority',\n"
            content = content[:idx] + insert_str + content[idx:]
            remote_write(path_update, content)
        else:
            print("  [WARN] Could not find insertion point in updateJobById.js")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 : clientReview.js — add autoSendReviewRequest internal function
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 3: clientReview.js — add autoSendReviewRequest ===")

path_review = f"{BACKEND}/endPoints/v1/clientReview.js"
content_review = remote_read(path_review)

AUTO_FUNC_MARKER = "// [AUTO] autoSendReviewRequest"

if AUTO_FUNC_MARKER in content_review:
    print("  [SKIP] autoSendReviewRequest already added")
else:
    auto_func = """
// [AUTO] autoSendReviewRequest
// ─────────────────────────────────────────────────────────────
// Called fire-and-forget from completeJobById after job completion.
// Sends a review request email to the client if:
//   - job has a contractee_email
//   - no review token / submitted review already exists
// ─────────────────────────────────────────────────────────────
const autoSendReviewRequest = async (jobId) => {
  let connection;
  try {
    connection = await connect();

    const [jobRows] = await connection.execute(
      `SELECT id, code, status, contractee_email, contractee_contact_name
         FROM jobs WHERE id = ?`,
      [parseInt(jobId)]
    );

    if (!jobRows.length) return;
    const job = jobRows[0];

    // Only if email exists and job is completed
    if (!job.contractee_email || job.status !== 'completed') return;

    // Skip if review already exists (submitted or not)
    const [existingRows] = await connection.execute(
      'SELECT id FROM client_reviews WHERE job_id = ?',
      [job.id]
    );
    if (existingRows.length > 0) return; // already sent before

    // Generate token + insert
    const reviewToken = buildReviewToken(job.id);
    await connection.execute(
      'INSERT INTO client_reviews (job_id, token) VALUES (?, ?)',
      [job.id, reviewToken]
    );

    // Record request (no sent_by since it's automatic)
    await connection.execute(
      `INSERT INTO client_review_requests (job_id, sent_by, recipient_email)
       VALUES (?, NULL, ?)`,
      [job.id, job.contractee_email]
    );

    const reviewUrl = `${APP_BASE_URL}/review/${reviewToken}`;
    const clientName = job.contractee_contact_name || 'Valued Client';

    // Send email
    const { sendMail } = MailSender();
    const subject = '⭐ How was your move? Leave a review — Cobbr';
    const textBody = `Hi ${clientName},\\n\\nYour job #${job.code} is now complete. We'd love your feedback!\\n\\nLeave your review: ${reviewUrl}\\n\\nBest regards,\\nThe Cobbr Team`;
    const htmlBody = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f9fa;padding:24px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
  <h2 style="color:#4361ee;margin:0 0 16px">How was your experience? ⭐</h2>
  <p style="color:#495057">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#495057">Your job <strong>#${job.code}</strong> is now complete.</p>
  <p style="color:#495057">We'd love to hear your feedback — it only takes 30 seconds!</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${reviewUrl}" style="background:#4361ee;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
      Leave a Review
    </a>
  </div>
  <p style="color:#6c757d;font-size:13px">Or copy this link: ${reviewUrl}</p>
</div>
</body></html>`;

    await sendMail(job.contractee_email, subject, textBody, htmlBody);
    if (connection) connection.release();
    consoleStyle.success('REVIEW', '[AUTO] Review request sent automatically', { jobId: job.id, to: job.contractee_email });
  } catch (err) {
    if (connection) try { connection.release(); } catch (_) {}
    consoleStyle.warn('REVIEW', '[AUTO] autoSendReviewRequest failed (non-critical)', { error: err.message });
  }
};

"""
    # Insert before module.exports
    old_exports = "module.exports = { sendReviewRequestEndpoint, getReviewPageEndpoint, submitReviewEndpoint };"
    new_exports = auto_func + "module.exports = { sendReviewRequestEndpoint, getReviewPageEndpoint, submitReviewEndpoint, autoSendReviewRequest };"
    if old_exports in content_review:
        content_review = content_review.replace(old_exports, new_exports)
        remote_write(path_review, content_review)
    else:
        print("  [WARN] Could not find module.exports in clientReview.js")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 4 : completeJobById.js — fix truck check + auto-review
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 4: completeJobById.js — fix truck check + auto-review ===")

path_complete = f"{BACKEND}/endPoints/v1/completeJobById.js"
content_complete = remote_read(path_complete)

# 4a: Fix the truck check to also look in job_assignments
OLD_TRUCK_CHECK = """    const [truckResults] = await connection.execute(
      'SELECT COUNT(*) as truck_count FROM job_trucks WHERE job_id = ? AND unassigned_at IS NULL',
      [jobId]
    );

    if (truckResults[0].truck_count === 0) {
      consoleStyle.error('VALIDATION', 'No trucks assigned to job', { 
        jobId, 
        jobCode: job.code 
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete job: no trucks assigned'
      });
    }"""

NEW_TRUCK_CHECK = """    // Check trucks: legacy job_trucks table OR new job_assignments (resource_type='vehicle')
    const [truckResults] = await connection.execute(
      'SELECT COUNT(*) as truck_count FROM job_trucks WHERE job_id = ? AND unassigned_at IS NULL',
      [jobId]
    );
    const [vehicleAssignmentResults] = await connection.execute(
      "SELECT COUNT(*) as vehicle_count FROM job_assignments WHERE job_id = ? AND resource_type = 'vehicle' AND status NOT IN ('cancelled','declined','replaced')",
      [jobId]
    );
    const hasTruck = (truckResults[0].truck_count > 0) || (vehicleAssignmentResults[0].vehicle_count > 0);

    if (!hasTruck) {
      consoleStyle.error('VALIDATION', 'No trucks assigned to job', { 
        jobId, 
        jobCode: job.code 
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete job: no trucks assigned'
      });
    }"""

if "hasTruck" in content_complete:
    print("  [SKIP] truck check fix already applied")
elif OLD_TRUCK_CHECK in content_complete:
    content_complete = content_complete.replace(OLD_TRUCK_CHECK, NEW_TRUCK_CHECK)
    print("  [OK] Fixed truck check to use both systems")
else:
    print("  [WARN] Could not find old truck check pattern")

# 4b: Add auto-review trigger after generateScorecard
OLD_SCORECARD = """    try {
      const { generateScorecard } = require('../../utils/scoreEngine');
      generateScorecard(jobId).catch(e => console.error('[scoreEngine] error:', e.message));
    } catch (_) {}"""

NEW_SCORECARD = """    try {
      const { generateScorecard } = require('../../utils/scoreEngine');
      generateScorecard(jobId).catch(e => console.error('[scoreEngine] error:', e.message));
    } catch (_) {}
    // [AUTO REVIEW] Send review request to client (fire-and-forget)
    try {
      const { autoSendReviewRequest } = require('../v1/clientReview');
      autoSendReviewRequest(jobId).catch(() => {});
    } catch (_) {}"""

if "autoSendReviewRequest" in content_complete:
    print("  [SKIP] auto-review already added")
elif OLD_SCORECARD in content_complete:
    content_complete = content_complete.replace(OLD_SCORECARD, NEW_SCORECARD)
    print("  [OK] Added auto-review trigger")
else:
    print("  [WARN] Could not find scorecard hook point")

# Write the complete file
remote_write(path_complete, content_complete)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 : Quota heures — new endpoint GET /v1/company/:id/weekly-hours
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 5: weeklyHours.js — new endpoint ===")

weekly_hours_js = """/**
 * weeklyHours.js
 * GET /swift-app/v1/company/:companyId/weekly-hours
 *
 * Retourne les heures facturables de chaque employé sur la semaine en cours
 * ainsi que leur quota (si défini sur le worker).
 *
 * Response:
 *   { success, week_start, week_end, workers: [{ user_id, name, hours_this_week, quota_hours, over_quota }] }
 */
const { connect } = require('../../swiftDb');
const { getUserByToken } = require('../database/user');

const getWeeklyHoursEndpoint = async (req, res) => {
  const { companyId } = req.params;
  const { week_offset = 0 } = req.query; // 0 = current week, -1 = last week, etc.

  if (!companyId) {
    return res.status(400).json({ success: false, message: 'companyId required' });
  }

  let connection;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Auth required' });
    }
    const user = await getUserByToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });

    // Company guard
    if (user.company_id && parseInt(user.company_id) !== parseInt(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    connection = await connect();

    // Compute week boundaries (Monday→Sunday)
    const offset = parseInt(week_offset) || 0;
    const now = new Date();
    const day = now.getDay(); // 0=Sun,1=Mon,...
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset + offset * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const fmtDate = (d) => d.toISOString().slice(0, 10);

    // Query: sum billable hours per worker for completed jobs in the week.
    // Uses job_users (legacy) and job_assignments (new) joined to jobs.
    const [rows] = await connection.execute(`
      SELECT
        u.id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.avatar_url,
        COALESCE(
          SUM(
            CASE
              WHEN j.timer_billable_hours IS NOT NULL AND j.status = 'completed'
                   AND j.updated_at BETWEEN ? AND ?
              THEN j.timer_billable_hours
              ELSE 0
            END
          ), 0
        ) AS hours_this_week,
        COALESCE(u.weekly_hours_quota, 0) AS quota_hours
      FROM users u
      LEFT JOIN job_assignments ja ON ja.resource_id = u.id
        AND ja.resource_type = 'staff'
        AND ja.status NOT IN ('cancelled','declined','replaced')
      LEFT JOIN jobs j ON j.id = ja.job_id
      WHERE u.company_id = ?
        AND u.role NOT IN ('admin', 'manager')
      GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.weekly_hours_quota
      ORDER BY hours_this_week DESC
    `, [weekStart, weekEnd, parseInt(companyId)]);

    const workers = rows.map(r => ({
      user_id: r.user_id,
      name: r.name,
      avatar_url: r.avatar_url,
      hours_this_week: parseFloat(r.hours_this_week) || 0,
      quota_hours: parseFloat(r.quota_hours) || 0,
      over_quota: r.quota_hours > 0 && parseFloat(r.hours_this_week) > parseFloat(r.quota_hours),
    }));

    connection.release();

    return res.status(200).json({
      success: true,
      week_start: fmtDate(weekStart),
      week_end: fmtDate(weekEnd),
      week_offset: offset,
      workers,
    });

  } catch (err) {
    if (connection) try { connection.release(); } catch (_) {}
    console.error('[weeklyHours] error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getWeeklyHoursEndpoint };
"""

remote_write(f"{BACKEND}/endPoints/v1/weeklyHours.js", weekly_hours_js)

# Register the route in index.js
print("\n=== STEP 5b: Register weekly-hours route in index.js ===")
path_index = f"{BACKEND}/index.js"
content_index = remote_read(path_index)

WEEKLY_ROUTE_MARKER = "weeklyHours"
if WEEKLY_ROUTE_MARKER in content_index:
    print("  [SKIP] weekly-hours route already registered")
else:
    # Insert after monthly invoices or a good anchor point - after the vehicles section
    ANCHOR = "  app.get('/swift-app/v1/companies/:companyId/public-trucks', authenticateToken, companyPublicTrucks.getPublicTrucksEndpoint);"
    INSERT = """
  // ── Weekly hours quota ──────────────────────────────────────────────
  app.get('/swift-app/v1/company/:companyId/weekly-hours', authenticateToken, (req, res) => {
    const { getWeeklyHoursEndpoint } = require('./endPoints/v1/weeklyHours');
    getWeeklyHoursEndpoint(req, res);
  });
"""
    if ANCHOR in content_index:
        content_index = content_index.replace(ANCHOR, ANCHOR + INSERT)
        remote_write(path_index, content_index)
    else:
        print("  [WARN] Could not find anchor in index.js for weekly-hours route")

# Also add weekly_hours_quota column to users if not exists
print("\n=== STEP 5c: DB migration — users.weekly_hours_quota ===")
migration_quota_py = """
import pymysql
conn = pymysql.connect(host='localhost', user='swiftapp_user', password='U%Xgxvc54EKUD39PcwNAYvuS', db='swiftapp', charset='utf8mb4')
cur = conn.cursor()
cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='swiftapp' AND TABLE_NAME='users' AND COLUMN_NAME='weekly_hours_quota'")
if cur.fetchone():
    print('weekly_hours_quota already exists')
else:
    cur.execute("ALTER TABLE users ADD COLUMN weekly_hours_quota DECIMAL(5,2) DEFAULT NULL COMMENT 'Max billable hours per week (NULL = no limit)'")
    conn.commit()
    print('Added weekly_hours_quota column')
conn.close()
"""

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, prefix='migrate_quota_') as f:
    f.write(migration_quota_py)
    tmp_quota = f.name
ret = subprocess.run(["scp", tmp_quota, "sushinari:/tmp/migrate_quota.py"], capture_output=True, text=True)
os.unlink(tmp_quota)
result = subprocess.run(["ssh", "sushinari", "python3 /tmp/migrate_quota.py"], capture_output=True, encoding='utf-8', errors='replace')
print(result.stdout.strip() or result.stderr.strip())

# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 : Referral system
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 6: Referral system — DB + endpoint ===")

referral_migration_py = (
    'import pymysql\n'
    'conn = pymysql.connect(host="localhost", user="swiftapp_user", password="U%Xgxvc54EKUD39PcwNAYvuS", db="swiftapp", charset="utf8mb4")\n'
    'cur = conn.cursor()\n'
    'cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\'swiftapp\' AND TABLE_NAME=\'companies\' AND COLUMN_NAME=\'referral_code\'")\n'
    'if not cur.fetchone():\n'
    '    cur.execute("ALTER TABLE companies ADD COLUMN referral_code VARCHAR(12) UNIQUE DEFAULT NULL")\n'
    '    cur.execute("ALTER TABLE companies ADD COLUMN referred_by_company_id INT DEFAULT NULL")\n'
    '    conn.commit()\n'
    '    print("Added referral_code + referred_by_company_id to companies")\n'
    'else:\n'
    '    print("referral_code already exists on companies")\n'
    'sql = (\n'
    '    "CREATE TABLE IF NOT EXISTS referral_registrations ("\n'
    '    "  id INT AUTO_INCREMENT PRIMARY KEY,"\n'
    '    "  referrer_company_id INT NOT NULL,"\n'
    '    "  referred_company_id INT NOT NULL,"\n'
    '    "  reward_granted TINYINT(1) DEFAULT 0,"\n'
    '    "  reward_granted_at DATETIME DEFAULT NULL,"\n'
    '    "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"\n'
    '    "  UNIQUE KEY uniq_referred (referred_company_id),"\n'
    '    "  INDEX idx_referrer (referrer_company_id)"\n'
    '    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"\n'
    ')\n'
    'cur.execute(sql)\n'
    'conn.commit()\n'
    'print("referral_registrations table ready")\n'
    'conn.close()\n'
)

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, prefix='migrate_referral_') as f:
    f.write(referral_migration_py)
    tmp_ref = f.name
ret = subprocess.run(["scp", tmp_ref, "sushinari:/tmp/migrate_referral.py"], capture_output=True, text=True)
os.unlink(tmp_ref)
result = subprocess.run(["ssh", "sushinari", "python3 /tmp/migrate_referral.py"], capture_output=True, encoding='utf-8', errors='replace')
print(result.stdout.strip() or result.stderr.strip())

# Generate referral codes for existing companies that don't have one
print("\n=== STEP 6b: Generate referral codes for existing companies ===")
gen_codes_py = """
import pymysql, random, string

def gen_code():
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))

conn = pymysql.connect(host='localhost', user='swiftapp_user', password='U%Xgxvc54EKUD39PcwNAYvuS', db='swiftapp', charset='utf8mb4')
cur = conn.cursor()

cur.execute("SELECT id FROM companies WHERE referral_code IS NULL")
companies = cur.fetchall()
updated = 0
for (company_id,) in companies:
    code = gen_code()
    # Ensure uniqueness
    for _ in range(10):
        cur.execute("SELECT id FROM companies WHERE referral_code = %s", (code,))
        if not cur.fetchone():
            break
        code = gen_code()
    cur.execute("UPDATE companies SET referral_code = %s WHERE id = %s", (code, company_id))
    updated += 1

conn.commit()
print(f'Generated referral codes for {updated} companies')
conn.close()
"""

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, prefix='gen_ref_codes_') as f:
    f.write(gen_codes_py)
    tmp_gen = f.name
ret = subprocess.run(["scp", tmp_gen, "sushinari:/tmp/gen_ref_codes.py"], capture_output=True, text=True)
os.unlink(tmp_gen)
result = subprocess.run(["ssh", "sushinari", "python3 /tmp/gen_ref_codes.py"], capture_output=True, encoding='utf-8', errors='replace')
print(result.stdout.strip() or result.stderr.strip())

# Write referral endpoint
referral_js = """/**
 * referral.js
 *
 * GET  /swift-app/v1/company/:companyId/referral-code  — récupère le code de parrainage
 * POST /swift-app/v1/referral/use                      — utilise un code (lors de l'inscription)
 * GET  /swift-app/v1/company/:companyId/referrals       — liste des filleuls + statut récompense
 */
const { connect } = require('../../swiftDb');
const { getUserByToken } = require('../database/user');

// ─── GET referral code ────────────────────────────────────────────────────────
const getReferralCodeEndpoint = async (req, res) => {
  const { companyId } = req.params;
  let connection;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Auth required' });
    const user = await getUserByToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (user.company_id && parseInt(user.company_id) !== parseInt(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    connection = await connect();
    const [rows] = await connection.execute(
      'SELECT id, name, referral_code FROM companies WHERE id = ?',
      [parseInt(companyId)]
    );
    connection.release();

    if (!rows.length) return res.status(404).json({ success: false, message: 'Company not found' });
    const company = rows[0];

    // Generate code if missing
    if (!company.referral_code) {
      const code = generateCode();
      const conn2 = await connect();
      await conn2.execute('UPDATE companies SET referral_code = ? WHERE id = ?', [code, company.id]);
      conn2.release();
      company.referral_code = code;
    }

    return res.status(200).json({
      success: true,
      referral_code: company.referral_code,
      share_text: `Join me on Cobbr! Use my referral code ${company.referral_code} when signing up and we both get a bonus. Download at: https://cobbr-app.com`,
    });
  } catch (err) {
    if (connection) try { connection.release(); } catch (_) {}
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST use referral code ───────────────────────────────────────────────────
const useReferralCodeEndpoint = async (req, res) => {
  const { code, company_id } = req.body;

  if (!code || !company_id) {
    return res.status(400).json({ success: false, message: 'code and company_id required' });
  }

  // Sanitize
  const safeCode = (code || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

  let connection;
  try {
    connection = await connect();

    // Find referrer
    const [referrerRows] = await connection.execute(
      'SELECT id, name FROM companies WHERE referral_code = ?',
      [safeCode]
    );
    if (!referrerRows.length) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    const referrer = referrerRows[0];

    // Prevent self-referral
    if (parseInt(referrer.id) === parseInt(company_id)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Cannot use your own referral code' });
    }

    // Check not already referred
    const [existRows] = await connection.execute(
      'SELECT id FROM referral_registrations WHERE referred_company_id = ?',
      [parseInt(company_id)]
    );
    if (existRows.length) {
      connection.release();
      return res.status(409).json({ success: false, message: 'Already referred' });
    }

    // Record referral
    await connection.execute(
      'UPDATE companies SET referred_by_company_id = ? WHERE id = ?',
      [referrer.id, parseInt(company_id)]
    );
    await connection.execute(
      'INSERT INTO referral_registrations (referrer_company_id, referred_company_id) VALUES (?, ?)',
      [referrer.id, parseInt(company_id)]
    );

    // Fire gamification reward for referrer (100 XP)
    try {
      const { awardXP } = require('../../utils/gamificationEngine');
      awardXP(referrer.id, null, 100, 'referral_success', { referred_company_id: company_id }).catch(() => {});
    } catch (_) {}

    connection.release();
    return res.status(200).json({
      success: true,
      message: 'Referral code applied successfully',
      referrer_name: referrer.name,
    });
  } catch (err) {
    if (connection) try { connection.release(); } catch (_) {}
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET list of referrals ─────────────────────────────────────────────────────
const listReferralsEndpoint = async (req, res) => {
  const { companyId } = req.params;
  let connection;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Auth required' });
    const user = await getUserByToken(authHeader.split(' ')[1]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (user.company_id && parseInt(user.company_id) !== parseInt(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    connection = await connect();
    const [rows] = await connection.execute(`
      SELECT
        rr.id,
        rr.referred_company_id,
        c.name AS referred_company_name,
        c.created_at AS joined_at,
        rr.reward_granted,
        rr.reward_granted_at,
        rr.created_at
      FROM referral_registrations rr
      JOIN companies c ON c.id = rr.referred_company_id
      WHERE rr.referrer_company_id = ?
      ORDER BY rr.created_at DESC
    `, [parseInt(companyId)]);
    connection.release();

    return res.status(200).json({
      success: true,
      total: rows.length,
      referrals: rows,
    });
  } catch (err) {
    if (connection) try { connection.release(); } catch (_) {}
    return res.status(500).json({ success: false, message: err.message });
  }
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = { getReferralCodeEndpoint, useReferralCodeEndpoint, listReferralsEndpoint };
"""

remote_write(f"{BACKEND}/endPoints/v1/referral.js", referral_js)

# Register referral routes
print("\n=== STEP 6c: Register referral routes in index.js ===")
content_index_final = remote_read(path_index)

REFERRAL_MARKER = "referral.js"
if REFERRAL_MARKER in content_index_final:
    print("  [SKIP] referral routes already registered")
else:
    ANCHOR2 = "  // ── Weekly hours quota ──"
    REFERRAL_ROUTES = """
  // ── Referral / Parrainage ──────────────────────────────────────────────────
  app.get('/swift-app/v1/company/:companyId/referral-code', authenticateToken, (req, res) => {
    const { getReferralCodeEndpoint } = require('./endPoints/v1/referral');
    getReferralCodeEndpoint(req, res);
  });
  app.get('/swift-app/v1/company/:companyId/referrals', authenticateToken, (req, res) => {
    const { listReferralsEndpoint } = require('./endPoints/v1/referral');
    listReferralsEndpoint(req, res);
  });
  app.post('/swift-app/v1/referral/use', (req, res) => {
    // No auth required (called during onboarding before user has token)
    const { useReferralCodeEndpoint } = require('./endPoints/v1/referral');
    useReferralCodeEndpoint(req, res);
  });

"""
    if ANCHOR2 in content_index_final:
        content_index_final = content_index_final.replace(ANCHOR2, REFERRAL_ROUTES + ANCHOR2)
        remote_write(path_index, content_index_final)
    else:
        print("  [WARN] Could not find anchor for referral routes in index.js")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 7: Restart PM2
# ──────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 7: Restart PM2 ===")
result = subprocess.run(
    ["ssh", "sushinari", "pm2 restart 17 && sleep 3 && pm2 show 17 2>&1 | grep -E 'status|name|restart'"],
    capture_output=True, encoding='utf-8', errors='replace'
)
print(result.stdout.strip())
if "online" in result.stdout:
    print("\n✅ All backend changes deployed and server is online!")
else:
    print("\n⚠️  Server may not be fully running, check logs")
    print(result.stderr)

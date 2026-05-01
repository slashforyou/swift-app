/**
 * clientReview.js — Demande de review client + page publique
 *
 * POST /swift-app/v1/jobs/:id/review-request  — envoie l'email au client
 * GET  /swift-app/v1/review/:token            — page HTML publique (formulaire)
 * POST /swift-app/v1/review/:token            — soumettre l'avis (no auth)
 */

const crypto = require('crypto');
const { connect } = require('../../swiftDb');
const { getUserByToken } = require('../database/user');
const consoleStyle = require('../../utils/consoleStyle');
const MailSender = require('../../utils/mailSender');

const HMAC_SECRET = process.env.REVIEW_HMAC_SECRET || 'swift_review_secret_2026';
const APP_BASE_URL = process.env.APP_PUBLIC_URL || 'https://cobbr-app.com';

/**
 * Génère un token signé HMAC pour un job donné
 */
const buildReviewToken = (jobId) => {
  const payload = `review_${jobId}_${Date.now()}`;
  const sig = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex').slice(0, 32);
  return `${Buffer.from(payload).toString('base64url').slice(0, 24)}_${sig}`;
};

/**
 * Vérifie que le token appartient à ce job (lookup DB uniquement, pas de re-signature)
 */
const verifyReviewToken = async (token, connection) => {
  const [rows] = await connection.execute(
    'SELECT job_id FROM client_reviews WHERE token = ?',
    [token]
  );
  return rows.length ? rows[0].job_id : null;
};

// ─────────────────────────────────────────────────────────────
// POST /swift-app/v1/jobs/:id/review-request
// ─────────────────────────────────────────────────────────────
const sendReviewRequestEndpoint = async (req, res) => {
  const { id: jobIdOrCode } = req.params;

  if (!jobIdOrCode) {
    return res.status(400).json({ success: false, message: 'Job ID required' });
  }

  let connection;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authorization token' });
    }

    connection = await connect();

    let jobQuery, jobParams;
    if (/^\d+$/.test(jobIdOrCode)) {
      jobQuery  = `SELECT id, code, status, contractee_email, contractee_contact_name,
                          contractor_company_id, contractee_company_id
                     FROM jobs WHERE id = ?`;
      jobParams = [parseInt(jobIdOrCode)];
    } else {
      jobQuery  = `SELECT id, code, status, contractee_email, contractee_contact_name,
                          contractor_company_id, contractee_company_id
                     FROM jobs WHERE code = ?`;
      jobParams = [jobIdOrCode];
    }

    const [jobRows] = await connection.execute(jobQuery, jobParams);
    if (!jobRows.length) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const job   = jobRows[0];
    const jobId = job.id;

    // Guard cross-company
    if (user.company_id) {
      const allowed = user.company_id === job.contractee_company_id ||
                      user.company_id === job.contractor_company_id;
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Job must be completed before requesting a review' });
    }

    if (!job.contractee_email) {
      return res.status(400).json({ success: false, message: 'No client email on this job' });
    }

    // Vérifier si un review existe déjà et est déjà soumis
    const [existingRows] = await connection.execute(
      'SELECT submitted_at FROM client_reviews WHERE job_id = ?',
      [jobId]
    );
    if (existingRows.length && existingRows[0].submitted_at) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this job' });
    }

    // Générer ou réutiliser le token
    let reviewToken;
    if (existingRows.length) {
      const [tokenRow] = await connection.execute(
        'SELECT token FROM client_reviews WHERE job_id = ?',
        [jobId]
      );
      reviewToken = tokenRow[0].token;
    } else {
      reviewToken = buildReviewToken(jobId);
      await connection.execute(
        'INSERT INTO client_reviews (job_id, token) VALUES (?, ?)',
        [jobId, reviewToken]
      );
    }

    // Enregistrer la demande
    await connection.execute(
      `INSERT INTO client_review_requests (job_id, sent_by, recipient_email)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE sent_at = NOW(), sent_by = VALUES(sent_by)`,
      [jobId, user.id, job.contractee_email]
    );

    const reviewUrl = `${APP_BASE_URL}/review/${reviewToken}`;
    const clientName = job.contractee_contact_name || 'Valued Client';

    // Envoyer l'email
    const { sendMail } = MailSender();
    const subject = '⭐ Share your experience — Cobbr';
    const textBody = `Hi ${clientName},\n\nThank you for choosing Cobbr!\nWe'd love to hear your feedback about your recent job #${job.code}.\n\nLeave your review here:\n${reviewUrl}\n\nBest regards,\nThe Cobbr Team`;
    const htmlBody = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f9fa;padding:24px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
  <h2 style="color:#4361ee;margin:0 0 16px">How was your experience? ⭐</h2>
  <p style="color:#495057">Hi <strong>${clientName}</strong>,</p>
  <p style="color:#495057">Thank you for using Cobbr! Your job <strong>#${job.code}</strong> is now complete.</p>
  <p style="color:#495057">We'd love to hear your feedback — it only takes 30 seconds.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${reviewUrl}" style="background:#4361ee;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
      Leave a Review
    </a>
  </div>
  <p style="color:#6c757d;font-size:13px">Or copy this link: ${reviewUrl}</p>
</div>
</body></html>`;

    await sendMail(job.contractee_email, subject, textBody, htmlBody);

    connection.release();

    consoleStyle.success('REVIEW', 'Review request sent', { jobId, to: job.contractee_email });
    return res.status(200).json({
      success: true,
      message: 'Review request sent',
      review_url: reviewUrl,
    });

  } catch (err) {
    if (connection) connection.release();
    consoleStyle.error('ERROR', 'sendReviewRequest failed', { error: err.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /swift-app/v1/review/:token — page HTML publique
// ─────────────────────────────────────────────────────────────
const getReviewPageEndpoint = async (req, res) => {
  const { token } = req.params;

  if (!token || !/^[\w\-_]+$/.test(token)) {
    return res.status(400).send('<p>Invalid link.</p>');
  }

  let connection;
  try {
    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT r.job_id, r.submitted_at, j.code
         FROM client_reviews r
         JOIN jobs j ON r.job_id = j.id
        WHERE r.token = ?`,
      [token]
    );

    if (!rows.length) {
      connection.release();
      return res.status(404).send('<p>Review link not found or expired.</p>');
    }

    const row = rows[0];
    connection.release();

    if (row.submitted_at) {
      return res.status(200).send(`
<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:48px">
<h2>✅ Thank you!</h2>
<p>Your review for job <strong>#${row.code}</strong> has already been submitted.</p>
</body></html>`);
    }

    // Formulaire de review
    const submitUrl = `/swift-app/v1/review/${token}`;
    return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Leave a Review — Cobbr</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;margin:0;padding:16px}
    .card{max-width:480px;margin:24px auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 20px rgba(0,0,0,.08)}
    h2{color:#4361ee;margin:0 0 8px}p{color:#495057}
    .stars{font-size:32px;cursor:pointer;letter-spacing:4px}
    .star{transition:transform .1s}.star:hover{transform:scale(1.2)}
    label{display:block;font-weight:600;color:#1a1a2e;margin:20px 0 6px}
    textarea{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:10px;font-size:14px;min-height:80px;box-sizing:border-box}
    button{background:#4361ee;color:#fff;border:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%;margin-top:16px}
    button:hover{background:#3a56d4}
    .rating-group{margin-bottom:4px}
    #success{display:none;text-align:center;padding:32px}
  </style>
</head>
<body>
<div class="card">
  <div id="form-view">
    <h2>How was your experience? ⭐</h2>
    <p>Job <strong>#${row.code}</strong></p>
    <form id="review-form">
      <label>Overall rating</label>
      <div class="stars rating-group" data-field="overall">
        ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">☆</span>`).join('')}
      </div>
      <label>Service quality</label>
      <div class="stars rating-group" data-field="service">
        ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">☆</span>`).join('')}
      </div>
      <label>Team</label>
      <div class="stars rating-group" data-field="team">
        ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">☆</span>`).join('')}
      </div>
      <label>Comments (optional)</label>
      <textarea id="comment" placeholder="Tell us about your experience..."></textarea>
      <button type="submit">Submit Review</button>
    </form>
  </div>
  <div id="success">
    <h2>✅ Thank you!</h2>
    <p>Your review has been submitted successfully.</p>
  </div>
</div>
<script>
const ratings = {};
document.querySelectorAll('.rating-group').forEach(group => {
  const field = group.dataset.field;
  group.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      ratings[field] = val;
      group.querySelectorAll('.star').forEach((s, i) => {
        s.textContent = i < val ? '★' : '☆';
      });
    });
  });
});
document.getElementById('review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resp = await fetch('${submitUrl}', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      rating_overall: ratings.overall || null,
      rating_service: ratings.service || null,
      rating_team:    ratings.team    || null,
      comment: document.getElementById('comment').value.trim() || null,
    })
  });
  const data = await resp.json();
  if (data.success) {
    document.getElementById('form-view').style.display='none';
    document.getElementById('success').style.display='block';
  } else {
    alert(data.message || 'An error occurred, please try again.');
  }
});
</script>
</body></html>`);

  } catch (err) {
    if (connection) connection.release();
    return res.status(500).send('<p>Internal error. Please try again later.</p>');
  }
};

// ─────────────────────────────────────────────────────────────
// POST /swift-app/v1/review/:token — soumettre l'avis
// ─────────────────────────────────────────────────────────────
const submitReviewEndpoint = async (req, res) => {
  const { token } = req.params;

  if (!token || !/^[\w\-_]+$/.test(token)) {
    return res.status(400).json({ success: false, message: 'Invalid token' });
  }

  const { rating_overall, rating_service, rating_team, comment } = req.body || {};

  // Validation des notes
  const validateRating = (v) => v == null || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5);
  if (!validateRating(rating_overall) || !validateRating(rating_service) || !validateRating(rating_team)) {
    return res.status(400).json({ success: false, message: 'Ratings must be between 1 and 5' });
  }

  if (!rating_overall) {
    return res.status(400).json({ success: false, message: 'Overall rating is required' });
  }

  // Sanitize comment
  const safeComment = comment ? String(comment).slice(0, 1000) : null;

  let connection;
  try {
    connection = await connect();

    const jobId = await verifyReviewToken(token, connection);
    if (!jobId) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Review link not found' });
    }

    // Vérifier non encore soumis
    const [rows] = await connection.execute(
      'SELECT submitted_at FROM client_reviews WHERE token = ?',
      [token]
    );
    if (rows.length && rows[0].submitted_at) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Review already submitted' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const safeIp = ip ? String(ip).slice(0, 45) : null;

    await connection.execute(
      `UPDATE client_reviews
          SET rating_overall = ?, rating_service = ?, rating_team = ?,
              comment = ?, submitted_at = NOW(), ip_address = ?
        WHERE token = ?`,
      [Number(rating_overall), rating_service ? Number(rating_service) : null,
       rating_team ? Number(rating_team) : null, safeComment, safeIp, token]
    );

    // [Phase 3 JQS] Log job event — non-blocking
    try {
      await connection.execute(
        `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
         VALUES (?, NULL, NULL, 'review_submitted', JSON_OBJECT('stars', ?, 'has_comment', ?))`,
        [jobId, Number(rating_overall), safeComment ? 1 : 0]
      );
    } catch (evtErr) {
      console.error('[review_submitted] job_events insert failed:', evtErr.message);
    }

    connection.release();

    // Fire-and-forget gamification si note >= 4
    if (Number(rating_overall) >= 4) {
      try {
        const { processReviewSubmitted } = require('../../utils/gamificationEngine');
        processReviewSubmitted(jobId, Number(rating_overall)).catch(() => {});
      } catch (_) {}
    }

    return res.status(200).json({ success: true, message: 'Review submitted. Thank you!' });

  } catch (err) {
    if (connection) connection.release();
    consoleStyle.error('ERROR', 'submitReview failed', { error: err.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


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
    const textBody = `Hi ${clientName},\n\nYour job #${job.code} is now complete. We'd love your feedback!\n\nLeave your review: ${reviewUrl}\n\nBest regards,\nThe Cobbr Team`;
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

module.exports = { sendReviewRequestEndpoint, getReviewPageEndpoint, submitReviewEndpoint, autoSendReviewRequest };

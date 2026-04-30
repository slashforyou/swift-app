/**
 * jobReviews.js — Avis clients post-job (lien email tokenisé)
 *
 * Routes:
 *   POST /v1/jobs/:jobId/review-request   → génère token, insère en DB, envoie email au client
 *   POST /v1/reviews/submit               → PUBLIC — soumet l'avis multi-critères via token
 *   GET  /v1/reviews                      → liste les avis de la company + stats
 *   GET  /v1/jobs/:jobId/review           → retourne la review d'un job si elle existe
 *
 * Table: job_reviews (migration 045 + 051 multi-critères)
 * Critères: rating_overall, rating_team, rating_service, rating_punctuality, rating_care,
 *           staff_ratings (JSON), staff_adjectives, price_opinion, price_expected
 *
 * Gamification: après soumission → distributeReviewRewards() attribue XP + trophées
 *               aux employés terrain, entreprise réalisatrice et entreprise créatrice.
 *
 * Sécurité: review_token = crypto.randomBytes(32) — jamais devinable.
 *           /reviews/submit est public (pas de JWT vérifié).
 */

const crypto = require('crypto');
const { connect } = require('../../swiftDb');
const MailSender = require('../../utils/mailSender');
const { distributeReviewRewards } = require('../../utils/reviewGamification');

/* ─── Rate limiter in-memory pour routes publiques ───────────────────────── */
// Max 5 soumissions par IP par 15 minutes
const _submitRateStore = new Map();
const _isSubmitRateLimited = (ip) => {
  const MAX = 5, WINDOW = 15 * 60 * 1000;
  const now = Date.now();
  const entry = _submitRateStore.get(ip) || { count: 0, resetAt: now + WINDOW };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW; }
  entry.count++;
  _submitRateStore.set(ip, entry);
  return entry.count > MAX;
};

/* ─── POST /v1/jobs/:jobId/review-request ────────────────────────────────── */
const requestReview = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const connection = await connect();
  try {
    // Vérifier que le job appartient à la company et récupérer les infos client
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.status, c.email AS client_email, c.first_name AS client_first_name
       FROM jobs j
       LEFT JOIN clients c ON c.id = j.client_id
       WHERE j.id = ? AND j.contractee_company_id = ?`,
      [jobId, companyId]
    );
    if (!jobRows.length) return res.status(404).json({ success: false, message: 'Job not found' });

    const job = jobRows[0];

    // Vérifier qu'une review n'est pas déjà soumise
    const [existing] = await connection.execute(
      'SELECT id, review_token, submitted_at FROM job_reviews WHERE job_id = ?',
      [jobId]
    );

    if (existing.length && existing[0].submitted_at) {
      return res.status(409).json({ success: false, message: 'Review already submitted for this job' });
    }

    let reviewToken;

    if (existing.length) {
      // Réutiliser le token existant, mettre à jour reminder_sent_at
      reviewToken = existing[0].review_token;
      await connection.execute(
        'UPDATE job_reviews SET reminder_sent_at = NOW() WHERE id = ?',
        [existing[0].id]
      );
    } else {
      // Générer un nouveau token sécurisé
      reviewToken = crypto.randomBytes(32).toString('hex');
      // Insérer avec rating_overall=0 placeholder (sera mis à jour lors du submit)
      await connection.execute(
        `INSERT INTO job_reviews
           (job_id, company_id, reviewer_email, reviewer_name, rating_overall, review_token, reminder_sent_at)
         VALUES (?, ?, ?, ?, 0, ?, NOW())`,
        [jobId, companyId, job.client_email || null, job.client_first_name || null, reviewToken]
      );
    }

    // Envoyer l'email si l'adresse email du client est disponible
    if (job.client_email) {
      try {
        const { sendMail } = MailSender();
        const reviewUrl = `https://app.cobbr-app.com/review/${reviewToken}`;
        const subject = 'Share your experience — Cobbr';
        const textBody = `Hi ${job.client_first_name || 'there'},\n\nWe'd love to hear your feedback!\n${reviewUrl}`;
        const htmlBody = `
          <p>Hi ${job.client_first_name || 'there'},</p>
          <p>Thank you for choosing us. Please take a moment to share your experience:</p>
          <p><a href="${reviewUrl}" style="background:#4361ee;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Leave a Review</a></p>
          <p style="color:#888;font-size:12px;">If the button doesn't work, copy this link: ${reviewUrl}</p>`;
        await sendMail(job.client_email, subject, textBody, htmlBody);
      } catch {
        // Email failure is non-blocking
      }
    }

    return res.status(200).json({ success: true, data: { review_token: reviewToken } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/reviews/submit (PUBLIC — sans auth) ───────────────────────── */
const submitReview = async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (_isSubmitRateLimited(clientIp)) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  const {
    token,
    // Note globale — obligatoire
    rating, rating_overall,
    // Notes additionnelles — optionnelles (1-5)
    rating_team,
    rating_service,
    rating_punctuality,
    rating_care,
    // Staff individuel
    staff_ratings,
    // Prix
    price_opinion,
    price_expected,
    // Commentaire + recommandation
    comment,
    would_recommend,
    reviewer_name,
  } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'token is required' });
  }

  // rating_overall accepte 'rating' (compat) ou 'rating_overall'
  const overallVal = parseInt(rating_overall ?? rating, 10);
  if (isNaN(overallVal) || overallVal < 1 || overallVal > 5) {
    return res.status(400).json({ success: false, message: 'rating (overall) must be between 1 and 5' });
  }

  const clamp = (v) => {
    const n = parseInt(v, 10);
    return (!isNaN(n) && n >= 1 && n <= 5) ? n : null;
  };

  const teamVal   = clamp(rating_team);
  const svcVal    = clamp(rating_service);
  const punctVal  = clamp(rating_punctuality);
  const careVal   = clamp(rating_care);

  // Validation staff_ratings (JSON ou tableau)
  let staffRatingsJson = null;
  if (staff_ratings !== undefined && staff_ratings !== null) {
    try {
      const parsed = typeof staff_ratings === 'string' ? JSON.parse(staff_ratings) : staff_ratings;
      if (Array.isArray(parsed)) {
        // Nettoyer + limiter chaque entrée
        const clean = parsed.slice(0, 20).map(s => ({
          user_id:    parseInt(s.user_id || s.id, 10) || null,
          rating:     clamp(s.rating),
          adjectives: Array.isArray(s.adjectives) ? s.adjectives.slice(0, 8).map(a => String(a).substring(0, 50)) : [],
        })).filter(s => s.user_id && s.rating);
        staffRatingsJson = JSON.stringify(clean);
      }
    } catch { /* ignore invalid JSON */ }
  }

  // price_opinion whitelist
  const priceOpinionVal = ['fair', 'expensive', 'cheap'].includes(price_opinion) ? price_opinion : null;
  const priceExpectedVal = price_expected != null && !isNaN(parseFloat(price_expected))
    ? parseFloat(price_expected) : null;

  const resolvedRecommend = would_recommend !== undefined ? (would_recommend ? 1 : 0) : null;

  const connection = await connect();
  try {
    // Trouver la review par token
    const [rows] = await connection.execute(
      'SELECT id, submitted_at FROM job_reviews WHERE review_token = ?',
      [token]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Invalid or expired review link' });
    if (rows[0].submitted_at) {
      return res.status(409).json({ success: false, message: 'Review already submitted' });
    }

    const reviewId = rows[0].id;

    await connection.execute(
      `UPDATE job_reviews
       SET rating_overall    = ?,
           rating_team       = ?,
           rating_service    = ?,
           rating_punctuality= ?,
           rating_care       = ?,
           staff_ratings     = ?,
           price_opinion     = ?,
           price_expected    = ?,
           comment           = ?,
           would_recommend   = ?,
           reviewer_name     = COALESCE(?, reviewer_name),
           submitted_at      = NOW()
       WHERE review_token = ?`,
      [overallVal, teamVal, svcVal, punctVal, careVal,
       staffRatingsJson, priceOpinionVal, priceExpectedVal,
       comment ? String(comment).substring(0, 2000) : null,
       resolvedRecommend, reviewer_name || null, token]
    );

    // Déclencher la distribution XP + trophées (non-bloquant)
    distributeReviewRewards(connection, reviewId).catch(
      err => console.warn('[submitReview] gamification error:', err.message)
    );

    return res.status(200).json({ success: true, message: 'Review submitted. Thank you!' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    // Ne pas fermer la connexion immédiatement si distributeReviewRewards l'utilise encore
    // (distributeReviewRewards ouvre sa propre connexion en pratique — safe to close here)
    await connection.end();
  }
};

/* ─── GET /v1/reviews ─────────────────────────────────────────────────────── */
const listReviews = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const connection = await connect();
  try {
    const [reviews] = await connection.execute(
      `SELECT id, job_id, reviewer_name, reviewer_email,
              rating_overall, rating_team, rating_service,
              rating_punctuality, rating_care,
              staff_ratings, price_opinion,
              comment, would_recommend, submitted_at, created_at
       FROM job_reviews
       WHERE company_id = ? AND submitted_at IS NOT NULL
       ORDER BY submitted_at DESC`,
      [companyId]
    );

    const [stats] = await connection.execute(
      `SELECT
         COUNT(*)                                           AS total,
         ROUND(AVG(rating_overall), 2)                     AS avg_overall,
         ROUND(AVG(rating_team), 2)                        AS avg_team,
         ROUND(AVG(rating_service), 2)                     AS avg_service,
         ROUND(AVG(rating_punctuality), 2)                 AS avg_punctuality,
         ROUND(AVG(rating_care), 2)                        AS avg_care,
         SUM(CASE WHEN rating_overall = 5 THEN 1 ELSE 0 END) AS five_star_count,
         SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) AS would_recommend_count
       FROM job_reviews
       WHERE company_id = ? AND submitted_at IS NOT NULL`,
      [companyId]
    );

    return res.status(200).json({
      success: true,
      data: { reviews, stats: stats[0] }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/jobs/:jobId/review ─────────────────────────────────────────── */
const getJobReview = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      `SELECT id, reviewer_name, reviewer_email,
              rating_overall, rating_team, rating_service,
              rating_punctuality, rating_care,
              staff_ratings, price_opinion, price_expected,
              comment, would_recommend, xp_distributed,
              submitted_at, reminder_sent_at
       FROM job_reviews
       WHERE job_id = ? AND company_id = ?`,
      [jobId, companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'No review for this job' });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/review/:token (PUBLIC — page HTML pour le client final) ────── */
const getReviewPage = async (req, res) => {
  const { token } = req.params;
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return res.status(400).send('<p>Invalid review link.</p>');
  }

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      `SELECT jr.id, jr.submitted_at, j.code
       FROM job_reviews jr
       JOIN jobs j ON j.id = jr.job_id
       WHERE jr.review_token = ?`,
      [token]
    );

    if (!rows.length) {
      return res.status(404).send('<p>Review link not found or expired.</p>');
    }

    const row = rows[0];

    if (row.submitted_at) {
      return res.status(200).send(`
<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:48px">
<h2>✅ Thank you!</h2>
<p>Your review for job <strong>#${row.code}</strong> has already been submitted.</p>
</body></html>`);
    }

    const submitUrl = `/swift-app/v1/reviews/submit`;
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
const TOKEN = '${token}';
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
      token: TOKEN,
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

  } catch {
    return res.status(500).send('<p>Internal error. Please try again later.</p>');
  } finally {
    await connection.end();
  }
};

module.exports = { requestReview, submitReview, listReviews, getJobReview, getReviewPage };

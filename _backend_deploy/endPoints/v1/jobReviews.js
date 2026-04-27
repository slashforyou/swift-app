/**
 * jobReviews.js — Avis clients post-job (lien email tokenisé)
 *
 * Routes:
 *   POST /v1/jobs/:jobId/review-request   → génère token, insère en DB, envoie email au client
 *   POST /v1/reviews/submit               → PUBLIC — soumet l'avis via token
 *   GET  /v1/reviews                      → liste les avis de la company + stats
 *   GET  /v1/jobs/:jobId/review           → retourne la review d'un job si elle existe
 *
 * Table: job_reviews (migration 045)
 * Sécurité: review_token = crypto.randomBytes(32) — jamais devinable.
 *           /reviews/submit est public (pas de JWT vérifié).
 */

const crypto = require('crypto');
const { connect } = require('../../swiftDb');
const MailSender = require('../../utils/mailSender');

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
       WHERE j.id = ? AND j.company_id = ?`,
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
      // Insérer avec rating=0 placeholder (sera mis à jour lors du submit)
      await connection.execute(
        `INSERT INTO job_reviews
           (job_id, company_id, reviewer_email, reviewer_name, rating, review_token, reminder_sent_at)
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
  const { token, rating, comment, would_recommend, reviewer_name } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'token is required' });
  }
  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
  }

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

    const resolvedRecommend = would_recommend !== undefined ? (would_recommend ? 1 : 0) : null;

    await connection.execute(
      `UPDATE job_reviews
       SET rating = ?, comment = ?, would_recommend = ?,
           reviewer_name = COALESCE(?, reviewer_name),
           submitted_at = NOW()
       WHERE review_token = ?`,
      [ratingVal, comment || null, resolvedRecommend, reviewer_name || null, token]
    );

    return res.status(200).json({ success: true, message: 'Review submitted. Thank you!' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
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
      `SELECT id, job_id, reviewer_name, reviewer_email, rating, comment,
              would_recommend, submitted_at, created_at
       FROM job_reviews
       WHERE company_id = ? AND submitted_at IS NOT NULL
       ORDER BY submitted_at DESC`,
      [companyId]
    );

    const [stats] = await connection.execute(
      `SELECT
         COUNT(*) AS total,
         ROUND(AVG(rating), 2) AS avg_rating,
         SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) AS would_recommend_count
       FROM job_reviews
       WHERE company_id = ? AND submitted_at IS NOT NULL`,
      [companyId]
    );

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: stats[0]
      }
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
      `SELECT id, reviewer_name, reviewer_email, rating, comment, would_recommend,
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

module.exports = { requestReview, submitReview, listReviews, getJobReview };

const pool = require('../../swiftDb');

/**
 * GET /v1/onboarding/checklist
 * Returns lightweight onboarding completion status for the authenticated user. 
 * Requires authenticateToken middleware (req.user populated).
 */
const getOnboardingChecklist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get company info
    let company = null;
    if (companyId) {
      const [companies] = await pool.execute(
        `SELECT name, phone, street_address, suburb, state, postcode,
                profile_completed, stripe_onboarding_completed
         FROM companies WHERE id = ?`,
        [companyId]
      );
      if (companies.length > 0) company = companies[0];
    }

    // Profile completed check
    const profileCompleted = !!(
      company &&
      (company.profile_completed ||
        (company.name && company.phone && company.street_address))
    );

    // Check if at least 1 job exists (created or accepted by this company)
    let hasJobs = false;
    if (companyId) {
      const [jobCount] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM jobs
         WHERE contractor_company_id = ? OR contractee_company_id = ?`,
        [companyId, companyId]
      );
      hasJobs = jobCount[0].cnt > 0;
    }

    // Check if team has members (besides the owner) — users, contractors, or invitations sent
    // Also auto-check if user is an employee (not the boss — they don't need to invite)
    let hasTeam = false;
    if (companyId) {
      // Check user's company_role — if not 'patron', they're an employee so team exists
      const [userRoleRows] = await pool.execute(
        `SELECT company_role FROM users WHERE id = ?`,
        [userId]
      );
      const userRole = userRoleRows[0]?.company_role;
      if (userRole && userRole !== 'patron') {
        hasTeam = true;
      } else {
        const [memberCount] = await pool.execute(
          `SELECT
             (SELECT COUNT(*) FROM users WHERE company_id = ? AND id != ?) +
             (SELECT COUNT(*) FROM contractors WHERE company_id = ?) +
             (SELECT COUNT(*) FROM staff_invitations WHERE company_id = ?)
           AS cnt`,
          [companyId, userId, companyId, companyId]
        );
        hasTeam = memberCount[0].cnt > 0;
      }
    }

    // Stripe status — use stripe_onboarding_completed flag
    const stripeConfigured = !!(company && company.stripe_onboarding_completed);

    // Check if at least 1 payment received
    let hasPayment = false;
    if (companyId) {
      const [paymentCount] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM invoices
         WHERE company_id = ? AND (status = 'paid' OR status = 'completed')
         LIMIT 1`,
        [companyId]
      );
      hasPayment = paymentCount[0].cnt > 0;
    }

    return res.json({
      success: true,
      checklist: {
        profile_completed: profileCompleted,
        first_job_created: hasJobs,
        team_invited: hasTeam,
        payments_setup: stripeConfigured,
        first_payment_received: hasPayment,
      },
    });
  } catch (error) {
    console.error('[Onboarding Checklist] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getOnboardingChecklist };

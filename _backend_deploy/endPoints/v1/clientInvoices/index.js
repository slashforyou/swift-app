/**
 * /swift-app/v1/jobs/:jobId/invoice
 *
 * GET   /jobs/:jobId/invoice       — retourne la client_invoice (404 si inexistante)
 * POST  /jobs/:jobId/invoice       — crée l'invoice draft
 * PATCH /jobs/:jobId/invoice/sign  — marque la signature client
 */

const { connect } = require('../../../swiftDb');

// ── Helper ─────────────────────────────────────────────────────────────────

function canViewFinancials(req) {
  return (
    req.user?.account_type === 'business_owner' ||
    req.membership?.can_view_financials === 1
  );
}

function generateInvoiceNumber(companyId, jobId) {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  return `INV-${companyId}-${yyyy}${mm}${dd}-${jobId}`;
}

// ── GET /jobs/:jobId/invoice ───────────────────────────────────────────────

const getInvoice = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ GET /jobs/:jobId/invoice ]', { jobId, companyId: req.user?.company_id });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!canViewFinancials(req)) {
      return res.status(403).json({ success: false, message: 'Permission denied: can_view_financials' });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    connection = await connect();

    // Vérifier accès au job avant d'exposer l'invoice
    const [jobRows] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const [rows] = await connection.execute(
      'SELECT * FROM client_invoices WHERE job_id = ? AND company_id = ? LIMIT 1',
      [numJobId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[GET /jobs/:jobId/invoice]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /jobs/:jobId/invoice ──────────────────────────────────────────────

const createInvoice = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ POST /jobs/:jobId/invoice ]', { jobId, body: req.body });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!canViewFinancials(req)) {
      return res.status(403).json({ success: false, message: 'Permission denied: can_view_financials' });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    const { deposit_amount = 0, balance_amount = 0, total_amount, notes } = req.body;

    if (total_amount === undefined || total_amount === null || isNaN(parseFloat(total_amount))) {
      return res.status(400).json({ success: false, message: 'total_amount is required' });
    }

    connection = await connect();

    // Vérifier ownership du job + récupérer client_id
    const [jobRows] = await connection.execute(
      'SELECT id, client_id FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Une seule invoice par job
    const [existing] = await connection.execute(
      'SELECT id FROM client_invoices WHERE job_id = ? AND company_id = ?',
      [numJobId, companyId],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Invoice already exists for this job',
      });
    }

    const invoiceNumber = generateInvoiceNumber(companyId, numJobId);
    const clientId      = jobRows[0].client_id || null;

    await connection.execute(
      `INSERT INTO client_invoices
         (job_id, company_id, client_id, invoice_number,
          deposit_amount, balance_amount, total_amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        numJobId,
        companyId,
        clientId,
        invoiceNumber,
        parseFloat(deposit_amount),
        parseFloat(balance_amount),
        parseFloat(total_amount),
        notes || null,
      ],
    );

    const [created] = await connection.execute(
      'SELECT * FROM client_invoices WHERE job_id = ? AND company_id = ? LIMIT 1',
      [numJobId, companyId],
    );

    return res.status(201).json({ success: true, data: created[0], message: 'Invoice created' });
  } catch (error) {
    console.error('[POST /jobs/:jobId/invoice]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /jobs/:jobId/invoice/sign ───────────────────────────────────────

const signInvoice = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ PATCH /jobs/:jobId/invoice/sign ]', { jobId, companyId: req.user?.company_id });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      'SELECT * FROM client_invoices WHERE job_id = ? AND company_id = ? LIMIT 1',
      [numJobId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = rows[0];

    if (invoice.signed_at) {
      return res.status(400).json({ success: false, message: 'Invoice is already signed' });
    }

    // Déterminer le nouveau statut après signature :
    // - deposit déjà payé → balance_pending
    // - deposit > 0 non encore payé → deposit_pending
    // - pas de deposit → balance_pending directement
    let newStatus;
    if (invoice.deposit_paid_at) {
      newStatus = 'balance_pending';
    } else if (parseFloat(invoice.deposit_amount) > 0) {
      newStatus = 'deposit_pending';
    } else {
      newStatus = 'balance_pending';
    }

    await connection.execute(
      `UPDATE client_invoices
       SET signed_at = NOW(), status = ?
       WHERE job_id = ? AND company_id = ?`,
      [newStatus, numJobId, companyId],
    );

    const [updated] = await connection.execute(
      'SELECT * FROM client_invoices WHERE job_id = ? AND company_id = ? LIMIT 1',
      [numJobId, companyId],
    );

    return res.json({ success: true, data: updated[0], message: 'Invoice signed' });
  } catch (error) {
    console.error('[PATCH /jobs/:jobId/invoice/sign]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { getInvoice, createInvoice, signInvoice };

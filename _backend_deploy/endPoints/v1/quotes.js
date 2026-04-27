/**
 * quotes.js — Gestion des devis (Quotes)
 *
 * Routes:
 *   GET    /v1/quotes                    → liste des devis (company-scoped, filtres: status, client_id)
 *   POST   /v1/quotes                    → créer un devis avec items (quote_number auto)
 *   GET    /v1/quotes/:id                → détail d'un devis avec items
 *   PATCH  /v1/quotes/:id                → mise à jour (title, status, valid_until, notes, items)
 *   POST   /v1/quotes/:id/convert-to-job → convertir en job
 *   DELETE /v1/quotes/:id                → supprime si status=draft, sinon 400
 *
 * Tables: quotes, quote_items (migration 047)
 * Note: quote_items.total est GENERATED ALWAYS — ne jamais l'insérer/modifier directement.
 *       GST 10% par défaut (Australie).
 */

const { connect } = require('../../swiftDb');

const VALID_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Génère le prochain quote_number pour la company. Format: QT-YYYY-NNN */
const generateQuoteNumber = async (connection, companyId) => {
  const year = new Date().getFullYear();
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM quotes WHERE company_id = ? AND quote_number LIKE ?`,
    [companyId, `QT-${year}-%`]
  );
  const seq = (rows[0].cnt || 0) + 1;
  return `QT-${year}-${String(seq).padStart(3, '0')}`;
};

/** Calcule les totaux depuis un tableau d'items. */
const calcTotals = (items, taxRate = 10) => {
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.quantity) * parseFloat(i.unit_price), 0);
  const tax_amount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + tax_amount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), tax_amount, total };
};

/** Insère les items d'un devis. Retourne immédiatement si tableau vide. */
const insertItems = async (connection, quoteId, items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    await connection.execute(
      `INSERT INTO quote_items (quote_id, description, quantity, unit_price, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [quoteId, item.description, qty, price, i]
    );
  }
};

/* ─── GET /v1/quotes ─────────────────────────────────────────────────────── */
const listQuotes = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { status, client_id } = req.query;
  const conditions = ['q.company_id = ?'];
  const params = [companyId];

  if (status && VALID_STATUSES.includes(status)) {
    conditions.push('q.status = ?');
    params.push(status);
  }
  if (client_id) {
    const cid = parseInt(client_id, 10);
    if (isNaN(cid)) return res.status(400).json({ success: false, message: 'Invalid client_id' });
    conditions.push('q.client_id = ?');
    params.push(cid);
  }

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      `SELECT q.id, q.quote_number, q.title, q.status, q.valid_until,
              q.subtotal, q.tax_amount, q.total, q.client_id,
              q.converted_to_job_id, q.created_at,
              CONCAT(c.first_name, ' ', c.last_name) AS client_name
       FROM quotes q
       LEFT JOIN clients c ON c.id = q.client_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY q.created_at DESC`,
      params
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/quotes ────────────────────────────────────────────────────── */
const createQuote = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { title, client_id, valid_until, notes, terms, items = [] } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  if (valid_until && !/^\d{4}-\d{2}-\d{2}$/.test(valid_until)) {
    return res.status(400).json({ success: false, message: 'valid_until must be YYYY-MM-DD' });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items must be an array' });
  }
  // Valider les items
  for (const item of items) {
    if (!item.description || !item.description.trim()) {
      return res.status(400).json({ success: false, message: 'Each item must have a description' });
    }
  }

  const resolvedClientId = client_id ? parseInt(client_id, 10) : null;
  if (client_id && isNaN(resolvedClientId)) {
    return res.status(400).json({ success: false, message: 'Invalid client_id' });
  }

  const connection = await connect();
  try {
    // Vérifier que le client appartient à la company si fourni
    if (resolvedClientId) {
      const [clientCheck] = await connection.execute(
        'SELECT id FROM clients WHERE id = ? AND company_id = ?',
        [resolvedClientId, companyId]
      );
      if (!clientCheck.length) return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const quote_number = await generateQuoteNumber(connection, companyId);
    const TAX_RATE = 10; // GST Australie
    const { subtotal, tax_amount, total } = calcTotals(items, TAX_RATE);

    const [result] = await connection.execute(
      `INSERT INTO quotes
         (company_id, client_id, quote_number, title, status, valid_until,
          subtotal, tax_rate, tax_amount, total, notes, terms, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        resolvedClientId,
        quote_number,
        title.trim(),
        valid_until || null,
        subtotal,
        TAX_RATE,
        tax_amount,
        total,
        notes || null,
        terms || null,
        userId
      ]
    );

    const quoteId = result.insertId;
    if (items.length) await insertItems(connection, quoteId, items);

    return res.status(201).json({
      success: true,
      data: { id: quoteId, quote_number, subtotal, tax_amount, total }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/quotes/:id ─────────────────────────────────────────────────── */
const getQuote = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const quoteId = parseInt(req.params.id, 10);
  if (isNaN(quoteId)) return res.status(400).json({ success: false, message: 'Invalid id' });

  const connection = await connect();
  try {
    const [quotes] = await connection.execute(
      `SELECT q.*, CONCAT(c.first_name, ' ', c.last_name) AS client_name
       FROM quotes q
       LEFT JOIN clients c ON c.id = q.client_id
       WHERE q.id = ? AND q.company_id = ?`,
      [quoteId, companyId]
    );
    if (!quotes.length) return res.status(404).json({ success: false, message: 'Quote not found' });

    const [items] = await connection.execute(
      'SELECT id, description, quantity, unit_price, total, sort_order FROM quote_items WHERE quote_id = ? ORDER BY sort_order',
      [quoteId]
    );

    return res.status(200).json({ success: true, data: { ...quotes[0], items } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/quotes/:id ───────────────────────────────────────────────── */
const updateQuote = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const quoteId = parseInt(req.params.id, 10);
  if (isNaN(quoteId)) return res.status(400).json({ success: false, message: 'Invalid id' });

  const { title, status, valid_until, notes, items } = req.body;

  const connection = await connect();
  try {
    const [quoteCheck] = await connection.execute(
      'SELECT id, status FROM quotes WHERE id = ? AND company_id = ?',
      [quoteId, companyId]
    );
    if (!quoteCheck.length) return res.status(404).json({ success: false, message: 'Quote not found' });

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.push('status = ?'); params.push(status);
    }
    if (valid_until !== undefined) {
      if (valid_until && !/^\d{4}-\d{2}-\d{2}$/.test(valid_until)) {
        return res.status(400).json({ success: false, message: 'valid_until must be YYYY-MM-DD' });
      }
      updates.push('valid_until = ?'); params.push(valid_until || null);
    }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes || null); }

    // Si des items sont fournis, recalculer les totaux
    if (Array.isArray(items)) {
      const TAX_RATE = 10;
      const { subtotal, tax_amount, total } = calcTotals(items, TAX_RATE);
      updates.push('subtotal = ?', 'tax_amount = ?', 'total = ?');
      params.push(subtotal, tax_amount, total);
    }

    if (updates.length > 0) {
      params.push(quoteId, companyId);
      await connection.execute(
        `UPDATE quotes SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
        params
      );
    }

    // Remplacer les items si fournis
    if (Array.isArray(items)) {
      await connection.execute('DELETE FROM quote_items WHERE quote_id = ?', [quoteId]);
      if (items.length) await insertItems(connection, quoteId, items);
    }

    return res.status(200).json({ success: true, message: 'Quote updated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/quotes/:id/convert-to-job ─────────────────────────────────── */
const convertToJob = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const quoteId = parseInt(req.params.id, 10);
  if (isNaN(quoteId)) return res.status(400).json({ success: false, message: 'Invalid id' });

  const connection = await connect();
  try {
    const [quoteRows] = await connection.execute(
      'SELECT id, title, client_id, total, status, converted_to_job_id FROM quotes WHERE id = ? AND company_id = ?',
      [quoteId, companyId]
    );
    if (!quoteRows.length) return res.status(404).json({ success: false, message: 'Quote not found' });

    const quote = quoteRows[0];
    if (quote.converted_to_job_id) {
      return res.status(409).json({
        success: false,
        message: 'Quote already converted to a job',
        job_id: quote.converted_to_job_id
      });
    }
    if (quote.status === 'rejected' || quote.status === 'expired') {
      return res.status(400).json({ success: false, message: `Cannot convert a ${quote.status} quote` });
    }

    // Créer un job minimal depuis le devis
    const [jobResult] = await connection.execute(
      `INSERT INTO jobs (company_id, client_id, title, status, total_price, created_by_user_id)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [companyId, quote.client_id || null, quote.title, quote.total, userId]
    );
    const jobId = jobResult.insertId;

    // Marquer le devis comme converti
    await connection.execute(
      `UPDATE quotes SET converted_to_job_id = ?, status = 'accepted' WHERE id = ? AND company_id = ?`,
      [jobId, quoteId, companyId]
    );

    return res.status(201).json({ success: true, data: { job_id: jobId } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/quotes/:id ──────────────────────────────────────────────── */
const deleteQuote = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const quoteId = parseInt(req.params.id, 10);
  if (isNaN(quoteId)) return res.status(400).json({ success: false, message: 'Invalid id' });

  const connection = await connect();
  try {
    const [quoteRows] = await connection.execute(
      'SELECT id, status FROM quotes WHERE id = ? AND company_id = ?',
      [quoteId, companyId]
    );
    if (!quoteRows.length) return res.status(404).json({ success: false, message: 'Quote not found' });

    if (quoteRows[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft quotes can be deleted. Update status to cancel non-draft quotes.'
      });
    }

    // Hard delete — quote_items supprimés par ON DELETE CASCADE
    await connection.execute(
      'DELETE FROM quotes WHERE id = ? AND company_id = ?',
      [quoteId, companyId]
    );
    return res.status(200).json({ success: true, message: 'Quote deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listQuotes, createQuote, getQuote, updateQuote, convertToJob, deleteQuote };

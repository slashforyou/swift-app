const pool = require('../../swiftDb');

/**
 * GET /v1/clients
 * Returns all clients for the authenticated company.
 * Optional: ?search=&page=&limit=
 */
const getClients = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const searchClause = search
      ? `AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`
      : '';
    const searchParams = search
      ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
      : [];

    const [clients] = await pool.execute(
      `SELECT
         c.id,
         c.first_name,
         c.last_name,
         c.email,
         c.phone,
         c.address_street,
         c.address_city,
         c.address_state,
         c.address_zip,
         c.address_country,
         c.company_name,
         c.notes,
         c.created_at,
         c.updated_at,
         COUNT(DISTINCT j.id) AS job_count,
         MAX(j.created_at) AS last_job_at
       FROM clients c
       LEFT JOIN jobs j ON j.client_id = c.id AND j.deleted_at IS NULL
       WHERE c.company_id = ? AND c.deleted_at IS NULL
       ${searchClause}
       GROUP BY c.id
       ORDER BY c.last_name ASC, c.first_name ASC
       LIMIT ? OFFSET ?`,
      [companyId, ...searchParams, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM clients c
       WHERE c.company_id = ? AND c.deleted_at IS NULL
       ${searchClause}`,
      [companyId, ...searchParams]
    );

    return res.json({
      success: true,
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[clients] getClients error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * GET /v1/client/:clientId
 */
const getClientById = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { clientId } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.*,
         COUNT(DISTINCT j.id) AS job_count,
         MAX(j.created_at) AS last_job_at
       FROM clients c
       LEFT JOIN jobs j ON j.client_id = c.id AND j.deleted_at IS NULL
       WHERE c.id = ? AND c.company_id = ? AND c.deleted_at IS NULL
       GROUP BY c.id`,
      [clientId, companyId]
    );

    if (!rows.length) return res.status(404).json({ success: false, error: 'Client not found' });

    return res.json({ success: true, client: rows[0] });
  } catch (err) {
    console.error('[clients] getClientById error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * POST /v1/client
 * Body: { first_name, last_name, email?, phone?, address_street?, address_city?,
 *         address_state?, address_zip?, address_country?, company_name?, notes? }
 */
const createClient = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const {
      first_name, last_name, email, phone,
      address_street, address_city, address_state, address_zip, address_country,
      company_name, notes,
    } = req.body;

    if (!first_name && !last_name && !email) {
      return res.status(400).json({ success: false, error: 'At least first_name, last_name or email is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO clients
         (company_id, first_name, last_name, email, phone,
          address_street, address_city, address_state, address_zip, address_country,
          company_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        first_name || null, last_name || null, email || null, phone || null,
        address_street || null, address_city || null, address_state || null,
        address_zip || null, address_country || null,
        company_name || null, notes || null,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ success: true, client: rows[0] });
  } catch (err) {
    console.error('[clients] createClient error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * PATCH /v1/client/:clientId
 */
const updateClient = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { clientId } = req.params;

    const [check] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [clientId, companyId]
    );
    if (!check.length) return res.status(404).json({ success: false, error: 'Client not found' });

    const allowed = ['first_name','last_name','email','phone','address_street',
      'address_city','address_state','address_zip','address_country','company_name','notes'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key] ?? null);
      }
    }
    if (!updates.length) return res.status(400).json({ success: false, error: 'No fields to update' });

    await pool.execute(
      `UPDATE clients SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      [...values, clientId]
    );

    const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [clientId]);
    return res.json({ success: true, client: rows[0] });
  } catch (err) {
    console.error('[clients] updateClient error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * DELETE /v1/client/:clientId  (soft delete)
 */
const deleteClient = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { clientId } = req.params;

    const [check] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [clientId, companyId]
    );
    if (!check.length) return res.status(404).json({ success: false, error: 'Client not found' });

    await pool.execute(
      'UPDATE clients SET deleted_at = NOW() WHERE id = ?',
      [clientId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[clients] deleteClient error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };

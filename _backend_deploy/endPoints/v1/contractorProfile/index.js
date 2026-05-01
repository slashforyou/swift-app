/**
 * /swift-app/v1/contractor-profile
 *
 * GET   /contractor-profile  — profil ABN du user connecté (404 si inexistant)
 * POST  /contractor-profile  — crée le profil ABN (account_type = 'contractor' requis)
 * PATCH /contractor-profile  — met à jour le profil existant
 */

const { connect } = require('../../../swiftDb');

const VALID_RATE_TYPES = ['hourly', 'flat', 'per_item'];

// ── GET /contractor-profile ────────────────────────────────────────────────

const getContractorProfile = async (req, res) => {
  console.log('[ GET /contractor-profile ]', { userId: req.user?.id });

  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, user_id, abn, trade_name, rate_type, rate_amount,
              currency, gst_registered, created_at, updated_at
       FROM contractor_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contractor profile not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[GET /contractor-profile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /contractor-profile ───────────────────────────────────────────────

const createContractorProfile = async (req, res) => {
  console.log('[ POST /contractor-profile ]', { userId: req.user?.id, body: req.body });

  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Vérification account_type server-side — jamais depuis le body
    if (req.user?.account_type !== 'contractor') {
      return res.status(403).json({
        success: false,
        message: 'Only contractor accounts can create a contractor profile',
      });
    }

    const { abn, trade_name, rate_type, rate_amount, gst_registered = 0 } = req.body;

    if (!rate_type || !VALID_RATE_TYPES.includes(rate_type)) {
      return res.status(400).json({
        success: false,
        message: `rate_type must be one of: ${VALID_RATE_TYPES.join(', ')}`,
      });
    }
    if (rate_amount === undefined || rate_amount === null || isNaN(parseFloat(rate_amount))) {
      return res.status(400).json({ success: false, message: 'rate_amount is required and must be a number' });
    }

    connection = await connect();

    // user_id est UNIQUE — vérifier avant INSERT pour message clair
    const [existing] = await connection.execute(
      'SELECT id FROM contractor_profiles WHERE user_id = ?',
      [userId],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Contractor profile already exists. Use PATCH to update.',
      });
    }

    await connection.execute(
      `INSERT INTO contractor_profiles
         (user_id, abn, trade_name, rate_type, rate_amount, currency, gst_registered)
       VALUES (?, ?, ?, ?, ?, 'AUD', ?)`,
      [
        userId,
        abn        || null,
        trade_name || null,
        rate_type,
        parseFloat(rate_amount),
        gst_registered ? 1 : 0,
      ],
    );

    const [created] = await connection.execute(
      'SELECT * FROM contractor_profiles WHERE user_id = ?',
      [userId],
    );

    return res.status(201).json({ success: true, data: created[0], message: 'Contractor profile created' });
  } catch (error) {
    console.error('[POST /contractor-profile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /contractor-profile ──────────────────────────────────────────────

const updateContractorProfile = async (req, res) => {
  console.log('[ PATCH /contractor-profile ]', { userId: req.user?.id, body: req.body });

  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { abn, trade_name, rate_type, rate_amount, gst_registered } = req.body;

    if (
      abn            === undefined &&
      trade_name     === undefined &&
      rate_type      === undefined &&
      rate_amount    === undefined &&
      gst_registered === undefined
    ) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }

    if (rate_type !== undefined && !VALID_RATE_TYPES.includes(rate_type)) {
      return res.status(400).json({
        success: false,
        message: `rate_type must be one of: ${VALID_RATE_TYPES.join(', ')}`,
      });
    }
    if (rate_amount !== undefined && isNaN(parseFloat(rate_amount))) {
      return res.status(400).json({ success: false, message: 'rate_amount must be a number' });
    }

    connection = await connect();

    const [existing] = await connection.execute(
      'SELECT id FROM contractor_profiles WHERE user_id = ?',
      [userId],
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor profile not found. Use POST to create.',
      });
    }

    const fields = [];
    const values = [];

    if (abn            !== undefined) { fields.push('abn = ?');            values.push(abn); }
    if (trade_name     !== undefined) { fields.push('trade_name = ?');     values.push(trade_name); }
    if (rate_type      !== undefined) { fields.push('rate_type = ?');      values.push(rate_type); }
    if (rate_amount    !== undefined) { fields.push('rate_amount = ?');    values.push(parseFloat(rate_amount)); }
    if (gst_registered !== undefined) { fields.push('gst_registered = ?'); values.push(gst_registered ? 1 : 0); }

    values.push(userId);

    await connection.execute(
      `UPDATE contractor_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      values,
    );

    const [updated] = await connection.execute(
      'SELECT * FROM contractor_profiles WHERE user_id = ?',
      [userId],
    );

    return res.json({ success: true, data: updated[0], message: 'Contractor profile updated' });
  } catch (error) {
    console.error('[PATCH /contractor-profile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { getContractorProfile, createContractorProfile, updateContractorProfile };

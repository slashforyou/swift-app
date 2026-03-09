/**
 * POST /v1/jobs/:jobId/counter_proposal
 *
 * Permet au prestataire (contractor) de proposer un créneau alternatif,
 * un type de prix (horaire/forfait), un véhicule et des employés.
 * Met assignment_status → "negotiating".
 * Notifie le contractee (Entreprise A).
 *
 * Body: {
 *   proposed_start: ISO,
 *   proposed_end: ISO,
 *   note?: string,
 *   proposed_price?: number,
 *   price_type?: 'hourly' | 'flat' | 'daily',
 *   vehicle_id?: string,
 *   staff?: Array<{ user_id: string, role: 'driver' | 'offsider' | 'packer' }>
 * }
 */

const { connect } = require('../../../swiftDb');

// Inline push helper
async function sendPushToCompany(connection, companyId, title, body, data = {}) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT ut.push_token
       FROM user_push_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE u.company_id = ? AND ut.push_token IS NOT NULL AND ut.is_active = 1`,
      [companyId],
    );
    if (!tokenRows.length) return;

    const messages = tokenRows.map(r => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: 'Calendar' },
      sound: 'default',
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn('[sendPushToCompany] Non-blocking error:', err.message);
  }
}

async function resolveJobId(connection, jobParam) {
  const numId = parseInt(jobParam);
  if (!isNaN(numId)) return numId;
  const [rows] = await connection.execute('SELECT id FROM jobs WHERE code = ?', [jobParam]);
  return rows[0]?.id || null;
}


/**
 * Convert ISO 8601 to MySQL DATETIME 'YYYY-MM-DD HH:MM:SS'
 * e.g. '2026-03-12T07:30:00.000Z' => '2026-03-12 07:30:00'
 */
function toMysqlDatetime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').substring(0, 19);
}
// ─────────────────────────────────────────────────────────────────────────────

const counterProposalEndpoint = async (req, res) => {
  console.log('[ POST /jobs/:jobId/counter_proposal ]', {
    jobId: req.params.jobId,
    body: req.body,
  });

  let connection;
  try {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;
    if (!companyId) return res.status(403).json({ success: false, error: 'No company' });

    const {
      proposed_start,
      proposed_end,
      note,
      proposed_price,
      price_type,
      vehicle_id,
      staff,
    } = req.body;

    if (!proposed_start || !proposed_end) {
      return res.status(400).json({
        success: false,
        error: 'proposed_start and proposed_end are required',
      });
    }

    // Normalize ISO 8601 to MySQL DATETIME format
    const startMysql = toMysqlDatetime(proposed_start);
    const endMysql   = toMysqlDatetime(proposed_end);
    if (!startMysql || !endMysql) {
      return res.status(400).json({ success: false, error: 'Invalid datetime format' });
    }

    // Validate price_type
    const validPriceTypes = ['hourly', 'flat', 'daily'];
    const resolvedPriceType = price_type && validPriceTypes.includes(price_type) ? price_type : null;

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId) return res.status(404).json({ success: false, error: 'Job not found' });

    // Vérifier que l'appelant est bien le contractor du job
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.code, j.contractor_company_id, j.contractee_company_id, j.assignment_status,
              c.name AS contractee_name
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.contractee_company_id
       WHERE j.id = ?`,
      [jobId],
    );
    if (!jobRows.length) return res.status(404).json({ success: false, error: 'Job not found' });

    const job = jobRows[0];

    if (job.contractor_company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Only the assigned contractor can submit a counter proposal',
      });
    }

    if (!['pending', 'negotiating'].includes(job.assignment_status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot counter-propose on a job with status "${job.assignment_status}"`,
      });
    }

    // Créer l'entrée dans job_counter_proposals (si la table existe)
    let proposalId = null;
    try {
      const [insertResult] = await connection.execute(
        `INSERT INTO job_counter_proposals
           (job_id, proposed_by_company_id, proposed_by_user_id, proposed_start, proposed_end, note, 
            proposed_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          jobId,
          companyId,
          userId,
          startMysql,
          endMysql,
          note || null,
          proposed_price != null ? Number(proposed_price) : null,
        ],
      );
      proposalId = insertResult.insertId;

      // Insert proposed staff if provided
      if (proposalId && Array.isArray(staff) && staff.length > 0) {
        for (const s of staff) {
          if (!s.user_id) continue;
          try {
            await connection.execute(
              `INSERT INTO job_counter_proposal_staff (proposal_id, user_id, role, created_at)
               VALUES (?, ?, ?, NOW())`,
              [proposalId, s.user_id, s.role || 'driver'],
            );
          } catch (staffErr) {
            console.warn('[counterProposal] staff insert error (non-blocking):', staffErr.message);
          }
        }
      }
    } catch (tableErr) {
      console.warn('[counterProposal] job_counter_proposals table not found:', tableErr.message);
    }

    // Mettre à jour assignment_status → negotiating
    await connection.execute(
      `UPDATE jobs
       SET assignment_status        = 'negotiating',
           counter_proposed_start   = ?,
           counter_proposed_end     = ?,
           counter_proposal_note    = ?,
           counter_proposed_price   = ?,
           counter_proposed_at      = NOW(),
           counter_proposed_by      = ?
       WHERE id = ?`,
      [startMysql, endMysql, JSON.stringify({
        text: note || null,
        proposed_price: proposed_price != null ? Number(proposed_price) : null,
        price_type: resolvedPriceType || null,
        vehicle_id: vehicle_id ? String(vehicle_id) : null,
        proposed_drivers: req.body.proposed_drivers != null ? Number(req.body.proposed_drivers) : null,
        proposed_offsiders: req.body.proposed_offsiders != null ? Number(req.body.proposed_offsiders) : null,
        proposed_packers: req.body.proposed_packers != null ? Number(req.body.proposed_packers) : null,
      }), proposed_price != null ? Number(proposed_price) : null, userId, jobId],
    );

    // Notifier le contractee (Entreprise A)
    if (job.contractee_company_id) {
      const [contractorRows] = await connection.execute(
        'SELECT name FROM companies WHERE id = ?',
        [companyId],
      );
      const contractorName = contractorRows[0]?.name || 'Le prestataire';
      const jobCode = job.code || jobId;

      await sendPushToCompany(
        connection,
        job.contractee_company_id,
        '🔄 Contre-proposition reçue',
        `${contractorName} propose un autre créneau pour le job #${jobCode}`,
        {
          screen: 'JobDetails',
          job_id: String(jobId),
          job_code: jobCode,
          type: 'counter_proposal_received',
        },
      );
    }

    return res.json({
      success: true,
      message: 'Counter proposal submitted',
      data: { proposal_id: proposalId, assignment_status: 'negotiating' },
    });
  } catch (error) {
    console.error('❌ POST /jobs/:jobId/counter_proposal error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { counterProposalEndpoint };

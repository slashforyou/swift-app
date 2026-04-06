const pool = require('../../swiftDb');

/**
 * Job Contracts — Generate from clauses + Sign
 * All endpoints require authenticateToken middleware.
 */

// POST /v1/contracts/generate/:jobId — auto-generate contract for a job
const generateContract = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const jobId = parseInt(req.params.jobId, 10);
    if (!companyId || isNaN(jobId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    // Verify job belongs to company
    const [jobs] = await pool.execute(
      'SELECT id, client_id, modular_template_id FROM jobs WHERE id = ? AND contractor_company_id = ?',
      [jobId, companyId]
    );
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const job = jobs[0];

    // Get client info
    let clientName = null;
    let clientEmail = null;
    if (job.client_id) {
      const [clients] = await pool.execute(
        'SELECT first_name, last_name, email FROM clients WHERE id = ?',
        [job.client_id]
      );
      if (clients.length > 0) {
        clientName = `${clients[0].first_name || ''} ${clients[0].last_name || ''}`.trim();
        clientEmail = clients[0].email;
      }
    }

    // Get job segments to determine which clause conditions match
    const segmentTypes = new Set();
    let jobPostcode = null;
    let jobCity = null;
    let jobState = null;

    // Check segments from job_segment_instances table
    const [segments] = await pool.execute(
      'SELECT type FROM job_segment_instances WHERE job_id = ?',
      [jobId]
    );
    segments.forEach(s => segmentTypes.add(s.type));

    // Also check template segments if template is set
    if (job.modular_template_id) {
      const [templateSegments] = await pool.execute(
        'SELECT type FROM job_template_segments WHERE template_id = ?',
        [job.modular_template_id]
      );
      templateSegments.forEach(s => segmentTypes.add(s.type));
    }

    // Get job address info for zip/city/state conditions
    const [jobAddresses] = await pool.execute(
      `SELECT zip, city, state FROM job_addresses WHERE job_id = ? LIMIT 1`,
      [jobId]
    );
    if (jobAddresses.length > 0) {
      jobPostcode = jobAddresses[0].zip;
      jobCity = jobAddresses[0].city;
      jobState = jobAddresses[0].state;
    }

    // Get all active clauses for the company with their conditions
    const [clauses] = await pool.execute(
      `SELECT cc.id, cc.title, cc.content, cc.clause_order
       FROM contract_clauses cc
       WHERE cc.company_id = ? AND cc.is_active = 1
       ORDER BY cc.clause_order ASC`,
      [companyId]
    );

    const clauseIds = clauses.map(c => c.id);
    let allConditions = [];
    if (clauseIds.length > 0) {
      const placeholders = clauseIds.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT clause_id, condition_type, condition_value
         FROM clause_conditions
         WHERE clause_id IN (${placeholders})`,
        clauseIds
      );
      allConditions = rows;
    }

    // Filter clauses based on conditions
    const matchingClauses = clauses.filter(clause => {
      const conditions = allConditions.filter(c => c.clause_id === clause.id);
      
      // If no conditions, clause is always included
      if (conditions.length === 0) return true;

      // Clause is included if ANY condition matches (OR logic)
      return conditions.some(cond => {
        switch (cond.condition_type) {
          case 'always':
            return true;
          case 'segment_type':
            return segmentTypes.has(cond.condition_value);
          case 'postcode':
            return jobPostcode && jobPostcode === cond.condition_value;
          case 'city':
            return jobCity && jobCity.toLowerCase() === (cond.condition_value || '').toLowerCase();
          case 'state':
            return jobState && jobState.toLowerCase() === (cond.condition_value || '').toLowerCase();
          default:
            return false;
        }
      });
    });

    // Check for existing contract (re-generate replaces it)
    const [existingContracts] = await pool.execute(
      'SELECT id FROM job_contracts WHERE job_id = ? AND company_id = ?',
      [jobId, companyId]
    );
    
    let contractId;
    if (existingContracts.length > 0) {
      contractId = existingContracts[0].id;
      // Reset status and remove old clauses
      await pool.execute(
        `UPDATE job_contracts SET status = 'draft', client_name = ?, client_email = ?, 
         generated_at = NOW(), signed_at = NULL, signature_data = NULL WHERE id = ?`,
        [clientName, clientEmail, contractId]
      );
      await pool.execute('DELETE FROM job_contract_clauses WHERE job_contract_id = ?', [contractId]);
    } else {
      const [insertResult] = await pool.execute(
        `INSERT INTO job_contracts (job_id, company_id, client_name, client_email, status) 
         VALUES (?, ?, ?, ?, 'draft')`,
        [jobId, companyId, clientName, clientEmail]
      );
      contractId = insertResult.insertId;
    }

    // Insert matching clauses as snapshots
    for (let i = 0; i < matchingClauses.length; i++) {
      const clause = matchingClauses[i];
      await pool.execute(
        `INSERT INTO job_contract_clauses (job_contract_id, clause_id, clause_title, clause_content, clause_order)
         VALUES (?, ?, ?, ?, ?)`,
        [contractId, clause.id, clause.title, clause.content, i]
      );
    }

    // Fetch the generated contract
    const [contract] = await pool.execute(
      `SELECT id, job_id, company_id, client_name, client_email, status, generated_at, signed_at
       FROM job_contracts WHERE id = ?`,
      [contractId]
    );
    const [contractClauses] = await pool.execute(
      `SELECT id, clause_id, clause_title, clause_content, clause_order
       FROM job_contract_clauses WHERE job_contract_id = ?
       ORDER BY clause_order ASC`,
      [contractId]
    );

    return res.status(201).json({
      success: true,
      contract: { ...contract[0], clauses: contractClauses },
    });
  } catch (err) {
    console.error('generateContract error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /v1/contracts/job/:jobId — get contract for a job
const getJobContract = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const jobId = parseInt(req.params.jobId, 10);
    if (!companyId || isNaN(jobId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const [contracts] = await pool.execute(
      `SELECT id, job_id, company_id, client_name, client_email, status, generated_at, signed_at
       FROM job_contracts WHERE job_id = ? AND company_id = ?
       ORDER BY generated_at DESC LIMIT 1`,
      [jobId, companyId]
    );
    // Note: job_contracts.company_id is set when generating, so this is correct

    if (contracts.length === 0) {
      return res.json({ success: true, contract: null });
    }

    const contract = contracts[0];
    const [clauses] = await pool.execute(
      `SELECT id, clause_id, clause_title, clause_content, clause_order
       FROM job_contract_clauses WHERE job_contract_id = ?
       ORDER BY clause_order ASC`,
      [contract.id]
    );

    return res.json({
      success: true,
      contract: { ...contract, clauses },
    });
  } catch (err) {
    console.error('getJobContract error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /v1/contracts/sign/:contractId — sign a contract (client signature)
const signContract = async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId, 10);
    if (isNaN(contractId)) {
      return res.status(400).json({ success: false, error: 'Invalid contract ID' });
    }

    const { signatureData } = req.body;
    if (!signatureData) {
      return res.status(400).json({ success: false, error: 'signatureData is required' });
    }

    // Verify contract exists and is in draft/sent status
    const [contracts] = await pool.execute(
      `SELECT id, status FROM job_contracts WHERE id = ?`,
      [contractId]
    );
    if (contracts.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    if (contracts[0].status === 'signed') {
      return res.status(400).json({ success: false, error: 'Contract already signed' });
    }

    await pool.execute(
      `UPDATE job_contracts SET status = 'signed', signed_at = NOW(), signature_data = ? WHERE id = ?`,
      [signatureData, contractId]
    );

    return res.json({ success: true, status: 'signed' });
  } catch (err) {
    console.error('signContract error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { generateContract, getJobContract, signContract };

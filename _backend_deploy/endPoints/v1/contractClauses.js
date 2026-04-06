const pool = require('../../swiftDb');

/**
 * Contract Clauses CRUD
 * All endpoints require authenticateToken middleware (req.user populated).
 */

// GET /v1/contracts/clauses — list all clauses for user's company
const getClauses = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company associated' });
    }

    const [clauses] = await pool.execute(
      `SELECT id, title, content, clause_order, is_active, created_at, updated_at
       FROM contract_clauses
       WHERE company_id = ?
       ORDER BY clause_order ASC, id ASC`,
      [companyId]
    );

    // Fetch conditions for each clause
    const clauseIds = clauses.map(c => c.id);
    let conditions = [];
    if (clauseIds.length > 0) {
      const placeholders = clauseIds.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT id, clause_id, condition_type, condition_value
         FROM clause_conditions
         WHERE clause_id IN (${placeholders})`,
        clauseIds
      );
      conditions = rows;
    }

    // Attach conditions to each clause
    const result = clauses.map(clause => ({
      ...clause,
      conditions: conditions.filter(c => c.clause_id === clause.id),
    }));

    return res.json({ success: true, clauses: result });
  } catch (err) {
    console.error('getClauses error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /v1/contracts/clauses — create a new clause
const createClause = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company associated' });
    }

    const { title, content, conditions } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'title and content are required' });
    }

    // Get next order
    const [maxOrder] = await pool.execute(
      'SELECT COALESCE(MAX(clause_order), -1) + 1 as next_order FROM contract_clauses WHERE company_id = ?',
      [companyId]
    );
    const nextOrder = maxOrder[0].next_order;

    const [result] = await pool.execute(
      'INSERT INTO contract_clauses (company_id, title, content, clause_order) VALUES (?, ?, ?, ?)',
      [companyId, title, content, nextOrder]
    );

    const clauseId = result.insertId;

    // Insert conditions
    if (Array.isArray(conditions) && conditions.length > 0) {
      for (const cond of conditions) {
        if (!cond.condition_type) continue;
        await pool.execute(
          'INSERT INTO clause_conditions (clause_id, condition_type, condition_value) VALUES (?, ?, ?)',
          [clauseId, cond.condition_type, cond.condition_value || null]
        );
      }
    }

    // Fetch the created clause with its conditions
    const [created] = await pool.execute(
      'SELECT id, title, content, clause_order, is_active, created_at, updated_at FROM contract_clauses WHERE id = ?',
      [clauseId]
    );
    const [createdConditions] = await pool.execute(
      'SELECT id, clause_id, condition_type, condition_value FROM clause_conditions WHERE clause_id = ?',
      [clauseId]
    );

    return res.status(201).json({
      success: true,
      clause: { ...created[0], conditions: createdConditions },
    });
  } catch (err) {
    console.error('createClause error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// PATCH /v1/contracts/clauses/:id — update a clause
const updateClause = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const clauseId = parseInt(req.params.id, 10);
    if (!companyId || isNaN(clauseId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    // Verify ownership
    const [existing] = await pool.execute(
      'SELECT id FROM contract_clauses WHERE id = ? AND company_id = ?',
      [clauseId, companyId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Clause not found' });
    }

    const { title, content, clause_order, is_active, conditions } = req.body;

    // Build dynamic update
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (clause_order !== undefined) { updates.push('clause_order = ?'); params.push(clause_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length > 0) {
      params.push(clauseId);
      await pool.execute(
        `UPDATE contract_clauses SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Replace conditions if provided
    if (Array.isArray(conditions)) {
      await pool.execute('DELETE FROM clause_conditions WHERE clause_id = ?', [clauseId]);
      for (const cond of conditions) {
        if (!cond.condition_type) continue;
        await pool.execute(
          'INSERT INTO clause_conditions (clause_id, condition_type, condition_value) VALUES (?, ?, ?)',
          [clauseId, cond.condition_type, cond.condition_value || null]
        );
      }
    }

    // Fetch updated clause
    const [updated] = await pool.execute(
      'SELECT id, title, content, clause_order, is_active, created_at, updated_at FROM contract_clauses WHERE id = ?',
      [clauseId]
    );
    const [updatedConditions] = await pool.execute(
      'SELECT id, clause_id, condition_type, condition_value FROM clause_conditions WHERE clause_id = ?',
      [clauseId]
    );

    return res.json({
      success: true,
      clause: { ...updated[0], conditions: updatedConditions },
    });
  } catch (err) {
    console.error('updateClause error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// DELETE /v1/contracts/clauses/:id
const deleteClause = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const clauseId = parseInt(req.params.id, 10);
    if (!companyId || isNaN(clauseId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const [result] = await pool.execute(
      'DELETE FROM contract_clauses WHERE id = ? AND company_id = ?',
      [clauseId, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Clause not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteClause error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// POST /v1/contracts/reorder — reorder clauses
const reorderClauses = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company associated' });
    }

    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'orderedIds array required' });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await pool.execute(
        'UPDATE contract_clauses SET clause_order = ? WHERE id = ? AND company_id = ?',
        [i, orderedIds[i], companyId]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('reorderClauses error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { getClauses, createClause, updateClause, deleteClause, reorderClauses };

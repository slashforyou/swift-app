/**
 * employeeSkills.js — Compétences et certifications des employés
 *
 * Routes:
 *   GET    /v1/employees/:userId/skills              → liste des compétences (company-scoped)
 *   POST   /v1/employees/:userId/skills              → ajouter une compétence
 *   PATCH  /v1/employees/:userId/skills/:skillId     → mettre à jour une compétence
 *   DELETE /v1/employees/:userId/skills/:skillId     → supprimer une compétence
 *
 * Table: employee_skills (migration 040)
 * Note: alerte si cert_expiry_date < NOW() + 30 jours (champ `expiry_warning` dans la réponse GET)
 */

const { connect } = require('../../swiftDb');

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

/* ─── GET /v1/employees/:userId/skills ───────────────────────────────────── */
const listSkills = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const connection = await connect();
  try {
    // Vérifier que l'employé appartient à la company
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [rows] = await connection.execute(
      `SELECT id, skill_name, skill_level, certified, cert_expiry_date, notes, updated_at,
              CASE WHEN cert_expiry_date IS NOT NULL
                        AND cert_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                   THEN 1 ELSE 0 END AS expiry_warning
       FROM employee_skills
       WHERE user_id = ? AND company_id = ?
       ORDER BY skill_name`,
      [targetUserId, companyId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/employees/:userId/skills ──────────────────────────────────── */
const addSkill = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const { skill_name, skill_level, certified, cert_expiry_date, notes } = req.body;
  if (!skill_name || typeof skill_name !== 'string' || !skill_name.trim()) {
    return res.status(400).json({ success: false, message: 'skill_name is required' });
  }
  const resolvedLevel = VALID_LEVELS.includes(skill_level) ? skill_level : 'intermediate';

  // Valider cert_expiry_date si fourni
  if (cert_expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(cert_expiry_date)) {
    return res.status(400).json({ success: false, message: 'cert_expiry_date must be YYYY-MM-DD' });
  }

  const connection = await connect();
  try {
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [targetUserId, companyId]
    );
    if (!userCheck.length) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [result] = await connection.execute(
      `INSERT INTO employee_skills
         (company_id, user_id, skill_name, skill_level, certified, cert_expiry_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        targetUserId,
        skill_name.trim(),
        resolvedLevel,
        certified ? 1 : 0,
        cert_expiry_date || null,
        notes || null
      ]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    // Violation de contrainte UNIQUE (user_id, skill_name)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'This skill already exists for this employee' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── PATCH /v1/employees/:userId/skills/:skillId ────────────────────────── */
const updateSkill = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  const skillId = parseInt(req.params.skillId, 10);
  if (isNaN(targetUserId) || isNaN(skillId)) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const { skill_level, certified, cert_expiry_date } = req.body;

  const updates = [];
  const params = [];

  if (skill_level !== undefined) {
    if (!VALID_LEVELS.includes(skill_level)) {
      return res.status(400).json({ success: false, message: 'Invalid skill_level' });
    }
    updates.push('skill_level = ?');
    params.push(skill_level);
  }
  if (certified !== undefined) {
    updates.push('certified = ?');
    params.push(certified ? 1 : 0);
  }
  if (cert_expiry_date !== undefined) {
    if (cert_expiry_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(cert_expiry_date)) {
      return res.status(400).json({ success: false, message: 'cert_expiry_date must be YYYY-MM-DD or null' });
    }
    updates.push('cert_expiry_date = ?');
    params.push(cert_expiry_date || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  const connection = await connect();
  try {
    params.push(skillId, targetUserId, companyId);
    const [result] = await connection.execute(
      `UPDATE employee_skills SET ${updates.join(', ')} WHERE id = ? AND user_id = ? AND company_id = ?`,
      params
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    return res.status(200).json({ success: true, message: 'Skill updated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/employees/:userId/skills/:skillId ───────────────────────── */
const deleteSkill = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.params.userId, 10);
  const skillId = parseInt(req.params.skillId, 10);
  if (isNaN(targetUserId) || isNaN(skillId)) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'DELETE FROM employee_skills WHERE id = ? AND user_id = ? AND company_id = ?',
      [skillId, targetUserId, companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    return res.status(200).json({ success: true, message: 'Skill deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listSkills, addSkill, updateSkill, deleteSkill };

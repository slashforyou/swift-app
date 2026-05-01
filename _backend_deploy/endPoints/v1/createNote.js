const { connect } = require('../../swiftDb');
const { processNoteAdded } = require('../../utils/gamificationEngine');

const createNoteEndpoint = async (req, res) => {
  console.log('[ Create Note ]', { method: req.method, url: req.originalUrl, query: req.query, body: req.body });
  
  let connection;
  try {
    // Récupérer job_id depuis l'URL (route RESTful) ou depuis le body (compatibilité)
    const job_id = req.params.jobId || req.body.job_id;
    const {
      title,
      content,
      note_type,
      created_by
    } = req.body;

    // Validation des champs obligatoires
    if (!job_id) {
      return res.status(400).json({
        success: false,
        error: 'job_id est requis pour créer une note'
      });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'title est requis pour créer une note'
      });
    }

    // Create database connection
    connection = await connect();

    // Vérification que le job existe
    const [jobCheck] = await connection.execute('SELECT id FROM jobs WHERE id = ?', [job_id]);
    if (jobCheck.length === 0) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Le job spécifié n\'existe pas'
      });
    }

    // Vérification que l'utilisateur existe (si fourni)
    if (created_by) {
      const [userCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [created_by]);
      if (userCheck.length === 0) {
        await connection.release();
        return res.status(400).json({
          success: false,
          error: 'L\'utilisateur spécifié n\'existe pas'
        });
      }
    }

    // Construction de la requête d'insertion dynamique
    const fields = ['job_id', 'title'];
    const values = [job_id, title.trim()];
    const placeholders = ['?', '?'];

    // Ajout des champs optionnels s'ils sont fournis
    if (content && content.trim() !== '') {
      fields.push('content');
      values.push(content.trim());
      placeholders.push('?');
    }

    if (note_type !== undefined && note_type !== null) {
      fields.push('note_type');
      values.push(note_type);
      placeholders.push('?');
    }

    if (created_by) {
      fields.push('created_by');
      values.push(created_by);
      placeholders.push('?');
    }

    const insertQuery = `INSERT INTO job_notes (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    console.log('Executing query:', insertQuery, 'with values:', values);

    const [result] = await connection.execute(insertQuery, values);

    // Récupération de la note créée avec les informations du job et de l'utilisateur
    const [newNote] = await connection.execute(`
      SELECT 
        jn.*,
        j.code as job_code,
        u.first_name,
        u.last_name
      FROM job_notes jn
      LEFT JOIN jobs j ON jn.job_id = j.id
      LEFT JOIN users u ON jn.created_by = u.id
      WHERE jn.id = ?
    `, [result.insertId]);

    // [Phase 3 JQS] Log job event — non-blocking
    try {
      await connection.execute(
        `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
         VALUES (?, NULL, ?, 'note_added', JSON_OBJECT('note_type', ?))`,
        [parseInt(job_id), created_by || null, note_type || null]
      );
    } catch (evtErr) {
      console.error('[note_added] job_events insert failed:', evtErr.message);
    }

    await connection.release();

    // [GAMIF V2]
    const _nJobId  = parseInt(job_id || req.params?.jobId);
    const _nUserId = parseInt(created_by || 0);
    if (_nJobId && _nUserId) processNoteAdded(_nJobId, _nUserId, null, result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Note créée avec succès',
      note: newNote[0]
    });

  } catch (error) {
    console.error('Erreur lors de la création de la note:', error);
    if (connection) {
      await connection.release();
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur lors de la création de la note'
    });
  }
};

module.exports = { createNoteEndpoint };

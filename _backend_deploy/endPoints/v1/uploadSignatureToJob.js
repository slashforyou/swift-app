const { connect } = require('../../swiftDb');
const { processSignatureCollected } = require('../../utils/gamificationEngine');
const { getUserByToken } = require('../database/user');
const consoleStyle = require('../../utils/consoleStyle');

/**
 * Upload a signature to a job
 * POST /swift-app/v1/job/:jobId/signature
 * 
 * Body: {
 *   signature_data: string (required) - Base64 encoded signature image,
 *   signature_type: string (optional) - 'client', 'delivery', 'pickup' (default: 'client'),
 *   signer_name: string (optional),
 *   signer_email: string (optional),
 *   signer_phone: string (optional)
 * }
 * 
 * Permissions: admin, manager, employee
 */
const uploadSignatureToJobEndpoint = async (req, res) => {
  console.log('[ Upload Signature to Job ]', { 
    method: req.method, 
    url: req.originalUrl, 
    query: req.query, 
    body: { ...req.body, signature_data: req.body.signature_data ? '[Base64 Data]' : undefined }
  });

  let connection;
  try {
    const { jobId } = req.params;
    const { 
      signature_data, 
      signature_type = 'client',
      signer_name,
      signer_email,
      signer_phone 
    } = req.body;

    // Validation des paramètres
    if (!jobId || isNaN(parseInt(jobId))) {
      return res.status(400).json({
        success: false,
        error: 'jobId valide requis pour ajouter une signature'
      });
    }

    if (!signature_data) {
      return res.status(400).json({
        success: false,
        error: 'signature_data requis (données Base64 de la signature)'
      });
    }

    // Validation du type de signature
    const validTypes = ['client', 'delivery', 'pickup'];
    if (!validTypes.includes(signature_type)) {
      return res.status(400).json({
        success: false,
        error: `signature_type doit être l'un de: ${validTypes.join(', ')}`
      });
    }

    // Validation de la signature Base64
    if (!signature_data.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'signature_data doit être une image en format Base64 (data:image/...)'
      });
    }

    connection = await connect();

    // Authentification
    const authHeader = req.headers.authorization;
    let user = null;

    if (process.env.NODE_ENV === 'test' && req.user) {
      user = req.user;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      user = await getUserByToken(token);
    }

    if (!user) {
      await connection.release();
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis pour ajouter une signature'
      });
    }

    console.log('User attempting signature upload:', { 
      id: user.id, 
      role: user.role, 
      email: user.email 
    });

    // Vérification des droits (tous les rôles connectés peuvent ajouter des signatures)
    const allowedRoles = ['admin', 'manager', 'employee', 'user'];
    if (!allowedRoles.includes(user.role)) {
      await connection.release();
      return res.status(403).json({
        success: false,
        error: 'Droits insuffisants pour ajouter une signature'
      });
    }

    // Vérification que le job existe
    const [jobCheck] = await connection.execute(
      'SELECT id, code, status FROM jobs WHERE id = ?',
      [parseInt(jobId)]
    );

    if (jobCheck.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Job non trouvé avec cet ID'
      });
    }

    const job = jobCheck[0];
    console.log('Job found for signature:', { id: job.id, code: job.code, status: job.status });

    // Vérification qu'il n'y a pas déjà une signature de ce type pour ce job
    const [existingSignature] = await connection.execute(
      'SELECT id, signature_type FROM job_signatures WHERE job_id = ? AND signature_type = ?',
      [parseInt(jobId), signature_type]
    );

    if (existingSignature.length > 0) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: `Une signature de type "${signature_type}" existe déjà pour ce job`,
        existing_signature_id: existingSignature[0].id
      });
    }

    // Insertion de la signature
    const [insertResult] = await connection.execute(
      `INSERT INTO job_signatures 
       (job_id, signature_type, signature_data, signer_name, signer_email, signer_phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(jobId),
        signature_type,
        signature_data,
        signer_name || null,
        signer_email || null,
        signer_phone || null,
        user.id
      ]
    );

    // Récupération de la signature créée
    const [createdSignature] = await connection.execute(
      `SELECT id, job_id, signature_type, signer_name, signer_email, signer_phone, 
              signed_at, created_by, created_at
       FROM job_signatures 
       WHERE id = ?`,
      [insertResult.insertId]
    );

    // [Phase 3 JQS] Log job event — non-blocking
    try {
      await connection.execute(
        `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
         VALUES (?, ?, ?, 'signature_collected', JSON_OBJECT('signed_at', NOW()))`,
        [parseInt(jobId), user.company_id || null, user.id]
      );
    } catch (evtErr) {
      console.error('[signature_collected] job_events insert failed:', evtErr.message);
    }

    await connection.release();

    const signatureData = {
      signatureId: insertResult.insertId,
      jobId: parseInt(jobId),
      signatureType: signature_type,
      signerInfo: {
        name: signer_name || null,
        email: signer_email || null,
        phone: signer_phone || null
      },
      uploadedBy: user.id,
      uploadedByEmail: user.email,
      signedAt: createdSignature[0].signed_at,
      jobData: {
        id: job.id,
        code: job.code,
        status: job.status
      }
    };

    console.log('Signature uploaded successfully:', {
      signatureId: insertResult.insertId,
      jobId: parseInt(jobId),
      signatureType: signature_type,
      uploadedBy: user.id
    });

    // [GAMIF V2]
    processSignatureCollected(parseInt(jobId), user.id, user.company_id || null, insertResult.insertId);

    return res.status(201).json({
      success: true,
      message: 'Signature ajoutée avec succès',
      signature: signatureData
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la signature:', error);
    
    if (connection) {
      await connection.release();
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur lors de l\'ajout de la signature'
    });
  }
};

module.exports = { uploadSignatureToJobEndpoint };

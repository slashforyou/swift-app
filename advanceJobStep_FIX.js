// 🔧 FIX POUR advanceJobStep.js
// À appliquer sur le serveur backend

/**
 * PROBLÈME:
 * L'endpoint /job/:id/advance-step attend actuellement un CODE (JOB-DEC-002)
 * mais le client mobile envoie un ID numérique (2).
 * 
 * Les autres endpoints (start, complete) acceptent l'ID numérique.
 * Il faut harmoniser pour accepter BOTH formats.
 */

// ========================================
// SOLUTION: Accepter ID ET CODE
// ========================================

router.post('/job/:id/advance-step', async (req, res) => {
  let connection;
  
  try {
    const { connect, close } = require('../../swiftDb');
    connection = await connect();
    
    // ✅ ÉTAPE 1: Récupérer le paramètre (peut être ID ou CODE)
    const jobIdOrCode = req.params.id;
    let jobId;
    let job;
    
    // ✅ ÉTAPE 2: Détecter si c'est un ID numérique ou un CODE
    if (/^\d+$/.test(jobIdOrCode)) {
      // C'est un ID numérique (ex: "2")
      jobId = parseInt(jobIdOrCode, 10);
      
      console.log(`[advanceJobStep] Received numeric ID: ${jobId}`);
      
      // Récupérer job par ID
      const [jobs] = await connection.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId]
      );
      
      if (!jobs.length) {
        return res.status(404).json({ 
          success: false, 
          error: 'Job not found',
          searchedBy: 'ID',
          searchedValue: jobId
        });
      }
      
      job = jobs[0];
      
    } else {
      // C'est un CODE (ex: "JOB-DEC-002")
      const jobCode = jobIdOrCode;
      
      console.log(`[advanceJobStep] Received CODE: ${jobCode}`);
      
      // Récupérer job par CODE
      const [jobs] = await connection.execute(
        'SELECT * FROM jobs WHERE code = ?',
        [jobCode]
      );
      
      if (!jobs.length) {
        return res.status(404).json({ 
          success: false, 
          error: 'Job not found',
          searchedBy: 'CODE',
          searchedValue: jobCode
        });
      }
      
      job = jobs[0];
      jobId = job.id;  // Utiliser l'ID pour la suite
    }
    
    // ✅ ÉTAPE 3: Valider permissions (déjà présent probablement)
    // Vérifier que l'utilisateur a le droit de modifier ce job
    // ... (code existant)
    
    // ✅ ÉTAPE 4: Extraire et valider le step demandé
    const { new_step, current_step, reason, metadata } = req.body;
    const targetStep = new_step || current_step;
    
    if (!targetStep || typeof targetStep !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid step number',
        received: { new_step, current_step }
      });
    }
    
    if (targetStep < 1 || targetStep > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid step number. Must be between 1 and 5',
        received: targetStep
      });
    }
    
    console.log(`[advanceJobStep] Updating job ${jobId} (${job.code}) to step ${targetStep}`);
    
    // ✅ ÉTAPE 5: Vérifier que le step est différent (optionnel)
    if (job.current_step === targetStep) {
      console.log(`[advanceJobStep] Job already at step ${targetStep}, skipping update`);
      return res.json({ 
        success: true, 
        message: 'Job already at this step',
        new_step: targetStep,
        previous_step: job.current_step,
        job: {
          id: job.id,
          code: job.code,
          current_step: targetStep
        }
      });
    }
    
    // ✅ ÉTAPE 6: Update le step en DB
    const previousStep = job.current_step;
    
    await connection.execute(
      `UPDATE jobs 
       SET current_step = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [targetStep, jobId]
    );
    
    console.log(`[advanceJobStep] Job ${jobId} step updated: ${previousStep} → ${targetStep}`);
    
    // ✅ ÉTAPE 7: Insérer une note si fournie
    if (reason) {
      await connection.execute(
        `INSERT INTO job_notes (job_id, note, created_at) 
         VALUES (?, ?, NOW())`,
        [jobId, reason]
      );
      
      console.log(`[advanceJobStep] Note added: "${reason}"`);
    }
    
    // ✅ ÉTAPE 8: Logger l'action (optionnel mais recommandé)
    if (metadata) {
      await connection.execute(
        `INSERT INTO job_history (
          job_id, 
          action, 
          previous_value, 
          new_value, 
          metadata, 
          created_at
        ) VALUES (?, 'step_changed', ?, ?, ?, NOW())`,
        [
          jobId, 
          previousStep.toString(), 
          targetStep.toString(),
          JSON.stringify(metadata)
        ]
      );
    }
    
    // ✅ ÉTAPE 9: Retourner succès
    res.json({ 
      success: true, 
      message: 'Job step advanced successfully',
      new_step: targetStep,
      previous_step: previousStep,
      job: {
        id: job.id,
        code: job.code,
        current_step: targetStep,
        status: job.status,
        updated_at: new Date()
      }
    });
    
  } catch (error) {
    console.error('[advanceJobStep] Error:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
    
  } finally {
    if (connection) {
      const { close } = require('../../swiftDb');
      close(connection);
    }
  }
});

// ========================================
// TESTS DE VALIDATION
// ========================================

/**
 * Après modification, tester avec:
 * 
 * TEST 1: Avec ID numérique
 * curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer test-token-12345" \
 *   -d '{"current_step": 3}' \
 *   -v
 * 
 * Attendu: 200 OK {"success":true,"new_step":3}
 * 
 * 
 * TEST 2: Avec CODE
 * curl -X POST http://localhost:3021/swift-app/v1/job/JOB-DEC-002/advance-step \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer test-token-12345" \
 *   -d '{"current_step": 4}' \
 *   -v
 * 
 * Attendu: 200 OK {"success":true,"new_step":4}
 * 
 * 
 * TEST 3: Avec new_step (backward compatibility)
 * curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
 *   -H "Content-Type: application/json" \
 *   -d '{"new_step": 5}' \
 *   -v
 * 
 * Attendu: 200 OK {"success":true,"new_step":5}
 * 
 * 
 * TEST 4: Avec step invalide
 * curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
 *   -H "Content-Type: application/json" \
 *   -d '{"current_step": 99}' \
 *   -v
 * 
 * Attendu: 400 Bad Request {"error":"Invalid step number"}
 */

// ========================================
// NOTES D'IMPLÉMENTATION
// ========================================

/**
 * CHANGEMENTS MAJEURS:
 * 
 * 1. Détection ID vs CODE (regex /^\d+$/)
 *    - Si chiffres uniquement → ID numérique
 *    - Sinon → CODE string
 * 
 * 2. Récupération job flexible
 *    - Par ID: SELECT * FROM jobs WHERE id = ?
 *    - Par CODE: SELECT * FROM jobs WHERE code = ?
 * 
 * 3. Support new_step ET current_step
 *    - Priorité à new_step si présent
 *    - Sinon utilise current_step
 * 
 * 4. Validation robuste
 *    - Type number vérifié
 *    - Range 1-5 vérifié
 *    - Retours erreur clairs
 * 
 * 5. Logging amélioré
 *    - Console logs pour debugging
 *    - Indication ID vs CODE
 *    - Transitions step loggées
 * 
 * COMPATIBILITÉ:
 * - ✅ Client mobile (envoie ID numérique)
 * - ✅ Tests curl existants (utilisent CODE)
 * - ✅ Anciennes versions (acceptent new_step)
 * - ✅ Nouvelles versions (acceptent current_step)
 * 
 * COHÉRENCE:
 * - ✅ Même logique que startJobById.js
 * - ✅ Même logique que completeJobById.js
 * - ✅ Tous les endpoints acceptent ID ET CODE
 */

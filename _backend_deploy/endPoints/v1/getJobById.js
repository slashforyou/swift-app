const { connect } = require('../../swiftDb');

const getJobByIdEndpoint = async (req, res) => {
  console.log('[ Get Job by ID ]', { method: req.method, url: req.originalUrl, params: req.params });
  
  let connection;
  try {
    const jobCode = req.params.id;
    
    // Récupérer user_id et company_id depuis l'auth (si présent)
    const userId = req.user?.id || req.query?.user_id || null;
    const userCompanyId = req.user?.company_id || req.query?.company_id || null;
    
    // Connect to database
    connection = await connect();
    
    // Get complete job information avec les infos des companies
    const [jobResult] = await connection.execute(`
      SELECT 
        j.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.phone as client_phone,
        c.email as client_email,
        c.client_type as client_type,
        c.status as client_status,
        -- Contractee company info (créateur du job)
        contractee_comp.name as contractee_company_name,
        contractee_sca.stripe_account_id as contractee_stripe_account_id,
        -- Contractor company info (exécutant du job)
        contractor_comp.name as contractor_company_name,
        contractor_sca.stripe_account_id as contractor_stripe_account_id,
        -- Creator info
        creator.first_name as created_by_first_name,
        creator.last_name as created_by_last_name,
        creator.email as created_by_email,
        -- Assigned staff info
        assigned_staff.first_name as assigned_staff_first_name,
        assigned_staff.last_name as assigned_staff_last_name,
        -- Responder info (qui a accepté/refusé)
        responder.first_name as responder_first_name,
        responder.last_name as responder_last_name
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      LEFT JOIN companies contractee_comp ON j.contractee_company_id = contractee_comp.id
      LEFT JOIN companies contractor_comp ON j.contractor_company_id = contractor_comp.id
      LEFT JOIN stripe_connected_accounts contractee_sca ON j.contractee_company_id = contractee_sca.company_id AND contractee_sca.disconnected_at IS NULL
      LEFT JOIN stripe_connected_accounts contractor_sca ON j.contractor_company_id = contractor_sca.company_id AND contractor_sca.disconnected_at IS NULL
      LEFT JOIN users creator ON j.created_by_user_id = creator.id
      LEFT JOIN users assigned_staff ON j.assigned_staff_id = assigned_staff.id
      LEFT JOIN users responder ON j.assignment_responded_by_user_id = responder.id
      WHERE j.code = ?
    `, [jobCode]);
    
    if (jobResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found',
        jobCode 
      });
    }
    
    const job = jobResult[0];
    
    // Get job statistics (crew count, truck count, items count)
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM job_users WHERE job_id = ?) as crew_count,
        (SELECT COUNT(*) FROM job_trucks WHERE job_id = ?) as truck_count,
        (SELECT COUNT(*) FROM job_items WHERE job_id = ?) as item_count,
        (SELECT COUNT(*) FROM job_notes WHERE job_id = ?) as note_count
    `, [job.id, job.id, job.id, job.id]);
    
    const jobStats = stats[0] || { crew_count: 0, truck_count: 0, item_count: 0, note_count: 0 };
    
    // Calculer les permissions basées sur la company de l'utilisateur
    const isOwner = userCompanyId !== null && parseInt(job.contractee_company_id) === parseInt(userCompanyId);
    const isAssigned = userCompanyId !== null && parseInt(job.contractor_company_id) === parseInt(userCompanyId);
    const isPending = job.assignment_status === 'pending';
    const isAccepted = job.assignment_status === 'accepted';
    const isDeclined = job.assignment_status === 'declined';
    const jobStatus = job.status || 'pending';
    
    // Permissions
    const permissions = {
      can_accept: isAssigned && isPending && jobStatus === 'pending',
      can_decline: isAssigned && isPending && jobStatus === 'pending',
      can_start: isAssigned && isAccepted && ['pending', 'accepted'].includes(jobStatus),
      can_complete: isAssigned && jobStatus === 'in-progress',
      can_cancel: isOwner && ['pending', 'accepted'].includes(jobStatus),
      can_edit: isOwner && ['pending', 'draft'].includes(jobStatus),
      can_reassign: isOwner && ['pending', 'declined'].includes(jobStatus),
      is_owner: isOwner,
      is_assigned: isAssigned,
      // Délégation B2B
      can_create_transfer: isOwner && ['pending','accepted','in-progress'].includes(jobStatus),
      can_cancel_transfer: isOwner,
      can_respond_transfer: !!userCompanyId && !isOwner
    };

    // Delegation active (pending transfer)
    const [activeTransferRows] = await connection.execute(
      `SELECT jt.*,
              sc.name AS sender_company_name, sc.company_code AS sender_company_code,
              rc.name AS recipient_company_name, rc.company_code AS recipient_company_code
       FROM job_transfers jt
       LEFT JOIN companies sc ON sc.id = jt.sender_company_id
       LEFT JOIN companies rc ON rc.id = jt.recipient_company_id
       WHERE jt.job_id = ? AND jt.status = 'pending'
       LIMIT 1`,
      [job.id]
    );
    const activeTransfer = activeTransferRows[0] || null;

    return res.json({ 
      success: true, 
      message: 'Job retrieved successfully',
      data: {
        job: {
          id: job.id,
          code: job.code,
          status: job.status,
          currentStep: job.current_step,
          
          // Assignment status info (NEW)
          assignment: {
            status: job.assignment_status || 'none',
            assignedAt: job.assigned_at,
            respondedAt: job.assignment_responded_at,
            respondedBy: job.assignment_responded_by_user_id ? {
              id: job.assignment_responded_by_user_id,
              firstName: job.responder_first_name,
              lastName: job.responder_last_name
            } : null,
            declineReason: job.assignment_decline_reason
          },
          
          // Client information
          client: {
            id: job.client_id,
            firstName: job.client_first_name,
            lastName: job.client_last_name,
            fullName: job.client_first_name && job.client_last_name 
              ? `${job.client_first_name} ${job.client_last_name}` 
              : null,
            phone: job.client_phone,
            email: job.client_email,
            type: job.client_type,
            status: job.client_status
          },
          
          // Contact information
          contact: {
            firstName: job.contact_first_name,
            lastName: job.contact_last_name,
            phone: job.contact_phone
          },
          
          // Scheduling
          schedule: {
            startWindowStart: job.start_window_start,
            startWindowEnd: job.start_window_end,
            endWindowStart: job.end_window_start,
            endWindowEnd: job.end_window_end
          },
          
          // Financial information
          payment: {
            status: job.payment_status,
            totalAmount: job.amount_total,
            amountWithoutTax: job.amount_without_tax,
            amountPaid: job.amount_paid,
            amountDue: job.amount_due,
            currency: job.currency,
            dueDate: job.due_date,
            method: job.payment_method,
            transactionId: job.transaction_id,
            // Le paiement va à la company exécutante (contractor)
            stripeAccountId: job.contractor_stripe_account_id
          },
          
          // Contractor information (exécutant du job) - ENRICHED
          contractor: {
            companyId: job.contractor_company_id,
            companyName: job.contractor_company_name,
            name: job.contractor_name,
            contactName: job.contractor_contact_name,
            phone: job.contractor_phone,
            email: job.contractor_email,
            stripeAccountId: job.contractor_stripe_account_id,
            assignedStaff: job.assigned_staff_id ? {
              id: job.assigned_staff_id,
              firstName: job.assigned_staff_first_name,
              lastName: job.assigned_staff_last_name
            } : null
          },
          
          // Contractee information (créateur du job) - ENRICHED
          contractee: {
            companyId: job.contractee_company_id,
            companyName: job.contractee_company_name,
            name: job.contractee_name,
            contactName: job.contractee_contact_name,
            phone: job.contractee_phone,
            email: job.contractee_email,
            stripeAccountId: job.contractee_stripe_account_id,
            createdBy: job.created_by_user_id ? {
              id: job.created_by_user_id,
              firstName: job.created_by_first_name,
              lastName: job.created_by_last_name,
              email: job.created_by_email
            } : null
          },
          
          // Timestamps
          createdAt: job.created_at,
          updatedAt: job.updated_at,

          // Counter proposal (négociation B2B)
          counter_proposed_start: job.counter_proposed_start || null,
          counter_proposed_end: job.counter_proposed_end || null,
          counter_proposed_at: job.counter_proposed_at || null,
          counter_proposal_note: job.counter_proposal_note || null,
        },
        
        // Délégation B2B active
        active_transfer: (function() {
          // Sera populé par le select ci-dessous via activeTransfer
          return typeof activeTransfer !== "undefined" ? activeTransfer : null;
        })(),
        // Permissions (NEW - basées sur l'utilisateur connecté)
        permissions: permissions,
        
        // Statistics
        stats: {
          crewCount: parseInt(jobStats.crew_count),
          truckCount: parseInt(jobStats.truck_count),
          itemCount: parseInt(jobStats.item_count),
          noteCount: parseInt(jobStats.note_count)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting job:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getJobByIdEndpoint };

// services/jobs.ts
import { ServerData } from "../constants/ServerData";
import { getAuthHeaders } from "../utils/auth";

const API = ServerData.serverUrl;

export interface JobAPI {
  id: string;
  code?: string; // Job code (e.g., JOB-TEST-20260124-947)
  status:
    | "pending"
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "declined";
  priority: "low" | "medium" | "high" | "urgent";
  client_id: string;
  assigned_staff_id?: string; // ID du staff assigné
  assigned_staff?: {
    // Infos du staff assigné (optionnel, retourné par l'API)
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
  };

  // New fields from API v1.1.0
  contractor_company_id?: number; // Auto-assigned company ID
  created_by_user_id?: number; // User who created the job
  created_by_first_name?: string;
  created_by_last_name?: string;
  created_by_email?: string;

  // New ownership fields (v1.2.0)
  assignment_status?: "none" | "pending" | "accepted" | "declined";
  contractee?: {
    company_id: number;
    company_name: string;
    created_by_user_id?: number;
    created_by_name?: string;
    stripe_account_id?: string;
  };
  contractor?: {
    company_id: number;
    company_name: string;
    assigned_staff_id?: string;
    assigned_staff_name?: string;
    assigned_at?: string;
  };
  permissions?: {
    is_owner: boolean;
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
    can_start: boolean;
    can_complete: boolean;
    can_edit: boolean;
  };

  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  contact?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  addresses: {
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  }[];
  time: {
    startWindowStart: string;
    startWindowEnd: string;
    endWindowStart?: string;
    endWindowEnd?: string;
  };
  truck?: {
    licensePlate: string;
    name: string;
  };
  estimatedDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  client_id: string;
  status?: JobAPI["status"];
  priority?: JobAPI["priority"];
  addresses: JobAPI["addresses"];
  time: JobAPI["time"];
  truck?: JobAPI["truck"];
  estimatedDuration?: number;
  notes?: string;
  assigned_staff_id?: string; // ID du staff à assigner lors de la création
  extras?: string[]; // Liste des extras (Piano, Pool Table, etc.)
  // Payment details
  amount_total?: number; // Montant total estimé/devis
  payment_method?: string; // cash, card, bank_transfer, invoice
  deposit_required?: boolean; // Acompte requis
  deposit_percentage?: number; // Pourcentage d'acompte (ex: 50)
  deposit_paid?: boolean; // Acompte déjà versé
}

export interface UpdateJobRequest {
  status?: JobAPI["status"];
  priority?: JobAPI["priority"];
  addresses?: JobAPI["addresses"];
  time?: JobAPI["time"];
  truck?: JobAPI["truck"];
  estimatedDuration?: number;
  notes?: string;
  assigned_staff_id?: string; // ID du staff à assigner
}

// Fonction helper pour faire des appels API avec retry automatique
async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<Response> {
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  });

  // 🔍 DIAGNOSTIC: Log de la réponse HTTP
  // TEMP_DISABLED: console.log(`🔍 [authenticatedFetch] ${options.method || 'GET'} ${url} → ${response.status} ${response.statusText}`);

  // Si 401/403 et qu'on n'a pas encore retry, tenter le refresh
  if (
    (response.status === 401 || response.status === 403) &&
    retryCount === 0
  ) {
    // TEMP_DISABLED: console.log('🔄 Token expired, attempting refresh...');

    const { refreshToken } = await import("../utils/auth");
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
      // TEMP_DISABLED: console.log('✅ Token refreshed, retrying request...');
      // Retry avec le nouveau token
      return authenticatedFetch(url, options, retryCount + 1);
    } else {
      const { clearSession } = await import("../utils/auth");
      await clearSession();

      // Optionnel: Rediriger vers login
      // NavigationService.navigate('Connection');
    }
  }

  return response;
}

/**
 * Récupère les jobs pour une période donnée (calendrier)
 * Utilise l'endpoint calendar-days qui retourne les données complètes et fiables
 */
export async function fetchJobs(
  startDate?: Date,
  endDate?: Date,
): Promise<JobAPI[]> {
  try {
    // Formater les dates pour l'API calendar-days (DD-MM-YYYY)
    const formatDateForAPI = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Si pas de dates fournies, utiliser le mois courant
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateFormatted = formatDateForAPI(start);
    const endDateFormatted = formatDateForAPI(end);

    console.log(
      `📡 [fetchJobs] Fetching jobs via calendar-days from ${startDateFormatted} to ${endDateFormatted}`,
    );

    const res = await authenticatedFetch(`${API}calendar-days`, {
      method: "POST",
      body: JSON.stringify({
        startDate: startDateFormatted,
        endDate: endDateFormatted,
      }),
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobs] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch jobs`);
    }

    const data = await res.json();

    // 🔍 DIAGNOSTIC: Analyser la structure de calendar-days
    console.log(
      "🔍 [fetchJobs] Calendar-days response:",
      JSON.stringify(data, null, 2),
    );

    // L'endpoint calendar-days peut retourner { jobs: [...] } ou directement [...]
    let jobsArray: any[] = [];

    if (Array.isArray(data)) {
      jobsArray = data;
      console.log(
        `✅ [fetchJobs] Direct array from calendar-days with ${jobsArray.length} jobs`,
      );
    } else if (data && data.jobs && Array.isArray(data.jobs)) {
      jobsArray = data.jobs;
      console.log(
        `✅ [fetchJobs] Jobs array from calendar-days with ${jobsArray.length} jobs`,
      );
    } else {
      console.warn(
        "⚠️ [fetchJobs] Unexpected calendar-days response format:",
        data,
      );
      return [];
    }

    return jobsArray;
  } catch (error) {
    console.error("❌ [fetchJobs] Error fetching jobs:", error);
    throw error;
  }
}

/**
 * Récupère un job spécifique par son ID
 */
export async function fetchJobById(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [fetchJobById] Fetching job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: "GET",
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobById] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [fetchJobById] Successfully fetched job');

    return data;
  } catch (error) {
    console.error("❌ [fetchJobById] Error fetching job:", error);
    throw error;
  }
}

/**
 * Crée un nouveau job
 */
export async function createJob(jobData: CreateJobRequest): Promise<JobAPI> {
  try {
    console.log(
      "📡 [createJob] Creating job with data:",
      JSON.stringify(jobData, null, 2),
    );

    // Convertir les données au format attendu par l'API (snake_case)
    const apiPayload = {
      client_id: jobData.client_id,
      status: jobData.status || "pending",
      priority: jobData.priority || "medium",
      // Convertir les champs time en snake_case pour l'API
      start_window_start: jobData.time?.startWindowStart || null,
      start_window_end: jobData.time?.startWindowEnd || null,
      end_window_start: jobData.time?.endWindowStart || null,
      end_window_end: jobData.time?.endWindowEnd || null,
      // Durée estimée
      estimated_duration: jobData.estimatedDuration || null,
      // Notes
      notes: jobData.notes || null,
      // Staff assigné
      assigned_staff_id: jobData.assigned_staff_id || null,
      // Extras
      extras: jobData.extras || [],
      // Truck info
      truck_name: jobData.truck?.name || null,
      truck_license_plate: jobData.truck?.licensePlate || null,
      // Adresses - format API (peut nécessiter un ajustement)
      addresses:
        jobData.addresses?.map((addr) => ({
          type: addr.type,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })) || [],
      // Payment details
      amount_total: jobData.amount_total || null,
      payment_method: jobData.payment_method || null,
      deposit_required: jobData.deposit_required ? 1 : 0,
      deposit_percentage: jobData.deposit_percentage || null,
      deposit_paid: jobData.deposit_paid ? 1 : 0,
    };

    console.log(
      "📡 [createJob] API payload (snake_case):",
      JSON.stringify(apiPayload, null, 2),
    );

    // L'API utilise /v1/job (singulier) et non /v1/jobs
    const res = await authenticatedFetch(`${API}v1/job`, {
      method: "POST",
      body: JSON.stringify(apiPayload),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "No error body");
      console.error(
        `❌ [createJob] HTTP ${res.status}: ${res.statusText}`,
        errorBody,
      );
      throw new Error(`HTTP ${res.status}: Failed to create job`);
    }

    const data = await res.json();
    console.log("✅ [createJob] Successfully created job:", data);

    return data;
  } catch (error) {
    console.error("❌ [createJob] Error creating job:", error);
    throw error;
  }
}

/**
 * Met à jour un job existant
 */
export async function updateJob(
  jobId: string,
  jobData: UpdateJobRequest,
): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [updateJob] Updating job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(jobData),
    });

    if (!res.ok) {
      console.error(`❌ [updateJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to update job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [updateJob] Successfully updated job');

    return data;
  } catch (error) {
    console.error("❌ [updateJob] Error updating job:", error);
    throw error;
  }
}

/**
 * Supprime un job
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    // TEMP_DISABLED: console.log('📡 [deleteJob] Deleting job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error(`❌ [deleteJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to delete job`);
    }

    // TEMP_DISABLED: console.log('✅ [deleteJob] Successfully deleted job');
  } catch (error) {
    console.error("❌ [deleteJob] Error deleting job:", error);
    throw error;
  }
}

/**
 * Démarre un job
 */
export async function startJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [startJob] Starting job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/start`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [startJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to start job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [startJob] Successfully started job');

    return data;
  } catch (error) {
    console.error("❌ [startJob] Error starting job:", error);
    throw error;
  }
}

/**
 * Met en pause un job
 */
export async function pauseJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [pauseJob] Pausing job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/pause`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [pauseJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to pause job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [pauseJob] Successfully paused job');

    return data;
  } catch (error) {
    console.error("❌ [pauseJob] Error pausing job:", error);
    throw error;
  }
}

/**
 * Reprend un job en pause
 */
export async function resumeJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [resumeJob] Resuming job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/resume`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [resumeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to resume job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [resumeJob] Successfully resumed job');

    return data;
  } catch (error) {
    console.error("❌ [resumeJob] Error resuming job:", error);
    throw error;
  }
}

/**
 * Complète un job
 */
export async function completeJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [completeJob] Completing job:', jobId);

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/complete`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [completeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to complete job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [completeJob] Successfully completed job');

    return data;
  } catch (error) {
    console.error("❌ [completeJob] Error completing job:", error);
    throw error;
  }
}

/**
 * Récupère les détails complets d'un job par son CODE (ex: JOB-NERD-URGENT-006)
 * Utilise l'endpoint /v1/job/:code/full
 * Si échec, retour à l'écran précédent
 */
export async function getJobDetails(jobCode: string): Promise<any> {
  // TEMP_DISABLED: console.log(`📡 [getJobDetails] Starting fetch for jobCode: ${jobCode}`);

  try {
    const fullUrl = `${API}v1/job/${jobCode}/full`;
    // TEMP_DISABLED: console.log(`📡 [getJobDetails] Fetching job details from URL: ${fullUrl}`);

    const res = await authenticatedFetch(fullUrl, {
      method: "GET",
    });

    if (!res.ok) {
      const error = `HTTP ${res.status}: ${res.statusText}`;
      console.error(`❌ [getJobDetails] ${error}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job details`);
    }

    const rawData = await res.json();

    // TEMP_DISABLED: console.log('✅ [getJobDetails] Successfully fetched job details from /full endpoint');
    // TEMP_DISABLED: console.log('🔍 [getJobDetails] /full endpoint raw response:', JSON.stringify(rawData, null, 2));

    // Transformer les données au format attendu par useJobDetails
    if (!rawData.success || !rawData.data) {
      throw new Error("Invalid response format from /full endpoint");
    }

    const { data } = rawData;

    // ✅ FIX: Transformer current_step en job.step.actualStep
    // L'API retourne current_step dans data.job ET dans data.workflow
    const currentStepFromAPI =
      data.job?.current_step || data.workflow?.current_step || 0;
    const totalStepsFromAPI =
      data.workflow?.total_steps || data.addresses?.length || 5;

    // TEMP_DISABLED: console.log('🔍 [getJobDetails] Step data from API:', {
    // jobCurrentStep: data.job?.current_step,
    // workflowCurrentStep: data.workflow?.current_step,
    // workflowTotalSteps: data.workflow?.total_steps,
    // finalCurrentStep: currentStepFromAPI,
    // finalTotalSteps: totalStepsFromAPI
    // });

    // ✅ OWNERSHIP: Construire les objets contractee/contractor à partir des données API
    // L'API retourne maintenant contractee_company, company, et assignment_status
    const contractorCompanyId = data.job?.contractor_company_id;
    const contracteeCompanyId = data.job?.contractee_company_id;
    const companyData = data.company; // Entreprise exécutante (contractor) - peut être absent pour job interne
    const contracteeCompanyData = data.contractee_company; // ✅ Entreprise créatrice - toujours présent
    const assignmentStatus = data.job?.assignment_status || "none";
    const isSameCompany = contracteeCompanyId === contractorCompanyId;

    console.log("🏢 [OWNERSHIP] Traitement des données d'entreprise:", {
      contractorCompanyId,
      contracteeCompanyId,
      hasCompanyData: !!companyData,
      hasContracteeCompanyData: !!contracteeCompanyData,
      assignmentStatus,
      isSameCompany,
    });

    let contractorObj = null;
    let contracteeObj = null;

    // Construire l'objet contractee (entreprise créatrice) EN PREMIER
    if (contracteeCompanyId && contracteeCompanyData) {
      contracteeObj = {
        company_id: contracteeCompanyId,
        company_name: contracteeCompanyData.name || "Entreprise",
        created_by_user_id: data.job?.created_by_user_id || undefined,
        created_by_name:
          data.job?.created_by_first_name && data.job?.created_by_last_name
            ? `${data.job.created_by_first_name} ${data.job.created_by_last_name}`
            : undefined,
        stripe_account_id: contracteeCompanyData.stripe_account_id || undefined,
      };
      console.log(
        `✅ [OWNERSHIP] Contractee construit (${isSameCompany ? "JOB INTERNE" : "MULTI-ENTREPRISE"}):`,
        contracteeObj,
      );
    }

    // Construire l'objet contractor (entreprise exécutante)
    if (contractorCompanyId) {
      if (isSameCompany && contracteeCompanyData) {
        // Job interne - Réutiliser les données de contractee_company
        contractorObj = {
          company_id: contractorCompanyId,
          company_name: contracteeCompanyData.name || "Entreprise",
          assigned_staff_id:
            data.job?.assigned_staff_id?.toString() || undefined,
          assigned_staff_name: data.crew?.[0]
            ? `${data.crew[0].first_name} ${data.crew[0].last_name}`
            : undefined,
          assigned_at: data.crew?.[0]?.assigned_at || undefined,
        };
        console.log(
          "✅ [OWNERSHIP] Contractor construit (JOB INTERNE - réutilise contractee):",
          contractorObj,
        );
      } else if (companyData) {
        // Job multi-entreprise - Utiliser company de l'API
        contractorObj = {
          company_id: contractorCompanyId,
          company_name: companyData.name || "Entreprise",
          assigned_staff_id:
            data.job?.assigned_staff_id?.toString() || undefined,
          assigned_staff_name: data.crew?.[0]
            ? `${data.crew[0].first_name} ${data.crew[0].last_name}`
            : undefined,
          assigned_at: data.crew?.[0]?.assigned_at || undefined,
        };
        console.log(
          "✅ [OWNERSHIP] Contractor construit (MULTI-ENTREPRISE - company API):",
          contractorObj,
        );
      } else {
        console.warn(
          "⚠️ [OWNERSHIP] Impossible de construire contractor - company absent pour job multi-entreprise",
        );
      }
    }

    // Calculer les permissions côté frontend
    // TODO: Idéalement, le backend devrait retourner ces permissions calculées
    const currentUserId = data.job?.current_user_id; // Si l'API le fournit
    const permissions = {
      is_owner: contracteeCompanyId === contractorCompanyId,
      is_assigned: !!data.job?.assigned_staff_id,
      can_accept:
        assignmentStatus === "pending" && !contractorObj?.assigned_staff_id,
      can_decline: assignmentStatus === "pending",
      can_start:
        assignmentStatus === "accepted" ||
        contracteeCompanyId === contractorCompanyId,
      can_complete: true,
      can_edit: true,
    };

    console.log("🔐 [OWNERSHIP] Permissions calculées:", permissions);

    // Format attendu par useJobDetails
    const transformedData = {
      job: {
        ...data.job,
        // ✅ AJOUTER: Créer job.step.actualStep pour la synchronisation
        step: {
          actualStep: currentStepFromAPI,
          totalSteps: totalStepsFromAPI,
        },
        // ✅ SIGNATURE: Assurer que signature_blob est bien récupéré
        signature_blob: data.job?.signature_blob || null,
        signature_date: data.job?.signature_date || null,
        // ✅ OWNERSHIP: Ajouter les objets transformés
        assignment_status: assignmentStatus,
        contractee: contracteeObj,
        contractor: contractorObj,
        permissions: permissions,
      },
      client: data.client,
      company: data.company,
      trucks: data.trucks || [],
      workers: data.crew || [], // Transformer 'crew' en 'workers'
      // ✅ AJOUTER: Transformer addresses en steps pour totalSteps
      steps: data.addresses || [],
      // ✅ AJOUTER: Garder workflow pour accès direct
      workflow: data.workflow || {},
      items: (data.items || []).map((item: any, index: number) => {
        const transformedItem = {
          ...item,
          id: item.id || item.item_id || `item_${index + 1}`, // Assurer qu'il y a un ID
          checked: item.checked || item.item_checked || false,
          item_checked: item.item_checked || item.checked || false,
        };
        // TEMP_DISABLED: console.log(`[getJobDetails] Item ${index}: Original ID=${item.id}, Final ID=${transformedItem.id}, Name="${item.name}"`);
        return transformedItem;
      }),
      notes: data.notes || [],
      timeline: data.timeline || [],
      addresses: data.addresses || [], // Ajouter les vraies adresses de l'API
    };

    console.log("🔄 [getJobDetails] Data transformed for useJobDetails:", {
      hasJob: !!transformedData.job,
      jobId: transformedData.job?.id,
      jobCode: transformedData.job?.code,
      hasClient: !!transformedData.client,
      clientName:
        `${transformedData.client?.firstName || ""} ${transformedData.client?.lastName || ""}`.trim(),
      trucksCount: transformedData.trucks.length,
      workersCount: transformedData.workers.length,
      itemsCount: transformedData.items.length,
      notesCount: transformedData.notes.length,
      addressesCount: transformedData.addresses.length,
      // 🏢 Ownership data
      hasContractee: !!transformedData.job.contractee,
      hasContractor: !!transformedData.job.contractor,
      assignmentStatus: transformedData.job.assignment_status,
      contracteeName: transformedData.job.contractee?.company_name,
      contractorName: transformedData.job.contractor?.company_name,
      isOwner: transformedData.job.permissions?.is_owner,
    });

    // TEMP_DISABLED: console.log('🔍 [getJobDetails] OLD LOG - addressesCount: transformedData.addresses.length,
    // ✅ AJOUTER: Log du step transformé
    // stepActualStep: transformedData.job?.step?.actualStep,
    // stepTotalSteps: transformedData.job?.step?.totalSteps,
    // ✅ SIGNATURE: Log des champs signature
    // hasSignatureBlob: !!transformedData.job?.signature_blob,
    // signatureBlobPreview: transformedData.job?.signature_blob ?
    // transformedData.job.signature_blob.substring(0, 50) + '...' : 'null',
    // signatureDate: transformedData.job?.signature_date
    // });

    // ✅ AJOUTER: Log détaillé du step pour debug
    // TEMP_DISABLED: console.log('🔍 [getJobDetails] Transformed job.step:', transformedData.job?.step);

    // TEMP_DISABLED: console.log('🏠 [getJobDetails] Addresses data:', JSON.stringify(transformedData.addresses, null, 2));

    return transformedData;
  } catch (error) {
    console.error("❌ [getJobDetails] Error fetching job details:", error);
    throw error;
  }
}

/**
 * Ajoute une note à un job
 */
export async function addJobNote(
  jobId: string,
  noteData: { type: string; content: string },
): Promise<any> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/jobs/${jobId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to add job note`);
  }

  const data = await res.json();
  return data;
}

/**
 * Récupère la timeline d'un job
 */
export async function fetchJobTimeline(jobId: string): Promise<any[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/jobs/${jobId}/timeline`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch job timeline`);
  }

  const data = await res.json();
  return data;
}

/**
 * Ajoute un nouvel item à un job
 */
export async function addJobItem(
  jobId: string,
  item: { name: string; quantity: number; description?: string },
) {
  // TEMP_DISABLED: console.log(`[addJobItem] Adding item to job ${jobId}:`, item);

  const headers = await getAuthHeaders();

  // Essayer plusieurs formats d'URL pour diagnostiquer le problème
  const urlsToTry = [
    `${API}swift-app/v1/job/${jobId}/item`, // Format de la doc
    `${API}/swift-app/v1/job/${jobId}/item`, // Avec slash
    `${API}v1/job/${jobId}/item`, // Sans swift-app
    `${API}/v1/job/${jobId}/item`, // Sans swift-app avec slash
    `${API}job/${jobId}/item`, // Format minimal
    `${API}/job/${jobId}/item`, // Format minimal avec slash
  ];

  // TEMP_DISABLED: console.log(`[addJobItem] API base URL: ${API}`);
  // TEMP_DISABLED: console.log(`[addJobItem] Auth headers:`, headers);

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      // TEMP_DISABLED: console.log(`[addJobItem] Response for ${url}: ${res.status} ${res.statusText}`);

      if (res.ok) {
        const data = await res.json();
        // TEMP_DISABLED: console.log(`[addJobItem] Success with URL: ${url}`, data);
        return data;
      } else if (res.status !== 404) {
        // Si ce n'est pas une 404, c'est peut-être le bon endpoint mais avec une autre erreur
        const errorText = await res.text();
        console.error(`[addJobItem] Non-404 error for ${url}:`, errorText);
      }
    } catch (error) {
      console.error(`[addJobItem] Network error for ${url}:`, error);
    }
  }

  // Si aucune URL n'a fonctionné
  throw new Error("Failed to add item: No working endpoint found");
}

/**
 * Met à jour un item d'un job
 */
/**
 * Récupère les items d'un job pour voir leur format exact
 */

// Fonction pour récupérer les détails du job avec ses items réels
export async function getJobWithItems(jobId: string) {
  // TEMP_DISABLED: console.log(`[getJobWithItems] Fetching job ${jobId} to see real item IDs`);

  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API}v1/job/${jobId}`, {
      method: "GET",
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      // TEMP_DISABLED: console.log(`[getJobWithItems] Job data:`, JSON.stringify(data, null, 2));

      if (data.items) {
        data.items = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          is_checked: item.is_checked,
        }));
      }

      return data;
    } else {
      const errorText = await res.text();
      console.error(`[getJobWithItems] API Error:`, errorText);
      return null;
    }
  } catch (error) {
    console.error(`[getJobWithItems] Network error:`, error);
    return null;
  }
}

export async function updateJobItem(
  jobId: string,
  itemId: string,
  updates: {
    name?: string;
    quantity?: number;
    is_checked?: boolean;
    completedQuantity?: number;
  },
) {
  // TEMP_DISABLED: console.log(`[updateJobItem] Updating item ${itemId} in job ${jobId} with:`, updates);

  const headers = await getAuthHeaders();

  // URL selon la spécification API fournie
  // API contient déjà /swift-app/, donc on ajoute juste v1/job/...
  const url = `${API}v1/job/${jobId}/item/${itemId}`;

  // Préparer le payload selon la spécification API
  const apiPayload: any = {};
  if (updates.name !== undefined) apiPayload.name = updates.name;
  if (updates.quantity !== undefined) apiPayload.quantity = updates.quantity;
  if (updates.is_checked !== undefined)
    apiPayload.is_checked = updates.is_checked;

  // TEMP_DISABLED: console.log(`[updateJobItem] PATCH ${url}`, apiPayload);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    // TEMP_DISABLED: console.log(`[updateJobItem] Response: ${res.status} ${res.statusText}`);

    if (res.ok) {
      const data = await res.json();
      // TEMP_DISABLED: console.log(`[updateJobItem] Success:`, data);
      return data;
    } else {
      const errorText = await res.text();
      console.error(`[updateJobItem] API Error:`, errorText);
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`[updateJobItem] Network/API error:`, error);
    throw error;
  }
}

/**
 * Accepter un job assigné
 * POST /v1/jobs/{job_id}/accept
 */
export async function acceptJob(
  jobId: string,
  notes?: string,
): Promise<{ success: boolean; message: string; data: any }> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/${jobId}/accept`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to accept job: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[acceptJob] Error accepting job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Refuser un job assigné
 * POST /v1/jobs/{job_id}/decline
 */
export async function declineJob(
  jobId: string,
  reason: string,
): Promise<{ success: boolean; message: string; data: any }> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/${jobId}/decline`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to decline job: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[declineJob] Error declining job ${jobId}:`, error);
    throw error;
  }
}

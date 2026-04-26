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
  assignment_status?:
    | "none"
    | "pending"
    | "accepted"
    | "declined"
    | "negotiating";
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
    is_owner: boolean; // Job interne (même entreprise)
    is_contractee: boolean; // Viewer = créateur du job
    is_contractor: boolean; // Viewer = exécutant (cessionnaire)
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
    can_start: boolean;
    can_complete: boolean;
    can_edit: boolean;
    can_delete: boolean;
    // Transferts B2B
    can_create_transfer?: boolean;
    can_cancel_transfer?: boolean;
    can_respond_transfer?: boolean;
    // Ressources (équipe & véhicule)
    can_assign_resources?: boolean;
  };

  // Transfert actif sur ce job (délégation B2B)
  active_transfer?: import("../types/jobTransfer").JobTransfer;

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
  difficulty?: "easy" | "medium" | "hard" | "expert" | null;
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
  // Pricing configuration
  hourly_rate?: number; // Taux horaire ($/h)
  minimum_hours?: number; // Heures minimum facturables (ex: 2)
  call_out_fee_minutes?: number; // Forfait déplacement en minutes (0 si depot-to-depot)
  depot_to_depot?: boolean; // true = tarification dépôt-à-dépôt
  time_rounding_minutes?: number; // Arrondi temps (1, 15, 30, 60)
  // Modular job templates
  template_id?: string; // ID du template modulaire utilisé
  segments?: import('../types/jobSegment').JobSegmentInstance[];
  billing_mode?: import('../types/jobSegment').BillingMode;
  return_trip_minutes?: number; // Durée configurable du retour (dépôt-à-dépôt)
  // Forfait (flat_rate)
  flat_rate_amount?: number; // Montant fixe du forfait
  flat_rate_max_hours?: number; // Limite horaire incluse
  flat_rate_overage_rate?: number; // Taux horaire si dépassement
}

export interface UpdateJobRequest {
  status?: JobAPI["status"];
  priority?: JobAPI["priority"];
  addresses?: JobAPI["addresses"];
  time?: JobAPI["time"];
  truck?: JobAPI["truck"];
  estimatedDuration?: number;
  notes?: string;
  difficulty?: JobAPI["difficulty"];
  assigned_staff_id?: string; // ID du staff à assigner
  payment_status?: string;
  payment_method?: string;
  payment_time?: string;
  amount_paid?: number;
  amount_due?: number;
  payment_details?: string;
  transaction_id?: string;
  currency?: string;
  // Deposit / acompte
  deposit_required?: boolean;
  deposit_percentage?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  deposit_status?: "none" | "link_sent" | "pending" | "paid";
  deposit_payment_link_url?: string;
  deposit_payment_link_id?: string;
  // Additional billing items (JSON array serialized)
  additional_items?: string;
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

  // Si 401/403 et qu'on n'a pas encore retry, tenter le refresh
  if (
    (response.status === 401 || response.status === 403) &&
    retryCount === 0
  ) {

    const { refreshToken } = await import("../utils/auth");
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
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

    // L'endpoint calendar-days peut retourner { jobs: [...] } ou directement [...]
    let jobsArray: any[] = [];

    if (Array.isArray(data)) {
      jobsArray = data;
    } else if (data && data.jobs && Array.isArray(data.jobs)) {
      jobsArray = data.jobs;
    } else {
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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: "GET",
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobById] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job`);
    }

    const data = await res.json();

    return data;
  } catch (error) {
    console.error("❌ [fetchJobById] Error fetching job:", error);
    throw error;
  }
}

/** Default coordinates per Australian state/territory — used when no GPS data is available */
const AU_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  NSW: { lat: -33.8688, lng: 151.2093 },
  VIC: { lat: -37.8136, lng: 144.9631 },
  QLD: { lat: -27.4698, lng: 153.0251 },
  WA: { lat: -31.9505, lng: 115.8605 },
  SA: { lat: -34.9285, lng: 138.6007 },
  TAS: { lat: -42.8821, lng: 147.3272 },
  NT: { lat: -12.4634, lng: 130.8456 },
  ACT: { lat: -35.2809, lng: 149.13 },
};

/**
 * Crée un nouveau job
 */
export async function createJob(jobData: CreateJobRequest): Promise<JobAPI> {
  try {

    // Convertir les données au format attendu par l'API (snake_case)
    const apiPayload: Record<string, unknown> = {
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
      // Truck info
      truck_name: jobData.truck?.name || null,
      truck_license_plate: jobData.truck?.licensePlate || null,
      // Extras - format API (confirmed working in docs)
      extras: jobData.extras || [],
      // Adresses - format API (lat/lng required by backend timezoneService)
      addresses:
        jobData.addresses?.map((addr) => {
          const fallback = AU_STATE_COORDS[addr.state?.toUpperCase()] ?? {
            lat: -33.8688,
            lng: 151.2093,
          };
          return {
            type: addr.type,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            lat: addr.latitude ?? fallback.lat,
            lng: addr.longitude ?? fallback.lng,
          };
        }) || [],
    };

    // Pricing fields
    if (jobData.hourly_rate != null) apiPayload.hourly_rate = jobData.hourly_rate;
    if (jobData.minimum_hours != null) apiPayload.minimum_hours = jobData.minimum_hours;
    if (jobData.call_out_fee_minutes != null) apiPayload.call_out_fee_minutes = jobData.call_out_fee_minutes;
    if (jobData.depot_to_depot != null) apiPayload.depot_to_depot = jobData.depot_to_depot ? 1 : 0;
    if (jobData.time_rounding_minutes != null) apiPayload.time_rounding_minutes = jobData.time_rounding_minutes;

    // Modular template fields
    if (jobData.template_id != null) apiPayload.modular_template_id = jobData.template_id;
    if (jobData.billing_mode != null) apiPayload.billing_mode = jobData.billing_mode;
    if (jobData.flat_rate_amount != null) apiPayload.flat_rate_amount = jobData.flat_rate_amount;
    if (jobData.flat_rate_max_hours != null) apiPayload.flat_rate_max_hours = jobData.flat_rate_max_hours;
    if (jobData.flat_rate_overage_rate != null) apiPayload.flat_rate_overage_rate = jobData.flat_rate_overage_rate;
    if (jobData.return_trip_minutes != null) apiPayload.return_trip_minutes = jobData.return_trip_minutes;


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

    // Init segments from template if a numeric template ID was provided
    if (jobData.template_id && data.job?.id) {
      const numericId = parseInt(String(jobData.template_id), 10);
      if (!isNaN(numericId) && numericId > 0) {
        try {
          const { initJobSegments } = await import('./jobSegmentApiService');
          await initJobSegments(data.job.id, numericId);
        } catch (segErr) {
          console.warn('⚠️ [createJob] Failed to init segments (non-blocking):', segErr);
        }
      }
    }

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

    const primaryUrl = `${API}v1/jobs/${jobId}`;
    const fallbackUrl = `${API}v1/job/${jobId}`;

    let res = await authenticatedFetch(primaryUrl, {
      method: "PATCH",
      body: JSON.stringify(jobData),
    });

    if (!res.ok && res.status === 404) {
      res = await authenticatedFetch(fallbackUrl, {
        method: "PATCH",
        body: JSON.stringify(jobData),
      });
    }

    if (!res.ok) {
      console.error(`❌ [updateJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to update job`);
    }

    const data = await res.json();

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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error(`❌ [deleteJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to delete job`);
    }

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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/start`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [startJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to start job`);
    }

    const data = await res.json();

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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/pause`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [pauseJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to pause job`);
    }

    const data = await res.json();

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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/resume`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [resumeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to resume job`);
    }

    const data = await res.json();

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

    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/complete`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error(`❌ [completeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to complete job`);
    }

    const data = await res.json();

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

  try {
    const fullUrl = `${API}v1/job/${jobCode}/full`;

    const res = await authenticatedFetch(fullUrl, {
      method: "GET",
    });

    if (!res.ok) {
      const error = `HTTP ${res.status}: ${res.statusText}`;
      console.error(`❌ [getJobDetails] ${error}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job details`);
    }

    const rawData = await res.json();


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
      } else {
      }
    }

    // Calculer les permissions selon le rôle du viewer (contractee = créateur, contractor = exécutant)
    // Le backend retourne viewer_company_id = company_id de l'utilisateur connecté
    const viewerCompanyId = data.viewer_company_id ?? null;
    // Fallback permissif si le backend ne retourne pas viewer_company_id
    const isContractee =
      !viewerCompanyId || viewerCompanyId === contracteeCompanyId;
    const isContractor =
      !isContractee && viewerCompanyId === contractorCompanyId;
    const permissions = {
      is_owner: isSameCompany, // Même entreprise = job interne
      is_contractee: isContractee, // Créateur du job
      is_contractor: isContractor, // Exécutant (cessionnaire)
      is_assigned: !!data.job?.assigned_staff_id,
      // Accepter/refuser : uniquement le contractor pour les transferts
      can_accept:
        assignmentStatus === "pending" && (isContractor || isSameCompany),
      can_decline:
        assignmentStatus === "pending" && (isContractor || isSameCompany),
      // Démarrer/compléter : le contractor ou job interne
      can_start: isContractor || isSameCompany,
      can_complete: true,
      // Éditer/supprimer : uniquement le contractee (créateur) ou job interne
      can_edit: isContractee || isSameCompany,
      can_delete: isContractee || isSameCompany,
      // Transferts : seul le contractee peut initier/annuler
      // Uniquement si aucune délégation en cours ("none") ou si refusée ("declined")
      can_create_transfer:
        (isContractee || isSameCompany) &&
        (assignmentStatus === "none" || assignmentStatus === "declined"),
      can_cancel_transfer: isContractee || isSameCompany,
      can_respond_transfer: isContractor,
      // Ressources : le contractor affecte son équipe une fois le job accepté
      can_assign_resources: isContractor || isSameCompany,
    };


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
        // ✅ DELEGATION: Transfert actif (remonté depuis data.active_transfer)
        active_transfer: data.active_transfer || null,
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
        return transformedItem;
      }),
      notes: data.notes || [],
      timeline: data.timeline || [],
      addresses: data.addresses || [], // Ajouter les vraies adresses de l'API
    };


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


      if (res.ok) {
        const data = await res.json();
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

  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API}v1/job/${jobId}`, {
      method: "GET",
      headers,
    });

    if (res.ok) {
      const data = await res.json();

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


  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });


    if (res.ok) {
      const data = await res.json();
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

/**
 * Faire une contre-proposition sur un job assigné
 * POST /v1/jobs/{job_id}/counter_proposal
 * Met assignment_status → "negotiating"
 */
export interface CounterProposalData {
  proposed_start: string; // ISO datetime
  proposed_end: string; // ISO datetime
  proposed_price?: number; // nouveau prix proposé en A$
  price_type?: "hourly" | "flat" | "daily"; // type de prix
  vehicle_id?: string | null; // véhicule proposé
  proposed_drivers?: number; // nombre de chauffeurs proposés
  proposed_offsiders?: number; // nombre d'offsiders proposés
  proposed_packers?: number; // nombre de packers proposés
  note?: string;
}

// ─────────────────────────────────────────────
// Type for pending contractor assignment
// ─────────────────────────────────────────────
export interface PendingAssignment {
  id: string;
  code: string | null;
  status: string;
  assignment_status: string;
  start_window_start: string;
  start_window_end: string;
  contractee_company_id: number | null;
  contractee_company_name: string | null;
  client_name: string | null;
  requested_drivers: number | null;
  requested_offsiders: number | null;
  pricing_amount: number | null;
  pricing_type: "flat" | "hourly" | "daily" | null;
  transfer_message: string | null;
}

export async function counterProposalJob(
  jobId: string,
  proposal: CounterProposalData,
): Promise<{ success: boolean; message: string; data: any }> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/${jobId}/counter_proposal`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proposal),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to submit counter proposal: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[counterProposalJob] Error for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Accepter une contre-proposition (côté contractee)
 * POST /v1/jobs/{job_id}/accept_counter_proposal
 * Met assignment_status → "accepted"
 */
export async function acceptCounterProposal(
  jobId: string,
): Promise<{ success: boolean; message: string; data: any }> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/${jobId}/accept_counter_proposal`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to accept counter proposal: ${response.status} ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error(`[acceptCounterProposal] Error for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Rejeter une contre-proposition (côté contractee) → retour à "pending"
 * POST /v1/jobs/{job_id}/reject_counter_proposal
 * Met assignment_status → "pending"
 */
export async function rejectCounterProposal(
  jobId: string,
  reason?: string,
): Promise<{ success: boolean; message: string; data: any }> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/${jobId}/reject_counter_proposal`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to reject counter proposal: ${response.status} ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error(`[rejectCounterProposal] Error for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * GET /v1/jobs/pending-assignments
 * Récupère tous les jobs en attente de réponse pour le contractor connecté.
 */
export async function fetchPendingAssignments(): Promise<PendingAssignment[]> {
  const headers = await getAuthHeaders();
  const url = `${API}v1/jobs/pending-assignments`;

  try {
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data?.data?.jobs ?? [];
  } catch (error) {
    console.error(`[fetchPendingAssignments] Error:`, error);
    return [];
  }
}

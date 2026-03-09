/**
 * Job Assignment Types
 *
 * Types pour l'affectation des ressources (staff + véhicules) aux jobs.
 * Correspond au modèle défini dans docs/AVAILABILITY_ASSIGNMENT_SPEC.md
 */

// ─────────────────────────────────────────────────────────────
// Enums & primitives
// ─────────────────────────────────────────────────────────────

export type AssignmentResourceType = "staff" | "vehicle";

export type AssignmentRole = "driver" | "offsider" | "supervisor" | "vehicle";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "replaced";

export type StaffingStatus =
  | "unassigned"
  | "partial"
  | "fully_staffed"
  | "conflict";

// ─────────────────────────────────────────────────────────────
// Resources (données jointes dans les réponses API)
// ─────────────────────────────────────────────────────────────

export interface StaffResource {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  type?: "employee" | "contractor";
  company_id?: number | null;
  company_name?: string;
}

export interface VehicleResource {
  id: number;
  name: string;
  license_plate: string;
  capacity?: string;
  company_id: number;
  /** Nom de la société propriétaire (rempli par l'API availability) */
  company_name?: string;
  /** Prix affiché (ex: "$120/h" ou "$450/job") — fourni par l'API availability */
  price?: string;
}

// ─────────────────────────────────────────────────────────────
// Conflits de disponibilité
// ─────────────────────────────────────────────────────────────

export interface AvailabilityConflict {
  conflicting_job_id: number;
  conflicting_job_code: string;
  overlap_start: string;
  overlap_end: string;
}

export interface ResourceAvailability {
  resource_type: AssignmentResourceType;
  resource_id: number;
  is_available: boolean;
  conflicts: AvailabilityConflict[];
}

// ─────────────────────────────────────────────────────────────
// Affectation principale
// ─────────────────────────────────────────────────────────────

export interface JobAssignment {
  id: number;
  job_id: number;
  job_transfer_id: number | null;
  assigned_by_company_id: number;

  resource_type: AssignmentResourceType;
  resource_id: number;
  role: AssignmentRole;
  status: AssignmentStatus;

  confirmed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;

  assigned_by_user_id: number;
  notified_at: string | null;

  created_at: string;
  updated_at: string;

  // Données jointes (réponses API enrichies)
  resource?: StaffResource | VehicleResource;
  assigned_by_user?: { firstName: string; lastName: string };
  conflict?: AvailabilityConflict | null;
}

// ─────────────────────────────────────────────────────────────
// Réponse liste (GET /jobs/:id/assignments)
// ─────────────────────────────────────────────────────────────

export interface ListAssignmentsResponse {
  data: JobAssignment[];
  staffing_status: StaffingStatus;
  required: { driver: number; offsider: number; vehicle: number };
  confirmed: { driver: number; offsider: number; vehicle: number };
}

// ─────────────────────────────────────────────────────────────
// Réponse disponibilité (GET /companies/:id/resources/availability)
// ─────────────────────────────────────────────────────────────

export interface AvailableStaff extends StaffResource {
  is_available: boolean;
  conflicts: AvailabilityConflict[];
}

export interface AvailableVehicle extends VehicleResource {
  is_available: boolean;
  conflicts: AvailabilityConflict[];
}

export interface CompanyAvailabilityResponse {
  data: {
    vehicles: AvailableVehicle[];
    staff: AvailableStaff[];
  };
}

// ─────────────────────────────────────────────────────────────
// Requêtes
// ─────────────────────────────────────────────────────────────

export interface CreateJobAssignmentRequest {
  resource_type: AssignmentResourceType;
  resource_id: number;
  role: AssignmentRole;
  /** Uniquement quand resource_type = 'vehicle' : nombre de chauffeurs requis */
  driver_count?: number;
  /** Uniquement quand resource_type = 'vehicle' : nombre d'offsiders requis */
  offsider_count?: number;
}

export interface RespondToAssignmentRequest {
  action: "confirm" | "decline";
  decline_reason?: string;
}

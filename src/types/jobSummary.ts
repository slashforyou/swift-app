/**
 * JobSummaryData — Typed shape of the `job` object used across the Summary page.
 *
 * This extends the base JobAPI interface with runtime fields added by jobDetails.tsx
 * (payment, signature, timer, steps, etc.).
 *
 * Used by: summary.tsx and all section components (JobStatusBanner, FinancialSummarySection,
 * QuickActionsSection, SignaturePreviewSection, CompanyDetailsSection, ContactDetailsSection,
 * ClientDetailsSection, AddressesSection, TimeWindowsSection, TruckDetailsSection,
 * JobTimerDisplay, etc.).
 */

import type { JobTimerInfo } from "../components/jobDetails/JobStepHistoryCard";
import type { JobAPI } from "../services/jobs";

// ────────────────────────────────────────
// Sub-types used on the local job object
// ────────────────────────────────────────

/** Dynamic step generated from addresses (JobStepsConfig) */
export interface JobDynamicStep {
  id: number;
  name: string;
  description?: string;
}

/** Step progress object (local UI state) */
export interface JobStepProgress {
  actualStep: number;
  steps?: JobDynamicStep[];
}

/** Address as stored on the local job object (superset of JobAPI.addresses) */
export interface JobAddress {
  id?: string | number;
  type: string; // "pickup" | "dropoff" | "intermediate" | string
  street: string;
  city: string;
  state: string;
  zip: string;
  position?: number;
  latitude?: number;
  longitude?: number;
}

/** Client as stored on the local job object (superset of JobAPI.client) */
export interface JobClient {
  id?: string;
  name?: string; // display name (merged from API)
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  type?: string;
}

/** Contact info */
export interface JobContact {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

/** Truck info */
export interface JobTruck {
  name?: string;
  licensePlate?: string;
}

/** Contractee (owner company) */
export interface JobContractee {
  company_id: number;
  company_name: string;
  created_by_user_id?: number;
  created_by_name?: string;
  stripe_account_id?: string;
}

/** Contractor (assigned company) */
export interface JobContractor {
  company_id: number;
  company_name: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  assigned_at?: string;
}

/** Time windows */
export interface JobTimeWindows {
  startWindowStart?: string;
  startWindowEnd?: string;
  endWindowStart?: string;
  endWindowEnd?: string;
}

/** Permissions */
export interface JobPermissions {
  is_owner: boolean;
  is_assigned: boolean;
  can_accept: boolean;
  can_decline: boolean;
  can_start: boolean;
  can_complete: boolean;
  can_edit: boolean;
}

// ────────────────────────────────────────
// Main type
// ────────────────────────────────────────

/**
 * Complete shape of the `job` object passed to summary components.
 *
 * Combines base JobAPI fields with runtime fields added in jobDetails.tsx
 * during the API→local-state merge (setJob callback).
 */
export interface JobSummaryData {
  // — Identity ——
  id: string | number;
  code?: string;

  // — Status ——
  status?: JobAPI["status"];
  assignment_status?: "none" | "pending" | "accepted" | "declined";

  // — Steps (dynamic, from JobStepsConfig) ——
  step?: JobStepProgress;
  steps?: JobDynamicStep[];

  // — People ——
  client?: JobClient;
  contact?: JobContact;

  // — Addresses ——
  addresses?: JobAddress[];

  // — Time windows (camelCase local + snake_case API passthrough) ——
  time?: JobTimeWindows;
  start_window_start?: string;
  start_window_end?: string;
  end_window_start?: string;
  end_window_end?: string;

  // — Truck ——
  truck?: JobTruck | null;

  // — Multi-company / ownership ——
  contractee?: JobContractee;
  contractor?: JobContractor;
  permissions?: JobPermissions;

  // — Timer / step history ——
  timer_info?: JobTimerInfo;

  // — Payment ——
  payment_status?: "paid" | "partial" | "pending" | string;
  amount_due?: number;
  amount_paid?: number;
  amount_total?: number;
  hourly_rate?: number;
  rate?: number;

  // — Signature ——
  signature_blob?: string;
  signature_date?: string;
  signatureDataUrl?: string;
  signatureFileUri?: string;

  // -- Notes (local) --
  notes?: {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    type: number;
  }[];

  // -- Items (local) --
  items?: {
    id: string | number;
    name: string;
    number?: number;
    checked: boolean;
    item_checked?: boolean;
  }[];

  // -- Payment details (legacy structure) --
  payment?: {
    status?: string;
    amount?: string;
    amountWithoutTax?: string;
    amountPaid?: string;
    amountToBePaid?: string;
    currency?: string;
    dueDate?: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentLink?: string;
    paymentTime?: string;
    paymentDetails?: string;
    taxe?: {
      gst?: string;
      gstRate?: number;
      amountWithoutTax?: string;
    };
    savedCards?: {
      id: number;
      cardNumber: string;
      cardHolderName: string;
      expiryDate: string;
      cvv: string;
    }[];
  };

  // -- Crew (local) --
  crew?: unknown[];

  // -- Transfert actif (délégation B2B) --
  active_transfer?: import("./jobTransfer").JobTransfer;

  // -- Staffing (Phase 1 affectations) --
  staffing_status?: import("./jobAssignment").StaffingStatus;
  /** Ressources requises (depuis job_transfers ou mise à jour par B) */
  required_driver?: number;
  required_offsider?: number;
  required_vehicle?: number;

  // -- Dates --
  createdAt?: string;
  updatedAt?: string;

  // -- Misc / inherited from JobAPI --
  estimatedDuration?: number;
  priority?: JobAPI["priority"];
}

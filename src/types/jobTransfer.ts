/**
 * Job Transfer Types
 *
 * Types pour la délégation de job entre entreprises.
 * Correspond au modèle défini dans docs/JOB_TRANSFER_SPEC.md
 */

// ─────────────────────────────────────────────────────────────
// Transfert de job
// ─────────────────────────────────────────────────────────────

export type TransferDelegatedRole =
  | "driver"
  | "offsider"
  | "full_job"
  | "custom";

export type TransferPricingType = "hourly" | "flat";

export type HourCountingType = "depot_to_depot" | "site_only";

export type TransferStatus =
  | "pending" // Envoyé — attend la validation du contractor
  | "negotiating" // Contractor contre-propose — attend la validation du contractee
  | "accepted" // L'un des acteurs a accepté
  | "declined" // L'un des acteurs a refusé
  | "cancelled"; // Annulé par le contractee avant réponse

export type TransferRecipientType = "company" | "contractor";

export interface JobTransfer {
  id: number;
  job_id: string;

  sender_company_id: number;
  sender_company_name: string;
  sender_user_id: number;

  recipient_type: TransferRecipientType;
  recipient_company_id?: number;
  recipient_company_name?: string;
  recipient_contractor_id?: number;
  recipient_contractor_name?: string;

  delegated_role: TransferDelegatedRole;
  delegated_role_label?: string; // Uniquement si role = 'custom'

  pricing_type: TransferPricingType;
  pricing_amount: number;
  pricing_currency: string;
  hour_counting_type?: HourCountingType;

  status: TransferStatus;
  message?: string;
  decline_reason?: string;

  /** Renseigné quand status = 'negotiating' (contre-proposition du contractor) */
  counter_offer_amount?: number;
  counter_offer_message?: string;
  counter_offered_at?: string;
  /** Qui a fait la contre-proposition */
  counter_offered_by?: "contractor";

  // Resource requirements (specified by sender)
  requested_drivers?: number;
  requested_offsiders?: number;
  preferred_truck_id?: number;
  resource_note?: string;

  responded_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobTransferRequest {
  recipient_type: TransferRecipientType;
  recipient_company_id?: number;
  recipient_contractor_id?: number;
  delegated_role: TransferDelegatedRole;
  delegated_role_label?: string;
  pricing_type: TransferPricingType;
  pricing_amount: number;
  hour_counting_type?: HourCountingType;
  message?: string;
  vehicle_id?: number;
  vehicle_label?: string;
  // Resource requirements
  requested_drivers?: number;
  requested_offsiders?: number;
  preferred_truck_id?: number;
  resource_note?: string;
}

export interface RespondToTransferRequest {
  action: "accept" | "decline" | "counter";
  decline_reason?: string;
  /** Uniquement si action = 'counter' */
  counter_offer?: {
    pricing_amount: number;
    message?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Carnet de relations
// ─────────────────────────────────────────────────────────────

export type RelatedEntityType = "company" | "contractor";

export interface CompanyRelation {
  id: number;
  owner_company_id: number;
  related_type: RelatedEntityType;
  related_company_id?: number;
  related_company_name?: string;
  related_company_code?: string;
  related_contractor_id?: number;
  related_contractor_name?: string;
  nickname?: string;
  last_used_at?: string;
  created_at: string;
}

export interface SaveRelationRequest {
  related_type: RelatedEntityType;
  related_company_id?: number;
  related_contractor_id?: number;
  nickname?: string;
}

export interface UpdateRelationRequest {
  nickname: string;
}

// ─────────────────────────────────────────────────────────────
// Trucks publics d'un partenaire
// ─────────────────────────────────────────────────────────────

export interface PublicTruck {
  id: number;
  name: string;
  license_plate?: string;
  capacity?: string;
  vehicle_type?: string;
  color?: string;
}

export interface CompanyLookupResult {
  id: number;
  name: string;
  company_code: string;
  logo_url?: string;
  is_already_saved: boolean;
  trucks?: PublicTruck[];
}

// ─────────────────────────────────────────────────────────────
// Labels utilitaires
// ─────────────────────────────────────────────────────────────

export const DELEGATED_ROLE_LABELS: Record<TransferDelegatedRole, string> = {
  driver: "Chauffeur",
  offsider: "Offsider",
  full_job: "Job entier",
  custom: "Autre",
};

export const PRICING_TYPE_LABELS: Record<TransferPricingType, string> = {
  hourly: "À l'heure",
  flat: "Forfait",
};

export const HOUR_COUNTING_LABELS: Record<HourCountingType, string> = {
  depot_to_depot: "Dépôt à dépôt",
  site_only: "Sur site uniquement",
};

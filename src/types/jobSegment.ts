/**
 * Types pour les segments de job modulaires
 * Permet le calcul précis des heures payées/non payées par employé et par segment
 */

// Types de segments de temps
export type SegmentType = 'location' | 'travel' | 'storage' | 'loading' | 'service';

// Types de lieux
export type LocationType =
  | 'house'
  | 'apartment'
  | 'garage'
  | 'private_storage'
  | 'depot'
  | 'office'
  | 'other';

// Mode de facturation du template
export type BillingMode =
  | 'location_to_location' // Heures facturées du 1er lieu au dernier lieu
  | 'depot_to_depot' // Heures facturées du départ dépôt au retour dépôt
  | 'flat_rate' // Montant forfaitaire fixe (heures trackées pour analyse)
  | 'packing_only' // Seuls les segments location (packing) sont facturés
  | 'unpacking_only'; // Seuls les segments location (unpacking) sont facturés

// Un segment dans un template (définition réutilisable)
export interface JobSegmentTemplate {
  id: string;
  order: number;
  type: SegmentType;
  serviceType?: string; // 'packing' | 'unpacking' | 'cleaning' | 'painting' | etc. (si type === 'service')
  label: string; // "Lieu N°1", "Trajet A→B"
  locationType?: LocationType; // Pour 'location', 'storage', 'loading'
  isBillable: boolean;
  estimatedDurationMinutes?: number;
  requiredRoles?: string[]; // ["driver", "packer", "offsider"]
}

// Instance runtime d'un segment (pendant/après le job)
export interface JobSegmentInstance {
  id: string;
  templateSegmentId: string;
  order: number;
  type: SegmentType;
  serviceType?: string; // Si type === 'service'
  label: string;
  locationType?: LocationType;
  isBillable: boolean;

  // Timing réel
  startedAt?: string; // ISO timestamp
  completedAt?: string;
  durationMs?: number;

  // Employés assignés
  assignedEmployees: SegmentEmployeeAssignment[];

  // Pour les trajets retour configurables
  isReturnTrip?: boolean;
  configuredDurationMinutes?: number;
}

// Assignation employé ↔ segment
export interface SegmentEmployeeAssignment {
  employeeId: string;
  employeeName: string;
  role: string; // 'driver' | 'packer' | 'offsider' | 'mover'
  workedDurationMs?: number;
  hourlyRate?: number;
  cost?: number;
}

// Option ajoutable au forfait (page paiement)
export interface FlatRateOption {
  id: string;
  label: string; // "Piano", "Démontage lit", "Emballage fragile"
  price: number; // Montant fixe en AUD
  isSelected?: boolean; // Choisi par le patron au paiement
}

// Template de job modulaire complet
export interface ModularJobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  billingMode: BillingMode;
  segments: JobSegmentTemplate[];

  // Config facturation — modes horaires
  defaultHourlyRate?: number;
  minimumHours?: number;
  timeRoundingMinutes?: number; // 1, 15, 30, 60
  returnTripDefaultMinutes?: number;

  // Config facturation — mode forfait (flat_rate)
  flatRateAmount?: number; // Montant fixe du forfait
  flatRateMaxHours?: number; // Limite horaire incluse (ex: 8h)
  flatRateOverageRate?: number; // Taux horaire si dépassement
  flatRateOptions?: FlatRateOption[]; // Options ajoutables au paiement

  // Méta
  isDefault?: boolean;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// RÉCAPITULATIF POST-JOB
// ============================================================================

// Récapitulatif complet post-job
export interface JobTimeBreakdown {
  jobId: string;
  billingMode: BillingMode;
  totalDurationMs: number;
  billableDurationMs: number;
  nonBillableDurationMs: number;

  segments: JobSegmentBreakdown[];
  employees: EmployeeJobBreakdown[];

  // Coût horaire (modes location_to_location, depot_to_depot, packing, unpacking)
  hourlyCost: number;

  // Forfait (mode flat_rate)
  flatRateAmount?: number; // Montant de base du forfait
  flatRateMaxHours?: number; // Limite horaire incluse
  flatRateOverageHours?: number; // Heures en dépassement
  flatRateOverageCost?: number; // Coût du dépassement
  selectedOptions?: FlatRateOption[]; // Options choisies
  optionsTotalCost?: number; // Total des options

  totalCost: number; // hourlyCost OU flatRate + overage + options
}

// Détail d'un segment dans le récapitulatif
export interface JobSegmentBreakdown {
  segmentId: string;
  label: string;
  type: SegmentType;
  durationMs: number;
  isBillable: boolean;
  employees: SegmentEmployeeAssignment[];
  segmentCost: number;
}

// Détail d'un employé dans le récapitulatif
export interface EmployeeJobBreakdown {
  employeeId: string;
  employeeName: string;
  role: string;
  totalWorkedMs: number;
  billableWorkedMs: number;
  hourlyRate: number;
  totalCost: number;
  segments: { segmentLabel: string; durationMs: number; cost: number }[];
}

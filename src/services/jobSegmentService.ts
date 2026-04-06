/**
 * Job Segment Service — Logique métier pour les segments modulaires
 *
 * Fonctions principales :
 * - Créer les segments depuis un template
 * - Appliquer les 5 modes de facturation
 * - Calculer les coûts par segment et par employé
 * - Générer le récapitulatif post-job
 */

import type {
    BillingMode,
    EmployeeJobBreakdown,
    FlatRateOption,
    JobSegmentBreakdown,
    JobSegmentInstance,
    JobTimeBreakdown,
    ModularJobTemplate
} from '../types/jobSegment';

// Génération d'ID unique sans dépendance externe
function generateId(): string {
  return `seg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// CRÉATION DES SEGMENTS
// ============================================================================

/**
 * Créer les instances de segments depuis un template modulaire
 */
export function createSegmentsFromTemplate(
  template: ModularJobTemplate,
): JobSegmentInstance[] {
  return template.segments.map((seg) => ({
    id: generateId(),
    templateSegmentId: seg.id,
    order: seg.order,
    type: seg.type,
    label: seg.label,
    locationType: seg.locationType,
    isBillable: seg.isBillable,
    assignedEmployees: [],
  }));
}

// ============================================================================
// APPLICATION DU MODE DE FACTURATION
// ============================================================================

/**
 * Applique le mode de facturation aux segments (met à jour isBillable)
 *
 * - location_to_location : billable du 1er 'location' au dernier 'location'
 *   (trajets entre lieux = billable, départ/retour dépôt = non billable)
 * - depot_to_depot : tout billable de DEPARTURE à RETURN_TO_DEPOT
 *   (retour = configuredDurationMinutes si fourni)
 * - flat_rate : tout tracké mais rien marqué billable
 *   (le coût est le forfait + options + éventuel surplus horaire)
 * - packing_only / unpacking_only : seuls les segments type 'location' sont billable
 */
export function applyBillingMode(
  segments: JobSegmentInstance[],
  billingMode: BillingMode,
  returnTripMinutes?: number,
): JobSegmentInstance[] {
  const sorted = [...segments].sort((a, b) => a.order - b.order);

  switch (billingMode) {
    case 'location_to_location':
      return applyLocationToLocation(sorted);
    case 'depot_to_depot':
      return applyDepotToDepot(sorted, returnTripMinutes);
    case 'flat_rate':
      return applyFlatRate(sorted);
    case 'packing_only':
    case 'unpacking_only':
      return applyPackingOnly(sorted);
    default:
      return sorted;
  }
}

function applyLocationToLocation(
  segments: JobSegmentInstance[],
): JobSegmentInstance[] {
  // Trouver le premier et dernier segment de type 'location'
  const firstLocationIdx = segments.findIndex((s) => s.type === 'location');
  const lastLocationIdx = findLastIndex(segments, (s) => s.type === 'location');

  if (firstLocationIdx === -1 || lastLocationIdx === -1) {
    return segments;
  }

  return segments.map((seg, idx) => ({
    ...seg,
    isBillable: idx >= firstLocationIdx && idx <= lastLocationIdx,
  }));
}

function applyDepotToDepot(
  segments: JobSegmentInstance[],
  returnTripMinutes?: number,
): JobSegmentInstance[] {
  return segments.map((seg) => {
    const updated = { ...seg, isBillable: true };
    // Marquer le trajet retour avec la durée configurable
    if (seg.isReturnTrip && returnTripMinutes != null) {
      updated.configuredDurationMinutes = returnTripMinutes;
    }
    return updated;
  });
}

function applyFlatRate(segments: JobSegmentInstance[]): JobSegmentInstance[] {
  // Tout est tracké mais rien n'est marqué billable (le coût est le forfait)
  return segments.map((seg) => ({
    ...seg,
    isBillable: false,
  }));
}

function applyPackingOnly(
  segments: JobSegmentInstance[],
): JobSegmentInstance[] {
  // Seuls les segments de type 'location' sont facturables
  return segments.map((seg) => ({
    ...seg,
    isBillable: seg.type === 'location',
  }));
}

// ============================================================================
// CALCUL DES COÛTS
// ============================================================================

/**
 * Calculer le coût forfaitaire (mode flat_rate)
 */
export function calculateFlatRateCost(
  totalTrackedMs: number,
  flatRateAmount: number,
  maxHours?: number,
  overageRate?: number,
  selectedOptions?: FlatRateOption[],
): {
  baseCost: number;
  overageHours: number;
  overageCost: number;
  optionsCost: number;
  total: number;
} {
  const baseCost = flatRateAmount;
  let overageHours = 0;
  let overageCost = 0;

  // Calcul du dépassement
  if (maxHours != null && overageRate != null) {
    const totalHours = totalTrackedMs / (1000 * 60 * 60);
    if (totalHours > maxHours) {
      overageHours = totalHours - maxHours;
      overageCost = overageHours * overageRate;
    }
  }

  // Coût total des options sélectionnées
  const optionsCost = (selectedOptions ?? [])
    .filter((opt) => opt.isSelected)
    .reduce((sum, opt) => sum + opt.price, 0);

  return {
    baseCost,
    overageHours,
    overageCost,
    optionsCost,
    total: baseCost + overageCost + optionsCost,
  };
}

/**
 * Calculer le coût d'un segment (mode horaire)
 */
export function calculateSegmentCost(
  segment: JobSegmentInstance,
  hourlyRate: number,
): number {
  if (!segment.isBillable || !segment.durationMs) {
    return 0;
  }

  // Si durée configurée manuellement (retour configurable), l'utiliser
  const effectiveDurationMs =
    segment.configuredDurationMinutes != null
      ? segment.configuredDurationMinutes * 60 * 1000
      : segment.durationMs;

  const hours = effectiveDurationMs / (1000 * 60 * 60);

  // Coût par employé assigné (chacun a son propre taux)
  if (segment.assignedEmployees.length > 0) {
    return segment.assignedEmployees.reduce((total, emp) => {
      const empRate = emp.hourlyRate ?? hourlyRate;
      return total + hours * empRate;
    }, 0);
  }

  // Fallback : taux unique pour le segment
  return hours * hourlyRate;
}

// ============================================================================
// RÉCAPITULATIF POST-JOB
// ============================================================================

/**
 * Générer le récapitulatif complet post-job
 */
export function calculateJobBreakdown(
  jobId: string,
  segments: JobSegmentInstance[],
  billingMode: BillingMode,
  hourlyRate: number,
  flatRateConfig?: {
    amount: number;
    maxHours?: number;
    overageRate?: number;
    selectedOptions?: FlatRateOption[];
  },
): JobTimeBreakdown {
  const sorted = [...segments].sort((a, b) => a.order - b.order);

  // Durées totales
  const totalDurationMs = sorted.reduce(
    (sum, s) => sum + (s.durationMs ?? 0),
    0,
  );
  const billableDurationMs = sorted
    .filter((s) => s.isBillable)
    .reduce((sum, s) => {
      const effectiveMs =
        s.configuredDurationMinutes != null
          ? s.configuredDurationMinutes * 60 * 1000
          : (s.durationMs ?? 0);
      return sum + effectiveMs;
    }, 0);
  const nonBillableDurationMs = totalDurationMs - billableDurationMs;

  // Détail par segment
  const segmentBreakdowns: JobSegmentBreakdown[] = sorted.map((seg) => ({
    segmentId: seg.id,
    label: seg.label,
    type: seg.type,
    durationMs: seg.durationMs ?? 0,
    isBillable: seg.isBillable,
    employees: seg.assignedEmployees,
    segmentCost: calculateSegmentCost(seg, hourlyRate),
  }));

  // Détail par employé — agréger par employeeId
  const employeeMap = new Map<string, EmployeeJobBreakdown>();

  for (const seg of sorted) {
    for (const emp of seg.assignedEmployees) {
      const effectiveDurationMs =
        seg.configuredDurationMinutes != null
          ? seg.configuredDurationMinutes * 60 * 1000
          : (seg.durationMs ?? 0);
      const empRate = emp.hourlyRate ?? hourlyRate;
      const segCost = seg.isBillable
        ? (effectiveDurationMs / (1000 * 60 * 60)) * empRate
        : 0;

      const existing = employeeMap.get(emp.employeeId);
      if (existing) {
        existing.totalWorkedMs += effectiveDurationMs;
        existing.billableWorkedMs += seg.isBillable ? effectiveDurationMs : 0;
        existing.totalCost += segCost;
        existing.segments.push({
          segmentLabel: seg.label,
          durationMs: effectiveDurationMs,
          cost: segCost,
        });
      } else {
        employeeMap.set(emp.employeeId, {
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          role: emp.role,
          totalWorkedMs: effectiveDurationMs,
          billableWorkedMs: seg.isBillable ? effectiveDurationMs : 0,
          hourlyRate: empRate,
          totalCost: segCost,
          segments: [
            {
              segmentLabel: seg.label,
              durationMs: effectiveDurationMs,
              cost: segCost,
            },
          ],
        });
      }
    }
  }

  const employees = Array.from(employeeMap.values());

  // Coût total horaire
  const hourlyCost = segmentBreakdowns.reduce(
    (sum, s) => sum + s.segmentCost,
    0,
  );

  // Mode forfait
  const breakdown: JobTimeBreakdown = {
    jobId,
    billingMode,
    totalDurationMs,
    billableDurationMs,
    nonBillableDurationMs,
    segments: segmentBreakdowns,
    employees,
    hourlyCost,
    totalCost: hourlyCost,
  };

  if (billingMode === 'flat_rate' && flatRateConfig) {
    const flatResult = calculateFlatRateCost(
      totalDurationMs,
      flatRateConfig.amount,
      flatRateConfig.maxHours,
      flatRateConfig.overageRate,
      flatRateConfig.selectedOptions,
    );

    breakdown.flatRateAmount = flatResult.baseCost;
    breakdown.flatRateMaxHours = flatRateConfig.maxHours;
    breakdown.flatRateOverageHours = flatResult.overageHours;
    breakdown.flatRateOverageCost = flatResult.overageCost;
    breakdown.selectedOptions = flatRateConfig.selectedOptions?.filter(
      (o) => o.isSelected,
    );
    breakdown.optionsTotalCost = flatResult.optionsCost;
    breakdown.totalCost = flatResult.total;
  }

  return breakdown;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Trouver le dernier index correspondant à un prédicat
 */
function findLastIndex<T>(
  arr: T[],
  predicate: (item: T) => boolean,
): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

/**
 * Formater une durée en millisecondes en heures et minutes lisibles
 */
export function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

/**
 * Arrondir une durée en ms selon le rounding configuré
 */
export function roundDuration(
  durationMs: number,
  roundingMinutes: number,
): number {
  if (roundingMinutes <= 1) return durationMs;

  const roundingMs = roundingMinutes * 60 * 1000;
  return Math.ceil(durationMs / roundingMs) * roundingMs;
}

/**
 * Obtenir l'icône d'un type de segment
 */
export function getSegmentIcon(type: string): string {
  switch (type) {
    case 'location':
      return 'location-outline';
    case 'travel':
      return 'car-outline';
    case 'storage':
      return 'filing-outline';
    case 'loading':
      return 'cube-outline';
    default:
      return 'ellipse-outline';
  }
}

/**
 * Obtenir la couleur d'un type de segment
 */
export function getSegmentColor(type: string): string {
  switch (type) {
    case 'location':
      return '#3B82F6'; // Bleu
    case 'travel':
      return '#8B5CF6'; // Violet
    case 'storage':
      return '#EF4444'; // Rouge
    case 'loading':
      return '#F59E0B'; // Orange
    default:
      return '#6B7280'; // Gris
  }
}

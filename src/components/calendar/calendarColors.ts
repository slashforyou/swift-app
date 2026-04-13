/**
 * calendarColors — Utility for #27 color coding in calendar views.
 * Returns a color for a job based on the selected "colorBy" mode.
 */

import type { CalendarFilterState } from "./CalendarFilters";

// ── Palettes ──────────────────────

/** Status-based colors */
const STATUS_COLORS: Record<string, string> = {
  pending: "#F97316", // orange
  assigned: "#F97316",
  accepted: "#F97316",
  "in-progress": "#FBBF24", // yellow
  in_progress: "#FBBF24",
  completed: "#10B981", // green
  cancelled: "#9CA3AF", // gray
  declined: "#EF4444", // red
  overdue: "#EF4444",
};

/** Priority-based colors */
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#3B82F6",
  low: "#6B7280",
};

/**
 * Stable palette for vehicle / team assignment.
 * We use a set of visually distinct hues that also work in dark mode.
 */
const ENTITY_PALETTE = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#EF4444", // red
  "#A855F7", // purple
  "#F59E0B", // amber
];

// Simple cache: entity id → palette index
const _vehicleColorMap = new Map<string, string>();
const _staffColorMap = new Map<string, string>();

function getEntityColor(
  id: string,
  map: Map<string, string>,
  idxRef: { current: number },
): string {
  if (!id) return "#9CA3AF";
  const existing = map.get(id);
  if (existing) return existing;
  const color = ENTITY_PALETTE[idxRef.current % ENTITY_PALETTE.length];
  map.set(id, color);
  idxRef.current++;
  return color;
}

const vehicleIdxRef = { current: 0 };
const staffIdxRef = { current: 0 };

// ── Main function ──────────────────────

/**
 * Get the display color for a job card in the calendar.
 * @param job  — raw job object (from API or local)
 * @param colorBy — the current colorBy mode from CalendarFilterState
 * @param fallback — optional fallback color (defaults to #3B82F6)
 */
export function getJobCalendarColor(
  job: any,
  colorBy: CalendarFilterState["colorBy"],
  fallback = "#3B82F6",
): string {
  switch (colorBy) {
    case "status":
      return STATUS_COLORS[job.status] || fallback;

    case "priority":
      return PRIORITY_COLORS[job.priority] || fallback;

    case "vehicle": {
      // Try truck.id, truck_id, preferred_truck_id
      const vehicleId =
        job.truck?.id?.toString() ||
        job.truck_id?.toString() ||
        job.preferred_truck_id?.toString() ||
        "";
      return vehicleId
        ? getEntityColor(vehicleId, _vehicleColorMap, vehicleIdxRef)
        : "#9CA3AF";
    }

    case "team": {
      // Use contractor company_id or assigned staff
      const teamId =
        job.contractor?.company_id?.toString() ||
        job.assigned_staff_id?.toString() ||
        "";
      return teamId
        ? getEntityColor(teamId, _staffColorMap, staffIdxRef)
        : "#9CA3AF";
    }

    default:
      return fallback;
  }
}

/** Get status color directly (for backward compat) */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "#9CA3AF";
}

/** Get priority color directly */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] || "#3B82F6";
}

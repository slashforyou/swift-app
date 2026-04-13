/**
 * CalendarFilters — Barre de filtres réutilisable pour les vues calendrier.
 * Filtres : statut job, véhicule, membre du personnel.
 * S'utilise dans weekScreen, monthScreen, dayScreen.
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

// ── Types ──────────────────────

export interface CalendarFilterState {
  status: string; // "" = all, "pending", "in-progress", "completed"
  vehicleId: string; // "" = all
  staffId: string; // "" = all
  colorBy: "status" | "priority" | "vehicle" | "team"; // #27 color coding
}

export const DEFAULT_FILTERS: CalendarFilterState = {
  status: "",
  vehicleId: "",
  staffId: "",
  colorBy: "status",
};

interface VehicleOption {
  id: string;
  name: string;
  licensePlate?: string;
}

interface StaffOption {
  id: string;
  name: string;
}

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  onFiltersChange: (filters: CalendarFilterState) => void;
  vehicles?: VehicleOption[];
  staff?: StaffOption[];
  /** Compact mode for tight spaces (week view) */
  compact?: boolean;
}

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  onFiltersChange,
  vehicles = [],
  staff = [],
  compact = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // ── Status filter options ──────────────────────

  const statusOptions = useMemo(
    () => [
      { key: "", label: t("calendar.filters.all"), icon: "apps" as const },
      {
        key: "pending",
        label: t("calendar.filters.pending"),
        icon: "time" as const,
      },
      {
        key: "in-progress",
        label: t("calendar.filters.active"),
        icon: "play-circle" as const,
      },
      {
        key: "completed",
        label: t("calendar.filters.done"),
        icon: "checkmark-circle" as const,
      },
    ],
    [t],
  );

  // ── Color-by options ──────────────────────

  const colorByOptions = useMemo(
    () => [
      {
        key: "status" as const,
        label: t("calendar.colorBy.status") || "Status",
        icon: "color-palette" as const,
      },
      {
        key: "priority" as const,
        label: t("calendar.colorBy.priority") || "Priority",
        icon: "flag" as const,
      },
      {
        key: "vehicle" as const,
        label: t("calendar.colorBy.vehicle") || "Vehicle",
        icon: "car" as const,
      },
      {
        key: "team" as const,
        label: t("calendar.colorBy.team") || "Team",
        icon: "people" as const,
      },
    ],
    [t],
  );

  // ── Handlers ──────────────────────

  const setStatus = useCallback(
    (status: string) => {
      onFiltersChange({ ...filters, status });
    },
    [filters, onFiltersChange],
  );

  const setVehicle = useCallback(
    (vehicleId: string) => {
      onFiltersChange({ ...filters, vehicleId });
    },
    [filters, onFiltersChange],
  );

  const setStaff = useCallback(
    (staffId: string) => {
      onFiltersChange({ ...filters, staffId });
    },
    [filters, onFiltersChange],
  );

  const setColorBy = useCallback(
    (colorBy: CalendarFilterState["colorBy"]) => {
      onFiltersChange({ ...filters, colorBy });
    },
    [filters, onFiltersChange],
  );

  const resetFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.status !== "" || filters.vehicleId !== "" || filters.staffId !== "";

  // ── Styles ──────────────────────

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: compact
            ? DESIGN_TOKENS.spacing.xs
            : DESIGN_TOKENS.spacing.sm,
        },
        row: {
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          marginBottom: compact ? 2 : DESIGN_TOKENS.spacing.xs,
        },
        sectionLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
          marginLeft: 2,
        },
        pillsRow: {
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.xs,
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 4 : 6,
          borderRadius: 16,
          borderWidth: 1,
          gap: 4,
        },
        pillActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        pillInactive: {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        pillText: {
          fontSize: compact ? 10 : 11,
          fontWeight: "600",
        },
        pillTextActive: {
          color: colors.buttonPrimaryText,
        },
        pillTextInactive: {
          color: colors.text,
        },
        resetBtn: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: colors.error + "15",
          gap: 4,
        },
      }),
    [colors, compact],
  );

  const renderPill = (
    key: string,
    label: string,
    isActive: boolean,
    onPress: () => void,
    icon?: string,
  ) => (
    <Pressable
      key={key}
      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={compact ? 10 : 12}
          color={isActive ? colors.buttonPrimaryText : colors.textSecondary}
        />
      )}
      <Text
        style={[
          styles.pillText,
          isActive ? styles.pillTextActive : styles.pillTextInactive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Status filters */}
      <View style={styles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {statusOptions.map((opt) =>
            renderPill(
              `status-${opt.key}`,
              opt.label,
              filters.status === opt.key,
              () => setStatus(opt.key),
              opt.icon,
            ),
          )}

          {/* Vehicles (if any) */}
          {vehicles.length > 0 && (
            <>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 4,
                }}
              />
              {renderPill(
                "vehicle-all",
                t("calendar.filters.allVehicles") || "All vehicles",
                filters.vehicleId === "",
                () => setVehicle(""),
                "car",
              )}
              {vehicles.map((v) =>
                renderPill(
                  `vehicle-${v.id}`,
                  v.name || v.licensePlate || v.id,
                  filters.vehicleId === v.id,
                  () => setVehicle(v.id),
                ),
              )}
            </>
          )}

          {/* Staff (if any) */}
          {staff.length > 0 && (
            <>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 4,
                }}
              />
              {renderPill(
                "staff-all",
                t("calendar.filters.allStaff") || "All staff",
                filters.staffId === "",
                () => setStaff(""),
                "people",
              )}
              {staff.map((s) =>
                renderPill(
                  `staff-${s.id}`,
                  s.name,
                  filters.staffId === s.id,
                  () => setStaff(s.id),
                ),
              )}
            </>
          )}

          {/* Reset button */}
          {hasActiveFilters && (
            <Pressable style={styles.resetBtn} onPress={resetFilters}>
              <Ionicons name="close-circle" size={12} color={colors.error} />
              <Text
                style={{ fontSize: 10, fontWeight: "600", color: colors.error }}
              >
                {t("calendar.filters.reset") || "Reset"}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Color-by selector */}
      {!compact && (
        <View style={styles.row}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            <Text
              style={[
                styles.sectionLabel,
                { alignSelf: "center", marginBottom: 0, marginRight: 4 },
              ]}
            >
              {t("calendar.colorBy.label") || "Color:"}
            </Text>
            {colorByOptions.map((opt) =>
              renderPill(
                `color-${opt.key}`,
                opt.label,
                filters.colorBy === opt.key,
                () => setColorBy(opt.key),
                opt.icon,
              ),
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default CalendarFilters;

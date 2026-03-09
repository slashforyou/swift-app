/**
 * JobSummarySkeleton — Loading placeholder for the Job Summary page.
 *
 * Renders animated skeleton blocks that mirror the real section layout:
 * StatusBanner → Timer → QuickActions → Financial → Company → Client → Contact → Addresses → TimeWindows → Truck
 *
 * Uses the existing Skeleton/SkeletonText primitives from ui/SkeletonLoader.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { Skeleton, SkeletonText } from "../ui/SkeletonLoader";

// ─── Reusable skeleton card wrapper ──────────────────────────────────────────

const SkeletonSection: React.FC<{
  children: React.ReactNode;
  elevated?: boolean;
}> = ({ children, elevated = false }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: elevated ? 0.15 : 0.08,
          shadowRadius: elevated ? 6 : 3,
          elevation: elevated ? 6 : 3,
        },
      ]}
    >
      {children}
    </View>
  );
};

// ─── Individual section skeletons ────────────────────────────────────────────

/** Mimics JobStatusBanner — full-width colored bar */
const StatusBannerSkeleton: React.FC = () => (
  <SkeletonSection>
    <View style={styles.row}>
      <Skeleton width={24} height={24} borderRadius={12} />
      <Skeleton
        width="50%"
        height={18}
        style={{ marginLeft: DESIGN_TOKENS.spacing.sm }}
      />
    </View>
    <View style={[styles.row, { marginTop: DESIGN_TOKENS.spacing.sm }]}>
      <Skeleton
        width={80}
        height={22}
        borderRadius={DESIGN_TOKENS.radius.full}
      />
      <Skeleton
        width={80}
        height={22}
        borderRadius={DESIGN_TOKENS.radius.full}
        style={{ marginLeft: DESIGN_TOKENS.spacing.sm }}
      />
    </View>
  </SkeletonSection>
);

/** Mimics JobTimerDisplay — large timer + stepper + buttons */
const TimerSkeleton: React.FC = () => (
  <SkeletonSection elevated>
    {/* Step indicator */}
    <Skeleton
      width="40%"
      height={14}
      style={{ alignSelf: "center", marginBottom: DESIGN_TOKENS.spacing.md }}
    />
    {/* Large timer */}
    <Skeleton
      width={180}
      height={48}
      borderRadius={DESIGN_TOKENS.radius.md}
      style={{ alignSelf: "center", marginBottom: DESIGN_TOKENS.spacing.lg }}
    />
    {/* Progress bar */}
    <Skeleton
      width="100%"
      height={6}
      borderRadius={3}
      style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
    />
    {/* Action buttons row */}
    <View style={styles.row}>
      <Skeleton
        width="48%"
        height={44}
        borderRadius={DESIGN_TOKENS.radius.md}
      />
      <Skeleton
        width="48%"
        height={44}
        borderRadius={DESIGN_TOKENS.radius.md}
      />
    </View>
  </SkeletonSection>
);

/** Mimics QuickActionsSection — 4 icon buttons */
const QuickActionsSkeleton: React.FC = () => (
  <SkeletonSection>
    <Skeleton
      width="35%"
      height={16}
      style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
    />
    <View style={styles.actionsRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.actionItem}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton
            width={48}
            height={10}
            style={{ marginTop: DESIGN_TOKENS.spacing.xs }}
          />
        </View>
      ))}
    </View>
  </SkeletonSection>
);

/** Mimics a generic info section (Company, Client, Contact, etc.) */
const InfoSectionSkeleton: React.FC<{
  lines?: number;
  headerWidth?: string;
}> = ({ lines = 3, headerWidth = "45%" }) => (
  <SkeletonSection>
    <Skeleton
      width={headerWidth}
      height={16}
      style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
    />
    <SkeletonText lines={lines} lastLineWidth="60%" />
  </SkeletonSection>
);

/** Mimics AddressesSection — 2 address cards */
const AddressesSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <SkeletonSection>
      <Skeleton
        width="30%"
        height={16}
        style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
      />
      {[1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.addressCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border + "40",
            },
          ]}
        >
          <View style={styles.row}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton
              width="30%"
              height={14}
              style={{ marginLeft: DESIGN_TOKENS.spacing.sm }}
            />
          </View>
          <SkeletonText
            lines={2}
            lastLineWidth="50%"
            style={{ marginTop: DESIGN_TOKENS.spacing.sm }}
          />
        </View>
      ))}
    </SkeletonSection>
  );
};

/** Mimics TimeWindowsSection — 2 time rows */
const TimeWindowsSkeleton: React.FC = () => (
  <SkeletonSection>
    <Skeleton
      width="40%"
      height={16}
      style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
    />
    {[1, 2].map((i) => (
      <View
        key={i}
        style={[
          styles.row,
          { marginBottom: i < 2 ? DESIGN_TOKENS.spacing.sm : 0 },
        ]}
      >
        <Skeleton width={20} height={20} borderRadius={10} />
        <Skeleton
          width="70%"
          height={14}
          style={{ marginLeft: DESIGN_TOKENS.spacing.sm }}
        />
      </View>
    ))}
  </SkeletonSection>
);

// ─── Main composite skeleton ─────────────────────────────────────────────────

const JobSummarySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBannerSkeleton />
      <TimerSkeleton />
      <QuickActionsSkeleton />
      {/* Financial — small section */}
      <InfoSectionSkeleton lines={2} headerWidth="50%" />
      {/* Company */}
      <InfoSectionSkeleton lines={3} headerWidth="40%" />
      {/* Client */}
      <InfoSectionSkeleton lines={2} headerWidth="35%" />
      {/* Contact */}
      <InfoSectionSkeleton lines={2} headerWidth="30%" />
      {/* Addresses */}
      <AddressesSkeleton />
      {/* Time windows */}
      <TimeWindowsSkeleton />
      {/* Truck */}
      <InfoSectionSkeleton lines={2} headerWidth="45%" />
    </View>
  );
};

JobSummarySkeleton.displayName = "JobSummarySkeleton";

export default JobSummarySkeleton;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingBottom: DESIGN_TOKENS.spacing.lg,
  },
  section: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    padding: DESIGN_TOKENS.spacing.lg,
    borderWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.md,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionItem: {
    alignItems: "center",
  },
  addressCard: {
    borderRadius: DESIGN_TOKENS.radius.md,
    padding: DESIGN_TOKENS.spacing.md,
    borderWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
});

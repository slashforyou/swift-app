/**
 * PendingAssignmentsSection
 *
 * Displays a scrollable list of jobs waiting for the contractor's response.
 * Shown on the home screen so the user can see pending assignments at a glance.
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { usePendingAssignments } from "../../hooks/usePendingAssignments";
import { PendingAssignment } from "../../services/jobs";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatShortDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

function formatPricingType(type: string | null): string {
  if (!type) return "";
  switch (type) {
    case "hourly":
      return "/h";
    case "flat":
      return " (forfait)";
    case "daily":
      return "/j";
    default:
      return "";
  }
}

function formatAmount(amount: number | null, type: string | null): string {
  if (amount == null) return "";
  const formatted = amount.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted}${formatPricingType(type)}`;
}

// ─────────────────────────────────────────────
// Single assignment card
// ─────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: PendingAssignment;
  onPress: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      testID={`pending-assignment-card-${assignment.id}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? colors.backgroundTertiary
          : colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.sm,
        borderWidth: 1,
        borderColor: colors.warning + "60",
        borderLeftWidth: 3,
        borderLeftColor: colors.warning,
        marginRight: DESIGN_TOKENS.spacing.sm,
        minWidth: 180,
        maxWidth: 220,
      })}
    >
      {/* Company name */}
      {assignment.contractee_company_name ? (
        <Text
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {assignment.contractee_company_name}
        </Text>
      ) : null}

      {/* Job code & date */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 2,
        }}
        numberOfLines={1}
      >
        {assignment.code ?? `#${assignment.id}`}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
        numberOfLines={1}
      >
        {formatShortDate(assignment.start_window_start)}
      </Text>

      {/* Resources requested */}
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {assignment.requested_drivers != null &&
        assignment.requested_drivers > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: colors.primary + "18",
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Ionicons name="person-outline" size={11} color={colors.primary} />
            <Text
              style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}
            >
              {assignment.requested_drivers}
            </Text>
          </View>
        ) : null}

        {assignment.requested_offsiders != null &&
        assignment.requested_offsiders > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: colors.info + "18",
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Ionicons name="people-outline" size={11} color={colors.info} />
            <Text
              style={{ fontSize: 11, color: colors.info, fontWeight: "600" }}
            >
              {assignment.requested_offsiders}
            </Text>
          </View>
        ) : null}

        {assignment.pricing_amount != null ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: colors.success + "18",
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Ionicons name="cash-outline" size={11} color={colors.success} />
            <Text
              style={{ fontSize: 11, color: colors.success, fontWeight: "600" }}
            >
              {formatAmount(assignment.pricing_amount, assignment.pricing_type)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────

interface PendingAssignmentsSectionProps {
  navigation: any;
}

const PendingAssignmentsSection: React.FC<PendingAssignmentsSectionProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { assignments, isLoading } = usePendingAssignments();

  // Don't render if nothing pending
  if (!isLoading && assignments.length === 0) return null;

  const handleAssignmentPress = (assignment: PendingAssignment) => {
    const d = new Date(assignment.start_window_start);
    navigation.navigate("Calendar", {
      screen: "Day",
      params: {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      },
    });
  };

  return (
    <View
      testID="pending-assignments-section"
      style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: DESIGN_TOKENS.spacing.xs,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.warning,
          }}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.warning,
            flex: 1,
          }}
        >
          {assignments.length > 0
            ? `${assignments.length} job${assignments.length > 1 ? "s" : ""} en attente de réponse`
            : "Jobs en attente"}
        </Text>
        {isLoading ? (
          <ActivityIndicator size={14} color={colors.warning} />
        ) : null}
      </View>

      {/* Horizontal list of assignment cards */}
      {isLoading && assignments.length === 0 ? (
        <View
          style={{
            height: 80,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.warning} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onPress={() => handleAssignmentPress(a)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default PendingAssignmentsSection;

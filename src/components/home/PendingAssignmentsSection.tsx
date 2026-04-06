/**
 * PendingAssignmentsSection
 *
 * Simple button on home: "X jobs awaiting response".
 * Opens a full-screen wizard modal showing one detailed job at a time
 * with accept / decline actions and swipe pagination.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
    ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { usePendingAssignments } from "../../hooks/usePendingAssignments";
import { useTranslation } from "../../localization";
import {
    acceptJob,
    declineJob,
    PendingAssignment,
} from "../../services/jobs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatTime(dateString: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

function formatAmount(amount: number | null, type: string | null): string {
  if (amount == null) return "—";
  const formatted = amount.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const suffix =
    type === "hourly" ? "/h" : type === "daily" ? "/day" : type === "flat" ? " flat" : "";
  return `${formatted}${suffix}`;
}

// ─────────────────────────────────────────────
// Detail card shown inside the wizard
// ─────────────────────────────────────────────

interface DetailCardProps {
  assignment: PendingAssignment;
  colors: any;
  t: any;
  onAccept: () => void;
  onDecline: () => void;
  onView: () => void;
  isSubmitting: boolean;
}

const DetailCard: React.FC<DetailCardProps> = ({
  assignment,
  colors,
  t,
  onAccept,
  onDecline,
  onView,
  isSubmitting,
}) => (
  <View
    style={{
      width: SCREEN_WIDTH,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
    }}
  >
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
        borderWidth: 1,
        borderColor: colors.warning + "40",
        gap: DESIGN_TOKENS.spacing.md,
      }}
    >
      {/* Company name */}
      {assignment.contractee_company_name ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {assignment.contractee_company_name}
          </Text>
        </View>
      ) : null}

      {/* Client */}
      {assignment.client_name ? (
        <InfoRow
          icon="person-outline"
          label={t("common.client") || "Client"}
          value={assignment.client_name}
          colors={colors}
        />
      ) : null}

      {/* Date & Time */}
      <InfoRow
        icon="calendar-outline"
        label={t("common.date") || "Date"}
        value={formatDate(assignment.start_window_start)}
        colors={colors}
      />
      <InfoRow
        icon="time-outline"
        label={t("common.time") || "Time"}
        value={`${formatTime(assignment.start_window_start)} — ${formatTime(assignment.start_window_end)}`}
        colors={colors}
      />

      {/* Staff requested */}
      {(assignment.requested_drivers ?? 0) > 0 ? (
        <InfoRow
          icon="car-outline"
          label={t("common.drivers") || "Drivers"}
          value={String(assignment.requested_drivers)}
          colors={colors}
        />
      ) : null}
      {(assignment.requested_offsiders ?? 0) > 0 ? (
        <InfoRow
          icon="people-outline"
          label={t("common.offsiders") || "Offsiders"}
          value={String(assignment.requested_offsiders)}
          colors={colors}
        />
      ) : null}

      {/* Pricing */}
      <InfoRow
        icon="cash-outline"
        label={t("common.price") || "Price"}
        value={formatAmount(assignment.pricing_amount, assignment.pricing_type)}
        iconColor={colors.success}
        valueColor={colors.success}
        colors={colors}
      />

      {/* Transfer message */}
      {assignment.transfer_message ? (
        <View
          style={{
            backgroundColor: colors.info + "15",
            borderRadius: DESIGN_TOKENS.radius.sm,
            padding: DESIGN_TOKENS.spacing.sm,
            borderLeftWidth: 3,
            borderLeftColor: colors.info,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.info, marginBottom: 4 }}>
            {t("home.pendingJobs.message") || "Message"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
            {assignment.transfer_message}
          </Text>
        </View>
      ) : null}

      {/* View button */}
      <Pressable
        onPress={onView}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.primary + "25" : colors.primary + "12",
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingVertical: 12,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: colors.primary + "40",
          marginTop: 4,
        })}
      >
        <Ionicons name="open-outline" size={16} color={colors.primary} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
          {t("home.pendingJobs.viewJob") || "View Job"}
        </Text>
      </Pressable>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
        <Pressable
          onPress={onDecline}
          disabled={isSubmitting}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? colors.textMuted + "30" : colors.textMuted + "15",
            borderRadius: DESIGN_TOKENS.radius.md,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.textMuted + "30",
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMuted }}>
            {t("common.decline") || "Decline"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onAccept}
          disabled={isSubmitting}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? colors.success + "CC" : colors.success,
            borderRadius: DESIGN_TOKENS.radius.md,
            paddingVertical: 14,
            alignItems: "center",
          })}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size={18} />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
              {t("common.accept") || "Accept"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Info row helper
// ─────────────────────────────────────────────

const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  iconColor?: string;
  valueColor?: string;
  colors: any;
}> = ({ icon, label, value, iconColor, valueColor, colors }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
    <Ionicons name={icon as any} size={16} color={iconColor ?? colors.textMuted} />
    <Text style={{ fontSize: 13, color: colors.textMuted, width: 70 }}>{label}</Text>
    <Text
      style={{ fontSize: 14, fontWeight: "600", color: valueColor ?? colors.text, flex: 1 }}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

// ─────────────────────────────────────────────
// Wizard Modal
// ─────────────────────────────────────────────

interface PendingWizardModalProps {
  visible: boolean;
  assignments: PendingAssignment[];
  onClose: () => void;
  onJobActioned: () => void;
  navigation: any;
}

const PendingWizardModal: React.FC<PendingWizardModalProps> = ({
  visible,
  assignments,
  onClose,
  onJobActioned,
  navigation,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const flatListRef = React.useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
        setShowDeclineInput(false);
        setDeclineReason("");
      }
    },
    [],
  );

  const handleAccept = async () => {
    const job = assignments[currentIndex];
    if (!job) return;
    setIsSubmitting(true);
    try {
      await acceptJob(job.id);
      Alert.alert(
        t("common.success") || "Success",
        t("home.pendingJobs.accepted") || "Job accepted!",
      );
      onJobActioned();
    } catch {
      Alert.alert(
        t("common.error") || "Error",
        t("contractorWizard.errorAcceptJob") || "Unable to accept this job.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    if (!showDeclineInput) {
      setShowDeclineInput(true);
      return;
    }
    const job = assignments[currentIndex];
    if (!job) return;
    setIsSubmitting(true);
    declineJob(job.id, declineReason.trim() || "Declined from home")
      .then(() => {
        Alert.alert(
          t("common.success") || "Success",
          t("home.pendingJobs.declined") || "Job declined.",
        );
        setShowDeclineInput(false);
        setDeclineReason("");
        onJobActioned();
      })
      .catch(() => {
        Alert.alert(
          t("common.error") || "Error",
          t("contractorWizard.errorDeclineJob") || "Unable to decline this job.",
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  if (assignments.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              {t("home.pendingJobs.title") || "Pending Jobs"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
              {currentIndex + 1} / {assignments.length}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Paginated cards */}
        <FlatList
          ref={flatListRef}
          data={assignments}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <DetailCard
              assignment={item}
              colors={colors}
              t={t}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onView={() => {
                onClose();
                navigation.navigate("JobDetails", { jobId: item.code || item.id });
              }}
              isSubmitting={isSubmitting}
            />
          )}
        />

        {/* Decline reason input */}
        {showDeclineInput ? (
          <View
            style={{
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingBottom: DESIGN_TOKENS.spacing.md,
              gap: 8,
            }}
          >
            <TextInput
              placeholder={t("home.pendingJobs.declineReason") || "Reason for declining..."}
              placeholderTextColor={colors.textMuted}
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                fontSize: 14,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.errorButton + "40",
                minHeight: 60,
                maxHeight: 100,
              }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => {
                  setShowDeclineInput(false);
                  setDeclineReason("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor: colors.backgroundTertiary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDecline}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor: colors.errorButton,
                  borderRadius: DESIGN_TOKENS.radius.md,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size={16} />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("common.confirm") || "Confirm"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Pagination dots */}
        {assignments.length > 1 ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              paddingBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {assignments.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentIndex ? colors.warning : colors.textMuted + "40",
                }}
              />
            ))}
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Section (simple button)
// ─────────────────────────────────────────────

interface PendingAssignmentsSectionProps {
  navigation: any;
}

const PendingAssignmentsSection: React.FC<PendingAssignmentsSectionProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { assignments, isLoading, refetch } = usePendingAssignments();
  const [wizardVisible, setWizardVisible] = useState(false);

  // Don't render if nothing pending
  if (!isLoading && assignments.length === 0) return null;

  const count = assignments.length;

  return (
    <>
      <Pressable
        testID="pending-assignments-button"
        onPress={() => setWizardVisible(true)}
        disabled={isLoading || count === 0}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.warning + "25" : colors.warning + "15",
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          marginBottom: DESIGN_TOKENS.spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.warning + "50",
          gap: 10,
        })}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.warning,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size={14} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
              {count}
            </Text>
          )}
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.warning,
            flex: 1,
          }}
        >
          {count > 0
            ? t("home.pendingJobs.button", { count: String(count) }) ||
              `${count} job${count > 1 ? "s" : ""} awaiting response`
            : t("home.pendingJobs.loading") || "Loading…"}
        </Text>

        <Ionicons name="chevron-forward" size={18} color={colors.warning} />
      </Pressable>

      <PendingWizardModal
        visible={wizardVisible}
        assignments={assignments}
        onClose={() => setWizardVisible(false)}
        onJobActioned={() => {
          setWizardVisible(false);
          refetch();
        }}
        navigation={navigation}
      />
    </>
  );
};

export default PendingAssignmentsSection;

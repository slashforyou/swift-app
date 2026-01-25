/**
 * EditJobModal - Modal pour modifier un job existant
 * Permet de modifier client, adresse, date/heure, priorité et notes
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";
import { UpdateJobRequest } from "../../services/jobs";

interface EditJobModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateJob: (data: UpdateJobRequest) => Promise<void>;
  job: {
    id: string;
    status?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    addresses?: {
      type: string;
      street: string;
      city: string;
      state: string;
      zip: string;
    }[];
    time?: {
      startWindowStart?: string;
      startWindowEnd?: string;
      endWindowStart?: string;
      endWindowEnd?: string;
    };
    estimatedDuration?: number;
    notes?: string;
  } | null;
}

const PRIORITY_OPTIONS = [
  { key: "low" as const, label: "Low", emoji: "🟢", color: "#22c55e" },
  { key: "medium" as const, label: "Medium", emoji: "🟡", color: "#eab308" },
  { key: "high" as const, label: "High", emoji: "🟠", color: "#f97316" },
  { key: "urgent" as const, label: "Urgent", emoji: "🔴", color: "#ef4444" },
];

const STATUS_OPTIONS = [
  { key: "pending" as const, label: "Pending", emoji: "⏳" },
  { key: "in-progress" as const, label: "In Progress", emoji: "🔄" },
  { key: "completed" as const, label: "Completed", emoji: "✅" },
  { key: "cancelled" as const, label: "Cancelled", emoji: "❌" },
];

export default function EditJobModal({
  visible,
  onClose,
  onUpdateJob,
  job,
}: EditJobModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [status, setStatus] = useState<UpdateJobRequest["status"]>("pending");
  const [priority, setPriority] =
    useState<UpdateJobRequest["priority"]>("medium");
  const [addresses, setAddresses] = useState<UpdateJobRequest["addresses"]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [estimatedDuration, setEstimatedDuration] = useState("4");
  const [notes, setNotes] = useState("");

  // Initialize form when job changes
  useEffect(() => {
    if (job && visible) {
      setStatus((job.status as UpdateJobRequest["status"]) || "pending");
      setPriority(job.priority || "medium");
      setAddresses(job.addresses || []);
      setNotes(job.notes || "");

      // Parse times
      if (job.time?.startWindowStart) {
        const start = new Date(job.time.startWindowStart);
        setStartTime(
          `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
        );
      }
      if (job.time?.endWindowEnd) {
        const end = new Date(job.time.endWindowEnd);
        setEndTime(
          `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`,
        );
      }
      if (job.estimatedDuration) {
        setEstimatedDuration(Math.round(job.estimatedDuration / 60).toString());
      }
    }
  }, [job, visible]);

  const handleClose = () => {
    onClose();
  };

  const updateAddress = (index: number, field: string, value: string) => {
    const newAddresses = [...(addresses || [])];
    if (newAddresses[index]) {
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      setAddresses(newAddresses);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const updateData: UpdateJobRequest = {
        status,
        priority,
        addresses,
        estimatedDuration: parseInt(estimatedDuration) * 60,
        notes: notes || undefined,
      };

      // Add time if we have a date context
      if (job?.time?.startWindowStart) {
        const baseDate = new Date(job.time.startWindowStart);
        const [startHour, startMinute] = startTime.split(":");
        const [endHour, endMinute] = endTime.split(":");

        const startDateTime = new Date(baseDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

        const endDateTime = new Date(baseDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

        updateData.time = {
          startWindowStart: startDateTime.toISOString(),
          startWindowEnd: startDateTime.toISOString(),
          endWindowStart: endDateTime.toISOString(),
          endWindowEnd: endDateTime.toISOString(),
        };
      }

      await onUpdateJob(updateData);
      handleClose();
      Alert.alert(
        t("common.success"),
        t("jobs.updateSuccess") || "Job updated successfully!",
      );
    } catch (error) {
      console.error("Error updating job:", error);
      Alert.alert(
        t("common.error"),
        t("jobs.updateError") || "Failed to update job. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
      borderTopRightRadius: DESIGN_TOKENS.radius.xl,
      maxHeight: "85%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    sectionLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
    },
    optionEmoji: {
      fontSize: 16,
      marginRight: DESIGN_TOKENS.spacing.xs,
    },
    optionLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "500",
    },
    addressBlock: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    addressHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    addressLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
      marginLeft: DESIGN_TOKENS.spacing.xs,
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    input: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    inputRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    inputHalf: {
      flex: 1,
    },
    timeSection: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
    },
    timeBlock: {
      flex: 1,
    },
    timeLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    textareaContainer: {
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
    },
    textarea: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      minHeight: 80,
    },
    buttonRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.xl,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    buttonSecondary: {
      borderWidth: 1,
    },
    buttonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
  });

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t("jobs.editJob") || "Edit Job"}
            </Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Status */}
            <Text style={styles.sectionLabel}>
              {t("jobs.statusLabel") || "Status"}
            </Text>
            <View style={styles.optionsGrid}>
              {STATUS_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor:
                        status === option.key
                          ? colors.primary + "20"
                          : colors.backgroundSecondary,
                      borderColor:
                        status === option.key ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setStatus(option.key)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Priority */}
            <Text style={styles.sectionLabel}>
              {t("jobs.priority") || "Priority"}
            </Text>
            <View style={styles.optionsGrid}>
              {PRIORITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor:
                        priority === option.key
                          ? option.color + "20"
                          : colors.backgroundSecondary,
                      borderColor:
                        priority === option.key ? option.color : colors.border,
                    },
                  ]}
                  onPress={() => setPriority(option.key)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Addresses */}
            {addresses && addresses.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {t("jobs.addresses") || "Addresses"}
                </Text>
                {addresses.map((address, index) => (
                  <View key={index} style={styles.addressBlock}>
                    <View style={styles.addressHeader}>
                      <Text style={{ fontSize: 16 }}>
                        {address.type === "pickup" ? "📦" : "🏠"}
                      </Text>
                      <Text
                        style={[
                          styles.addressLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {address.type === "pickup" ? "Pickup" : "Delivery"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Street"
                        placeholderTextColor={colors.textSecondary}
                        value={address.street}
                        onChangeText={(value) =>
                          updateAddress(index, "street", value)
                        }
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <View
                        style={[
                          styles.inputGroup,
                          styles.inputHalf,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="City"
                          placeholderTextColor={colors.textSecondary}
                          value={address.city}
                          onChangeText={(value) =>
                            updateAddress(index, "city", value)
                          }
                        />
                      </View>
                      <View
                        style={[
                          styles.inputGroup,
                          styles.inputHalf,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="State"
                          placeholderTextColor={colors.textSecondary}
                          value={address.state}
                          onChangeText={(value) =>
                            updateAddress(index, "state", value)
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Time */}
            <Text style={styles.sectionLabel}>
              {t("jobs.schedule") || "Schedule"}
            </Text>
            <View style={styles.timeSection}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <View
                  style={[
                    styles.inputGroup,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Ionicons
                    name="time"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, marginLeft: 8 },
                    ]}
                    placeholder="09:00"
                    placeholderTextColor={colors.textSecondary}
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
              </View>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>End Time</Text>
                <View
                  style={[
                    styles.inputGroup,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Ionicons
                    name="time"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, marginLeft: 8 },
                    ]}
                    placeholder="17:00"
                    placeholderTextColor={colors.textSecondary}
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>
              {t("jobs.notes") || "Notes"}
            </Text>
            <View
              style={[
                styles.textareaContainer,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <TextInput
                style={[styles.textarea, { color: colors.text }]}
                placeholder={t("jobs.notesPlaceholder") || "Add notes..."}
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  { borderColor: colors.border },
                ]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.buttonPrimaryText}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.buttonPrimaryText}
                    />
                    <Text
                      style={[
                        styles.buttonText,
                        { color: colors.buttonPrimaryText, marginLeft: 8 },
                      ]}
                    >
                      {t("common.save") || "Save"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

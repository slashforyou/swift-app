/**
 * AddVehicleModal - Wizard progressif pour ajouter un véhicule
 * Chaque étape apparaît juste après la précédente dans le même scroll.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
import { useLocalization } from "../../localization/useLocalization";

export interface VehicleCreateData {
  type: "moving-truck" | "van" | "trailer" | "ute" | "dolly" | "tools";
  make: string;
  model: string;
  year: number;
  registration: string;
  capacity: string;
  location: string;
  nextService: string;
}

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onAddVehicle: (data: VehicleCreateData) => Promise<void>;
}

// phase: 1 = type, 2 = details, 3 = logistics
type Phase = 1 | 2 | 3;

const VEHICLE_TYPES = [
  { type: "moving-truck" as const, emoji: "🚛", label: "Moving Truck" },
  { type: "van" as const, emoji: "🚐", label: "Van" },
  { type: "trailer" as const, emoji: "🚜", label: "Trailer" },
  { type: "ute" as const, emoji: "🛻", label: "Ute" },
  { type: "dolly" as const, emoji: "🛒", label: "Dolly" },
  { type: "tools" as const, emoji: "🔧", label: "Tools" },
];

const VEHICLE_MAKES = [
  "Isuzu", "Ford", "Toyota", "Mitsubishi", "Mercedes-Benz",
  "Hino", "Fuso", "Volkswagen", "Hyundai", "Nissan", "Other",
];

const LOCATIONS = [
  "Sydney Depot", "Melbourne Branch", "Brisbane Office",
  "Perth Warehouse", "Adelaide Hub", "Gold Coast Base",
];

const EMPTY_DATA: VehicleCreateData = {
  type: "moving-truck",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  registration: "",
  capacity: "",
  location: "",
  nextService: "",
};

export default function AddVehicleModal({
  visible,
  onClose,
  onAddVehicle,
}: AddVehicleModalProps) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const scrollRef = useRef<ScrollView>(null);

  const [phase, setPhase] = useState<Phase>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleCreateData>(EMPTY_DATA);

  const resetModal = () => {
    setPhase(1);
    setVehicleData(EMPTY_DATA);
  };

  useEffect(() => {
    if (!visible) resetModal();
  }, [visible]);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Auto-scroll to bottom when a new section appears
  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSelectType = (type: VehicleCreateData["type"]) => {
    if (vehicleData.type === type) return;
    if (phase >= 2) {
      // Changing type mid-wizard: reset all downstream data
      setVehicleData({ ...EMPTY_DATA, type });
      setPhase(2);
    } else {
      setVehicleData((d) => ({ ...d, type }));
      setPhase(2);
      scrollToBottom();
    }
  };

  // Unlock logistics once make + model + year + registration are set
  const detailsComplete =
    vehicleData.make.trim().length > 0 &&
    vehicleData.model.trim().length > 0 &&
    vehicleData.year >= 1990 &&
    vehicleData.registration.trim().length >= 4;

  const handleDetailsChange = (patch: Partial<VehicleCreateData>) => {
    setVehicleData((d) => {
      const next = { ...d, ...patch };
      const complete =
        next.make.trim().length > 0 &&
        next.model.trim().length > 0 &&
        next.year >= 1990 &&
        next.registration.trim().length >= 4;
      if (complete && phase < 3) {
        setPhase(3);
        scrollToBottom();
      }
      return next;
    });
  };

  const validateRegistration = (reg: string): boolean => {
    // Australian plates: 5-8 alphanumeric chars, no dashes (NSW ABC123, VIC 1AB2CD, QLD 123ABC, WA 1ABC234)
    return /^[A-Z0-9]{5,8}$/.test(reg);
  };

  const canSubmit =
    phase === 3 &&
    vehicleData.location.trim().length > 0 &&
    vehicleData.nextService.trim().length > 0;

  const handleAddVehicle = async () => {
    if (!vehicleData.make.trim()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.selectMake"));
      return;
    }
    if (!vehicleData.model.trim()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.enterModel"));
      return;
    }
    if (vehicleData.year < 1990 || vehicleData.year > new Date().getFullYear()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.yearRange", { maxYear: new Date().getFullYear() }));
      return;
    }
    if (!vehicleData.registration.trim()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.enterRegistration"));
      return;
    }
    if (!validateRegistration(vehicleData.registration.toUpperCase())) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.invalidRegistration"));
      return;
    }
    if (!vehicleData.location.trim()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.selectLocation"));
      return;
    }
    if (!vehicleData.nextService.trim()) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.enterNextService"));
      return;
    }
    const serviceDate = new Date(vehicleData.nextService);
    if (isNaN(serviceDate.getTime())) {
      Alert.alert(t("vehicles.validation.error"), "Invalid date format. Please use YYYY-MM-DD.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (serviceDate < today) {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.validation.serviceDatePast"));
      return;
    }
    setIsLoading(true);
    try {
      await onAddVehicle(vehicleData);
      handleClose();
    } catch {
      Alert.alert(t("vehicles.validation.error"), t("vehicles.alerts.addError.message"));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTypeInfo = VEHICLE_TYPES.find((v) => v.type === vehicleData.type);

  // ─── Step Indicator ─────────────────────────────────────────────────────────
  const StepBadge = ({ n, done }: { n: number; done: boolean }) => (
    <View style={[styles.stepBadge, { backgroundColor: done ? colors.success : colors.primary }]}>
      {done
        ? <Ionicons name="checkmark" size={12} color="#fff" />
        : <Text style={styles.stepBadgeText}>{n}</Text>
      }
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        testID="add-vehicle-modal"
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("vehicles.addModal.title")}
          </Text>
          <Pressable testID="close-button" onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: Type ─────────────────────────────────────── */}
          <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.stepHeader}>
              <StepBadge n={1} done={phase > 1} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepLabel, { color: colors.text }]}>
                  {t("vehicles.addModal.vehicleType")}
                </Text>
                {phase > 1 && selectedTypeInfo && (
                  <Text style={[styles.stepSummary, { color: colors.textSecondary }]}>
                    {selectedTypeInfo.emoji} {selectedTypeInfo.label}
                  </Text>
                )}
              </View>
              {phase > 1 && (
                <Pressable onPress={() => setPhase(1)} hitSlop={8}>
                  <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
                </Pressable>
              )}
            </View>

            {/* Type grid — toujours visible pour éditer */}
            <View style={styles.typeGrid}>
              {VEHICLE_TYPES.map((vt) => {
                const selected = vehicleData.type === vt.type;
                return (
                  <Pressable
                    key={vt.type}
                    testID={`vehicle-type-${vt.type}`}
                    style={[
                      styles.typeCell,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      selected && { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
                    ]}
                    onPress={() => handleSelectType(vt.type)}
                  >
                    <Text style={styles.typeEmoji}>{vt.emoji}</Text>
                    <Text style={[styles.typeCellLabel, { color: selected ? colors.primary : colors.text }]}>
                      {vt.label}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── STEP 2: Details ──────────────────────────────────── */}
          {phase >= 2 && (
            <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <View style={styles.stepHeader}>
                <StepBadge n={2} done={detailsComplete && phase > 2} />
                <Text style={[styles.stepLabel, { color: colors.text }]}>
                  {t("vehicles.addModal.vehicleDetails")}
                </Text>
              </View>

              {/* Make */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.make")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {VEHICLE_MAKES.map((make) => {
                  const sel = vehicleData.make === make;
                  return (
                    <Pressable
                      key={make}
                      style={[
                        styles.pill,
                        { backgroundColor: sel ? colors.primary : colors.background, borderColor: sel ? colors.primary : colors.border },
                      ]}
                      onPress={() => handleDetailsChange({ make })}
                    >
                      <Text style={[styles.pillText, { color: sel ? "#fff" : colors.text }]}>{make}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Model */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.model")}
              </Text>
              <TextInput
                testID="vehicle-model-input"
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={vehicleData.model}
                onChangeText={(text) => handleDetailsChange({ model: text })}
                placeholder="Ex: NPR 200"
                placeholderTextColor={colors.textSecondary}
              />

              {/* Year + Registration row */}
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    {t("vehicles.addModal.year")}
                  </Text>
                  <TextInput
                    testID="vehicle-year-input"
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={String(vehicleData.year)}
                    onChangeText={(text) => handleDetailsChange({ year: parseInt(text) || new Date().getFullYear() })}
                    placeholder="2024"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    {t("vehicles.addModal.registration")}
                  </Text>
                  <TextInput
                    testID="vehicle-registration-input"
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={vehicleData.registration}
                    onChangeText={(text) => handleDetailsChange({ registration: text.toUpperCase() })}
                    placeholder="ABC-123"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Capacity (optional) */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.capacity")} <Text style={{ fontWeight: "400" }}>(optional)</Text>
              </Text>
              <TextInput
                testID="vehicle-capacity-input"
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={vehicleData.capacity}
                onChangeText={(text) => handleDetailsChange({ capacity: text })}
                placeholder="Ex: 3.5 tonnes"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          {/* ── STEP 3: Logistics ─────────────────────────────────── */}
          {phase >= 3 && (
            <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <View style={styles.stepHeader}>
                <StepBadge n={3} done={canSubmit} />
                <Text style={[styles.stepLabel, { color: colors.text }]}>
                  Where & When
                </Text>
              </View>

              {/* Location */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.location")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {LOCATIONS.map((loc) => {
                  const sel = vehicleData.location === loc;
                  return (
                    <Pressable
                      key={loc}
                      style={[
                        styles.pill,
                        { backgroundColor: sel ? colors.primary : colors.background, borderColor: sel ? colors.primary : colors.border },
                      ]}
                      onPress={() => setVehicleData((d) => ({ ...d, location: loc }))}
                    >
                      <Text style={[styles.pillText, { color: sel ? "#fff" : colors.text }]}>{loc}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Next Service */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.nextService")}
              </Text>
              <TextInput
                testID="vehicle-nextservice-input"
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={vehicleData.nextService}
                onChangeText={(text) => setVehicleData((d) => ({ ...d, nextService: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("vehicles.addModal.dateHelperText")}
              </Text>
            </View>
          )}

          {/* ── Submit ─────────────────────────────────────────────── */}
          {canSubmit && (
            <Pressable
              testID="vehicle-submit-btn"
              style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && { opacity: 0.6 }]}
              onPress={handleAddVehicle}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>{t("vehicles.addModal.addButton")}</Text>
                  </>
              }
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: {
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.md,
  },
  // Step cards
  stepCard: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: 4,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  stepLabel: { fontSize: 16, fontWeight: "700", flex: 1 },
  stepSummary: { fontSize: 13, marginTop: 1 },
  editLink: { fontSize: 13, fontWeight: "600" },
  // Type grid (3 col × 2 rows)
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  typeCell: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1.5,
    gap: 4,
  },
  typeEmoji: { fontSize: 26 },
  typeCellLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  // Fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
  },
  fieldRow: { flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm },
  input: {
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 15,
    borderWidth: 1,
  },
  helperText: { fontSize: 11, fontStyle: "italic" },
  // Pills
  pillScroll: { marginVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: "600" },
  // Submit
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

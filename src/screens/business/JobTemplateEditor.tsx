/**
 * JobTemplateEditor — Écran de création/édition de template de job modulaire
 *
 * Permet de configurer :
 * - Nom, catégorie, description
 * - Mode de facturation (5 modes)
 * - Segments réordonnables (ajout, suppression, réordonnancement)
 * - Configuration tarifaire (horaire ou forfait)
 * - Options forfaitaires ajoutables
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    createModularTemplate,
    updateModularTemplate,
} from "../../services/business/templatesService";
import type {
    BillingMode,
    FlatRateOption,
    JobSegmentTemplate,
    LocationType,
    ModularJobTemplate,
    SegmentType,
} from "../../types/jobSegment";

// ============================================================================
// CONSTANTES (sans labels — les labels sont générés via t() dans le composant)
// ============================================================================

const ROUNDING_OPTIONS = [
  { value: 1, label: "1 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
];

const CATEGORIES = [
  "residential",
  "commercial",
  "storage",
  "packing",
  "specialty",
];

// Static labels for getDefaultLabel (module-level, no translation needed for generated names)
const LOCATION_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  garage: "Garage",
  private_storage: "Private Storage",
  depot: "Depot",
  office: "Office",
  other: "Other",
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

interface JobTemplateEditorProps {
  route?: { params?: { template?: ModularJobTemplate } };
  navigation?: any;
  existingTemplate?: ModularJobTemplate;
  onSave?: (template: ModularJobTemplate) => void;
  onCancel?: () => void;
}

const JobTemplateEditor: React.FC<JobTemplateEditorProps> = ({
  route,
  navigation,
  existingTemplate: existingTemplateProp,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // ── Constantes traduites ──
  const BILLING_MODES = useMemo(() => [
    { key: "location_to_location" as BillingMode, icon: "location-outline", label: t("businessHub.templates.billingModes.locationToLocation") || "Location to location", desc: t("businessHub.templates.billingModes.locationToLocationDesc") || "From first to last location" },
    { key: "depot_to_depot" as BillingMode, icon: "business-outline", label: t("businessHub.templates.billingModes.depotToDepot") || "Depot to depot", desc: t("businessHub.templates.billingModes.depotToDepotDesc") || "Start and end at depot" },
    { key: "flat_rate" as BillingMode, icon: "cash-outline", label: t("businessHub.templates.billingModes.flatRate") || "Flat rate", desc: t("businessHub.templates.billingModes.flatRateDesc") || "Fixed predefined amount" },
    { key: "packing_only" as BillingMode, icon: "cube-outline", label: t("businessHub.templates.billingModes.packingOnly") || "Packing only", desc: t("businessHub.templates.billingModes.packingOnlyDesc") || "Location segments only" },
    { key: "unpacking_only" as BillingMode, icon: "download-outline", label: t("businessHub.templates.billingModes.unpackingOnly") || "Unpacking only", desc: t("businessHub.templates.billingModes.unpackingOnlyDesc") || "Location segments only" },
  ], [t]);

  const SEGMENT_TYPES = useMemo(() => [
    { key: "location" as SegmentType, icon: "location-outline", label: t("businessHub.templates.segmentTypes.location") || "Location", color: "#3B82F6" },
    { key: "travel" as SegmentType, icon: "car-outline", label: t("businessHub.templates.segmentTypes.travel") || "Travel", color: "#8B5CF6" },
    { key: "storage" as SegmentType, icon: "filing-outline", label: t("businessHub.templates.segmentTypes.storage") || "Storage", color: "#EF4444" },
    { key: "loading" as SegmentType, icon: "cube-outline", label: t("businessHub.templates.segmentTypes.loading") || "Loading", color: "#F59E0B" },
  ], [t]);

  const LOCATION_TYPES = useMemo(() => [
    { key: "house" as LocationType, label: t("businessHub.templates.locationTypes.house") || "House" },
    { key: "apartment" as LocationType, label: t("businessHub.templates.locationTypes.apartment") || "Apartment" },
    { key: "garage" as LocationType, label: t("businessHub.templates.locationTypes.garage") || "Garage" },
    { key: "private_storage" as LocationType, label: t("businessHub.templates.locationTypes.privateStorage") || "Private Storage" },
    { key: "depot" as LocationType, label: t("businessHub.templates.locationTypes.depot") || "Depot / Storage" },
    { key: "office" as LocationType, label: t("businessHub.templates.locationTypes.office") || "Office" },
    { key: "other" as LocationType, label: t("businessHub.templates.locationTypes.other") || "Other" },
  ], [t]);

  const existingTemplate = existingTemplateProp ?? route?.params?.template;
  const handleCancel = onCancel ?? (() => navigation?.goBack?.());
  const isEditing = !!existingTemplate;

  // ── State du formulaire ──
  const [name, setName] = useState(existingTemplate?.name ?? "");
  const [description, setDescription] = useState(existingTemplate?.description ?? "");
  const [category, setCategory] = useState(existingTemplate?.category ?? "residential");
  const [billingMode, setBillingMode] = useState<BillingMode>(
    existingTemplate?.billingMode ?? "location_to_location",
  );
  const [segments, setSegments] = useState<JobSegmentTemplate[]>(
    existingTemplate?.segments ?? [],
  );

  // Config horaire
  const [hourlyRate, setHourlyRate] = useState(
    existingTemplate?.defaultHourlyRate?.toString() ?? "120",
  );
  const [minimumHours, setMinimumHours] = useState(
    existingTemplate?.minimumHours?.toString() ?? "2",
  );
  const [timeRounding, setTimeRounding] = useState(
    existingTemplate?.timeRoundingMinutes ?? 15,
  );
  const [returnTripMinutes, setReturnTripMinutes] = useState(
    existingTemplate?.returnTripDefaultMinutes?.toString() ?? "30",
  );

  // Config forfait
  const [flatRateAmount, setFlatRateAmount] = useState(
    existingTemplate?.flatRateAmount?.toString() ?? "",
  );
  const [flatRateMaxHours, setFlatRateMaxHours] = useState(
    existingTemplate?.flatRateMaxHours?.toString() ?? "",
  );
  const [flatRateOverageRate, setFlatRateOverageRate] = useState(
    existingTemplate?.flatRateOverageRate?.toString() ?? "",
  );
  const [flatRateOptions, setFlatRateOptions] = useState<FlatRateOption[]>(
    existingTemplate?.flatRateOptions ?? [],
  );

  // UI state
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isFlatRate = billingMode === "flat_rate";

  // ── Segments management ──
  const generateSegmentId = () => `seg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const addSegment = useCallback(
    (type: SegmentType, locationType?: LocationType) => {
      const newSeg: JobSegmentTemplate = {
        id: generateSegmentId(),
        order: segments.length + 1,
        type,
        label: getDefaultLabel(type, locationType, segments.length + 1),
        locationType,
        isBillable: getDefaultBillable(type, billingMode),
        estimatedDurationMinutes: type === "travel" ? 30 : 60,
      };
      setSegments((prev) => [...prev, newSeg]);
      setShowAddSegment(false);
    },
    [segments, billingMode],
  );

  const removeSegment = useCallback((id: string) => {
    setSegments((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  }, []);

  const moveSegment = useCallback((index: number, direction: "up" | "down") => {
    setSegments((prev) => {
      const newArr = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newArr.length) return prev;
      [newArr[index], newArr[targetIdx]] = [newArr[targetIdx], newArr[index]];
      return newArr.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  }, []);

  const updateSegmentLabel = useCallback((id: string, label: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label } : s)),
    );
  }, []);

  // ── Flat rate options management ──
  const addFlatRateOption = useCallback(() => {
    setFlatRateOptions((prev) => [
      ...prev,
      { id: `opt-${Date.now()}`, label: "", price: 0 },
    ]);
  }, []);

  const removeFlatRateOption = useCallback((id: string) => {
    setFlatRateOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateFlatRateOption = useCallback(
    (id: string, field: "label" | "price", value: string) => {
      setFlatRateOptions((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, [field]: field === "price" ? parseFloat(value) || 0 : value }
            : o,
        ),
      );
    },
    [],
  );

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Template name is required.");
      return;
    }
    if (segments.length === 0) {
      Alert.alert("Error", "Add at least one segment.");
      return;
    }

    setIsSaving(true);
    try {
      const templateData: Omit<ModularJobTemplate, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        description: description.trim(),
        category,
        billingMode,
        segments,
        defaultHourlyRate: parseFloat(hourlyRate) || undefined,
        minimumHours: parseFloat(minimumHours) || undefined,
        timeRoundingMinutes: timeRounding,
        returnTripDefaultMinutes: billingMode === "depot_to_depot"
          ? parseFloat(returnTripMinutes) || undefined
          : undefined,
        ...(isFlatRate && {
          flatRateAmount: parseFloat(flatRateAmount) || undefined,
          flatRateMaxHours: parseFloat(flatRateMaxHours) || undefined,
          flatRateOverageRate: parseFloat(flatRateOverageRate) || undefined,
          flatRateOptions: flatRateOptions.filter((o) => o.label.trim()),
        }),
      };

      let result: ModularJobTemplate;
      if (isEditing && existingTemplate) {
        result = await updateModularTemplate(existingTemplate.id, templateData as Partial<ModularJobTemplate>);
      } else {
        result = await createModularTemplate(templateData);
      }

      onSave?.(result);
      if (!onSave) {
        navigation?.goBack?.();
      }
    } catch (error) {
      Alert.alert("Error", "Unable to save template.");
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    name, description, category, billingMode, segments,
    hourlyRate, minimumHours, timeRounding, returnTripMinutes,
    isFlatRate, flatRateAmount, flatRateMaxHours, flatRateOverageRate, flatRateOptions,
    isEditing, existingTemplate, onSave, navigation,
  ]);

  // ── Styles helpers ──
  const sectionTitle = useMemo(
    () => ({
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.textSecondary,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.xl,
    }),
    [colors],
  );

  const inputStyle = useMemo(
    () => ({
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      fontSize: 15,
      color: colors.text,
    }),
    [colors],
  );

  // ── RENDER ──
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={handleCancel} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          {isEditing ? "Edit template" : "New job template"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => ({
            opacity: pressed || isSaving ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
            {isSaving ? "..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Nom & Description ── */}
        <Text style={sectionTitle}>Information</Text>
        <TextInput
          placeholder="Template name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          style={[inputStyle, { marginBottom: DESIGN_TOKENS.spacing.sm }]}
        />
        <TextInput
          placeholder="Description (optional)"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          style={[inputStyle, { minHeight: 60, textAlignVertical: "top" }]}
        />

        {/* ── Catégorie ── */}
        <Text style={sectionTitle}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: DESIGN_TOKENS.spacing.sm }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                backgroundColor: category === cat ? colors.primary + "20" : colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: category === cat ? colors.primary : colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: category === cat ? "700" : "500",
                  color: category === cat ? colors.primary : colors.textSecondary,
                  textTransform: "capitalize",
                }}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Mode de facturation ── */}
        <Text style={sectionTitle}>Billing mode</Text>
        <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
          {BILLING_MODES.map((mode) => {
            const isSelected = billingMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => setBillingMode(mode.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? colors.primary + "12" : colors.backgroundSecondary,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  padding: DESIGN_TOKENS.spacing.md,
                  gap: DESIGN_TOKENS.spacing.md,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isSelected ? colors.primary + "25" : colors.border + "40",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? colors.primary : colors.text,
                    }}
                  >
                    {mode.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                    {mode.desc}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Segments ── */}
        <Text style={sectionTitle}>Segments</Text>
        <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
          {segments.map((seg, index) => {
            const segTypeInfo = SEGMENT_TYPES.find((st) => st.key === seg.type);
            return (
              <View
                key={seg.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: DESIGN_TOKENS.spacing.sm,
                  gap: DESIGN_TOKENS.spacing.sm,
                }}
              >
                {/* Icône type */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: (segTypeInfo?.color ?? "#6B7280") + "20",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={(segTypeInfo?.icon ?? "ellipse-outline") as any}
                    size={16}
                    color={segTypeInfo?.color ?? "#6B7280"}
                  />
                </View>

                {/* Label éditable */}
                <TextInput
                  value={seg.label}
                  onChangeText={(text) => updateSegmentLabel(seg.id, text)}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: colors.text,
                    paddingVertical: 4,
                  }}
                  placeholderTextColor={colors.textSecondary}
                />

                {/* Ordre + actions */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Pressable
                    onPress={() => moveSegment(index, "up")}
                    disabled={index === 0}
                    hitSlop={8}
                    style={{ opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveSegment(index, "down")}
                    disabled={index === segments.length - 1}
                    hitSlop={8}
                    style={{ opacity: index === segments.length - 1 ? 0.3 : 1 }}
                  >
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => removeSegment(seg.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Bouton ajouter */}
          {!showAddSegment ? (
            <Pressable
              onPress={() => setShowAddSegment(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.primary + "60",
                borderRadius: DESIGN_TOKENS.radius.md,
                gap: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                Add segment
              </Text>
            </Pressable>
          ) : (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                Segment type
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: DESIGN_TOKENS.spacing.sm }}>
                {SEGMENT_TYPES.map((st) => (
                  <Pressable
                    key={st.key}
                    onPress={() => addSegment(
                      st.key,
                      st.key === "location" ? "house" : st.key === "loading" ? "depot" : undefined,
                    )}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: st.color + "15",
                      borderWidth: 1,
                      borderColor: st.color + "40",
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      gap: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    <Ionicons name={st.icon as any} size={16} color={st.color} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: st.color }}>
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => setShowAddSegment(false)}
                style={{ alignSelf: "center", marginTop: DESIGN_TOKENS.spacing.sm }}
              >
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Facturation (modes horaires) ── */}
        {!isFlatRate && (
          <>
            <Text style={sectionTitle}>Billing</Text>
            <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
              <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Hourly rate ($/h)
                  </Text>
                  <TextInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="decimal-pad"
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Minimum hours
                  </Text>
                  <TextInput
                    value={minimumHours}
                    onChangeText={setMinimumHours}
                    keyboardType="decimal-pad"
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Rounding
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {ROUNDING_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setTimeRounding(opt.value)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          backgroundColor:
                            timeRounding === opt.value
                              ? colors.primary + "20"
                              : colors.backgroundSecondary,
                          borderWidth: 1,
                          borderColor:
                            timeRounding === opt.value
                              ? colors.primary
                              : colors.border,
                          borderRadius: DESIGN_TOKENS.radius.sm,
                          paddingVertical: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: timeRounding === opt.value ? "700" : "500",
                            color:
                              timeRounding === opt.value
                                ? colors.primary
                                : colors.textSecondary,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {billingMode === "depot_to_depot" && (
                <View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Return trip default (min)
                  </Text>
                  <TextInput
                    value={returnTripMinutes}
                    onChangeText={setReturnTripMinutes}
                    keyboardType="number-pad"
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Facturation (mode forfait) ── */}
        {isFlatRate && (
          <>
            <Text style={sectionTitle}>Flat rate</Text>
            <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                  Fixed amount ($)
                </Text>
                <TextInput
                  value={flatRateAmount}
                  onChangeText={setFlatRateAmount}
                  keyboardType="decimal-pad"
                  placeholder="2500"
                  style={inputStyle}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Max hours (h)
                  </Text>
                  <TextInput
                    value={flatRateMaxHours}
                    onChangeText={setFlatRateMaxHours}
                    keyboardType="decimal-pad"
                    placeholder="8"
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    Overage rate ($/h)
                  </Text>
                  <TextInput
                    value={flatRateOverageRate}
                    onChangeText={setFlatRateOverageRate}
                    keyboardType="decimal-pad"
                    placeholder="150"
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Options ajoutables */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginTop: DESIGN_TOKENS.spacing.md,
                }}
              >
                Add-on options
              </Text>
              {flatRateOptions.map((opt) => (
                <View
                  key={opt.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <TextInput
                    value={opt.label}
                    onChangeText={(v) => updateFlatRateOption(opt.id, "label", v)}
                    placeholder="Label (Piano...)"
                    style={[inputStyle, { flex: 2 }]}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    value={opt.price > 0 ? opt.price.toString() : ""}
                    onChangeText={(v) => updateFlatRateOption(opt.id, "price", v)}
                    placeholder="$"
                    keyboardType="decimal-pad"
                    style={[inputStyle, { flex: 1 }]}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable onPress={() => removeFlatRateOption(opt.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={addFlatRateOption}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  gap: 4,
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                  Add option
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultLabel(
  type: SegmentType,
  locationType: LocationType | undefined,
  order: number,
): string {
  switch (type) {
    case "location": {
      const locLabel = locationType ? (LOCATION_TYPE_LABELS[locationType] ?? "") : "";
      return `Location #${order}${locLabel ? ` (${locLabel.toLowerCase()})` : ""}`;
    }
    case "travel":
      return "Travel";
    case "storage":
      return "Storage";
    case "loading":
      return "Loading";
    default:
      return `Segment ${order}`;
  }
}

function getDefaultBillable(type: SegmentType, billing: BillingMode): boolean {
  switch (billing) {
    case "flat_rate":
      return false;
    case "packing_only":
    case "unpacking_only":
      return type === "location";
    case "depot_to_depot":
      return true;
    case "location_to_location":
      return type === "location" || type === "travel";
    default:
      return true;
  }
}

export default JobTemplateEditor;

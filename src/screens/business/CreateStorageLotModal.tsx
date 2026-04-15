/**
 * CreateStorageLotModal — Full-featured modal to create a new storage lot
 * Supports client search/creation, billing config, job linking, unit pre-assignment
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import type { ClientSuggestion } from "../../services/storageService";
import * as StorageService from "../../services/storageService";
import type {
    BillingType,
    StorageLot,
    StorageUnit,
} from "../../types/storage";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (lot: StorageLot) => void;
  /** Pre-fill from a job */
  prefillJobId?: number;
  prefillClientName?: string;
  prefillClientEmail?: string;
  prefillClientPhone?: string;
}

const BILLING_TYPES: BillingType[] = ["fixed", "weekly", "monthly"];

export default function CreateStorageLotModal({
  visible,
  onClose,
  onCreated,
  prefillJobId,
  prefillClientName,
  prefillClientEmail,
  prefillClientPhone,
}: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // ── Form state ──
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [jobId, setJobId] = useState<string>("");
  const [billingType, setBillingType] = useState<BillingType>("monthly");
  const [billingAmount, setBillingAmount] = useState("");
  const [billingStartDate, setBillingStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Client search ──
  const [clientQuery, setClientQuery] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [clientSelected, setClientSelected] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Unit pre-assignment ──
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<StorageUnit[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // ── Step ──
  const [step, setStep] = useState<1 | 2>(1);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setClientName(prefillClientName || "");
      setClientEmail(prefillClientEmail || "");
      setClientPhone(prefillClientPhone || "");
      setClientQuery(prefillClientName || "");
      setClientSelected(!!prefillClientName);
      setIsNewClient(false);
      setClientSuggestions([]);
      setShowSuggestions(false);
      setJobId(prefillJobId ? String(prefillJobId) : "");
      setBillingType("monthly");
      setBillingAmount("");
      setBillingStartDate("");
      setNotes("");
      setSelectedUnitIds([]);
      setStep(1);
    }
  }, [visible, prefillClientName, prefillClientEmail, prefillClientPhone, prefillJobId]);

  // Debounced client search
  const handleClientQueryChange = useCallback((text: string) => {
    setClientQuery(text);
    setClientSelected(false);
    setIsNewClient(false);
    setClientName(text);
    setClientEmail("");
    setClientPhone("");

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) {
      setClientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    searchTimeout.current = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const results = await StorageService.searchClients(text);
        setClientSuggestions(results);
      } catch {
        setClientSuggestions([]);
      } finally {
        setSearchingClients(false);
      }
    }, 300);
  }, []);

  const handleSelectClient = useCallback((client: ClientSuggestion) => {
    setClientQuery(client.name);
    setClientName(client.name);
    setClientEmail(client.email || "");
    setClientPhone(client.phone || "");
    setClientSelected(true);
    setIsNewClient(false);
    setShowSuggestions(false);
  }, []);

  const handleCreateNewClient = useCallback(() => {
    setClientName(clientQuery.trim());
    setClientSelected(false);
    setIsNewClient(true);
    setShowSuggestions(false);
  }, [clientQuery]);

  // Load available units when moving to step 2
  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const units = await StorageService.listUnits();
      setAvailableUnits(units.filter((u) => u.status === "available" || u.status === "in_use"));
    } catch {
      // silent
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const toggleUnit = (id: number) => {
    setSelectedUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (!clientName.trim()) {
      Alert.alert(t("common.error"), t("storage.create.clientNameRequired"));
      return;
    }
    loadUnits();
    setStep(2);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const lot = await StorageService.createLot({
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        job_id: jobId ? parseInt(jobId) : undefined,
        billing_type: billingType,
        billing_amount: parseFloat(billingAmount) || 0,
        billing_start_date: billingStartDate || undefined,
        notes: notes.trim() || undefined,
      });

      // Assign selected units
      for (const unitId of selectedUnitIds) {
        try {
          await StorageService.assignUnitToLot(lot.id, unitId);
        } catch {
          // continue if one fails
        }
      }

      onCreated(lot);
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.backgroundSecondary : "#F9FAFB",
    },
  ];

  // ── Step 1: Client & Billing info ──
  const renderStep1 = () => (
    <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.border }]} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("storage.create.clientInfo")}
      </Text>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.fields.clientName")} *
      </Text>
      <View style={{ position: "relative", zIndex: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[...inputStyle, { flex: 1 }]}
            value={clientQuery}
            onChangeText={handleClientQueryChange}
            placeholder={t("storage.clientSearch.placeholder")}
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
          {clientSelected && (
            <Pressable
              style={{ marginLeft: 8 }}
              onPress={() => {
                setClientQuery("");
                setClientName("");
                setClientEmail("");
                setClientPhone("");
                setClientSelected(false);
                setIsNewClient(false);
              }}
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <View
            style={[
              styles.suggestionsContainer,
              {
                backgroundColor: isDark ? colors.backgroundSecondary : "#FFF",
                borderColor: colors.border,
              },
            ]}
          >
            {searchingClients ? (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 13 }}>
                  {t("storage.clientSearch.searching")}
                </Text>
              </View>
            ) : (
              <>
                {clientSuggestions.map((client, idx) => (
                  <Pressable
                    key={`${client.name}-${idx}`}
                    style={[
                      styles.suggestionRow,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSelectClient(client)}
                  >
                    <Ionicons
                      name={client.source === "storage" ? "cube-outline" : "briefcase-outline"}
                      size={18}
                      color={colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.suggestionName, { color: colors.text }]}>
                        {client.name}
                      </Text>
                      {(client.email || client.phone) && (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                          {[client.email, client.phone].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}

                {/* "Create new client" option */}
                {clientQuery.trim().length >= 2 && (
                  <Pressable
                    style={[styles.suggestionRow, { borderBottomWidth: 0 }]}
                    onPress={handleCreateNewClient}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 10, fontSize: 14 }}>
                      {t("storage.clientSearch.createNew", { name: clientQuery.trim() })}
                    </Text>
                  </Pressable>
                )}

                {!searchingClients && clientSuggestions.length === 0 && clientQuery.trim().length >= 2 && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 10, paddingHorizontal: 12 }}>
                    {t("storage.clientSearch.noResults")}
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* Client selected badge */}
      {clientSelected && (
        <View style={[styles.clientBadge, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 6, fontSize: 13 }}>
            {t("storage.clientSearch.selected")}
          </Text>
        </View>
      )}

      {/* New client form fields */}
      {(isNewClient || clientSelected) && (
        <>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {t("storage.fields.clientEmail")}
          </Text>
          <TextInput
            style={inputStyle}
            value={clientEmail}
            onChangeText={setClientEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="email@example.com"
            placeholderTextColor={colors.textSecondary}
            editable={isNewClient || !clientSelected}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {t("storage.fields.clientPhone")}
          </Text>
          <TextInput
            style={inputStyle}
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
            placeholder="+61 400 000 000"
            placeholderTextColor={colors.textSecondary}
            editable={isNewClient || !clientSelected}
          />
        </>
      )}

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.create.linkedJob")}
      </Text>
      <TextInput
        style={inputStyle}
        value={jobId}
        onChangeText={setJobId}
        keyboardType="number-pad"
        placeholder={t("storage.create.linkedJobPlaceholder")}
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.divider} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("storage.create.billingSetup")}
      </Text>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.fields.billingType")}
      </Text>
      <View style={styles.chipRow}>
        {BILLING_TYPES.map((bt) => {
          const active = billingType === bt;
          return (
            <Pressable
              key={bt}
              style={[
                styles.chip,
                { borderColor: active ? colors.primary : colors.border },
                active && { backgroundColor: colors.primary + "15" },
              ]}
              onPress={() => setBillingType(bt)}
            >
              <Text
                style={{
                  color: active ? colors.primary : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: active ? "600" : "400",
                }}
              >
                {t(`storage.billing.${bt}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.fields.billingAmount")} ($)
      </Text>
      <TextInput
        style={inputStyle}
        value={billingAmount}
        onChangeText={setBillingAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.create.startDate")}
      </Text>
      <TextInput
        style={inputStyle}
        value={billingStartDate}
        onChangeText={setBillingStartDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("storage.fields.notes")}
      </Text>
      <TextInput
        style={[...inputStyle, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        placeholder={t("storage.fields.notesPlaceholder")}
        placeholderTextColor={colors.textSecondary}
      />

      <View style={{ height: 16 }} />
    </ScrollView>
  );

  // ── Step 2: Assign units ──
  const renderStep2 = () => (
    <View style={styles.modalBody}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressLine, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("storage.create.assignUnits")}
      </Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t("storage.create.assignUnitsHint")}
      </Text>

      {selectedUnitIds.length > 0 && (
        <View style={[styles.selectedBanner, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 6 }}>
            {selectedUnitIds.length} {t("storage.create.unitsSelected")}
          </Text>
        </View>
      )}

      <FlatList
        data={availableUnits}
        keyExtractor={(u) => String(u.id)}
        style={{ maxHeight: 340 }}
        ListEmptyComponent={
          loadingUnits ? (
            <Text style={[styles.hint, { color: colors.textSecondary, textAlign: "center", paddingVertical: 30 }]}>
              {t("storage.loading")}
            </Text>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {t("storage.noAvailableUnits")}
              </Text>
            </View>
          )
        }
        renderItem={({ item: unit }) => {
          const selected = selectedUnitIds.includes(unit.id);
          return (
            <Pressable
              style={[
                styles.unitRow,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected
                    ? colors.primary + "08"
                    : isDark
                      ? colors.backgroundSecondary
                      : "#FFF",
                },
              ]}
              onPress={() => toggleUnit(unit.id)}
            >
              <Ionicons
                name={selected ? "checkbox" : "square-outline"}
                size={22}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.unitName, { color: colors.text }]}>{unit.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {t(`storage.unitType.${unit.unit_type}`)}
                  {unit.capacity_cbm ? ` · ${unit.capacity_cbm} m³` : ""}
                  {unit.location_description ? ` · ${unit.location_description}` : ""}
                </Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      unit.status === "available" ? "#10B981" : "#3B82F6",
                  },
                ]}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            {step === 2 ? (
              <Pressable onPress={() => setStep(1)} style={styles.headerBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("storage.create.title")}
            </Text>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {step === 1 ? renderStep1() : renderStep2()}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {step === 1 ? (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: !clientName.trim() ? 0.5 : 1,
                  },
                ]}
                onPress={handleNext}
                disabled={!clientName.trim()}
              >
                <Text style={styles.primaryBtnText}>{t("storage.create.next")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                    {t("storage.create.skipUnits")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.primary, flex: 1, opacity: saving ? 0.5 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.primaryBtnText}>
                    {saving ? t("common.saving") : t("storage.create.createLot")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 32, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  modalBody: { paddingHorizontal: 16, paddingTop: 12 },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 4,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressLine: { width: 50, height: 2 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  hint: { fontSize: 13, marginBottom: 12 },

  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },

  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },

  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  unitName: { fontSize: 15, fontWeight: "600" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  emptyState: { alignItems: "center", paddingVertical: 30, gap: 8 },

  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    maxHeight: 220,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionName: { fontSize: 14, fontWeight: "600" },
  suggestionLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  clientBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 30,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "500" },
});

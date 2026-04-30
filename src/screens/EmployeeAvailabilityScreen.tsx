import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useAuth } from "../hooks/useAuth";
import { useLocalization } from "../localization/useLocalization";
import {
    addAvailabilityException,
    AvailabilityException,
    AvailabilitySlot,
    deleteAvailabilityException,
    getEmployeeAvailability,
    updateEmployeeAvailability,
} from "../services/employeeAvailabilityService";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface Props {
  route?: any;
  navigation: any;
}

export default function EmployeeAvailabilityScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { user } = useAuth();
  const userId: number = route?.params?.userId ?? user?.id;

  const defaultSlots = (): AvailabilitySlot[] =>
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      is_available: i >= 1 && i <= 5,
      start_time: "08:00",
      end_time: "17:00",
    }));

  const [slots, setSlots] = useState<AvailabilitySlot[]>(defaultSlots());
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exception modal
  const [showExcModal, setShowExcModal] = useState(false);
  const [excDate, setExcDate] = useState("");
  const [excAvail, setExcAvail] = useState(false);
  const [excReason, setExcReason] = useState("");
  const [savingExc, setSavingExc] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getEmployeeAvailability(userId);
      if (data.availabilities?.length) setSlots(data.availabilities);
      setExceptions(data.exceptions ?? []);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const updateSlot = (idx: number, patch: Partial<AvailabilitySlot>) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmployeeAvailability(userId, slots);
      Alert.alert(t("common.saved") ?? "Enregistré", t("availability.saveSuccess") ?? "Disponibilités mises à jour");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("availability.saveError") ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!excDate.trim()) return;
    setSavingExc(true);
    try {
      const exc = await addAvailabilityException(userId, {
        date: excDate.trim(),
        is_available: excAvail,
        reason: excReason.trim() || undefined,
      });
      setExceptions((prev) => [...prev, exc]);
      setShowExcModal(false);
      setExcDate("");
      setExcAvail(false);
      setExcReason("");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("availability.exceptionError") ?? "Impossible d'ajouter");
    } finally {
      setSavingExc(false);
    }
  };

  const handleDeleteException = async (exc: AvailabilityException) => {
    if (!exc.id) return;
    try {
      await deleteAvailabilityException(userId, exc.id);
      setExceptions((prev) => prev.filter((e) => e.id !== exc.id));
    } catch {
      Alert.alert(t("common.error") ?? "Erreur");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("availability.title") ?? "Disponibilités"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {t("common.save") ?? "Enregistrer"}
            </Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable
            onPress={load}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {/* Weekly schedule */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            {t("availability.weekLabel") ?? "Planning hebdomadaire"}
          </Text>
          {slots.map((slot, idx) => (
            <View
              key={slot.day_of_week}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.sm,
                borderWidth: 1,
                borderColor: slot.is_available ? colors.primary + "40" : colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text, width: 36 }}>
                  {DAY_LABELS[slot.day_of_week]}
                </Text>
                <Switch
                  value={slot.is_available}
                  onValueChange={(val) => updateSlot(idx, { is_available: val })}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              {slot.is_available && (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                      {t("availability.startTime") ?? "Début"}
                    </Text>
                    <TextInput
                      value={slot.start_time ?? ""}
                      onChangeText={(v) => updateSlot(idx, { start_time: v })}
                      placeholder="08:00"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        color: colors.text,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                      {t("availability.endTime") ?? "Fin"}
                    </Text>
                    <TextInput
                      value={slot.end_time ?? ""}
                      onChangeText={(v) => updateSlot(idx, { end_time: v })}
                      placeholder="17:00"
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        color: colors.text,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Exceptions */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              {t("availability.exceptionsLabel") ?? "Exceptions"}
            </Text>
            <Pressable
              onPress={() => setShowExcModal(true)}
              style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                {t("common.add") ?? "Ajouter"}
              </Text>
            </Pressable>
          </View>

          {exceptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 12 }}>
              {t("availability.noExceptions") ?? "Aucune exception"}
            </Text>
          ) : (
            exceptions.map((exc) => (
              <View
                key={exc.id ?? exc.date}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                  marginBottom: DESIGN_TOKENS.spacing.xs ?? 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: colors.text, fontSize: 14 }}>{exc.date}</Text>
                  {exc.reason ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{exc.reason}</Text>
                  ) : null}
                </View>
                <View
                  style={{
                    backgroundColor: exc.is_available ? "#38A16920" : "#E53E3E20",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: exc.is_available ? "#38A169" : "#E53E3E" }}>
                    {exc.is_available ? (t("common.available") ?? "Dispo") : (t("common.unavailable") ?? "Indispo")}
                  </Text>
                </View>
                <Pressable onPress={() => handleDeleteException(exc)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Exception Modal */}
      <Modal visible={showExcModal} transparent animationType="slide" onRequestClose={() => setShowExcModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowExcModal(false)} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: DESIGN_TOKENS.spacing.lg,
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("availability.addException") ?? "Ajouter une exception"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("availability.dateLabel") ?? "Date (AAAA-MM-JJ) *"}
            </Text>
            <TextInput
              value={excDate}
              onChangeText={setExcDate}
              placeholder="2026-05-01"
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1,
                borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
                color: colors.text, fontSize: 14, marginBottom: 14,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                {t("availability.isAvailable") ?? "Disponible ce jour"}
              </Text>
              <Switch
                value={excAvail}
                onValueChange={setExcAvail}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("availability.reasonLabel") ?? "Raison (optionnel)"}
            </Text>
            <TextInput
              value={excReason}
              onChangeText={setExcReason}
              placeholder="Jour férié, maladie..."
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1,
                borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
                color: colors.text, fontSize: 14, marginBottom: 20,
              }}
            />

            <Pressable
              onPress={handleAddException}
              disabled={savingExc || !excDate.trim()}
              style={{
                backgroundColor: excDate.trim() ? colors.primary : colors.border,
                borderRadius: 14, paddingVertical: 14, alignItems: "center",
              }}
            >
              {savingExc ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("common.add") ?? "Ajouter"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

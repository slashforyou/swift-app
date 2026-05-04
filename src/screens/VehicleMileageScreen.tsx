import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServerData } from "../constants/ServerData";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
    addMileageEntry,
    getVehicleMileage,
    MileageEntry,
    updateVehicleServiceInfo,
    VehicleServiceInfo,
} from "../services/vehicleMileageService";
import { authenticatedFetch } from "../utils/auth";

interface Props {
  route?: any;
  navigation: any;
}

interface SimpleVehicle { id: number; name: string; license_plate?: string; }

export default function VehicleMileageScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const paramVehicleId: number | undefined = route?.params?.vehicleId;

  // Vehicle picker (when no vehicleId passed)
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(!paramVehicleId);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(paramVehicleId);
  const [showVehiclePicker, setShowVehiclePicker] = useState(!paramVehicleId);

  const vehicleId = selectedVehicleId ?? 0;

  useEffect(() => {
    if (paramVehicleId) return;
    (async () => {
      try {
        const res = await authenticatedFetch(`${ServerData.serverUrl}v1/trucks`);
        const json = await res.json();
        const list: SimpleVehicle[] = (json.trucks ?? json.data ?? []).map((v: any) => ({
          id: v.id,
          name: v.name || v.make || 'Véhicule',
          license_plate: v.license_plate || v.registration,
        }));
        setVehicles(list);
      } catch { /* silently ignore */ } finally {
        setVehiclesLoading(false);
      }
    })();
  }, [paramVehicleId]);

  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [serviceInfo, setServiceInfo] = useState<VehicleServiceInfo>({});
  const [loading, setLoading] = useState(!!paramVehicleId);
  const [error, setError] = useState<string | null>(null);

  // Add mileage modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [odoInput, setOdoInput] = useState("");
  const [jobIdInput, setJobIdInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Service config modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [svcInterval, setSvcInterval] = useState("");
  const [svcLastKm, setSvcLastKm] = useState("");
  const [svcNextDate, setSvcNextDate] = useState("");
  const [savingSvc, setSavingSvc] = useState(false);

  const load = useCallback(async () => {
    if (!vehicleId) return;
    try {
      setError(null);
      setLoading(true);
      const data = await getVehicleMileage(vehicleId);
      setEntries(data.entries ?? []);
      setServiceInfo(data.service_info ?? {});
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { if (vehicleId) load(); }, [load, vehicleId]);

  const isServiceDue =
    serviceInfo.current_odometer != null &&
    serviceInfo.next_service_km != null &&
    serviceInfo.current_odometer >= serviceInfo.next_service_km;

  const handleAddEntry = async () => {
    const odo = parseInt(odoInput, 10);
    if (isNaN(odo) || odo < 1) return;
    setSaving(true);
    try {
      await addMileageEntry(vehicleId, {
        odometer_after: odo,
        job_id: jobIdInput.trim() ? parseInt(jobIdInput.trim(), 10) : undefined,
        note: noteInput.trim() || undefined,
      });
      await load();
      setShowAddModal(false);
      setOdoInput("");
      setJobIdInput("");
      setNoteInput("");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("mileage.saveError") ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    setSavingSvc(true);
    try {
      await updateVehicleServiceInfo(vehicleId, {
        service_interval_km: svcInterval ? parseInt(svcInterval, 10) : undefined,
        last_service_km: svcLastKm ? parseInt(svcLastKm, 10) : undefined,
        next_service_date: svcNextDate.trim() || undefined,
      });
      await load();
      setShowServiceModal(false);
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("mileage.serviceError") ?? "Impossible d'enregistrer");
    } finally {
      setSavingSvc(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // Show vehicle picker if no vehicleId provided
  if (!selectedVehicleId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + DESIGN_TOKENS.spacing.sm, paddingHorizontal: DESIGN_TOKENS.spacing.lg, paddingBottom: DESIGN_TOKENS.spacing.md, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
            {t("mileage.title") ?? "Kilométrage"}
          </Text>
        </View>
        {vehiclesLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(v) => String(v.id)}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, gap: DESIGN_TOKENS.spacing.sm }}
            ListHeaderComponent={
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: DESIGN_TOKENS.spacing.md }}>
                {t("mileage.selectVehicle") ?? "Select a vehicle"}
              </Text>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Ionicons name="car-outline" size={40} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>{t("mileage.noVehicles") ?? "No vehicles found"}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { setSelectedVehicleId(item.id); setLoading(true); }}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md, padding: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1, borderColor: colors.border,
                })}
              >
                <Ionicons name="car-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{item.name}</Text>
                  {item.license_plate ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.license_plate}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("mileage.title") ?? "Kilométrage"}
        </Text>
        <Pressable
          onPress={() => setShowServiceModal(true)}
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable onPress={load} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* Service due alert */}
          {isServiceDue && (
            <View
              style={{
                margin: DESIGN_TOKENS.spacing.lg,
                marginBottom: 0,
                backgroundColor: "#E53E3E15",
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1, borderColor: "#E53E3E40",
                flexDirection: "row", alignItems: "center", gap: 10,
              }}
            >
              <Ionicons name="warning" size={20} color="#E53E3E" />
              <Text style={{ color: "#E53E3E", fontWeight: "700", flex: 1, fontSize: 14 }}>
                {t("mileage.serviceDue") ?? "⚠️ Service dû — entretien requis"}
              </Text>
            </View>
          )}

          {/* Stats card */}
          <View
            style={{
              margin: DESIGN_TOKENS.spacing.lg,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.xl ?? 16,
              padding: DESIGN_TOKENS.spacing.lg,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: "row", gap: 12,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
                {serviceInfo.current_odometer?.toLocaleString() ?? "—"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {t("mileage.currentOdo") ?? "km actuels"}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: isServiceDue ? "#E53E3E" : colors.text }}>
                {serviceInfo.next_service_km?.toLocaleString() ?? "—"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {t("mileage.nextServiceKm") ?? "km prochain service"}
              </Text>
            </View>
          </View>

          {/* History */}
          <View style={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              {t("mileage.history") ?? "Historique"}
            </Text>
            {entries.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 30 }}>
                <Ionicons name="speedometer-outline" size={40} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 }}>
                  {t("mileage.empty") ?? "Aucune entrée"}
                </Text>
              </View>
            ) : (
              entries.slice(0, 20).map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.xs ?? 6,
                    borderWidth: 1, borderColor: colors.border, gap: 12,
                  }}
                >
                  <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                      {entry.odometer_after.toLocaleString()} km
                    </Text>
                    {entry.note ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{entry.note}</Text>
                    ) : null}
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {formatDate(entry.created_at)}
                    </Text>
                  </View>
                  {entry.job_id ? (
                    <View style={{ backgroundColor: colors.primary + "15", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>
                        Job #{entry.job_id}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <View style={{ position: "absolute", bottom: insets.bottom + DESIGN_TOKENS.spacing.lg, right: DESIGN_TOKENS.spacing.lg }}>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
            width: 56, height: 56, borderRadius: 28,
            justifyContent: "center", alignItems: "center",
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
          })}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Add Mileage Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAddModal(false)} />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("mileage.addEntry") ?? "Saisir le kilométrage"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{t("mileage.odoLabel") ?? "Odomètre (km) *"}</Text>
            <TextInput
              value={odoInput}
              onChangeText={setOdoInput}
              keyboardType="numeric"
              placeholder="125000"
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16, marginBottom: 14, textAlign: "center", fontWeight: "700" }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{t("mileage.jobIdLabel") ?? "Job ID (optionnel)"}</Text>
            <TextInput
              value={jobIdInput}
              onChangeText={setJobIdInput}
              keyboardType="numeric"
              placeholder="123"
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14 }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{t("common.note") ?? "Note (optionnel)"}</Text>
            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="..."
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 20 }}
            />
            <Pressable
              onPress={handleAddEntry}
              disabled={saving || !odoInput.trim()}
              style={{ backgroundColor: odoInput.trim() ? colors.primary : colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("common.save") ?? "Enregistrer"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Service Config Modal */}
      <Modal visible={showServiceModal} transparent animationType="slide" onRequestClose={() => setShowServiceModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowServiceModal(false)} />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("mileage.serviceConfig") ?? "Configurer le service"}
            </Text>
            {[
              { label: t("mileage.intervalLabel") ?? "Intervalle (km)", value: svcInterval, set: setSvcInterval, keyboardType: "numeric" as const },
              { label: t("mileage.lastServiceKmLabel") ?? "Dernier service (km)", value: svcLastKm, set: setSvcLastKm, keyboardType: "numeric" as const },
              { label: t("mileage.nextServiceDateLabel") ?? "Prochain service (AAAA-MM-JJ)", value: svcNextDate, set: setSvcNextDate, keyboardType: "default" as const },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.keyboardType}
                  placeholderTextColor={colors.textSecondary}
                  placeholder={f.keyboardType === "numeric" ? "0" : "2026-12-31"}
                  style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14 }}
                />
              </View>
            ))}
            <Pressable
              onPress={handleSaveService}
              disabled={savingSvc}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 }}
            >
              {savingSvc ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("common.save") ?? "Enregistrer"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
    createMaintenanceAlert,
    deleteMaintenanceAlert,
    getAllMaintenanceAlerts,
    MaintenanceAlert,
    updateMaintenanceAlert,
} from "../services/vehicleMaintenanceService";

const ALERT_TYPE_IDS = ["oil_change", "tyre", "rego", "service", "other"];

interface Props {
  route?: any;
  navigation: any;
}

export default function VehicleMaintenanceScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "done">("active");

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formType, setFormType] = useState("service");
  const [formTitle, setFormTitle] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueKm, setFormDueKm] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getAllMaintenanceAlerts();
      setAlerts(data);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().split("T")[0];

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === "active") return a.status !== "done";
    return a.status === "done";
  });

  // Group by vehicle
  const grouped = filteredAlerts.reduce<Record<string, MaintenanceAlert[]>>((acc, alert) => {
    const key = String(alert.vehicle_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(alert);
    return acc;
  }, {});

  const handleMarkDone = async (alert: MaintenanceAlert) => {
    try {
      await updateMaintenanceAlert(alert.id, { status: "done" });
      setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: "done" } : a));
    } catch {
      Alert.alert(t("common.error") ?? "Erreur");
    }
  };

  const handleDelete = (alert: MaintenanceAlert) => {
    Alert.alert(
      t("common.delete") ?? "Supprimer",
      t("maintenance.deleteConfirm") ?? "Supprimer cette alerte ?",
      [
        { text: t("common.cancel") ?? "Annuler", style: "cancel" },
        {
          text: t("common.delete") ?? "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMaintenanceAlert(alert.id);
              setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
            } catch {
              Alert.alert(t("common.error") ?? "Erreur");
            }
          },
        },
      ],
    );
  };

  const handleAdd = async () => {
    if (!formTitle.trim() || !formVehicleId.trim()) return;
    setSaving(true);
    try {
      const created = await createMaintenanceAlert(parseInt(formVehicleId, 10), {
        alert_type: formType,
        title: formTitle.trim(),
        due_date: formDueDate.trim() || undefined,
        due_km: formDueKm.trim() ? parseInt(formDueKm, 10) : undefined,
        status: "pending",
      });
      setAlerts((prev) => [created, ...prev]);
      setShowAddModal(false);
      setFormVehicleId("");
      setFormTitle("");
      setFormDueDate("");
      setFormDueKm("");
      setFormType("service");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("maintenance.saveError") ?? "Impossible d'ajouter");
    } finally {
      setSaving(false);
    }
  };

  const isOverdue = (alert: MaintenanceAlert) =>
    alert.due_date && alert.due_date < today && alert.status !== "done";

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
          {t("maintenance.title") ?? "Maintenance véhicules"}
        </Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 8 }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: DESIGN_TOKENS.spacing.lg, paddingVertical: DESIGN_TOKENS.spacing.sm, gap: 8 }}>
        {(["active", "done"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
              backgroundColor: activeTab === tab ? colors.primary : colors.backgroundSecondary,
              borderWidth: 1, borderColor: activeTab === tab ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: activeTab === tab ? "#fff" : colors.text, fontWeight: "600", fontSize: 14 }}>
              {tab === "active" ? (t("maintenance.tabActive") ?? "Actives") : (t("maintenance.tabDone") ?? "Terminées")}
            </Text>
          </Pressable>
        ))}
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
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {Object.keys(grouped).length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="car-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>
                {t("maintenance.empty") ?? "Aucune alerte"}
              </Text>
            </View>
          ) : (
            Object.entries(grouped).map(([vehicleId, vehicleAlerts]) => (
              <View key={vehicleId} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary, marginBottom: 8 }}>
                  {vehicleAlerts[0].vehicle_name ?? `Véhicule #${vehicleId}`}
                </Text>
                {vehicleAlerts.map((alert) => {
                  const overdue = isOverdue(alert);
                  const isDone = alert.status === "done";
                  return (
                    <View
                      key={alert.id}
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        padding: DESIGN_TOKENS.spacing.md,
                        marginBottom: DESIGN_TOKENS.spacing.sm,
                        borderWidth: 1,
                        borderColor: overdue ? "#E53E3E40" : colors.border,
                        opacity: isDone ? 0.6 : 1,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Ionicons
                          name={isDone ? "checkmark-circle" : overdue ? "alert-circle" : "build-outline"}
                          size={22}
                          color={isDone ? "#38A169" : overdue ? "#E53E3E" : colors.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: "700", color: colors.text, fontSize: 14,
                              textDecorationLine: isDone ? "line-through" : "none",
                            }}
                          >
                            {alert.title}
                          </Text>
                          <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                            <View style={{ backgroundColor: colors.primary + "15", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>
                                {t(`maintenance.alertTypes.${alert.alert_type}`) ?? alert.alert_type}
                              </Text>
                            </View>
                            {alert.due_date && (
                              <Text style={{ color: overdue ? "#E53E3E" : colors.textSecondary, fontSize: 12 }}>
                                {overdue ? "⚠️ " : ""}{alert.due_date}
                              </Text>
                            )}
                          </View>
                        </View>
                        {!isDone && (
                          <Pressable
                            onPress={() => handleMarkDone(alert)}
                            style={{ backgroundColor: "#38A16920", borderRadius: 8, padding: 8 }}
                            hitSlop={4}
                          >
                            <Ionicons name="checkmark" size={18} color="#38A169" />
                          </Pressable>
                        )}
                        <Pressable onPress={() => handleDelete(alert)} hitSlop={8} style={{ padding: 4 }}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAddModal(false)} />
          <ScrollView
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" }}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
              {t("maintenance.addTitle") ?? "Nouvelle alerte"}
            </Text>

            {[
              { label: t("maintenance.vehicleIdLabel") ?? "ID Véhicule *", value: formVehicleId, set: setFormVehicleId, numeric: true },
              { label: t("maintenance.titleLabel") ?? "Titre *", value: formTitle, set: setFormTitle, numeric: false },
              { label: t("maintenance.dueDateLabel") ?? "Date limite (AAAA-MM-JJ)", value: formDueDate, set: setFormDueDate, numeric: false },
              { label: t("maintenance.dueKmLabel") ?? "Km limite", value: formDueKm, set: setFormDueKm, numeric: true },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.numeric ? "numeric" : "default"}
                  placeholderTextColor={colors.textSecondary}
                  style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14 }}
                />
              </View>
            ))}

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              {t("maintenance.typeLabel") ?? "Type"}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {ALERT_TYPE_IDS.map((id) => (
                <Pressable
                  key={id}
                  onPress={() => setFormType(id)}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                    backgroundColor: formType === id ? colors.primary : colors.backgroundSecondary,
                    borderWidth: 1, borderColor: formType === id ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: formType === id ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
                    {t(`maintenance.alertTypes.${id}`) ?? id}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={saving || !formTitle.trim() || !formVehicleId.trim()}
              style={{ backgroundColor: (formTitle.trim() && formVehicleId.trim()) ? colors.primary : colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("common.add") ?? "Ajouter"}</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

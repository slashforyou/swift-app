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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
  fetchWeeklyHours,
  WorkerWeeklyHours,
} from "../services/weeklyHours";
import { useAuth } from "../hooks/useAuth";
import { authenticatedFetch } from "../utils/auth";
import { ServerData } from "../constants/ServerData";

const API = ServerData.serverUrl;

interface Props {
  route?: any;
  navigation: any;
}

export default function WeeklyHoursScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { user } = useAuth();

  const [workers, setWorkers] = useState<WorkerWeeklyHours[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quota modal
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWeeklyHours | null>(null);
  const [quotaInput, setQuotaInput] = useState("");
  const [savingQuota, setSavingQuota] = useState(false);

  const companyId = (user as any)?.company_id ?? "me";

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchWeeklyHours(companyId, weekOffset);
      setWorkers(data.workers ?? []);
      setWeekStart(data.week_start ?? "");
      setWeekEnd(data.week_end ?? "");
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [companyId, weekOffset]);

  useEffect(() => { load(); }, [load]);

  const openQuotaModal = (worker: WorkerWeeklyHours) => {
    setSelectedWorker(worker);
    setQuotaInput(String(worker.quota_hours));
    setShowQuotaModal(true);
  };

  const handleSaveQuota = async () => {
    if (!selectedWorker) return;
    const quota = parseInt(quotaInput, 10);
    if (isNaN(quota) || quota < 1) return;
    setSavingQuota(true);
    try {
      await authenticatedFetch(`${API}v1/employees/${selectedWorker.worker_id}/quota`, {
        method: "PATCH",
        body: JSON.stringify({ max_hours_per_week: quota }),
      });
      setShowQuotaModal(false);
      await load();
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("weeklyHours.quotaError") ?? "Impossible de modifier le quota");
    } finally {
      setSavingQuota(false);
    }
  };

  const formatWeekLabel = () => {
    if (!weekStart) return weekOffset === 0 ? "Semaine courante" : weekOffset === -1 ? "Semaine précédente" : `S${weekOffset}`;
    return `${new Date(weekStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${new Date(weekEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  };

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
          {t("weeklyHours.title") ?? "Heures équipe"}
        </Text>
      </View>

      {/* Week selector */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => setWeekOffset((w) => w - 1)}
          style={{ padding: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={{ fontWeight: "600", color: colors.text, fontSize: 14 }}>
          {formatWeekLabel()}
        </Text>
        <Pressable
          onPress={() => setWeekOffset((w) => w + 1)}
          style={{ padding: 8 }}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
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
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {workers.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }}>
                {t("weeklyHours.empty") ?? "Aucun employé"}
              </Text>
            </View>
          ) : (
            workers.map((w) => {
              const pct = w.quota_hours > 0 ? Math.min(w.hours_this_week / w.quota_hours, 1) : 0;
              const isOver = w.over_quota;
              const initials = w.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <Pressable
                  key={w.worker_id}
                  onPress={() => openQuotaModal(w)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    borderWidth: 1,
                    borderColor: isOver ? "#E53E3E40" : colors.border,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: colors.primary + "30",
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>{w.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                        {w.hours_this_week}h / {w.quota_hours}h
                      </Text>
                    </View>
                    {isOver && (
                      <View style={{ backgroundColor: "#E53E3E20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: "#E53E3E", fontSize: 11, fontWeight: "700" }}>
                          {t("weeklyHours.overQuota") ?? "Dépassé"}
                        </Text>
                      </View>
                    )}
                    <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
                  </View>
                  {/* Progress bar */}
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${pct * 100}%`,
                        backgroundColor: isOver ? "#E53E3E" : colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Quota Modal */}
      <Modal visible={showQuotaModal} transparent animationType="slide" onRequestClose={() => setShowQuotaModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowQuotaModal(false)} />
          <View
            style={{
              backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              {selectedWorker?.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
              {t("weeklyHours.editQuota") ?? "Modifier le quota hebdomadaire"}
            </Text>
            <TextInput
              value={quotaInput}
              onChangeText={setQuotaInput}
              keyboardType="numeric"
              placeholder="40"
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1,
                borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
                color: colors.text, fontSize: 18, textAlign: "center", marginBottom: 20, fontWeight: "700",
              }}
            />
            <Pressable
              onPress={handleSaveQuota}
              disabled={savingQuota}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              {savingQuota ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("common.save") ?? "Enregistrer"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

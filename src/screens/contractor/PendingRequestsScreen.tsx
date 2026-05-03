/**
 * PendingRequestsScreen — Contractor
 * Liste des demandes de job en attente d'acceptation/refus.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    acceptJob,
    declineJob,
    fetchPendingAssignments,
    PendingAssignment,
} from "../../services/jobs";

interface Props {
  navigation?: any;
}

export default function PendingRequestsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [jobs, setJobs] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingAssignments();
      setJobs(data);
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("common.loadError") ?? "Impossible de charger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (jobId: string) => {
    setActionId(jobId);
    try {
      await acceptJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", "Impossible d'accepter ce job");
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (jobId: string) => {
    Alert.alert(
      "Refuser la demande",
      "Confirmer le refus de cette demande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser", style: "destructive",
          onPress: async () => {
            setActionId(jobId);
            try {
              await declineJob(jobId, "");
              setJobs(prev => prev.filter(j => j.id !== jobId));
            } catch {
              Alert.alert(t("common.error") ?? "Erreur", "Impossible de refuser ce job");
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
      " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatPrice = (amount: number | null, type: string | null) => {
    if (!amount) return null;
    const suffix = type === "hourly" ? "/h" : type === "daily" ? "/j" : "";
    return `$${amount}${suffix} AUD`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {navigation && (
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Demandes en attente
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[styles.list, jobs.length === 0 && styles.listEmpty]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucune demande en attente
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Les nouvelles demandes de job apparaîtront ici
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActing = actionId === item.id;
            const price = formatPrice(item.pricing_amount, item.pricing_type);
            return (
              <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                {/* Company + code */}
                <View style={styles.cardHeader}>
                  <View style={styles.companyRow}>
                    <Ionicons name="business-outline" size={15} color={colors.primary} />
                    <Text style={[styles.company, { color: colors.primary }]}>
                      {item.contractee_company_name ?? "Entreprise"}
                    </Text>
                  </View>
                  {item.code && (
                    <Text style={[styles.code, { color: colors.textSecondary }]}>#{item.code}</Text>
                  )}
                </View>

                {/* Date */}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {formatDate(item.start_window_start)}
                    {item.start_window_end && item.start_window_end !== item.start_window_start
                      ? ` — ${formatDate(item.start_window_end)}`
                      : ""}
                  </Text>
                </View>

                {/* Client */}
                {item.client_name && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {item.client_name}
                    </Text>
                  </View>
                )}

                {/* Resources */}
                {(item.requested_drivers || item.requested_offsiders) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {[
                        item.requested_drivers ? `${item.requested_drivers} driver${item.requested_drivers > 1 ? "s" : ""}` : null,
                        item.requested_offsiders ? `${item.requested_offsiders} offsider${item.requested_offsiders > 1 ? "s" : ""}` : null,
                      ].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                )}

                {/* Price */}
                {price && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={14} color="#22C55E" />
                    <Text style={[styles.infoText, { color: "#22C55E", fontWeight: "600" }]}>
                      {price}
                    </Text>
                  </View>
                )}

                {/* Message */}
                {item.transfer_message && (
                  <Text style={[styles.message, { color: colors.textSecondary, borderTopColor: colors.border }]}>
                    {item.transfer_message}
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => handleDecline(item.id)}
                    disabled={isActing}
                    style={({ pressed }) => [
                      styles.btn, styles.btnDecline,
                      { borderColor: "#EF4444", opacity: isActing || pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={[styles.btnText, { color: "#EF4444" }]}>Refuser</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAccept(item.id)}
                    disabled={isActing}
                    style={({ pressed }) => [
                      styles.btn, styles.btnAccept,
                      { backgroundColor: isActing || pressed ? colors.primary + "cc" : colors.primary },
                    ]}
                  >
                    {isActing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={[styles.btnText, { color: "#fff" }]}>Accepter</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: DESIGN_TOKENS.spacing.md, gap: DESIGN_TOKENS.spacing.sm },
  listEmpty: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: DESIGN_TOKENS.spacing.sm, paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },
  card: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  company: { fontSize: 14, fontWeight: "700" },
  code: { fontSize: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13 },
  message: {
    fontSize: 13, fontStyle: "italic",
    borderTopWidth: 1, marginTop: 4, paddingTop: 8,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: DESIGN_TOKENS.radius.md,
  },
  btnDecline: { borderWidth: 1.5, backgroundColor: "transparent" },
  btnAccept: { },
  btnText: { fontSize: 14, fontWeight: "600" },
});

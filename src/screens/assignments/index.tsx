/**
 * AssignmentsScreen
 *
 * Page "Jobs à confirmer" — liste les affectations en attente de l'utilisateur connecté.
 * Le staff peut confirmer ou décliner depuis cette page.
 *
 * Route : doit être enregistrée dans la navigation (ex: "Assignments")
 * Spec : docs/AVAILABILITY_ASSIGNMENT_SPEC.md — section 9.2
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
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
import { useLocalization } from "../../localization";
import {
    fetchMyAssignments,
    respondToAssignment,
} from "../../services/jobAssignments";
import type {
    AssignmentStatus,
    JobAssignment,
} from "../../types/jobAssignment";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<
  AssignmentStatus,
  { label: string; color: string; icon: string }
> = {
  pending: { label: "En attente", color: "#F59E0B", icon: "time-outline" },
  confirmed: { label: "Confirmé", color: "#22C55E", icon: "checkmark-circle" },
  declined: { label: "Décliné", color: "#EF4444", icon: "close-circle" },
  cancelled: { label: "Annulé", color: "#94A3B8", icon: "ban-outline" },
  replaced: { label: "Remplacé", color: "#94A3B8", icon: "swap-horizontal" },
};

const ROLE_LABELS: Record<string, string> = {
  driver: "Chauffeur",
  offsider: "Offsider",
  supervisor: "Superviseur",
  vehicle: "Véhicule",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Date inconnue";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// AssignmentCard
// ─────────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: JobAssignment;
  onAction: (assignment: JobAssignment, action: "confirm" | "decline") => void;
  loading: boolean;
}

const AssignmentCard: React.FC<AssignmentCardProps> = React.memo(({
  assignment,
  onAction,
  loading,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const statusCfg = STATUS_LABELS[assignment.status];
  const isPending = assignment.status === "pending";

  return (
    <View
      testID={`assignment-card-${assignment.id}`}
      style={[
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: isPending ? "#F59E0B40" : colors.border + "30",
          shadowColor: colors.text,
        },
      ]}
    >
      {/* En-tête */}
      <View style={styles.cardHeader}>
        <View
          style={[styles.roleIcon, { backgroundColor: colors.primary + "15" }]}
        >
          <Ionicons
            name={
              assignment.resource_type === "vehicle"
                ? "car-outline"
                : "person-outline"
            }
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={{ flex: 1, marginLeft: DESIGN_TOKENS.spacing.sm }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {ROLE_LABELS[assignment.role] ?? assignment.role}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Job #{assignment.job_id}
          </Text>
        </View>

        {/* Badge statut */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusCfg.color + "20" },
          ]}
        >
          <Ionicons
            name={statusCfg.icon as any}
            size={12}
            color={statusCfg.color}
          />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Métadonnées */}
      <View style={[styles.metaRow, { borderTopColor: colors.border + "20" }]}>
        <View style={styles.metaItem}>
          <Ionicons
            name="calendar-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatDate(assignment.created_at)}
          </Text>
        </View>

        {assignment.assigned_by_user && (
          <View style={styles.metaItem}>
            <Ionicons
              name="business-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {assignment.assigned_by_user.firstName}{" "}
              {assignment.assigned_by_user.lastName}
            </Text>
          </View>
        )}
      </View>

      {/* Actions si pending */}
      {isPending && (
        <View style={styles.actions}>
          <Pressable
            testID={`assignment-decline-${assignment.id}`}
            onPress={() => onAction(assignment, "decline")}
            disabled={loading}
            style={({ pressed }) => [
              styles.declineBtn,
              {
                backgroundColor: pressed ? "#EF444420" : "#EF444415",
                borderColor: "#EF444440",
              },
            ]}
          >
            <Ionicons name="close" size={16} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>
              Décliner
            </Text>
          </Pressable>

          <Pressable
            testID={`assignment-confirm-${assignment.id}`}
            onPress={() => onAction(assignment, "confirm")}
            disabled={loading}
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: pressed ? "#22C55ECC" : "#22C55E" },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                  {t("assignmentActions.confirmBtn")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Screen principal
// ─────────────────────────────────────────────────────────────

interface AssignmentsScreenProps {
  navigation?: any;
}

const AssignmentsScreen: React.FC<AssignmentsScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMyAssignments();
      setAssignments(data);
    } catch (err) {
      console.error("[AssignmentsScreen] load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAction = async (
    assignment: JobAssignment,
    action: "confirm" | "decline",
  ) => {
    if (action === "decline") {
      Alert.alert(
        "Décliner l'affectation",
        "Êtes-vous sûr de vouloir décliner cette affectation ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Décliner",
            style: "destructive",
            onPress: async () => {
              setActionLoadingId(assignment.id);
              try {
                await respondToAssignment(assignment.job_id, assignment.id, {
                  action: "decline",
                });
                load();
              } catch (err: unknown) {
                Alert.alert(
                  "Erreur",
                  err instanceof Error ? err.message : "Erreur",
                );
              } finally {
                setActionLoadingId(null);
              }
            },
          },
        ],
      );
      return;
    }

    setActionLoadingId(assignment.id);
    try {
      await respondToAssignment(assignment.job_id, assignment.id, {
        action: "confirm",
      });
      load();
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compter les pending
  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
            backgroundColor: colors.background,
            borderBottomColor: colors.border + "30",
          },
        ]}
      >
        {navigation && (
          <Pressable
            testID="assignments-back-btn"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mes affectations
          </Text>
          {pendingCount > 0 && (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {pendingCount} en attente de réponse
            </Text>
          )}
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            Chargement…
          </Text>
        </View>
      ) : (
        <FlatList
          testID="assignments-list"
          data={assignments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="checkmark-circle-outline"
                size={56}
                color={colors.textSecondary + "50"}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("assignmentActions.noAssignments")}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {t("assignmentActions.noAssignmentsDesc")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AssignmentCard
              assignment={item}
              onAction={handleAction}
              loading={actionLoadingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  backBtn: {
    marginRight: DESIGN_TOKENS.spacing.md,
    padding: 4,
  },
  list: {
    padding: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // Card
  card: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1.5,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.md,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DESIGN_TOKENS.radius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: DESIGN_TOKENS.spacing.sm,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.sm,
    padding: DESIGN_TOKENS.spacing.md,
    paddingTop: 0,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    gap: 6,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AssignmentsScreen;

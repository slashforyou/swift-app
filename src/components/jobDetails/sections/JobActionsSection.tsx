/**
 * JobActionsSection
 *
 * Affiche l'historique des actions d'un job sous forme de timeline verticale.
 * Se charge à la demande (lazy) quand l'utilisateur développe la section.
 *
 * Chaque action montre :
 *   - Icône + label coloré selon la sévérité
 *   - Nom de l'acteur (utilisateur ou société)
 *   - Rôle / niveau d'autorisation
 *   - Date et heure
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import type { JobAction } from "../../../services/jobActions";
import { fetchJobActions } from "../../../services/jobActions";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function severityColor(
  severity: string,
  colors: {
    tint: string;
    success: string;
    warning: string;
    error: string;
    textSecondary: string;
  },
): string {
  switch (severity) {
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "critical":
      return colors.error;
    default:
      return colors.tint;
  }
}

function permissionLabel(level: string): string {
  const map: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    employee: "Employé",
    contractor: "Prestataire",
    system: "Système",
  };
  return map[level] ?? level;
}

// ─────────────────────────────────────────────────────────────
// ActionItem
// ─────────────────────────────────────────────────────────────

interface ActionItemProps {
  action: JobAction;
  isLast: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({ action, isLast }) => {
  const { colors } = useTheme();
  const dotColor = severityColor(
    action.severity,
    colors as Parameters<typeof severityColor>[1],
  );
  const permLevel = permissionLabel(action.permission_level);

  return (
    <View style={{ flexDirection: "row", paddingLeft: 4 }}>
      {/* Timeline line + dot */}
      <View style={{ alignItems: "center", width: 28, marginRight: 10 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginTop: 4,
          }}
        />
        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: colors.border,
              marginTop: 4,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* Label + icon */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 15 }}>{action.icon}</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: dotColor,
              flex: 1,
            }}
          >
            {action.label}
          </Text>
        </View>

        {/* Actor + permission badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 3,
          }}
        >
          <Ionicons
            name="person-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={{ fontSize: 12, color: colors.text, fontWeight: "500" }}>
            {action.user}
          </Text>
          <View
            style={{
              backgroundColor: dotColor + "22",
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: DESIGN_TOKENS.radius.full,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: dotColor }}>
              {permLevel}
            </Text>
          </View>
        </View>

        {/* Status transition if present */}
        {(action.old_status || action.new_status) && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginBottom: 3,
            }}
          >
            {action.old_status && (
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {action.old_status}
              </Text>
            )}
            {action.old_status && action.new_status && (
              <Ionicons
                name="arrow-forward"
                size={10}
                color={colors.textSecondary}
              />
            )}
            {action.new_status && (
              <Text
                style={{ fontSize: 11, color: colors.text, fontWeight: "500" }}
              >
                {action.new_status}
              </Text>
            )}
          </View>
        )}

        {/* Date */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            name="time-outline"
            size={11}
            color={colors.textSecondary}
          />
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            {formatDate(action.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// JobActionsSection
// ─────────────────────────────────────────────────────────────

interface JobActionsSectionProps {
  jobId: string | number;
}

const JobActionsSection: React.FC<JobActionsSectionProps> = ({ jobId }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [actions, setActions] = useState<JobAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!expanded || fetched || !jobId) return;

    setLoading(true);
    setError(null);

    fetchJobActions(jobId, { limit: 100 })
      .then((data) => {
        setActions(data.actions ?? []);
        setFetched(true);
      })
      .catch((err) => {
        console.error("[JobActionsSection] Error fetching actions:", err);
        setError("Impossible de charger l'historique");
      })
      .finally(() => setLoading(false));
  }, [expanded, fetched, jobId]);

  const total = actions.length;

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        overflow: "hidden",
      }}
    >
      {/* Header / Toggle */}
      <Pressable
        onPress={handleToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          gap: DESIGN_TOKENS.spacing.sm,
        }}
        accessibilityRole="button"
        accessibilityLabel="Historique des actions"
        accessibilityState={{ expanded }}
      >
        <Ionicons name="list-outline" size={20} color={colors.primary} />
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
            flex: 1,
          }}
        >
          Historique des actions
        </Text>
        {total > 0 && (
          <View
            style={{
              backgroundColor: colors.primary + "18",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: DESIGN_TOKENS.radius.full,
              marginRight: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}
            >
              {total}
            </Text>
          </View>
        )}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Body */}
      {expanded && (
        <View
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: DESIGN_TOKENS.spacing.lg }}
            />
          )}

          {!loading && error && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text style={{ fontSize: 13, color: colors.error }}>{error}</Text>
              <Pressable
                onPress={() => {
                  setFetched(false);
                  setError(null);
                }}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  Réessayer
                </Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && actions.length === 0 && fetched && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              Aucune action enregistrée.
            </Text>
          )}

          {!loading && !error && actions.length > 0 && (
            <ScrollView
              nestedScrollEnabled
              scrollEnabled={false}
              style={{ maxHeight: 600 }}
            >
              {actions.map((action, index) => (
                <ActionItem
                  key={action.id ?? index}
                  action={action}
                  isLast={index === actions.length - 1}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

export default JobActionsSection;

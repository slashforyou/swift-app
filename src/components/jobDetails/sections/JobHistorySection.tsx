/**
 * JobHistorySection.tsx
 *
 * Section collapsible affichant l'historique chronologique des actions d'un job.
 * Utilise GET /v1/jobs/:id/actions (endpoint existant, données dans job_actions).
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobAction } from "../../../services/jobActions";
import { fetchJobActions } from "../../../services/jobActions";

interface Props {
  jobId: string | number;
}

// ─── Colours per severity ────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  success:  "#22C55E",
  warning:  "#F59E0B",
  critical: "#EF4444",
  info:     "#3B82F6",
};

const SEVERITY_ICON: Record<string, string> = {
  success:  "checkmark-circle-outline",
  warning:  "alert-circle-outline",
  critical: "close-circle-outline",
  info:     "information-circle-outline",
};

// ─── Component ───────────────────────────────────────────────────────────────

const JobHistorySection: React.FC<Props> = React.memo(
  function JobHistorySection({ jobId }) {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const [actions, setActions] = useState<JobAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const load = useCallback(async () => {
      setLoading(true);
      try {
        const res = await fetchJobActions(jobId, { limit: 50 });
        setActions(res.actions ?? []);
      } catch {
        setActions([]);
      } finally {
        setLoading(false);
      }
    }, [jobId]);

    useEffect(() => {
      load();
    }, [load]);

    if (loading) {
      return (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (!actions.length) return null;

    const visibleActions = expanded ? actions : actions.slice(0, 5);

    const formatDate = (iso: string) => {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: DESIGN_TOKENS.spacing.md,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            padding: DESIGN_TOKENS.spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Historique du job"
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary + "18",
              alignItems: "center",
              justifyContent: "center",
              marginRight: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {t("jobDetails.history.title") || "Historique"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 1,
              }}
            >
              {actions.length}{" "}
              {t("jobDetails.history.actions") || "actions enregistrées"}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Timeline */}
        {expanded && (
          <View
            style={{
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {visibleActions.map((action, index) => {
              const color =
                SEVERITY_COLOR[action.severity] ?? SEVERITY_COLOR.info;
              const icon =
                SEVERITY_ICON[action.severity] ?? SEVERITY_ICON.info;
              const isLast = index === visibleActions.length - 1;

              return (
                <View
                  key={action.id}
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  {/* Timeline line + dot */}
                  <View
                    style={{
                      width: 28,
                      alignItems: "center",
                      marginRight: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: color + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={icon as any} size={14} color={color} />
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          width: 1.5,
                          flex: 1,
                          minHeight: 16,
                          backgroundColor: colors.border,
                          marginTop: 2,
                        }}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View
                    style={{
                      flex: 1,
                      paddingBottom: isLast
                        ? 0
                        : DESIGN_TOKENS.spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {action.label || action.action}
                    </Text>
                    {!!action.details && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                        numberOfLines={2}
                      >
                        {action.details}
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 2,
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDate(action.timestamp)}
                      </Text>
                      {!!action.user && action.user !== "System" && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.primary,
                            fontWeight: "500",
                          }}
                        >
                          · {action.user}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Show more / less */}
            {actions.length > 5 && (
              <Pressable
                onPress={() => setExpanded((v) => !v)}
                style={({ pressed }) => ({
                  alignSelf: "center",
                  marginTop: DESIGN_TOKENS.spacing.sm,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderRadius: DESIGN_TOKENS.radius.full,
                  backgroundColor: colors.primary + "12",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  {expanded && actions.length > 5
                    ? t("jobDetails.history.showLess") || "Voir moins"
                    : `${t("jobDetails.history.showAll") || "Voir tout"} (${actions.length})`}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  },
);

export default JobHistorySection;

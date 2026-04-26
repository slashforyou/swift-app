/**
 * WeeklyHoursSection.tsx
 *
 * Carte collapsible affichant les heures hebdomadaires par employé (semaine courante).
 * Pour les managers/admins dans StaffCrewScreen.
 * Endpoint: GET /v1/company/:companyId/weekly-hours
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    fetchWeeklyHours,
    type WorkerWeeklyHours,
} from "../../services/weeklyHours";

interface Props {
  companyId: number | string;
}

const WeeklyHoursSection: React.FC<Props> = React.memo(
  function WeeklyHoursSection({ companyId }) {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const [workers, setWorkers] = useState<WorkerWeeklyHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [weekLabel, setWeekLabel] = useState("");

    const load = useCallback(
      async (offset: number) => {
        setLoading(true);
        try {
          const res = await fetchWeeklyHours(companyId, offset);
          setWorkers(res.workers ?? []);
          // Format week label: "Jan 13 – Jan 19"
          const fmt = (iso: string) => {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
            });
          };
          setWeekLabel(`${fmt(res.week_start)} – ${fmt(res.week_end)}`);
        } catch {
          setWorkers([]);
        } finally {
          setLoading(false);
        }
      },
      [companyId],
    );

    useEffect(() => {
      load(weekOffset);
    }, [load, weekOffset]);

    if (!loading && workers.length === 0) return null;

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
          accessibilityLabel={t("staff.weeklyHours.title" as any) ?? "Weekly Hours"}
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
            <Ionicons name="timer-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
            >
              {t("staff.weeklyHours.title" as any) ?? "Heures hebdomadaires"}
            </Text>
            {!!weekLabel && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 1,
                }}
              >
                {weekLabel}
              </Text>
            )}
          </View>

          {/* Week navigation */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setWeekOffset((w) => w - 1);
              }}
              style={({ pressed }) => ({
                padding: 6,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (weekOffset < 0) setWeekOffset((w) => w + 1);
              }}
              style={({ pressed }) => ({
                padding: 6,
                opacity: weekOffset >= 0 ? 0.3 : pressed ? 0.5 : 1,
              })}
              disabled={weekOffset >= 0}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        {/* Content */}
        {expanded && (
          <View
            style={{
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 12 }}
              />
            ) : (
              workers.map((w) => {
                const hasQuota = w.quota_hours > 0;
                const fillRatio = hasQuota
                  ? Math.min(w.hours_this_week / w.quota_hours, 1)
                  : 0;
                const barColor = w.over_quota
                  ? "#EF4444"
                  : fillRatio > 0.85
                  ? "#F59E0B"
                  : "#22C55E";

                return (
                  <View
                    key={w.worker_id}
                    style={{
                      marginBottom: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    {/* Name + hours */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontWeight: "500",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {w.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: w.over_quota ? "#EF4444" : colors.textSecondary,
                          fontWeight: w.over_quota ? "700" : "400",
                          marginLeft: 8,
                        }}
                      >
                        {w.hours_this_week.toFixed(1)}
                        {hasQuota ? ` / ${w.quota_hours}h` : "h"}
                      </Text>
                    </View>

                    {/* Progress bar */}
                    {hasQuota && (
                      <View
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colors.border,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${fillRatio * 100}%`,
                            height: "100%",
                            borderRadius: 3,
                            backgroundColor: barColor,
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  },
);

export default WeeklyHoursSection;

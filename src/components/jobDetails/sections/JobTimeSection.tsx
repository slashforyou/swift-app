/**
 * JobTimeSection - Section de suivi du temps avec mode collapsible
 * Affiche le temps écoulé, pause/reprendre, détails par étape
 * Quand réduit : affiche uniquement le temps total en cours
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useJobTimerContext } from "../../../context/JobTimerProvider";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import { formatDurationMs, getSegmentColor, getSegmentIcon } from "../../../services/jobSegmentService";
import { getSegmentLabel } from "../../../utils/getSegmentLabel";

interface JobTimeSectionProps {
  job: any;
}

const JobTimeSection: React.FC<JobTimeSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    timerData,
    totalElapsed,
    billableTime,
    formatTime,
    isRunning,
    isOnBreak,
    currentStep,
    totalSteps,
    togglePause,
    // Segments modulaires
    segments,
    currentSegment,
    segmentTimes,
  } = useJobTimerContext();

  const hasSegments = segments.length > 0;
  const completedSegments = segments.filter((s) => !!s.completedAt);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Ne pas afficher si le job n'a pas commencé
  if (currentStep === 0 || !timerData) {
    return (
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.textSecondary + "15",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {t("jobDetails.components.jobTime.timeTracking")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {t("jobDetails.components.jobTime.chronoWillStart")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Couleur du statut
  const statusColor = isOnBreak
    ? colors.warning
    : isRunning
      ? colors.primary
      : colors.success;
  const statusLabel = isOnBreak
    ? t("jobDetails.components.jobTime.onBreak")
    : isRunning
      ? t("jobDetails.components.jobTime.inProgress")
      : t("jobDetails.components.jobTime.finished");

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        overflow: "hidden",
      }}
    >
      {/* Header collapsible — toujours visible, affiche le temps */}
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => ({
          padding: DESIGN_TOKENS.spacing.lg,
          backgroundColor: pressed ? colors.backgroundTertiary : "transparent",
        })}
      >
        {/* Ligne 1 — Temps pleine largeur */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 36,
              fontWeight: "700",
              color: isRunning && !isOnBreak ? colors.primary : colors.text,
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            {formatTime(totalElapsed, false)}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color:
                isRunning && !isOnBreak
                  ? colors.primary + "AA"
                  : colors.textSecondary,
              fontFamily: "monospace",
              marginLeft: 1,
              alignSelf: "flex-end",
              marginBottom: 4,
            }}
          >
            :{String(Math.floor((totalElapsed / 1000) % 60)).padStart(2, "0")}
          </Text>
        </View>

        {/* Ligne 2 — Billable + Badge statut + Chevron */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: DESIGN_TOKENS.spacing.xs,
            gap: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {t("jobDetails.components.jobTime.billable")}{" "}
            {formatTime(billableTime)}
          </Text>

          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.textSecondary + "60",
            }}
          />

          {/* Badge statut */}
          <View
            style={{
              backgroundColor: statusColor + "18",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: DESIGN_TOKENS.radius.full,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: statusColor,
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </Text>
          </View>

          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.textSecondary + "60",
            }}
          />

          {/* Chevron */}
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textSecondary}
          />
        </View>

        {/* Ligne 3 — Segment actuel (mode collapsed, si segments modulaires) */}
        {hasSegments && currentSegment && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: DESIGN_TOKENS.spacing.xs,
              gap: DESIGN_TOKENS.spacing.xs,
            }}
          >
            <Ionicons
              name={getSegmentIcon(currentSegment.type) as any}
              size={14}
              color={getSegmentColor(currentSegment.type)}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: getSegmentColor(currentSegment.type),
              }}
            >
              {getSegmentLabel(t, currentSegment.labelKey, currentSegment.label)}
            </Text>
            {currentSegment.isBillable && (
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: colors.success,
                  marginLeft: 2,
                }}
              />
            )}
          </View>
        )}
      </Pressable>

      {/* Contenu déplié */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Bouton Break */}
          {isRunning && (
            <Pressable
              onPress={togglePause}
              style={({ pressed }) => ({
                backgroundColor: isOnBreak
                  ? pressed
                    ? colors.success + "DD"
                    : colors.success
                  : pressed
                    ? colors.warning + "DD"
                    : colors.warning,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              })}
            >
              <Ionicons
                name={isOnBreak ? "play" : "pause"}
                size={18}
                color={colors.background}
              />
              <Text
                style={{
                  color: colors.background,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {isOnBreak
                  ? t("jobDetails.components.jobTime.resumeWork")
                  : t("jobDetails.components.jobTime.takeBreak")}
              </Text>
            </Pressable>
          )}

          {/* Résumé temps en 3 colonnes */}
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginBottom: 4,
                  fontWeight: "500",
                }}
              >
                {t("jobDetails.components.jobTime.total")}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  fontFamily: "monospace",
                }}
              >
                {formatTime(totalElapsed)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginBottom: 4,
                  fontWeight: "500",
                }}
              >
                {t("jobDetails.components.jobTime.billableTime")}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.primary,
                  fontFamily: "monospace",
                }}
              >
                {formatTime(billableTime)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginBottom: 4,
                  fontWeight: "500",
                }}
              >
                {t("jobDetails.components.jobTime.currentStep")}
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: colors.text }}
              >
                {currentStep}/{totalSteps}
              </Text>
            </View>
          </View>

          {/* Détail par segments (si disponible) */}
          {hasSegments && completedSegments.length > 0 && (
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("segments")}
              </Text>
              {completedSegments.map((seg) => {
                const elapsed = segmentTimes[seg.id] ?? seg.durationMs ?? 0;
                return (
                  <View
                    key={seg.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: DESIGN_TOKENS.spacing.xs,
                      gap: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <Ionicons
                      name={getSegmentIcon(seg.type) as any}
                      size={14}
                      color={getSegmentColor(seg.type)}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.text,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {getSegmentLabel(t, seg.labelKey, seg.label)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: seg.isBillable ? colors.success : colors.textSecondary,
                        fontFamily: "monospace",
                      }}
                    >
                      {formatDurationMs(elapsed)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Détail par étapes */}
          {Array.isArray(timerData.stepTimes) &&
            timerData.stepTimes.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("jobDetails.components.jobTime.stepDetails")}
                </Text>

                <ScrollView
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={false}
                >
                  {timerData.stepTimes.map((stepTime: any, index: number) => (
                    <View
                      key={`step-${stepTime.step}-${index}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                        borderBottomWidth:
                          index < timerData.stepTimes.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border + "40",
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: stepTime.endTime
                            ? colors.success + "20"
                            : colors.primary + "20",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: DESIGN_TOKENS.spacing.sm,
                        }}
                      >
                        {stepTime.endTime ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.success}
                          />
                        ) : (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.primary,
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.text,
                          flex: 1,
                        }}
                      >
                        {stepTime.stepName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: stepTime.endTime
                            ? colors.textSecondary
                            : colors.primary,
                          fontFamily: "monospace",
                        }}
                      >
                        {stepTime.endTime
                          ? formatTime(stepTime.duration || 0)
                          : formatTime(Date.now() - stepTime.startTime)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
        </View>
      )}
    </View>
  );
};

export default JobTimeSection;

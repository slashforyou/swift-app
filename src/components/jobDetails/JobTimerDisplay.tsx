/**
 * JobTimerDisplay - Composant de timer/progression du job
 *
 * États d'affichage:
 * - Loading: Spinner pendant le chargement des données
 * - Step 0: Bouton "Start" uniquement
 * - Step 1 à avant-dernier: Temps + steps + bouton "Suivant" + bouton "Pause"
 * - Job en pause: Temps + step en cours + bouton "Play"
 * - Step final, pas signé: Temps arrêté + "Job terminé" + bouton "Signature requise"
 * - Step final, signé pas payé: Temps arrêté + "Job terminé" + bouton "Paiement"
 * - Step final, signé et payé: Temps arrêté + "Job terminé"
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useJobTimerContext } from "../../context/JobTimerProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";
import { checkJobSignatureExists } from "../../services/jobDetails";
import { formatDurationMs, getSegmentColor, getSegmentIcon } from "../../services/jobSegmentService";
import type { JobSummaryData } from "../../types/jobSummary";

interface JobTimerDisplayProps {
  job: JobSummaryData;
  onOpenSignatureModal?: () => void;
  onOpenPaymentPanel?: () => void;
}

const JobTimerDisplay: React.FC<JobTimerDisplayProps> = ({
  job,
  onOpenSignatureModal,
  onOpenPaymentPanel,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const {
    totalElapsed,
    billableTime,
    formatTime,
    isRunning,
    isOnBreak,
    isCompleted,
    currentStep,
    totalSteps,
    togglePause,
    nextStep,
    stopTimer,
    // Segments modulaires
    segments,
    currentSegment,
    segmentTimes,
    completeSegment,
  } = useJobTimerContext();

  const hasSegments = segments.length > 0;

  // Refs pour callbacks stables
  const nextStepRef = React.useRef(nextStep);
  const stopTimerRef = React.useRef(stopTimer);
  React.useEffect(() => {
    nextStepRef.current = nextStep;
    stopTimerRef.current = stopTimer;
  }, [nextStep, stopTimer]);

  // Modal state
  const [showNextStepModal, setShowNextStepModal] = React.useState(false);
  const [nextStepInfo, setNextStepInfo] = React.useState({
    name: "",
    number: 0,
  });

  // Pause duration modal state
  const [showPauseModal, setShowPauseModal] = React.useState(false);
  const [customMinutes, setCustomMinutes] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [pauseResumeTime, setPauseResumeTime] = React.useState<number | null>(
    null,
  );
  const [pauseCountdown, setPauseCountdown] = React.useState("");
  const pauseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const countdownIntervalRef = React.useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const PAUSE_OPTIONS = [
    { label: t("jobs.timer.noDuration" as any), minutes: 0 },
    { label: t("jobs.timer.minutes" as any, { count: 10 }), minutes: 10 },
    { label: t("jobs.timer.minutes" as any, { count: 15 }), minutes: 15 },
    { label: t("jobs.timer.minutes" as any, { count: 30 }), minutes: 30 },
  ];

  const handlePauseWithDuration = (minutes: number) => {
    togglePause(); // Pause the timer
    setShowPauseModal(false);
    setShowCustomInput(false);
    setCustomMinutes("");

    if (minutes > 0) {
      const resumeAt = Date.now() + minutes * 60 * 1000;
      setPauseResumeTime(resumeAt);

      // Auto-resume timer
      pauseTimerRef.current = setTimeout(
        () => {
          togglePause(); // Resume
          setPauseResumeTime(null);
          setPauseCountdown("");
        },
        minutes * 60 * 1000,
      );
    } else {
      setPauseResumeTime(null);
    }
  };

  // Countdown display while paused with duration
  React.useEffect(() => {
    if (pauseResumeTime && isOnBreak) {
      countdownIntervalRef.current = setInterval(() => {
        const remaining = pauseResumeTime - Date.now();
        if (remaining <= 0) {
          setPauseCountdown("");
          setPauseResumeTime(null);
          if (countdownIntervalRef.current)
            clearInterval(countdownIntervalRef.current);
          return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setPauseCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
      }, 1000);
      return () => {
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
      };
    }
  }, [pauseResumeTime, isOnBreak]);

  // Clear auto-resume if manually resumed
  React.useEffect(() => {
    if (!isOnBreak && pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
      setPauseResumeTime(null);
      setPauseCountdown("");
    }
  }, [isOnBreak]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // ✅ Loading state: attendre que les données soient prêtes
  const [isLoadingSignature, setIsLoadingSignature] = React.useState(true);
  const [hasSignatureFromAPI, setHasSignatureFromAPI] = React.useState(false);

  // Charger la signature depuis l'API au montage et quand le job change
  React.useEffect(() => {
    let cancelled = false;
    const checkSignature = async () => {
      if (!job?.id) return;
      setIsLoadingSignature(true);
      try {
        const result = await checkJobSignatureExists(job.id, "client");
        if (!cancelled) {
          setHasSignatureFromAPI(result.exists);
        }
      } catch (e) {
        // Silently fail - fallback to local check
      } finally {
        if (!cancelled) setIsLoadingSignature(false);
      }
    };
    checkSignature();
    return () => {
      cancelled = true;
    };
  }, [job?.id, job?.signature_blob, job?.signatureDataUrl]);

  // ===== Computed values =====
  const timerHasStarted = totalElapsed > 0;
  const effectiveCurrentStep = timerHasStarted ? currentStep : 0;

  const isJobCompleted = job?.status === "completed" || isCompleted;
  const isAtFinalStep = effectiveCurrentStep >= totalSteps;
  const isTimerFrozen = isJobCompleted || isAtFinalStep;

  // Signature: local OU API
  const hasSignature =
    hasSignatureFromAPI ||
    !!job?.signature_blob ||
    !!job?.signatureDataUrl ||
    !!job?.signatureFileUri;

  // Paiement
  const isPaid = job?.payment_status === "paid";
  const needsPayment =
    !isPaid &&
    parseFloat(String(job?.amount_due || job?.amount_total || 0)) > 0;

  // Loading: on attend d'avoir signature_check terminé si le job est completed
  const isLoading = isJobCompleted && isLoadingSignature;

  // Step config
  const currentStepConfig = React.useMemo(() => {
    if (!job?.steps || job.steps.length === 0) return null;
    return (
      job.steps.find((step: any) => step.id === effectiveCurrentStep) || null
    );
  }, [job?.steps, effectiveCurrentStep]);

  // Time display
  const displayTime =
    currentStep === 0 ? 0 : isRunning || totalElapsed > 0 ? totalElapsed : 0;

  // ===== Handlers =====
  const handleNextStep = () => {
    if (showNextStepModal) return;
    const nextStepNumber = currentStep + 1;
    const nextStepName =
      job?.steps?.[currentStep]?.name || `Étape ${nextStepNumber}`;
    setNextStepInfo({ name: nextStepName, number: nextStepNumber });
    setShowNextStepModal(true);
  };

  const handleConfirmNextStep = () => {
    setShowNextStepModal(false);
    nextStepRef.current();
  };

  const handleCancelNextStep = () => {
    setShowNextStepModal(false);
  };

  // ===== RENDER =====

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.xl,
          padding: DESIGN_TOKENS.spacing.xl,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}
        >
          Chargement du statut...
        </Text>
      </View>
    );
  }

  // ===== DETERMINE DISPLAY STATE =====
  // State machine clair:
  // 1. Step 0 (pas démarré) -> Bouton Start seulement
  // 2. Steps intermédiaires, running -> Temps + steps + Next + Pause
  // 3. Steps intermédiaires, paused -> Temps + step courant + Play
  // 4. Final step, pas signé -> Temps arrêté + "Job terminé" + "Signature requise"
  // 5. Final step, signé, pas payé -> Temps arrêté + "Job terminé" + "Paiement"
  // 6. Final step, signé et payé -> Temps arrêté + "Job terminé"

  type DisplayState =
    | "NOT_STARTED"
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED_NEEDS_SIGNATURE"
    | "COMPLETED_NEEDS_PAYMENT"
    | "COMPLETED_DONE";

  const getDisplayState = (): DisplayState => {
    // Job terminé (status backend OU dernière étape atteinte)
    if (isJobCompleted || isAtFinalStep) {
      if (!hasSignature) return "COMPLETED_NEEDS_SIGNATURE";
      if (needsPayment) return "COMPLETED_NEEDS_PAYMENT";
      return "COMPLETED_DONE";
    }
    // Pas encore démarré
    if (!timerHasStarted) return "NOT_STARTED";
    // En pause
    if (isOnBreak || !isRunning) return "PAUSED";
    // En cours
    return "RUNNING";
  };

  const displayState = getDisplayState();

  // Border color par état
  const borderColor =
    displayState === "COMPLETED_DONE" ||
    displayState === "COMPLETED_NEEDS_PAYMENT"
      ? colors.success
      : displayState === "COMPLETED_NEEDS_SIGNATURE"
        ? colors.warning
        : displayState === "RUNNING"
          ? colors.primary
          : colors.border;

  // ===== STATE: NOT_STARTED (Step 0) =====
  if (displayState === "NOT_STARTED") {
    return (
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.xl,
          padding: DESIGN_TOKENS.spacing.xl,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
        }}
      >
        {/* Step name */}
        {currentStepConfig && (
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {currentStepConfig.name}
          </Text>
        )}

        {/* Bouton Start */}
        <Pressable
          testID="job-timer-start-btn"
          onPress={togglePause}
          style={({ pressed }) => ({
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: DESIGN_TOKENS.radius.lg,
            backgroundColor: pressed ? colors.success + "DD" : colors.success,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minWidth: 180,
            justifyContent: "center",
          })}
        >
          <Ionicons name="play" size={22} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>
            {t("jobs.timer.start")}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ===== STATES: RUNNING, PAUSED, COMPLETED_* =====
  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.xl,
        padding: DESIGN_TOKENS.spacing.lg,
        marginBottom: DESIGN_TOKENS.spacing.lg,
        borderWidth: 2,
        borderColor,
      }}
    >
      {/* ROW 1: Timer display */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Ionicons
          name={isTimerFrozen ? "checkmark-circle" : "time"}
          size={20}
          color={
            isTimerFrozen
              ? colors.success
              : displayState === "RUNNING"
                ? colors.primary
                : colors.textSecondary
          }
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            fontFamily: "monospace",
            color: isTimerFrozen
              ? colors.success
              : displayState === "RUNNING"
                ? colors.primary
                : colors.text,
          }}
        >
          {formatTime(displayTime, false)}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "monospace",
            color: isTimerFrozen
              ? colors.success
              : displayState === "RUNNING"
                ? colors.primary
                : colors.textSecondary,
          }}
        >
          :{String(Math.floor((displayTime / 1000) % 60)).padStart(2, "0")}
        </Text>
        {isTimerFrozen && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.success,
              marginLeft: 8,
            }}
          >
            (Terminé)
          </Text>
        )}
      </View>

      {/* ROW 2: Stepper - affiché dans TOUS les états sauf si on veut simplifier en pause */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            gap: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
          }}
        >
          {job?.steps?.map((step: any, index: number) => {
            const stepNumber = step.id ?? index;
            const isStepCompleted =
              timerHasStarted && stepNumber < effectiveCurrentStep;
            const isCurrent = stepNumber === effectiveCurrentStep;

            return (
              <View
                key={step.id || index}
                style={{ alignItems: "center", position: "relative" }}
              >
                {isCurrent && (
                  <View
                    style={{
                      position: "absolute",
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.primary + "25",
                      top: -4,
                      left: -4,
                    }}
                  />
                )}
                <View
                  style={{
                    width: isCurrent ? 48 : 40,
                    height: isCurrent ? 48 : 40,
                    borderRadius: isCurrent ? 24 : 20,
                    backgroundColor: isStepCompleted
                      ? colors.success
                      : isCurrent
                        ? colors.primary
                        : colors.backgroundSecondary,
                    borderWidth: isCurrent ? 3 : 2,
                    borderColor: isStepCompleted
                      ? colors.success
                      : isCurrent
                        ? colors.primary
                        : colors.border,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: isCurrent ? colors.primary : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isCurrent ? 0.4 : 0,
                    shadowRadius: 4,
                    elevation: isCurrent ? 4 : 0,
                  }}
                >
                  {isStepCompleted ? (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.background}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: isCurrent ? 18 : 14,
                        fontWeight: "700",
                        color: isCurrent
                          ? colors.background
                          : colors.textSecondary,
                      }}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Current step name badge */}
        <View
          style={{ alignItems: "center", marginTop: DESIGN_TOKENS.spacing.md }}
        >
          <View
            style={{
              backgroundColor: colors.primary + "15",
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: DESIGN_TOKENS.radius.xl,
              paddingHorizontal: DESIGN_TOKENS.spacing.xl,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.primary,
                textAlign: "center",
              }}
            >
              {currentStepConfig?.name || `Étape ${effectiveCurrentStep}`}
            </Text>
          </View>
        </View>
      </View>

      {/* SEGMENT TIMELINE — Affiché si le job a des segments modulaires */}
      {hasSegments && (
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: DESIGN_TOKENS.spacing.sm,
              marginLeft: DESIGN_TOKENS.spacing.md,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("segments")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              gap: DESIGN_TOKENS.spacing.sm,
              alignItems: "center",
            }}
          >
            {segments.map((seg, index) => {
              const isActive = currentSegment?.id === seg.id;
              const isDone = !!seg.completedAt;
              const elapsed = segmentTimes[seg.id] ?? 0;
              const segColor = getSegmentColor(seg.type);
              const segIcon = getSegmentIcon(seg.type);

              return (
                <React.Fragment key={seg.id}>
                  {index > 0 && (
                    <View
                      style={{
                        width: 16,
                        height: 2,
                        backgroundColor: isDone ? segColor : colors.border,
                        alignSelf: "center",
                      }}
                    />
                  )}
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: isActive
                        ? segColor + "15"
                        : isDone
                          ? segColor + "10"
                          : colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive
                        ? segColor
                        : isDone
                          ? segColor + "50"
                          : colors.border,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      minWidth: 80,
                    }}
                  >
                    <Ionicons
                      name={segIcon as any}
                      size={18}
                      color={isDone || isActive ? segColor : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isActive ? "700" : "500",
                        color: isDone || isActive ? segColor : colors.textSecondary,
                        marginTop: 2,
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      {seg.label}
                    </Text>
                    {(isActive || isDone) && elapsed > 0 && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: isActive ? segColor : colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {formatDurationMs(elapsed)}
                      </Text>
                    )}
                    {isDone && (
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color={segColor}
                        style={{ marginTop: 2 }}
                      />
                    )}
                  </View>
                </React.Fragment>
              );
            })}
          </ScrollView>

          {/* Current segment info */}
          {currentSegment && (
            <View
              style={{
                alignItems: "center",
                marginTop: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: DESIGN_TOKENS.spacing.sm,
                  backgroundColor: getSegmentColor(currentSegment.type) + "15",
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Ionicons
                  name={getSegmentIcon(currentSegment.type) as any}
                  size={16}
                  color={getSegmentColor(currentSegment.type)}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: getSegmentColor(currentSegment.type),
                  }}
                >
                  {currentSegment.label}
                  {currentSegment.isBillable ? " • facturable" : " • non facturable"}
                </Text>
              </View>

              {/* Employés actifs sur ce segment */}
              {currentSegment.assignedEmployees.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: DESIGN_TOKENS.spacing.xs,
                    marginTop: DESIGN_TOKENS.spacing.xs,
                    justifyContent: "center",
                  }}
                >
                  {currentSegment.assignedEmployees.map((emp) => (
                    <View
                      key={emp.employeeId}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.sm,
                        paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                        paddingVertical: 2,
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={10}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        {emp.employeeName} ({emp.role})
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ROW 3: Action buttons - depends on state */}
      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* === RUNNING: Pause + Next === */}
        {displayState === "RUNNING" && (
          <>
            <Pressable
              testID="job-timer-pause-btn"
              onPress={() => setShowPauseModal(true)}
              style={({ pressed }) => ({
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.warning + "DD"
                  : colors.warning,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flex: 1,
                justifyContent: "center",
                minHeight: 48,
              })}
            >
              <Ionicons name="pause" size={20} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}
                numberOfLines={1}
              >
                {t("jobs.timer.pause")}
              </Text>
            </Pressable>

            <Pressable
              testID="job-timer-next-step-btn"
              onPress={handleNextStep}
              disabled={showNextStepModal}
              style={({ pressed }) => ({
                flex: 1,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.backgroundTertiary
                  : colors.backgroundSecondary,
                borderWidth: 1.5,
                borderColor: colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 48,
                opacity: showNextStepModal ? 0.5 : 1,
              })}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {t("jobs.timer.nextStep")}
              </Text>
            </Pressable>
          </>
        )}

        {/* === PAUSED: Play button + countdown === */}
        {displayState === "PAUSED" && (
          <View style={{ flex: 1, gap: DESIGN_TOKENS.spacing.sm }}>
            <Pressable
              testID="job-timer-play-btn"
              onPress={togglePause}
              style={({ pressed }) => ({
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.success + "DD"
                  : colors.success,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                minHeight: 48,
              })}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}
                numberOfLines={1}
              >
                {t("jobs.timer.resume")}
              </Text>
            </Pressable>
            {pauseCountdown !== "" && (
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: colors.warning,
                  fontWeight: "600",
                }}
              >
                {t("jobs.timer.resumesIn" as any, { time: pauseCountdown })}
              </Text>
            )}
          </View>
        )}

        {/* === COMPLETED_NEEDS_SIGNATURE: Signature button === */}
        {displayState === "COMPLETED_NEEDS_SIGNATURE" && (
          <Pressable
            testID="job-timer-signature-btn"
            onPress={() => onOpenSignatureModal?.()}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.lg,
              backgroundColor: pressed ? colors.primary + "DD" : colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            })}
          >
            <Ionicons name="create" size={18} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
              Signature requise
            </Text>
          </Pressable>
        )}

        {/* === COMPLETED_NEEDS_PAYMENT: Payment button === */}
        {displayState === "COMPLETED_NEEDS_PAYMENT" && (
          <Pressable
            testID="job-timer-payment-btn"
            onPress={() => onOpenPaymentPanel?.()}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.lg,
              backgroundColor: pressed ? colors.success + "DD" : colors.success,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            })}
          >
            <Ionicons name="card" size={18} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
              Passer au paiement
            </Text>
          </Pressable>
        )}

        {/* === COMPLETED_DONE: Status badge === */}
        {displayState === "COMPLETED_DONE" && (
          <View
            style={{
              flex: 1,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.lg,
              backgroundColor: colors.success + "20",
              borderWidth: 2,
              borderColor: colors.success,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text
              style={{ color: colors.success, fontSize: 15, fontWeight: "600" }}
            >
              {isPaid ? "Job terminé et payé" : "Job terminé"}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: Temps facturable / total */}
      <View
        style={{
          paddingTop: DESIGN_TOKENS.spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {t("jobs.timer.billableTime")}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            {formatTime(billableTime)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {t("jobs.timer.totalTime")}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
            {formatTime(totalElapsed)}
          </Text>
        </View>
      </View>

      {/* Modal: Confirmation étape suivante */}
      <Modal
        visible={showNextStepModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelNextStep}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              ⏭️ Étape suivante
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                marginBottom: 24,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Passer à &quot;{nextStepInfo.name}&quot; ({nextStepInfo.number}/{totalSteps}
              ) ?
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                testID="job-timer-cancel-next-step-btn"
                onPress={handleCancelNextStep}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 10,
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: colors.text,
                    fontSize: 15,
                  }}
                >
                  Annuler
                </Text>
              </Pressable>
              <Pressable
                testID="job-timer-confirm-next-step-btn"
                onPress={handleConfirmNextStep}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    fontSize: 15,
                  }}
                >
                  Continuer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Pause duration selection */}
      <Modal
        visible={showPauseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPauseModal(false);
          setShowCustomInput(false);
          setCustomMinutes("");
        }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={() => {
            setShowPauseModal(false);
            setShowCustomInput(false);
            setCustomMinutes("");
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              ⏸️ {t("jobs.timer.pauseDuration" as any)}
            </Text>

            <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
              {PAUSE_OPTIONS.map((option) => (
                <Pressable
                  key={option.minutes}
                  onPress={() => handlePauseWithDuration(option.minutes)}
                  style={({ pressed }) => ({
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: pressed
                      ? colors.warning + "20"
                      : colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: pressed ? colors.warning : colors.border,
                    alignItems: "center",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}

              {/* Custom duration option */}
              {!showCustomInput ? (
                <Pressable
                  onPress={() => setShowCustomInput(true)}
                  style={({ pressed }) => ({
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: pressed
                      ? colors.primary + "20"
                      : colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: pressed ? colors.primary : colors.border,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  })}
                >
                  <Ionicons
                    name="timer-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.primary,
                    }}
                  >
                    {t("jobs.timer.custom" as any)}
                  </Text>
                </Pressable>
              ) : (
                <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
                  <TextInput
                    autoFocus
                    keyboardType="number-pad"
                    placeholder={t("jobs.timer.customMinutes" as any)}
                    placeholderTextColor={colors.textMuted}
                    value={customMinutes}
                    onChangeText={(text) =>
                      setCustomMinutes(text.replace(/[^0-9]/g, ""))
                    }
                    maxLength={3}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      padding: DESIGN_TOKENS.spacing.md,
                      fontSize: 16,
                      color: colors.text,
                      textAlign: "center",
                    }}
                  />
                  <Pressable
                    onPress={() => {
                      const mins = parseInt(customMinutes, 10);
                      if (mins > 0) handlePauseWithDuration(mins);
                    }}
                    disabled={
                      !customMinutes || parseInt(customMinutes, 10) <= 0
                    }
                    style={({ pressed }) => ({
                      paddingVertical: DESIGN_TOKENS.spacing.md,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      backgroundColor:
                        !customMinutes || parseInt(customMinutes, 10) <= 0
                          ? colors.warning + "60"
                          : pressed
                            ? colors.warning + "DD"
                            : colors.warning,
                      alignItems: "center",
                    })}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {t("jobs.timer.confirm" as any)}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default JobTimerDisplay;

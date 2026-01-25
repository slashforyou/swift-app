/**
 * JobTimerDisplay - Composant fusionné simplifié
 * Combine le chrono + la progression sur une seule ligne
 *
 * Affichage :
 * ┌────────────────────────────────────────────────────────┐
 * │ ⏱️ 02:34:18                          🚛 En route (2/5) │
 * │ ○────●────○────○────○                          [Pause] │
 * │ [⏭️ Étape suivante]  [🏁 Terminer]                     │
 * └────────────────────────────────────────────────────────┘
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useJobTimerContext } from "../../context/JobTimerProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";

interface JobTimerDisplayProps {
  job: any;
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
    togglePause, // ✅ V1.0: Simple Play/Pause toggle
    nextStep,
    stopTimer,
  } = useJobTimerContext();

  // 🔍 DEBUG: Log chaque fois que le composant re-render
  React.useEffect(() => {
    // TEMP_DISABLED: console.log(`🔍 [JobTimerDisplay] Rendering: Step ${currentStep}/${totalSteps}, Job Step ${job?.step?.actualStep}`);
  }, [currentStep, totalSteps, job?.step?.actualStep]);

  // 🔍 DEBUG: Log des boutons
  React.useEffect(() => {
    // TEMP_DISABLED: console.log(`🔍 [BUTTON DEBUG] Running: ${isRunning}, Break: ${isOnBreak}, Step: ${currentStep}/${totalSteps}`);
  }, [isRunning, isOnBreak, currentStep, totalSteps]);

  // ✅ FIX: Si le timer n'a jamais démarré, on est au step 0
  const timerHasStarted = totalElapsed > 0;
  const effectiveCurrentStep = timerHasStarted ? currentStep : 0;

  // Config de l'étape actuelle
  const currentStepConfig = React.useMemo(() => {
    if (!job?.steps || job.steps.length === 0) return null;
    // ✅ FIX: Chercher le step par son ID, en utilisant effectiveCurrentStep
    return (
      job.steps.find((step: any) => step.id === effectiveCurrentStep) || null
    );
  }, [job?.steps, effectiveCurrentStep]);

  // ✅ Vérifier si le job est vraiment terminé (status completed)
  const isJobCompleted = job?.status === "completed";

  // Vérifier si on est à la dernière étape
  const isAtFinalStep = effectiveCurrentStep === totalSteps;

  // ✅ Le timer est "figé" si le job est completed OU à l'étape finale
  const isTimerFrozen = isJobCompleted || isAtFinalStep;

  // Log pour debug
  React.useEffect(() => {
    // TEMP_DISABLED: console.log(`🔍 [TIMER FROZEN DEBUG] Status: ${job?.status}, Frozen: ${isTimerFrozen}, Step: ${effectiveCurrentStep}/${totalSteps}`);
  }, [
    job?.status,
    isJobCompleted,
    effectiveCurrentStep,
    totalSteps,
    isAtFinalStep,
    isTimerFrozen,
  ]);

  // Vérifier si signature présente
  // ✅ Vérifier signature (local OU API)
  const hasSignature =
    job?.signature_blob ||
    job?.job?.signature_blob ||
    job?.signatureDataUrl ||
    job?.signatureFileUri;

  // Vérifier si paiement nécessaire
  const needsPayment =
    job?.payment_status === null && parseFloat(job?.amount_due || "0") > 0;

  // Handler pour terminer le job
  const handleStopTimer = () => {
    if (!hasSignature) {
      Alert.alert(
        "✍️ Signature requise",
        "Vous devez faire signer le client avant de finaliser le job.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Signer maintenant",
            onPress: () => onOpenSignatureModal?.(),
            style: "default",
          },
        ],
      );
      return;
    }

    Alert.alert(
      "🏁 Terminer le job",
      "Êtes-vous sûr ? La facturation sera déclenchée immédiatement.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Terminer", onPress: stopTimer, style: "destructive" },
      ],
    );
  };

  // Handler pour passer à l'étape suivante
  const handleNextStep = () => {
    const nextStepNumber = currentStep + 1;
    const nextStepName =
      job?.steps?.[currentStep]?.name || `Étape ${nextStepNumber}`;

    Alert.alert(
      "⏭️ Étape suivante",
      `Passer à "${nextStepName}" (${nextStepNumber}/${totalSteps}) ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Continuer", onPress: nextStep },
      ],
    );
  };

  // ✅ Step 0 = "Job not started" - On affiche quand même le bloc mais avec chrono à 0
  // Le chrono ne tourne qu'à partir du step 1
  const displayTime =
    currentStep === 0 ? 0 : isRunning || totalElapsed > 0 ? totalElapsed : 0;

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.xl,
        padding: DESIGN_TOKENS.spacing.lg,
        marginBottom: DESIGN_TOKENS.spacing.lg,
        borderWidth: 2,
        borderColor: isJobCompleted
          ? colors.success
          : isRunning
            ? colors.primary
            : colors.border,
      }}
    >
      {/* LIGNE 1: Temps uniquement */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        {/* Temps */}
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Ionicons
            name={isJobCompleted ? "checkmark-circle" : "time"}
            size={20}
            color={
              isJobCompleted
                ? colors.success
                : isRunning
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
              color: isJobCompleted
                ? colors.success
                : isRunning
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
              color: isJobCompleted
                ? colors.success
                : isRunning
                  ? colors.primary
                  : colors.textSecondary,
            }}
          >
            :{String(Math.floor((displayTime / 1000) % 60)).padStart(2, "0")}
          </Text>
          {isJobCompleted && (
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
      </View>

      {/* LIGNE 2: Stepper avec scroll horizontal */}
      <View
        style={{
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* ScrollView horizontal des cercles */}
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
            // ✅ FIX: Utiliser step.id directement (0, 1, 2, ...) au lieu de index + 1
            const stepNumber = step.id ?? index;

            // ✅ FIX: Si le timer n'a jamais démarré (totalElapsed = 0), on est au step 0
            // Le step 0 ne peut être validé que si le timer a démarré
            const timerHasStarted = totalElapsed > 0;
            const effectiveCurrentStep = timerHasStarted ? currentStep : 0;

            // Step 0 n'est validé que si timer a démarré ET currentStep > 0
            const isStepCompleted =
              timerHasStarted && stepNumber < effectiveCurrentStep;
            const isCurrent = stepNumber === effectiveCurrentStep;

            return (
              <React.Fragment key={step.id || index}>
                {/* Cercle du step */}
                <View
                  style={{
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Halo lumineux pour l'étape active */}
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
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* Nom du step actuel avec joli encadrement */}
        <View
          style={{
            alignItems: "center",
            marginTop: DESIGN_TOKENS.spacing.md,
          }}
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
              {currentStepConfig?.name || `Étape ${currentStep}`}
            </Text>
          </View>
        </View>
      </View>

      {/* LIGNE 2.5: Boutons de contrôle (sous la timeline) */}
      {/* ✅ Hiérarchie CTA claire: Primaire = action principale, Secondaire = action optionnelle */}
      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* ✅ Bouton PRIMAIRE: Play/Pause (action principale) */}
        {!isTimerFrozen && (
          <Pressable
            onPress={togglePause}
            style={({ pressed }) => ({
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: pressed
                ? isRunning
                  ? colors.warning + "DD"
                  : colors.success + "DD"
                : isRunning
                  ? colors.warning
                  : colors.success,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: isRunning ? 1 : 2, // Plus large quand c'est "Démarrer"
              justifyContent: "center",
              minHeight: 48, // Touch target minimum
            })}
          >
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={20}
              color={colors.background}
            />
            <Text
              style={{
                color: colors.background,
                fontSize: 15,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {isRunning ? t("jobs.timer.pause") : t("jobs.timer.start")}
            </Text>
          </Pressable>
        )}

        {/* ✅ Bouton SECONDAIRE: Étape suivante (outline style, moins proéminent) */}
        {isRunning && !isOnBreak && (
          <Pressable
            onPress={
              currentStep < totalSteps ? handleNextStep : handleStopTimer
            }
            style={({ pressed }) => ({
              flex: 1,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: pressed
                ? colors.backgroundTertiary
                : colors.backgroundSecondary,
              borderWidth: 1.5,
              borderColor:
                currentStep < totalSteps ? colors.primary : colors.success,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 48,
            })}
          >
            <Ionicons
              name={
                currentStep < totalSteps ? "arrow-forward" : "checkmark-circle"
              }
              size={18}
              color={currentStep < totalSteps ? colors.primary : colors.success}
            />
            <Text
              style={{
                color:
                  currentStep < totalSteps ? colors.primary : colors.success,
                fontSize: 14,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {currentStep < totalSteps
                ? t("jobs.timer.nextStep")
                : t("jobs.timer.finish")}
            </Text>
          </Pressable>
        )}
      </View>

      {/* LIGNE 3: Boutons d'action pour jobs terminés */}
      {/* ✅ CORRECTION: Si job terminé (completed), afficher bouton Signature ou Paiement */}
      {isJobCompleted && (
        <View
          style={{
            flexDirection: "row",
            gap: DESIGN_TOKENS.spacing.md,
          }}
        >
          {!hasSignature ? (
            // Pas de signature: Bouton "Signer"
            <Pressable
              onPress={() => onOpenSignatureModal?.()}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.lg,
                backgroundColor: pressed
                  ? colors.primary + "DD"
                  : colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              })}
            >
              <Ionicons name="create" size={18} color={colors.background} />
              <Text
                style={{
                  color: colors.background,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Signature requise
              </Text>
            </Pressable>
          ) : needsPayment ? (
            // Signature OK, mais paiement nécessaire
            <Pressable
              onPress={() => {
                if (onOpenPaymentPanel) {
                  onOpenPaymentPanel();
                } else {
                  Alert.alert(
                    "Paiement",
                    "Configuration du paiement nécessaire",
                  );
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.lg,
                backgroundColor: pressed
                  ? colors.success + "DD"
                  : colors.success,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              })}
            >
              <Ionicons name="card" size={18} color={colors.background} />
              <Text
                style={{
                  color: colors.background,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Passer au paiement
              </Text>
            </Pressable>
          ) : (
            // Tout est terminé
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
                style={{
                  color: colors.success,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Job terminé et payé
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Footer: Temps facturable */}
      <View
        style={{
          marginTop: DESIGN_TOKENS.spacing.md,
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
    </View>
  );
};

export default JobTimerDisplay;

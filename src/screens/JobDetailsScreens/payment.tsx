/**
 * Payment Page - Gestion moderne des paiements conforme au design Summary
 * Utilise le timer en temps réel pour calculer les coûts
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useEffect, useMemo, useState } from "react";
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
import SigningBloc from "../../components/signingBloc";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useJobTimerContext } from "../../context/JobTimerProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useJobDetails } from "../../hooks/useJobDetails";
import { useLocalization } from "../../localization/useLocalization";
import { checkJobSignatureExists } from "../../services/jobDetails";
import PaymentWindow from "./paymentWindow";

// Interfaces
interface PaymentProps {
  job: any;
  setJob: (job: any) => void;
}

interface AdditionalItem {
  id: string;
  description: string;
  amount: number;
}

const PaymentScreen: React.FC<PaymentProps> = ({ job, setJob }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [paymentWindowVisible, setPaymentWindowVisible] = useState<
    string | null
  >(null);
  const [isSigningVisible, setIsSigningVisible] = useState(false);

  // État pour les éléments additionnels de la facture
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  // ✅ État pour la signature vérifiée depuis le serveur
  const [signatureFromServer, setSignatureFromServer] = useState<{
    exists: boolean;
    signatureId?: number;
    isLoading: boolean;
  }>({ exists: false, isLoading: true });

  // ✅ Récupérer jobDetails du context pour avoir les données fraîches
  // NOTE: L'endpoint /job/:code/full attend un CODE (JOB-XXX), pas un ID numérique
  const jobCode = job?.code || job?.job?.code;
  const { jobDetails } = useJobDetails(jobCode);

  // ✅ Vérifier la signature sur le serveur au montage
  useEffect(() => {
    const checkSignatureOnServer = async () => {
      const jobId = job?.id || job?.job?.id;
      if (!jobId) {
        setSignatureFromServer({ exists: false, isLoading: false });
        return;
      }

      try {
        // TEMP_DISABLED: console.log('🔍 [Payment] Checking signature on server for job:', jobId);
        const result = await checkJobSignatureExists(jobId, "client");
        // TEMP_DISABLED: console.log('🔍 [Payment] Server signature check result:', result);
        setSignatureFromServer({
          exists: result.exists,
          signatureId: result.signatureId,
          isLoading: false,
        });
      } catch (error) {
        // TEMP_DISABLED: console.error('❌ [Payment] Error checking signature:', error);
        setSignatureFromServer({ exists: false, isLoading: false });
      }
    };

    checkSignatureOnServer();
  }, [job?.id, job?.job?.id]);

  // ✅ SYNC: Synchroniser job state avec jobDetails.job (notamment signature_blob)
  useEffect(() => {
    if (jobDetails?.job) {
      // TEMP_DISABLED: console.log('🔄 [Payment] Syncing job state with jobDetails:', {
      //     hasSignatureInContext: !!jobDetails.job.signature_blob,
      //     hasSignatureInState: !!job.signature_blob,
      //     signatureDate: jobDetails.job.signature_date
      // });

      // Merge pour garder modifications locales + ajouter données backend
      setJob((prev: any) => ({
        ...prev,
        ...jobDetails.job,
        // Préserver certains champs locaux si nécessaire
        signatureDataUrl:
          prev.signatureDataUrl || jobDetails.job.signature_blob,
      }));
    }
  }, [
    jobDetails?.job?.id,
    jobDetails?.job?.signature_blob,
    jobDetails?.job?.signature_date,
  ]);

  // ✅ Utiliser le context du timer pour les calculs en temps réel
  const {
    totalElapsed,
    billableTime,
    formatTime,
    calculateCost,
    HOURLY_RATE_AUD,
    isRunning,
    currentStep,
    totalSteps: contextTotalSteps,
  } = useJobTimerContext();

  // ✅ FIX: Forcer au moins 5 étapes car l'étape 5 = paiement (pas une étape de travail)
  // Si le template n'a que 4 steps, on considère step 4 comme la fin du travail
  // et le paiement est accessible dès step 4
  const totalSteps = Math.max(4, contextTotalSteps);

  // Calculer le coût en temps réel
  const getRealTimePaymentInfo = () => {
    const costData = calculateCost(billableTime);
    const estimatedCost = job?.job?.estimatedCost || job?.estimatedCost || 0;
    const currentCost = costData.total;
    const isPaid = job?.job?.isPaid || job?.isPaid || false;

    return {
      estimated: estimatedCost,
      current: currentCost,
      billableHours: costData.billableHours,
      actualTime: billableTime,
      totalTime: totalElapsed,
      currency: "AUD",
      status: determinePaymentStatus(currentCost, estimatedCost, isPaid),
      isPaid: isPaid,
      isRunning,
    };
  };

  const determinePaymentStatus = (
    actualCost: number,
    estimatedCost: number,
    isPaid: boolean,
  ) => {
    // Si déjà payé via Stripe, statut = completed (priorité absolue)
    if (isPaid) {
      return "completed";
    }

    // Sinon, déterminer selon le coût actuel
    if (actualCost === 0) {
      return "pending";
    }

    // Coût calculé mais pas encore payé → toujours 'pending'
    // (peu importe si actualCost >= estimatedCost, le statut reste 'pending' tant que isPaid = false)
    return "pending";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  // Fonctions pour gérer les éléments additionnels
  const handleAddItem = () => {
    if (!newItemDescription.trim()) {
      Alert.alert(
        t("common.error"),
        t("jobDetails.payment.additionalItems.descriptionRequired") ||
          "Description is required",
      );
      return;
    }
    const amount = parseFloat(newItemAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        t("common.error"),
        t("jobDetails.payment.additionalItems.validAmountRequired") ||
          "Please enter a valid amount",
      );
      return;
    }

    const newItem: AdditionalItem = {
      id: Date.now().toString(),
      description: newItemDescription.trim(),
      amount: amount,
    };

    setAdditionalItems((prev) => [...prev, newItem]);
    setNewItemDescription("");
    setNewItemAmount("");
    setIsAddItemModalVisible(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setAdditionalItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const additionalItemsTotal = useMemo(() => {
    return additionalItems.reduce((sum, item) => sum + item.amount, 0);
  }, [additionalItems]);

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        label: t("jobDetails.payment.status.pending"),
        color: colors.warning,
        bgColor: colors.warning + "20",
        icon: "time-outline",
      },
      partial: {
        label: t("jobDetails.payment.status.partial"),
        color: colors.info,
        bgColor: colors.info + "20",
        icon: "card-outline",
      },
      completed: {
        label: t("jobDetails.payment.status.completed"),
        color: colors.success,
        bgColor: colors.success + "20",
        icon: "checkmark-circle-outline",
      },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const paymentInfo = getRealTimePaymentInfo();
  const statusInfo = getStatusInfo(paymentInfo.status);

  // ✅ Vérifier si le job est terminé (currentStep = totalSteps) - OPTIMIZED WITH useMemo
  // ✅ FIX 2: Extract status values BEFORE useMemo to stabilize dependencies
  const jobStatus = job?.status;
  const jobJobStatus = job?.job?.status;

  const isJobCompleted = useMemo(() => {
    // ✅ FIX: Job complété si on a atteint au moins l'étape 4
    // (car étape 5 = paiement, pas une étape de travail)
    // OU si le statut du job est 'completed'
    const isStepCompleted = currentStep >= 4; // Au moins step 4
    const isStatusCompleted =
      jobStatus === "completed" || jobJobStatus === "completed";

    // TEMP_DISABLED: console.log('🔍 [Payment] isJobCompleted check:', {
    //     currentStep,
    //     totalSteps,
    //     isStepCompleted,
    //     isStatusCompleted,
    //     result: isStepCompleted || isStatusCompleted
    // });

    return isStepCompleted || isStatusCompleted;
  }, [currentStep, totalSteps, jobStatus, jobJobStatus]);

  // ✅ Vérifier si le client a signé (serveur OU local OU API) - UTILISER useMemo pour éviter boucle infinie
  const hasSignature = useMemo(() => {
    const result = !!(
      signatureFromServer.exists || // ✅ PRIORITÉ: Vérification serveur
      job?.signatureDataUrl ||
      job?.signatureFileUri ||
      job?.signature_blob ||
      job?.job?.signature_blob
    );

    return result;
  }, [
    signatureFromServer.exists,
    job?.signatureDataUrl,
    job?.signatureFileUri,
    job?.signature_blob,
    job?.job?.signature_blob,
  ]);

  // Log uniquement quand la valeur change (pas à chaque render)
  useEffect(() => {
    // TEMP_DISABLED: console.log('🔍 [Payment] hasSignature changed:', {
    //     signatureFromServer: signatureFromServer.exists,
    //     signatureDataUrl: !!job?.signatureDataUrl,
    //     signatureFileUri: !!job?.signatureFileUri,
    //     signatureBlob: !!job?.signature_blob,
    //     jobSignatureBlob: !!job?.job?.signature_blob,
    //     result: hasSignature
    // });
  }, [hasSignature]);

  // ✅ Handler pour le bouton de signature
  const handleOpenSignature = () => {
    setIsSigningVisible(true);
  };

  const handlePayment = () => {
    if (!isJobCompleted) {
      Alert.alert(
        t("jobDetails.payment.alerts.jobInProgress"),
        t("jobDetails.payment.alerts.jobInProgressMessage"),
      );
      return;
    }

    if (!hasSignature) {
      Alert.alert(
        t("jobDetails.payment.alerts.signatureRequired"),
        t("jobDetails.payment.alerts.signatureRequiredMessage"),
        [
          { text: t("jobDetails.payment.alerts.cancel"), style: "cancel" },
          {
            text: t("jobDetails.payment.alerts.signNow"),
            onPress: handleOpenSignature,
          },
        ],
      );
      return;
    }

    if (paymentInfo.status === "pending") {
      setPaymentWindowVisible("paymentWindow");
    } else {
      Alert.alert(
        t("jobDetails.payment.alerts.alreadyProcessed"),
        t("jobDetails.payment.alerts.alreadyProcessedMessage"),
      );
    }
  };

  if (paymentWindowVisible === "paymentWindow") {
    return (
      <PaymentWindow
        job={job}
        setJob={setJob}
        visibleCondition={paymentWindowVisible}
        setVisibleCondition={setPaymentWindowVisible}
      />
    );
  }

  return (
    <>
      {/* ✅ Modal de signature */}
      {isSigningVisible && (
        <SigningBloc
          isVisible={isSigningVisible}
          setIsVisible={setIsSigningVisible}
          onSave={(signature: any) => {
            // TEMP_DISABLED: console.log('Signature saved:', signature);
          }}
          job={job}
          setJob={setJob}
        />
      )}

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.md }}
      >
        {/* Header avec statuts et bouton de paiement */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Titre */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {t("jobDetails.payment.title")}
          </Text>

          {/* Badges de statut */}
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              flexWrap: "wrap",
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {/* Badge de statut du job */}
            <View
              style={{
                backgroundColor: isJobCompleted
                  ? colors.success + "20"
                  : colors.warning + "20",
                borderRadius: DESIGN_TOKENS.radius.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.xs,
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.xs,
              }}
            >
              <Ionicons
                name={
                  isJobCompleted ? "checkmark-circle-outline" : "time-outline"
                }
                size={16}
                color={isJobCompleted ? colors.success : colors.warning}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isJobCompleted ? colors.success : colors.warning,
                }}
              >
                {isJobCompleted
                  ? t("jobDetails.payment.jobStatus.completed")
                  : t("jobDetails.payment.jobStatus.inProgress")}
              </Text>
            </View>

            {/* Badge de statut de paiement */}
            <View
              style={{
                backgroundColor: statusInfo.bgColor,
                borderRadius: DESIGN_TOKENS.radius.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.xs,
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.xs,
              }}
            >
              <Ionicons
                name={statusInfo.icon as any}
                size={16}
                color={statusInfo.color}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* ✅ Bouton de signature ou paiement selon l'état */}
          {isJobCompleted && (
            <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
              {signatureFromServer.isLoading ? (
                // Afficher un loader pendant la vérification serveur
                <View
                  style={{
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {t("jobDetails.payment.signature.verifying")}
                  </Text>
                </View>
              ) : !hasSignature ? (
                // Bouton pour signer si pas encore signé
                <Pressable
                  onPress={handleOpenSignature}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.primary + "DD"
                      : colors.primary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                    minHeight: 56,
                  })}
                >
                  <Ionicons name="create" size={20} color={colors.background} />
                  <Text
                    style={{
                      color: colors.background,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {t("jobDetails.payment.signature.signJob")}
                  </Text>
                </Pressable>
              ) : (
                // Bouton pour payer si signé (ou afficher état payé)
                <Pressable
                  onPress={paymentInfo.isPaid ? undefined : handlePayment}
                  disabled={paymentInfo.isPaid}
                  style={({ pressed }) => ({
                    backgroundColor: paymentInfo.isPaid
                      ? colors.success + "40"
                      : pressed
                        ? colors.successLight
                        : colors.success,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                    minHeight: 56,
                    opacity: paymentInfo.isPaid ? 1 : 1,
                  })}
                >
                  <Ionicons
                    name={paymentInfo.isPaid ? "checkmark-circle" : "card"}
                    size={20}
                    color={
                      paymentInfo.isPaid ? colors.success : colors.background
                    }
                  />
                  <Text
                    style={{
                      color: paymentInfo.isPaid
                        ? colors.success
                        : colors.background,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {paymentInfo.isPaid
                      ? t("jobDetails.payment.signature.paid")
                      : t("jobDetails.payment.signature.payNow")}
                  </Text>
                </Pressable>
              )}

              {/* Indicateur si signé */}
              {hasSignature && (
                <View
                  style={{
                    marginTop: DESIGN_TOKENS.spacing.sm,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.success,
                      fontWeight: "600",
                    }}
                  >
                    {t("jobDetails.payment.signature.jobSignedByClient")}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Suivi du temps en temps réel */}
        {paymentInfo.isRunning && (
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              borderWidth: 2,
              borderColor: colors.primary + "30",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="time" size={18} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  flex: 1,
                }}
              >
                {t("jobDetails.payment.liveTracking.title")}
              </Text>
              <View
                style={{
                  backgroundColor: colors.success,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.buttonPrimaryText,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.buttonPrimaryText,
                  }}
                >
                  {t("jobDetails.payment.liveTracking.live")}
                </Text>
              </View>
            </View>

            <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t("jobDetails.payment.liveTracking.totalTimeElapsed")}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {formatTime(paymentInfo.totalTime)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t("jobDetails.payment.liveTracking.billableTime")}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {formatTime(paymentInfo.actualTime)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t("jobDetails.payment.liveTracking.currentCost")}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.primary,
                  }}
                >
                  {formatCurrency(paymentInfo.current)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Résumé financier */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {t("jobDetails.payment.financialSummary.title")}
          </Text>

          <View style={{ gap: DESIGN_TOKENS.spacing.lg }}>
            {/* Coût estimé */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {t("jobDetails.payment.financialSummary.estimatedCost")}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {formatCurrency(paymentInfo.estimated)}
                </Text>
              </View>
              <Ionicons
                name="calculator"
                size={20}
                color={colors.textSecondary}
              />
            </View>

            {/* Coût réel */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.md,
                borderBottomWidth:
                  paymentInfo.current !== paymentInfo.estimated ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {paymentInfo.status === "completed"
                    ? t("jobDetails.payment.financialSummary.finalCost")
                    : t("jobDetails.payment.financialSummary.currentCost")}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color:
                      paymentInfo.status === "completed"
                        ? colors.success
                        : colors.text,
                  }}
                >
                  {formatCurrency(paymentInfo.current)}
                </Text>
              </View>
              <Ionicons
                name={
                  paymentInfo.status === "completed"
                    ? "checkmark-circle"
                    : "time"
                }
                size={24}
                color={
                  paymentInfo.status === "completed"
                    ? colors.success
                    : colors.textSecondary
                }
              />
            </View>

            {/* Différence si applicable */}
            {paymentInfo.current !== paymentInfo.estimated && (
              <View
                style={{
                  backgroundColor:
                    paymentInfo.current > paymentInfo.estimated
                      ? colors.warning + "20"
                      : colors.success + "20",
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  padding: DESIGN_TOKENS.spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Ionicons
                  name={
                    paymentInfo.current > paymentInfo.estimated
                      ? "trending-up"
                      : "trending-down"
                  }
                  size={20}
                  color={
                    paymentInfo.current > paymentInfo.estimated
                      ? colors.warning
                      : colors.success
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color:
                        paymentInfo.current > paymentInfo.estimated
                          ? colors.warning
                          : colors.success,
                    }}
                  >
                    {paymentInfo.current > paymentInfo.estimated
                      ? t("jobDetails.payment.financialSummary.additionalCost")
                      : t("jobDetails.payment.financialSummary.savings")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color:
                        paymentInfo.current > paymentInfo.estimated
                          ? colors.warning
                          : colors.success,
                    }}
                  >
                    {formatCurrency(
                      Math.abs(paymentInfo.current - paymentInfo.estimated),
                    )}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 💰 BREAKDOWN DÉTAILLÉ DE FACTURATION */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderWidth: 2,
            borderColor: colors.primary + "20",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: DESIGN_TOKENS.spacing.sm,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="receipt" size={18} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                flex: 1,
              }}
            >
              {t("jobDetails.payment.billingBreakdown.title")}
            </Text>
          </View>

          {/* Calcul détaillé */}
          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            {/* Ligne 1: Temps de travail réel */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.text }}>
                {t("jobDetails.payment.billingBreakdown.actualWorkTime")}
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: colors.text }}
              >
                {formatTime(paymentInfo.totalTime)}
              </Text>
            </View>

            {/* Ligne 2: Pauses (si > 0) */}
            {paymentInfo.totalTime > paymentInfo.actualTime && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t("jobDetails.payment.billingBreakdown.pausesNotBillable")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.warning,
                  }}
                >
                  -{formatTime(paymentInfo.totalTime - paymentInfo.actualTime)}
                </Text>
              </View>
            )}

            {/* Séparateur */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: DESIGN_TOKENS.spacing.xs,
              }}
            />

            {/* Ligne 3: Temps facturable brut */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text
                style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}
              >
                {t("jobDetails.payment.billingBreakdown.grossBillableTime")}
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
              >
                {formatTime(paymentInfo.actualTime)}
              </Text>
            </View>

            {/* Ligne 4: Minimum facturable (2h) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {t("jobDetails.payment.billingBreakdown.minimumBillable")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t("jobDetails.payment.billingBreakdown.minimumPolicy")}
                </Text>
              </View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: colors.text }}
              >
                2h00min
              </Text>
            </View>

            {/* Ligne 5: Call-out fee */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {t("jobDetails.payment.billingBreakdown.callOutFee")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t("jobDetails.payment.billingBreakdown.travelFee")}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.primary,
                }}
              >
                +0h30min
              </Text>
            </View>

            {/* Ligne 6: Arrondi (règle 7min) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  {t("jobDetails.payment.billingBreakdown.halfHourRounding")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t("jobDetails.payment.billingBreakdown.sevenMinuteRule")}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.primary,
                }}
              >
                {t("jobDetails.payment.billingBreakdown.auto")}
              </Text>
            </View>

            {/* Double séparateur */}
            <View
              style={{
                height: 2,
                backgroundColor: colors.border,
                marginVertical: DESIGN_TOKENS.spacing.xs,
              }}
            />

            {/* Ligne 7: Total heures facturables */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.backgroundTertiary + "30",
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Text
                style={{ fontSize: 15, color: colors.text, fontWeight: "700" }}
              >
                {t("jobDetails.payment.billingBreakdown.totalBillableHours")}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {paymentInfo.billableHours}h
              </Text>
            </View>

            {/* Ligne 8: Taux horaire */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {t("jobDetails.payment.billingBreakdown.hourlyRate")}
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: colors.text }}
              >
                {formatCurrency(HOURLY_RATE_AUD)}/h
              </Text>
            </View>

            {/* Section Éléments Additionnels */}
            <View
              style={{
                marginTop: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {t("jobDetails.payment.additionalItems.title") ||
                    "Additional Items"}
                </Text>
                <Pressable
                  onPress={() => setIsAddItemModalVisible(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.primary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    gap: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={colors.buttonPrimaryText}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.buttonPrimaryText,
                      fontWeight: "600",
                    }}
                  >
                    {t("jobDetails.payment.additionalItems.addItem") ||
                      "Add Item"}
                  </Text>
                </Pressable>
              </View>

              {additionalItems.length > 0 ? (
                <View style={{ gap: DESIGN_TOKENS.spacing.xs }}>
                  {additionalItems.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: colors.backgroundTertiary + "30",
                        padding: DESIGN_TOKENS.spacing.sm,
                        borderRadius: DESIGN_TOKENS.radius.sm,
                      }}
                    >
                      <Text
                        style={{ fontSize: 14, color: colors.text, flex: 1 }}
                      >
                        {item.description}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: colors.text,
                          marginRight: DESIGN_TOKENS.spacing.sm,
                        }}
                      >
                        {formatCurrency(item.amount)}
                      </Text>
                      <Pressable onPress={() => handleRemoveItem(item.id)}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  ))}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: DESIGN_TOKENS.spacing.xs,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontWeight: "600",
                      }}
                    >
                      {t("jobDetails.payment.additionalItems.subtotal") ||
                        "Subtotal"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {formatCurrency(additionalItemsTotal)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                  }}
                >
                  {t("jobDetails.payment.additionalItems.noItems") ||
                    "No additional items"}
                </Text>
              )}
            </View>

            {/* Triple séparateur */}
            <View
              style={{
                height: 3,
                backgroundColor: colors.primary + "30",
                marginVertical: DESIGN_TOKENS.spacing.sm,
              }}
            />

            {/* Ligne 9: MONTANT FINAL */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.primary + "10",
                padding: DESIGN_TOKENS.spacing.lg,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 2,
                borderColor: colors.primary + "30",
              }}
            >
              <Text
                style={{ fontSize: 17, color: colors.text, fontWeight: "700" }}
              >
                {t("jobDetails.payment.billingBreakdown.finalAmount")}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {formatCurrency(paymentInfo.current + additionalItemsTotal)}
              </Text>
            </View>

            {/* Note explicative */}
            <View
              style={{
                backgroundColor: colors.backgroundTertiary + "30",
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                marginTop: DESIGN_TOKENS.spacing.sm,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {t("jobDetails.payment.billingBreakdown.explanatoryNote")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section détails du job (suite existante...) */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Détails de facturation */}
          <View
            style={{
              backgroundColor: colors.backgroundTertiary + "50",
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md,
              marginTop: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              <Ionicons
                name="calculator"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                {t("jobDetails.payment.jobDetailsSection.billingDetails")}
              </Text>
            </View>

            <View style={{ gap: DESIGN_TOKENS.spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {t("jobDetails.payment.jobDetailsSection.billableHours")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {paymentInfo.billableHours.toFixed(1)}h
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {t("jobDetails.payment.jobDetailsSection.hourlyRate")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {formatCurrency(HOURLY_RATE_AUD)}/h
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informations du job */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {t("jobDetails.payment.jobDetailsSection.title")}
          </Text>

          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {t("jobDetails.payment.jobDetailsSection.jobTitle")}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {job?.job?.title ||
                  job?.title ||
                  t("jobDetails.payment.jobDetailsSection.untitledJob")}
              </Text>
            </View>

            {job?.client && (
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {t("jobDetails.payment.jobDetailsSection.client")}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  {job.client.name ||
                    `${job.client.firstName} ${job.client.lastName}`}
                </Text>
              </View>
            )}

            <View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {t("jobDetails.payment.jobDetailsSection.estimatedDuration")}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {job?.job?.estimatedDuration
                  ? `${Math.round(job.job.estimatedDuration / 60)} ${t("jobDetails.payment.jobDetailsSection.hours")}`
                  : t("jobDetails.payment.jobDetailsSection.notDefined")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal pour ajouter un élément */}
      <Modal
        visible={isAddItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddItemModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: DESIGN_TOKENS.spacing.lg,
          }}
          onPress={() => setIsAddItemModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              width: "100%",
              maxWidth: 400,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {t("jobDetails.payment.additionalItems.addItemTitle") ||
                "Add Item"}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: DESIGN_TOKENS.spacing.xs,
              }}
            >
              {t("jobDetails.payment.additionalItems.description") ||
                "Description"}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
              placeholder={
                t(
                  "jobDetails.payment.additionalItems.descriptionPlaceholder",
                ) || "e.g., Extra materials"
              }
              placeholderTextColor={colors.textSecondary}
              value={newItemDescription}
              onChangeText={setNewItemDescription}
            />

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: DESIGN_TOKENS.spacing.xs,
              }}
            >
              {t("jobDetails.payment.additionalItems.amount") || "Amount (AUD)"}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={newItemAmount}
              onChangeText={setNewItemAmount}
              keyboardType="decimal-pad"
            />

            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}
            >
              <Pressable
                onPress={() => {
                  setIsAddItemModalVisible(false);
                  setNewItemDescription("");
                  setNewItemAmount("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {t("common.cancel") || "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.buttonPrimaryText,
                    fontWeight: "600",
                  }}
                >
                  {t("common.add") || "Add"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default PaymentScreen;

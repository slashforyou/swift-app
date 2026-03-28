/**
 * Payment Page - Gestion moderne des paiements conforme au design Summary
 * Utilise le timer en temps réel pour calculer les coûts
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useInvoice } from "../../hooks/useInvoice";
import { useJobDetails } from "../../hooks/useJobDetails";
import { useLocalization } from "../../localization/useLocalization";
import { checkJobSignatureExists } from "../../services/jobDetails";
import { checkStripeConnectionStatus } from "../../services/StripeService";
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
  const navigation = useNavigation<any>();
  const { sendInvoiceWithConfirmation } = useInvoice();
  const [paymentWindowVisible, setPaymentWindowVisible] = useState<
    string | null
  >(null);
  const [isSigningVisible, setIsSigningVisible] = useState(false);

  // État pour les éléments additionnels de la facture
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);

  // ✅ Guard Stripe : vérifier que le compte Stripe est actif avant autoriser paiement
  const [stripeAccountStatus, setStripeAccountStatus] = useState<
    "loading" | "active" | "inactive"
  >("loading");

  useEffect(() => {
    checkStripeConnectionStatus()
      .then((result) => {
        setStripeAccountStatus(
          result.status === "active" ? "active" : "inactive",
        );
      })
      .catch(() => {
        // En cas d'erreur réseau, on laisse passer (ne pas bloquer sur erreur transitoire)
        setStripeAccountStatus("active");
      });
  }, []);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [passFeesToClient, setPassFeesToClient] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("stripe_pass_fees_to_client").then((val) => {
      if (val !== null) setPassFeesToClient(val === "true");
    });
  }, []);

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
        const result = await checkJobSignatureExists(jobId, "client");
        setSignatureFromServer({
          exists: result.exists,
          signatureId: result.signatureId,
          isLoading: false,
        });
      } catch (error) {
        setSignatureFromServer({ exists: false, isLoading: false });
      }
    };

    checkSignatureOnServer();
  }, [job?.id, job?.job?.id]);

  // ✅ SYNC: Synchroniser job state avec jobDetails.job (notamment signature_blob)
  useEffect(() => {
    if (jobDetails?.job) {
      //     hasSignatureInContext: !!jobDetails.job.signature_blob,
      //     hasSignatureInState: !!job.signature_blob,
      //     signatureDate: jobDetails.job.signature_date
      // });

      // Merge pour garder modifications locales + ajouter données backend
      // ⚠️ L'API /full retourne le client dans jobDetails.client (sibling), PAS dans jobDetails.job
      setJob((prev: any) => ({
        ...prev,
        ...jobDetails.job,
        // Préserver les données client embarquées (non retournées dans jobDetails.job)
        client: prev?.client,
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
    const isPaid =
      job?.job?.payment_status === "paid" ||
      job?.payment_status === "paid" ||
      job?.job?.isPaid ||
      job?.isPaid ||
      false;

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

    // ✅ Guard Stripe : bloquer si le compte Stripe n'est pas actif
    if (stripeAccountStatus === "inactive") {
      Alert.alert(
        "Compte Stripe incomplet",
        "Vous devez compléter la configuration de votre compte Stripe avant de pouvoir recevoir des paiements.",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Activer Stripe",
            onPress: () =>
              navigation.navigate("Business", { initialTab: "JobsBilling" }),
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

  // ✅ Handler pour envoyer la facture au client (quand déjà payé)
  const handleSendInvoice = useCallback(async () => {
    try {
      const jobData = {
        id: job?.id || job?.job?.id,
        code: job?.code || job?.job?.code,
        client: job?.client,
        amount_total: paymentInfo.current + additionalItemsTotal,
      };
      await sendInvoiceWithConfirmation(jobData, t);
    } catch (error) {
      console.error("❌ [Payment] Error sending invoice:", error);
    }
  }, [
    job,
    paymentInfo.current,
    additionalItemsTotal,
    sendInvoiceWithConfirmation,
    t,
  ]);

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
          }}
          job={job}
          setJob={setJob}
        />
      )}

      <ScrollView
        testID="job-payment-scroll"
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        {stripeAccountStatus === "inactive" && (
          <View
            style={{
              backgroundColor: colors.warning + "20",
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.warning + "60",
              padding: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Ionicons
              name="warning-outline"
              size={20}
              color={colors.warning}
              style={{ marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.warning,
                  marginBottom: 4,
                }}
              >
                Compte Stripe incomplet
              </Text>
              <Text
                style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}
              >
                Votre compte Stripe n'est pas encore actif. Finalisez la
                configuration pour pouvoir recevoir des paiements.
              </Text>
              <Pressable
                testID="payment-stripe-activate-btn"
                onPress={() =>
                  navigation.navigate("Business", { initialTab: "JobsBilling" })
                }
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? colors.warning
                    : colors.warning + "E0",
                  borderRadius: DESIGN_TOKENS.radius.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  marginTop: DESIGN_TOKENS.spacing.sm,
                  alignSelf: "flex-start",
                })}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  }}
                >
                  Activer Stripe
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ===== 1. BILLING BREAKDOWN (en premier) ===== */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Header avec icône */}
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
            {/* Badge de statut de paiement */}
            <View
              style={{
                backgroundColor: statusInfo.bgColor,
                borderRadius: DESIGN_TOKENS.radius.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                paddingVertical: 3,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons
                name={statusInfo.icon as any}
                size={14}
                color={statusInfo.color}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Calcul détaillé */}
          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            {/* Temps de travail réel */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
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

            {/* Pauses (si > 0) */}
            {paymentInfo.totalTime > paymentInfo.actualTime && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
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
              }}
            />

            {/* Temps facturable brut */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
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

            {/* Minimum facturable (2h) */}
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

            {/* Call-out fee */}
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

            {/* Arrondi (règle 7min) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
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

            {/* Séparateur double */}
            <View
              style={{
                height: 2,
                backgroundColor: colors.border,
              }}
            />

            {/* Total heures facturables */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.backgroundTertiary + "30",
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
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

            {/* Taux horaire */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
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

            {/* Section Éléments Additionnels — masqué si payé */}
            {!paymentInfo.isPaid && (
              <View
                style={{
                  marginTop: DESIGN_TOKENS.spacing.sm,
                  marginBottom: DESIGN_TOKENS.spacing.sm,
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
            )}

            {/* Séparateur épais */}
            <View
              style={{
                height: 3,
                backgroundColor: colors.primary + "30",
                marginVertical: DESIGN_TOKENS.spacing.xs,
              }}
            />

            {/* MONTANT FINAL */}
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

            {/* ===== BOUTON D'ACTION (juste après le final amount) ===== */}
            {isJobCompleted && (
              <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                {signatureFromServer.isLoading ? (
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
                  // Pas encore signé → bouton signature
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
                      minHeight: 52,
                    })}
                  >
                    <Ionicons
                      name="create"
                      size={20}
                      color={colors.background}
                    />
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
                ) : paymentInfo.isPaid ? (
                  // Déjà payé → bouton envoyer facture
                  <Pressable
                    onPress={handleSendInvoice}
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
                      minHeight: 52,
                    })}
                  >
                    <Ionicons name="send" size={20} color={colors.background} />
                    <Text
                      style={{
                        color: colors.background,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {t("payment.window.sendInvoice") || "Send Invoice"}
                    </Text>
                  </Pressable>
                ) : (
                  // Signé mais pas payé → bouton payer
                  <Pressable
                    onPress={handlePayment}
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? colors.successLight
                        : colors.success,
                      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                      paddingVertical: DESIGN_TOKENS.spacing.md,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: DESIGN_TOKENS.spacing.sm,
                      minHeight: 52,
                    })}
                  >
                    <Ionicons name="card" size={20} color={colors.background} />
                    <Text
                      style={{
                        color: colors.background,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {t("jobDetails.payment.signature.payNow")}
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
                        fontSize: 13,
                        color: colors.success,
                        fontWeight: "600",
                      }}
                    >
                      {t("jobDetails.payment.signature.jobSignedByClient")}
                    </Text>
                  </View>
                )}
                {paymentInfo.isPaid && (
                  <View
                    style={{
                      marginTop: 4,
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
                        fontSize: 13,
                        color: colors.success,
                        fontWeight: "600",
                      }}
                    >
                      {t("jobDetails.payment.signature.paid")}
                    </Text>
                  </View>
                )}
              </View>
            )}

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

        {/* ===== 2. RÉSUMÉ FINANCIER ===== */}
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

            {/* Frais Stripe / Cobbr si refacturés au client */}
            {passFeesToClient && paymentInfo.current > 0 && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Stripe fees (2.9% + $0.30)
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.text,
                    }}
                  >
                    {formatCurrency(
                      Math.round(paymentInfo.current * 0.029 + 30),
                    )}
                  </Text>
                </View>
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
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Cobbr fees (2.5%)
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: colors.text,
                    }}
                  >
                    {formatCurrency(Math.round(paymentInfo.current * 0.025))}
                  </Text>
                </View>
              </>
            )}

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

        {/* ===== 3. SUIVI TEMPS RÉEL (si timer actif) ===== */}
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
              {t("jobDetails.payment.additionalItems.amount")}
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
              placeholder={t(
                "jobDetails.payment.additionalItems.amountPlaceholder",
              )}
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

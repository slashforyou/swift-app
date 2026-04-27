/**
 * Payment Page � Gestion des paiements
 * Structure : Hero CTA ? Acompte ? Items additionnels ? D�tail facturation ? Signaler probl�me
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    Text,
    TextInput,
    View,
} from "react-native";
import ReportPaymentIssueModal from "../../components/modals/ReportPaymentIssueModal";
import SigningBloc from "../../components/signingBloc";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useJobTimerContext } from "../../context/JobTimerProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useInvoice } from "../../hooks/useInvoice";
import { useJobDetails } from "../../hooks/useJobDetails";
import { useJobPaymentStatus } from "../../hooks/useJobPaymentStatus";
import { useLocalization } from "../../localization/useLocalization";
import { checkJobSignatureExists } from "../../services/jobDetails";
import { updateJob } from "../../services/jobs";
import {
    checkStripeConnectionStatus,
    createStripePaymentLink,
    deactivateStripePaymentLink,
} from "../../services/StripeService";
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

  // �tat pour les �l�ments additionnels de la facture
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);

  // ? Guard Stripe : v�rifier que le compte Stripe est actif avant autoriser paiement
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
        // En cas d'erreur r�seau, on laisse passer (ne pas bloquer sur erreur transitoire)
        setStripeAccountStatus("active");
      });
  }, []);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [isReportIssueVisible, setIsReportIssueVisible] = useState(false);

  // �tats acompte et UI
  const [depositInputAmount, setDepositInputAmount] = useState("");
  const [isCreatingDepositLink, setIsCreatingDepositLink] = useState(false);
  const [isBillingExpanded, setIsBillingExpanded] = useState(true);
  const itemsLoadedRef = useRef(false);

  // Hook de suivi du statut de paiement avec polling
  const paymentStatusHook = useJobPaymentStatus(job?.id || job?.job?.id);

  // ? �tat pour la signature v�rifi�e depuis le serveur
  const [signatureFromServer, setSignatureFromServer] = useState<{
    exists: boolean;
    signatureId?: number;
    isLoading: boolean;
  }>({ exists: false, isLoading: true });

  // ? R�cup�rer jobDetails du context pour avoir les donn�es fra�ches
  // NOTE: L'endpoint /job/:code/full attend un CODE (JOB-XXX), pas un ID num�rique
  const jobCode = job?.code || job?.job?.code;
  const { jobDetails } = useJobDetails(jobCode);

  // ? V�rifier la signature sur le serveur au montage
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

  // ? SYNC: Synchroniser job state avec jobDetails.job (notamment signature_blob)
  useEffect(() => {
    if (jobDetails?.job) {
      //     hasSignatureInContext: !!jobDetails.job.signature_blob,
      //     hasSignatureInState: !!job.signature_blob,
      //     signatureDate: jobDetails.job.signature_date
      // });

      // Merge pour garder modifications locales + ajouter donn�es backend
      // ?? L'API /full retourne le client dans jobDetails.client (sibling), PAS dans jobDetails.job
      setJob((prev: any) => ({
        ...prev,
        ...jobDetails.job,
        // Pr�server les donn�es client embarqu�es (non retourn�es dans jobDetails.job)
        client: prev?.client,
        // Pr�server certains champs locaux si n�cessaire
        signatureDataUrl:
          prev.signatureDataUrl || jobDetails.job.signature_blob,
      }));
    }
  }, [
    jobDetails?.job?.id,
    jobDetails?.job?.signature_blob,
    jobDetails?.job?.signature_date,
  ]);

  // Charger les items additionnels depuis le job au premier montage
  useEffect(() => {
    if (itemsLoadedRef.current) return;
    const rawItems = job?.additional_items || job?.job?.additional_items;
    if (rawItems) {
      try {
        const parsed =
          typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
        if (Array.isArray(parsed)) setAdditionalItems(parsed);
      } catch {}
    }
    itemsLoadedRef.current = true;
  }, []);

  // Synchroniser le hook de statut de paiement avec les donn�es du job
  useEffect(() => {
    paymentStatusHook.syncFromJob(job);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.deposit_status, job?.deposit_paid, job?.payment_status]);

  // Persister les items au backend avec un debounce de 1.2s
  useEffect(() => {
    if (!itemsLoadedRef.current) return;
    const jobId = job?.id || job?.job?.id;
    if (!jobId) return;
    const timer = setTimeout(async () => {
      try {
        await updateJob(String(jobId), {
          additional_items: JSON.stringify(additionalItems),
        });
      } catch {}
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalItems]);

  // ? Utiliser le context du timer pour les calculs en temps r�el
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

  // ? FIX: Forcer au moins 5 �tapes car l'�tape 5 = paiement (pas une �tape de travail)
  // Si le template n'a que 4 steps, on consid�re step 4 comme la fin du travail
  // et le paiement est accessible d�s step 4
  const totalSteps = Math.max(4, contextTotalSteps);

  // Calculer le co�t en temps r�el
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
    // Si d�j� pay� via Stripe, statut = completed (priorit� absolue)
    if (isPaid) {
      return "completed";
    }

    // Sinon, d�terminer selon le co�t actuel
    if (actualCost === 0) {
      return "pending";
    }

    // Co�t calcul� mais pas encore pay� ? toujours 'pending'
    // (peu importe si actualCost >= estimatedCost, le statut reste 'pending' tant que isPaid = false)
    return "pending";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  // ===== Handlers Acompte =====
  const handleCreateDepositLink = async () => {
    const amount = parseFloat(depositInputAmount);
    if (!amount || amount <= 0) {
      Alert.alert(
        t("common.error"),
        t("jobDetails.payment.deposit.invalidAmount") || "Montant invalide",
      );
      return;
    }
    const jobId = job?.id || job?.job?.id;
    setIsCreatingDepositLink(true);
    try {
      const link = await createStripePaymentLink({
        amount: Math.round(amount * 100),
        currency: "aud",
        description: `Acompte � ${job?.code || job?.job?.code || jobId}`,
        customer_email: job?.client?.email || job?.job?.client?.email,
        metadata: { job_id: String(jobId), type: "deposit" },
      });
      await updateJob(String(jobId), {
        deposit_payment_link_url: link.url,
        deposit_payment_link_id: link.id,
        deposit_status: "link_sent",
        deposit_amount: Math.round(amount),
        deposit_required: true,
      });
      setJob((prev: any) => ({
        ...prev,
        deposit_payment_link_url: link.url,
        deposit_payment_link_id: link.id,
        deposit_status: "link_sent",
        deposit_amount: Math.round(amount),
      }));
      paymentStatusHook.syncFromJob({
        deposit_status: "link_sent",
        deposit_payment_link_url: link.url,
      });
    } catch {
      Alert.alert("Erreur", "Impossible de cr�er le lien de paiement.");
    } finally {
      setIsCreatingDepositLink(false);
    }
  };

  const handleShareDepositLink = async () => {
    const url = paymentStatusHook.depositLinkUrl;
    if (!url) return;
    await Share.share({ message: url, url });
  };

  const handleDeactivateDepositLink = () => {
    Alert.alert(
      t("jobDetails.payment.deposit.deactivateConfirm") ||
        "D�sactiver le lien ?",
      t("jobDetails.payment.deposit.deactivateConfirmMessage") ||
        "Le client ne pourra plus acc�der au lien de paiement.",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text:
            t("jobDetails.payment.deposit.deactivateAction") || "D�sactiver",
          style: "destructive",
          onPress: async () => {
            const linkId = paymentStatusHook.depositLinkId;
            if (linkId) {
              try {
                await deactivateStripePaymentLink(linkId);
                setJob((p: any) => ({
                  ...p,
                  deposit_status: "none",
                  deposit_payment_link_url: null,
                }));
                paymentStatusHook.syncFromJob({ deposit_status: "none" });
              } catch {}
            }
          },
        },
      ],
    );
  };

  // Fonctions pour g�rer les �l�ments additionnels
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

  // ? V�rifier si le job est termin� (currentStep = totalSteps) - OPTIMIZED WITH useMemo
  // ? FIX 2: Extract status values BEFORE useMemo to stabilize dependencies
  const jobStatus = job?.status;
  const jobJobStatus = job?.job?.status;

  const isJobCompleted = useMemo(() => {
    // ? FIX: Job compl�t� si on a atteint au moins l'�tape 4
    // (car �tape 5 = paiement, pas une �tape de travail)
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

  // ? V�rifier si le client a sign� (serveur OU local OU API) - UTILISER useMemo pour �viter boucle infinie
  const hasSignature = useMemo(() => {
    const result = !!(
      signatureFromServer.exists || // ? PRIORIT�: V�rification serveur
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

  // Log uniquement quand la valeur change (pas � chaque render)
  useEffect(() => {
    //     signatureFromServer: signatureFromServer.exists,
    //     signatureDataUrl: !!job?.signatureDataUrl,
    //     signatureFileUri: !!job?.signatureFileUri,
    //     signatureBlob: !!job?.signature_blob,
    //     jobSignatureBlob: !!job?.job?.signature_blob,
    //     result: hasSignature
    // });
  }, [hasSignature]);

  // ? Handler pour le bouton de signature
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

    // ? Guard Stripe : bloquer si le compte Stripe n'est pas actif
    if (stripeAccountStatus === "inactive") {
      Alert.alert(
        t("stripeGate.title"),
        t("stripeGate.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("stripeGate.cta"),
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

  // ? Handler pour envoyer la facture au client (quand d�j� pay�)
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
      console.error("? [Payment] Error sending invoice:", error);
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
      {/* Modal de signature */}
      {isSigningVisible && (
        <SigningBloc
          isVisible={isSigningVisible}
          setIsVisible={setIsSigningVisible}
          onSave={(_signature: any) => {}}
          job={job}
          setJob={setJob}
        />
      )}

      <ScrollView
        testID="job-payment-scroll"
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
      >
        {/* Banner Stripe inactif */}
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

        {/* ===== 1. HERO CARD ===== */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Ligne statut + badge variation */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View
              style={{
                backgroundColor: statusInfo.bgColor,
                borderRadius: DESIGN_TOKENS.radius.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                paddingVertical: 4,
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
            {paymentInfo.current !== paymentInfo.estimated &&
              paymentInfo.estimated > 0 && (
                <View
                  style={{
                    backgroundColor:
                      paymentInfo.current > paymentInfo.estimated
                        ? colors.warning + "20"
                        : colors.success + "20",
                    borderRadius: DESIGN_TOKENS.radius.md,
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: 3,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name={
                      paymentInfo.current > paymentInfo.estimated
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                    color={
                      paymentInfo.current > paymentInfo.estimated
                        ? colors.warning
                        : colors.success
                    }
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        paymentInfo.current > paymentInfo.estimated
                          ? colors.warning
                          : colors.success,
                    }}
                  >
                    {formatCurrency(
                      Math.abs(paymentInfo.current - paymentInfo.estimated),
                    )}
                    {paymentInfo.current > paymentInfo.estimated
                      ? " au-dessus"
                      : " en dessous"}
                  </Text>
                </View>
              )}
          </View>

          {/* Montant total */}
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            {t("jobDetails.payment.billingBreakdown.finalAmount")}
          </Text>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "800",
              color: colors.primary,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {formatCurrency(paymentInfo.current + additionalItemsTotal)}
          </Text>

          {/* CTA principal � visible uniquement si job termin� */}
          {isJobCompleted && (
            <>
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
                <Pressable
                  onPress={handleOpenSignature}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.primary + "DD"
                      : colors.primary,
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
                <Pressable
                  onPress={handleSendInvoice}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.primary + "DD"
                      : colors.primary,
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
                <Pressable
                  onPress={handlePayment}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.successLight
                      : colors.success,
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

              {/* Indicateurs sous le CTA */}
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
            </>
          )}
        </View>

        {/* ===== 2. SECTION ACOMPTE ===== */}
        {!paymentInfo.isPaid && (
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {/* En-t�te */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.info + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="link" size={18} color={colors.info} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.text,
                  flex: 1,
                }}
              >
                {t("jobDetails.payment.deposit.title") || "Acompte"}
              </Text>
              {paymentStatusHook.isPolling && (
                <ActivityIndicator size="small" color={colors.info} />
              )}
            </View>

            {/* Contenu selon statut */}
            {paymentStatusHook.depositStatus === "paid" ? (
              // Acompte re�u
              <View
                style={{
                  backgroundColor: colors.success + "15",
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DESIGN_TOKENS.spacing.sm,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.success,
                    }}
                  >
                    {t("jobDetails.payment.deposit.statusPaid") ||
                      "Acompte re�u ?"}
                  </Text>
                </View>
                {(paymentStatusHook.depositAmount ?? 0) > 0 && (
                  <>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {t("jobDetails.payment.deposit.depositOf") ||
                        "Acompte de"}{" "}
                      {formatCurrency(paymentStatusHook.depositAmount ?? 0)}
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: colors.textSecondary }}
                    >
                      {t("jobDetails.payment.deposit.remainingBalance") ||
                        "Reste � percevoir"}{" "}
                      {formatCurrency(
                        Math.max(
                          0,
                          paymentInfo.current +
                            additionalItemsTotal -
                            (paymentStatusHook.depositAmount ?? 0),
                        ),
                      )}
                    </Text>
                  </>
                )}
              </View>
            ) : paymentStatusHook.depositLinkUrl ? (
              // Lien existant � statut envoy� ou pending
              <View>
                <View
                  style={{
                    backgroundColor: colors.info + "15",
                    borderRadius: DESIGN_TOKENS.radius.md,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.info}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.info,
                        fontWeight: "600",
                        flex: 1,
                      }}
                    >
                      {paymentStatusHook.depositStatus === "pending"
                        ? t("jobDetails.payment.deposit.statusPending") ||
                          "Paiement en cours..."
                        : t("jobDetails.payment.deposit.statusSent") ||
                          "Lien envoy� � En attente du client"}
                    </Text>
                  </View>
                  {paymentStatusHook.lastChecked && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {t("jobDetails.payment.deposit.lastChecked") ||
                        "V�rifi�"}{" "}
                      {paymentStatusHook.lastChecked.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Pressable
                    onPress={handleShareDepositLink}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: pressed
                        ? colors.info + "30"
                        : colors.info + "20",
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    })}
                  >
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={colors.info}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.info,
                        fontWeight: "600",
                      }}
                    >
                      {t("jobDetails.payment.deposit.shareLink") || "Partager"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={paymentStatusHook.refresh}
                    style={({ pressed }) => ({
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      backgroundColor: pressed
                        ? colors.border
                        : colors.backgroundTertiary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    {paymentStatusHook.isRefreshing ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.textSecondary}
                      />
                    ) : (
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleDeactivateDepositLink}
                    style={({ pressed }) => ({
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      backgroundColor: pressed
                        ? colors.error + "30"
                        : colors.error + "15",
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color={colors.error}
                    />
                  </Pressable>
                </View>
              </View>
            ) : (
              // Formulaire de cr�ation du lien
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  {t("jobDetails.payment.deposit.amountLabel") ||
                    "Montant de l'acompte (AUD)"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: colors.background,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      fontSize: 16,
                      color: colors.text,
                    }}
                    placeholder={
                      t("jobDetails.payment.deposit.amountPlaceholder") ||
                      "0.00"
                    }
                    placeholderTextColor={colors.textSecondary}
                    value={depositInputAmount}
                    onChangeText={setDepositInputAmount}
                    keyboardType="decimal-pad"
                  />
                  <Pressable
                    onPress={handleCreateDepositLink}
                    disabled={isCreatingDepositLink}
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? colors.info + "CC"
                        : colors.info,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      justifyContent: "center",
                      alignItems: "center",
                      minWidth: 110,
                    })}
                  >
                    {isCreatingDepositLink ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {t("jobDetails.payment.deposit.createLink") ||
                          "Cr�er le lien"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ===== 3. ITEMS ADDITIONNELS (toujours visible) ===== */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: DESIGN_TOKENS.spacing.md,
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
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {t("jobDetails.payment.additionalItems.title") ||
                  "�l�ments additionnels"}
              </Text>
            </View>
            <Pressable
              onPress={() => setIsAddItemModalVisible(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: pressed
                  ? colors.primary + "DD"
                  : colors.primary,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.xs,
                borderRadius: DESIGN_TOKENS.radius.md,
                gap: DESIGN_TOKENS.spacing.xs,
              })}
            >
              <Ionicons name="add" size={16} color={colors.buttonPrimaryText} />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.buttonPrimaryText,
                  fontWeight: "600",
                }}
              >
                {t("jobDetails.payment.additionalItems.addItem") || "Ajouter"}
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
                    "Sous-total"}
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
                "Aucun �l�ment additionnel"}
            </Text>
          )}
        </View>

        {/* ===== 4. D�TAIL DE FACTURATION (collapsible) ===== */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={() => setIsBillingExpanded((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: DESIGN_TOKENS.spacing.sm,
              padding: DESIGN_TOKENS.spacing.lg,
              backgroundColor: pressed
                ? colors.backgroundTertiary + "30"
                : "transparent",
            })}
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
                fontSize: 17,
                fontWeight: "700",
                color: colors.text,
                flex: 1,
              }}
            >
              {t("jobDetails.payment.billingBreakdown.title")}
            </Text>
            <Ionicons
              name={isBillingExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          {isBillingExpanded && (
            <View
              style={{
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingBottom: DESIGN_TOKENS.spacing.lg,
                gap: DESIGN_TOKENS.spacing.md,
              }}
            >
              {/* Temps de travail r�el */}
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
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {formatTime(paymentInfo.totalTime)}
                </Text>
              </View>

              {/* Pauses */}
              {paymentInfo.totalTime > paymentInfo.actualTime && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: colors.textSecondary }}
                  >
                    {t(
                      "jobDetails.payment.billingBreakdown.pausesNotBillable",
                    )}
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

              <View style={{ height: 1, backgroundColor: colors.border }} />

              {/* Temps facturable brut */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {t(
                    "jobDetails.payment.billingBreakdown.grossBillableTime",
                  )}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {formatTime(paymentInfo.actualTime)}
                </Text>
              </View>

              {/* Arrondi (r�gle 7min) */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {t(
                      "jobDetails.payment.billingBreakdown.halfHourRounding",
                    )}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.textSecondary }}
                  >
                    {t(
                      "jobDetails.payment.billingBreakdown.sevenMinuteRule",
                    )}
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

              <View style={{ height: 2, backgroundColor: colors.border }} />

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
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    fontWeight: "700",
                  }}
                >
                  {t(
                    "jobDetails.payment.billingBreakdown.totalBillableHours",
                  )}
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
                <Text
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  {t("jobDetails.payment.billingBreakdown.hourlyRate")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {formatCurrency(HOURLY_RATE_AUD)}/h
                </Text>
              </View>

              <View
                style={{
                  height: 3,
                  backgroundColor: colors.primary + "30",
                  marginVertical: DESIGN_TOKENS.spacing.xs,
                }}
              />

              {/* Montant final */}
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
                  style={{
                    fontSize: 17,
                    color: colors.text,
                    fontWeight: "700",
                  }}
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
            </View>
          )}
        </View>

        {/* ===== 5. SIGNALER UN PROBL�ME ===== */}
        <Pressable
          onPress={() => setIsReportIssueVisible(true)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: DESIGN_TOKENS.spacing.sm,
            backgroundColor: pressed
              ? colors.warning + "30"
              : colors.warning + "15",
            borderWidth: 1,
            borderColor: colors.warning + "40",
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          })}
        >
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.warning}
          />
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}
          >
            {t("jobDetails.payment.reportIssue.button")}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal ajouter un �l�ment */}
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
                "Ajouter un �l�ment"}
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
                ) || "ex: Mat�riaux suppl�mentaires"
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
                  {t("common.cancel") || "Annuler"}
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
                  {t("common.add") || "Ajouter"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal signaler un probl�me de paiement */}
      <ReportPaymentIssueModal
        visible={isReportIssueVisible}
        onClose={() => setIsReportIssueVisible(false)}
        jobId={job?.id || job?.job?.id || 0}
      />
    </>
  );
};

export default PaymentScreen;

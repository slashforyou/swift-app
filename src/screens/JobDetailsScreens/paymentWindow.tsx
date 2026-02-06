/**
 * PaymentWindow - Interface de paiement moderne avec temps réel
 * ✅ Intégré au JobTimerContext pour calculs en temps réel
 * ✅ Intégration Stripe Elements pour vrais paiements
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { initStripe, useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STRIPE_PUBLISHABLE_KEY } from "../../config/environment";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useJobTimerContext } from "../../context/JobTimerProvider";
import { useTheme } from "../../context/ThemeProvider";
import { useInvoice } from "../../hooks/useInvoice";
import { useJobPayment } from "../../hooks/useJobPayment";
import { useTranslation } from "../../localization/useLocalization";
import {
    trackPaymentFunnelStep,
    trackPaymentMethodSelected,
} from "../../services/stripeAnalytics";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface PaymentWindowProps {
  job: any;
  setJob: (job: any) => void;
  visibleCondition: string | null;
  setVisibleCondition: React.Dispatch<React.SetStateAction<string | null>>;
}

interface PaymentState {
  step: "method" | "cash" | "processing" | "success";
  selectedMethod: "card" | "cash" | null;
  cashAmount: string;
  isProcessing: boolean;
  // ✅ Données Payment Intent Stripe
  paymentIntentId: string | null;
  clientSecret: string | null;
}

const PaymentWindow: React.FC<PaymentWindowProps> = ({
  job,
  setJob,
  visibleCondition,
  setVisibleCondition,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isVisible = visibleCondition === "paymentWindow";

  // Note: usePaymentSheet désactivé temporairement (incompatible avec Expo managed)
  // const { initPaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();

  // ✅ Hooks pour paiement et facturation
  const jobPayment = useJobPayment();
  const { sendInvoiceWithConfirmation } = useInvoice();

  // ✅ Utiliser le timer context pour les calculs en temps réel
  const { billableTime, calculateCost, formatTime, HOURLY_RATE_AUD } =
    useJobTimerContext();

  // ✅ Calculer le montant à payer en temps réel basé sur le billableTime
  const getPaymentAmount = () => {
    // Utiliser le coût calculé en temps réel
    const costData = calculateCost(billableTime);
    const realTimeCost = costData.total;

    // Fallback sur les données du job si le timer n'a pas encore démarré
    const jobData = job?.job || job;
    const estimatedCost = jobData?.estimatedCost || jobData?.actualCost || 0;

    // Retourner le coût temps réel s'il est supérieur à 0, sinon l'estimé
    return realTimeCost > 0 ? realTimeCost : estimatedCost;
  };

  // ✅ Changer EUR → AUD pour correspondre au taux horaire
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const paymentAmount = getPaymentAmount();
  const costData = calculateCost(billableTime);

  // ✅ Hook Stripe PaymentSheet
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Payment state
  const [state, setState] = useState<PaymentState>({
    step: "method",
    selectedMethod: null,
    cashAmount: "",
    isProcessing: false,
    paymentIntentId: null,
    clientSecret: null,
  });

  // Animations
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // 📊 Track payment window view
      const jobId = job?.id || job?.job?.id;
      if (jobId) {
        trackPaymentFunnelStep("view_payment", jobId);
      }

      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const updateState = (updates: Partial<PaymentState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    // ✅ Reset du hook de paiement
    jobPayment.reset();
    setVisibleCondition(null);
  };

  const handleMethodSelect = (method: "card" | "cash") => {
    // 📊 Track payment method selection
    const jobId = job?.id || job?.job?.id;
    if (jobId) {
      trackPaymentMethodSelected(method, jobId);
      trackPaymentFunnelStep("select_method", jobId, method);
    }

    updateState({ selectedMethod: method, step: method });
  };

  // ✅ Déclencheur du PaymentSheet Stripe
  const handlePaymentSheet = async () => {
    // PaymentSheet ouvre un modal natif avec le formulaire de carte
    await handleCardPayment();
  };

  const handleCardPayment = async () => {
    console.log("🎯 [PaymentSheet] Starting payment process...");

    updateState({ isProcessing: true, step: "processing" });

    try {
      // ✅ 1. Extraire le jobId
      const jobData = job?.job || job;
      const jobId = jobData?.id;
      console.log(`🔍 [PaymentSheet] Extracted jobId: ${jobId}`);

      if (!jobId) {
        throw new Error(t("payment.errors.jobIdNotFound"));
      }

      console.log(
        `💳 [PaymentSheet] Creating Payment Intent for job ${jobId}, amount: ${paymentAmount} AUD`,
      );

      // ✅ 2. Créer le PaymentIntent côté backend
      // ⚠️ NE PAS multiplier par 100 - le backend le fait déjà
      const paymentIntent = await jobPayment.createPayment(jobId, {
        amount: Math.round(paymentAmount), // Backend convertit en centimes
        currency: "AUD",
        description: `Paiement job ${job?.title || jobId}`,
      });

      console.log(
        `✅ [PaymentSheet] Payment Intent created: ${paymentIntent.payment_intent_id}`,
      );
      console.log(
        `🔑 [PaymentSheet] Client Secret received: ${paymentIntent.client_secret?.substring(0, 30)}...`,
      );

      // ✅ 2.5. CRITIQUE - Réinitialiser Stripe avec le Connected Account
      if (paymentIntent.stripe_account_id) {
        console.log(
          `🔗 [PaymentSheet] Connected Account detected: ${paymentIntent.stripe_account_id}`,
        );
        console.log(
          "🔄 [PaymentSheet] Reinitializing Stripe SDK with Connected Account...",
        );

        await initStripe({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          stripeAccountId: paymentIntent.stripe_account_id, // ← OBLIGATOIRE pour Stripe Connect
        });

        console.log(
          "✅ [PaymentSheet] Stripe SDK reinitialized with Connected Account",
        );
      } else {
        console.warn(
          "⚠️ [PaymentSheet] No stripe_account_id in response - using platform account",
        );
      }

      // ✅ 3. Initialiser le PaymentSheet
      console.log("💳 [PaymentSheet] Initializing PaymentSheet...");
      console.log(
        "🔑 [PaymentSheet] Using client_secret:",
        paymentIntent.client_secret?.substring(0, 30) + "...",
      );

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.client_secret,
        merchantDisplayName: "Swift App",
        appearance: {
          colors: {
            primary: colors.primary,
            background: colors.background,
            componentBackground: colors.backgroundSecondary,
            componentBorder: colors.border,
            componentDivider: colors.border,
            primaryText: colors.text,
            secondaryText: colors.textSecondary,
            componentText: colors.text,
            placeholderText: colors.textSecondary,
          },
        },
        defaultBillingDetails: {
          name: "",
        },
      });

      if (initError) {
        console.error("❌ [PaymentSheet] Initialization failed:", initError);
        throw new Error(initError.message);
      }

      console.log("✅ [PaymentSheet] Initialized successfully");

      // ✅ 4. Présenter le PaymentSheet (modal natif)
      console.log("💳 [PaymentSheet] Presenting PaymentSheet...");
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // L'utilisateur a annulé ou erreur
        if (presentError.code === "Canceled") {
          console.log("⚠️ [PaymentSheet] User canceled payment");
          updateState({ isProcessing: false, step: "method" });
          return;
        }
        console.error("❌ [PaymentSheet] Presentation failed:", presentError);
        throw new Error(presentError.message);
      }

      console.log("✅ [PaymentSheet] Payment confirmed by user!");

      // ✅ 5. Confirmer le paiement côté backend
      console.log(
        `💳 [PaymentSheet] Confirming payment in backend: ${paymentIntent.payment_intent_id}`,
      );

      const confirmResult = await jobPayment.confirmPayment(
        jobId,
        paymentIntent.payment_intent_id,
        "succeeded", // PaymentSheet garantit que le paiement a réussi
      );

      console.log(
        `✅ [PaymentSheet] Payment confirmed successfully!`,
        confirmResult,
      );

      // ✅ 6. Mettre à jour le job avec les nouvelles données
      // Merger avec les données existantes pour éviter de perdre client/addresses
      if (confirmResult.job) {
        setJob((prevJob: any) => ({
          ...prevJob,
          ...confirmResult.job,
          // Préserver les données imbriquées si elles existent
          client: prevJob?.client || confirmResult.job.client,
          addresses: prevJob?.addresses || confirmResult.job.addresses,
        }));
      }

      // ✅ 7. Envoyer automatiquement la facture par email
      try {
        const jobData = job?.job || job;
        if (jobData?.client?.email) {
          console.log("📧 [PaymentSheet] Sending invoice to client...");
          await sendInvoiceWithConfirmation(jobData, t);
          console.log("✅ [PaymentSheet] Invoice sent successfully");
        } else {
          console.warn(
            "⚠️ [PaymentSheet] No client email found, skipping invoice",
          );
        }
      } catch (invoiceError) {
        console.error(
          "❌ [PaymentSheet] Failed to send invoice:",
          invoiceError,
        );
        // Ne pas bloquer le succès du paiement si l'envoi de facture échoue
      }

      updateState({ step: "success" });

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("❌ [PaymentSheet] Payment failed:", error);

      Alert.alert(
        t("payment.errors.paymentError"),
        error instanceof Error
          ? error.message
          : t("payment.errors.processingFailed"),
      );
      updateState({ isProcessing: false, step: "method" });
    }
  };

  const handleCashPayment = async () => {
    const cashValue = parseFloat(state.cashAmount);
    if (!cashValue || cashValue < paymentAmount) {
      Alert.alert(
        t("payment.window.incorrectAmount"),
        t("payment.window.incorrectAmountMessage", {
          amount: formatCurrency(paymentAmount),
        }),
      );
      return;
    }

    updateState({ isProcessing: true, step: "processing" });

    try {
      console.log("💰 [PaymentWindow] Starting REAL cash payment process...");
      console.log(
        "🔍 [PaymentWindow DEBUG CASH] job prop:",
        JSON.stringify(
          {
            hasJob: !!job,
            hasJobJob: !!job?.job,
            jobId: job?.id,
            jobJobId: job?.job?.id,
            jobCode: job?.code,
            jobJobCode: job?.job?.code,
          },
          null,
          2,
        ),
      );

      // ✅ SESSION 10 FIX: Utiliser le vrai ID numérique, pas le code
      const jobData = job?.job || job;
      const jobId = jobData?.id; // ID numérique (ex: 29)
      console.log(
        `🔍 [PaymentWindow CASH] Extracted jobId: ${jobId} (type: ${typeof jobId})`,
      );

      if (!jobId) {
        throw new Error("ID du job non trouvé");
      }

      console.log(
        `💰 [PaymentWindow] Creating Payment Intent for cash payment, job ${jobId}`,
      );

      // ⚠️ NE PAS multiplier par 100 - le backend le fait déjà
      const paymentIntent = await jobPayment.createPayment(jobId, {
        amount: Math.round(paymentAmount), // Backend convertit en centimes
        currency: "AUD",
        description: `Paiement cash job ${job?.title || jobId}`,
      });

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Payment Intent created for cash: ${paymentIntent.payment_intent_id}`);

      // Simuler le traitement cash (instantané)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // ✅ 2. Confirmer le paiement cash côté backend
      // TEMP_DISABLED: console.log(`💰 [PaymentWindow] Confirming cash payment: ${paymentIntent.payment_intent_id}`);

      const confirmResult = await jobPayment.confirmPayment(
        jobId,
        paymentIntent.payment_intent_id,
        "succeeded",
      );

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Cash payment confirmed!`, confirmResult);

      // ✅ 3. Mettre à jour le job
      setJob(confirmResult.job);

      // ✅ 4. Envoyer automatiquement la facture par email
      try {
        const jobData = job?.job || job;
        if (jobData?.client?.email) {
          console.log("📧 [PaymentWindow] Sending invoice to client...");
          await sendInvoiceWithConfirmation(jobData, t);
          console.log("✅ [PaymentWindow] Invoice sent successfully");
        } else {
          console.warn(
            "⚠️ [PaymentWindow] No client email found, skipping invoice",
          );
        }
      } catch (invoiceError) {
        console.error(
          "❌ [PaymentWindow] Failed to send invoice:",
          invoiceError,
        );
        // Ne pas bloquer le succès du paiement si l'envoi de facture échoue
      }

      updateState({ step: "success" });

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("❌ [PaymentWindow] REAL cash payment failed:", error);

      Alert.alert(
        t("payment.errors.generic"),
        error instanceof Error
          ? error.message
          : t("payment.errors.processingFailed"),
      );
      updateState({ isProcessing: false, step: "cash" });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // ✅ Vérifier si le job est déjà payé
  const isJobPaid = () => {
    const jobData = job?.job || job;
    return jobData?.payment_status === "paid";
  };

  // ✅ Vue pour job déjà payé
  const renderAlreadyPaid = () => (
    <View
      style={{
        flex: 1,
        padding: DESIGN_TOKENS.spacing.lg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.success + "20",
          borderRadius: DESIGN_TOKENS.radius.xl,
          padding: DESIGN_TOKENS.spacing.xl,
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.xl,
        }}
      >
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
            marginTop: DESIGN_TOKENS.spacing.md,
            textAlign: "center",
          }}
        >
          {t("payment.window.paymentConfirmed")}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            marginTop: DESIGN_TOKENS.spacing.xs,
            textAlign: "center",
          }}
        >
          {t("payment.window.alreadyPaid")}
        </Text>
      </View>

      {/* Bouton Envoyer la facture */}
      <Pressable
        onPress={async () => {
          try {
            const jobData = job?.job || job;
            await sendInvoiceWithConfirmation(jobData, t);
          } catch (error) {
            console.error("❌ [PaymentWindow] Error sending invoice:", error);
          }
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.tint + "DD" : colors.tint,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: DESIGN_TOKENS.spacing.xs,
          width: "100%",
        })}
      >
        <Ionicons name="mail" size={20} color={colors.background} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.background,
          }}
        >
          {t("payment.window.sendInvoice")}
        </Text>
      </Pressable>

      {/* Bouton Fermer */}
      <Pressable
        onPress={handleClose}
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? colors.backgroundTertiary
            : colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.md,
          alignItems: "center",
          marginTop: DESIGN_TOKENS.spacing.md,
          width: "100%",
        })}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {t("common.close") || "Fermer"}
        </Text>
      </Pressable>
    </View>
  );

  const renderMethodSelection = () => (
    <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        {t("payment.window.chooseMethod")}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {t("payment.window.amountToPay")} {formatCurrency(paymentAmount)}
      </Text>

      {/* ✅ Affichage des erreurs de paiement */}
      {jobPayment.error && (
        <View
          style={{
            backgroundColor: colors.errorBanner,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderLeftWidth: 3,
            borderLeftColor: colors.error,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.error,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            {t("payment.window.paymentError")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.errorBannerText,
            }}
          >
            {jobPayment.error}
          </Text>
        </View>
      )}

      {/* ✅ Statut Payment Intent */}
      {state.paymentIntentId && (
        <View
          style={{
            backgroundColor: colors.tint + "10",
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderLeftWidth: 3,
            borderLeftColor: colors.tint,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            🔐 Payment Intent créé
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: colors.tint,
            }}
          >
            {state.paymentIntentId}
          </Text>
        </View>
      )}

      {/* ✅ Afficher le temps facturable */}
      {billableTime > 0 && (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            {t("jobs.timer.billableTime")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.tint,
            }}
          >
            {formatTime(billableTime)} • {costData.billableHours.toFixed(2)}h @{" "}
            {HOURLY_RATE_AUD} AUD/h
          </Text>
        </View>
      )}

      <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
        {/* ✅ Bouton de paiement par carte bancaire */}
        <Pressable
          onPress={handlePaymentSheet}
          disabled={state.isProcessing}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
            borderWidth: 2,
            borderColor: colors.tint,
            opacity: state.isProcessing ? 0.7 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: colors.tint,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Ionicons name="card" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {t("payment.window.cardManualTitle")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {t("payment.window.secureCardPayment")}
            </Text>
          </View>
          {state.isProcessing ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleMethodSelect("cash")}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <View
            style={{
              backgroundColor: colors.success,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Ionicons name="cash" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {t("payment.window.cashPayment")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {t("payment.window.cashPayment")}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );

  const renderCashForm = () => (
    <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        {t("payment.window.cashPaymentTitle")}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {t("payment.window.amountToPay")} {formatCurrency(paymentAmount)}
      </Text>

      {/* ✅ Afficher le détail du calcul */}
      {billableTime > 0 && (
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {t("jobDetails.payment.liveTracking.billableTime")}
            </Text>
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.text }}
            >
              {formatTime(billableTime)}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {t("jobDetails.payment.billingBreakdown.hourlyRate")}
            </Text>
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.text }}
            >
              {costData.billableHours.toFixed(2)}h × {HOURLY_RATE_AUD} AUD/h
            </Text>
          </View>
        </View>
      )}

      <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}
        >
          {t("payment.window.amountReceived")}
        </Text>
        <TextInput
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
            borderWidth: 2,
            borderColor: colors.border,
          }}
          placeholder={paymentAmount.toString()}
          placeholderTextColor={colors.textSecondary}
          value={state.cashAmount}
          onChangeText={(text) => updateState({ cashAmount: text })}
          keyboardType="numeric"
        />

        {parseFloat(state.cashAmount) > paymentAmount && (
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.success,
              textAlign: "center",
              marginTop: DESIGN_TOKENS.spacing.sm,
            }}
          >
            Rendu :{" "}
            {formatCurrency(parseFloat(state.cashAmount) - paymentAmount)}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}>
        <Pressable
          onPress={() => updateState({ step: "method" })}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            Retour
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCashPayment}
          disabled={
            !state.cashAmount ||
            parseFloat(state.cashAmount) < paymentAmount ||
            state.isProcessing
          }
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor:
              !state.cashAmount || parseFloat(state.cashAmount) < paymentAmount
                ? colors.backgroundTertiary
                : pressed
                  ? colors.successLight
                  : colors.success,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: DESIGN_TOKENS.spacing.xs,
            opacity:
              !state.cashAmount ||
              parseFloat(state.cashAmount) < paymentAmount ||
              state.isProcessing
                ? 0.5
                : 1,
          })}
        >
          {state.isProcessing && (
            <ActivityIndicator size="small" color={colors.background} />
          )}
          <Ionicons name="cash" size={18} color={colors.background} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.background,
            }}
          >
            {state.isProcessing
              ? t("payment.buttons.processing")
              : t("payment.buttons.confirm")}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <ActivityIndicator size="large" color={colors.tint} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginTop: DESIGN_TOKENS.spacing.lg,
          textAlign: "center",
        }}
      >
        {t("payment.window.processingPayment")}
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <View
        style={{
          backgroundColor: colors.success + "20",
          borderRadius: 50,
          padding: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <Ionicons name="checkmark" size={48} color={colors.success} />
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {t("payment.window.paymentSuccess")}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {t("payment.window.paymentSuccessMessage", {
          amount: formatCurrency(paymentAmount),
        })}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: backdropAnimation,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.85,
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
            borderTopRightRadius: DESIGN_TOKENS.radius.xl,
            transform: [{ translateY: slideAnimation }],
            paddingTop: insets.top,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: DESIGN_TOKENS.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              Paiement
            </Text>

            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.xs,
              })}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          {isJobPaid() ? (
            renderAlreadyPaid()
          ) : (
            <>
              {state.step === "method" && renderMethodSelection()}
              {state.step === "cash" && renderCashForm()}
              {state.step === "processing" && renderProcessing()}
              {state.step === "success" && renderSuccess()}
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PaymentWindow;

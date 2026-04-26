/**
 * StripePaymentsTab — Sous-tab "Paiements" de l'onglet Finances
 * 2 états : non configuré (setup CTA) / configuré (dashboard + actions rapides)
 * Partial refresh: sub-sections refresh independently with skeleton placeholders
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import {
    useStripeAccount,
    useStripePayments,
    useStripePayouts,
} from "../../hooks/useStripe";
import { useStripeConnection } from "../../hooks/useStripeConnection";
import { useTranslation } from "../../localization/useLocalization";

const mascotStripeImage = require("../../../assets/images/mascot/mascotte_stripe.png");

const STATUS_COLORS = {
  success: "#10B981",
  warning: "#F59E0B",
};

interface StripePaymentsTabProps {
  onNavigateStripeScreen: (screen: string) => void;
  mainNavigation?: any;
}

// Skeleton placeholder for partial loading
function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={{
      width: "48%",
      flexGrow: 1,
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.md,
      gap: 6,
    }}>
      <View style={{ width: "60%", height: 12, borderRadius: 4, backgroundColor: colors.border }} />
      <View style={{ width: "40%", height: 20, borderRadius: 4, backgroundColor: colors.border }} />
    </View>
  );
}

export default function StripePaymentsTab({
  onNavigateStripeScreen,
  mainNavigation,
}: StripePaymentsTabProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stripeConnection = useStripeConnection();
  const stripeAccount = useStripeAccount();
  const stripePayments = useStripePayments({ autoLoad: false });
  const stripePayouts = useStripePayouts({ autoLoad: false });

  const isConnected = stripeConnection.isConnected;
  const isActive = stripeConnection.status === "active" || stripeConnection.status === "pending";
  const isConnectionLoading = stripeConnection.loading;

  const accountId =
    stripeAccount.account?.stripe_account_id ||
    stripeAccount.account?.accountId;

  // Load payments/payouts only when connected and have an account ID
  React.useEffect(() => {
    if (isConnected && accountId) {
      stripePayments.refresh();
      stripePayouts.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, accountId]);

  const stats = useMemo(() => {
    const totalRevenue = stripePayments.payments.reduce(
      (sum, p) => (p.status === "succeeded" ? sum + p.amount : sum),
      0,
    );
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = stripePayments.payments
      .filter(
        (p) =>
          new Date(p.date).getMonth() === currentMonth &&
          p.status === "succeeded",
      )
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts = stripeAccount.balance?.pending || 0;
    const currency = stripeAccount.account?.default_currency || "AUD";
    return { totalRevenue, monthlyRevenue, pendingPayouts, currency };
  }, [stripePayments.payments, stripeAccount.balance, stripeAccount.account]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: stats.currency }).format(amount);

  const s = getStyles(colors);

  // Show loading only for connection check (not stats — those use skeletons)
  if (isConnectionLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── ÉTAT A : Non configuré ──
  if (!isConnected) {
    const requirements = stripeAccount.account?.requirements?.currently_due || [];
    return (
      <View style={s.setupContainer}>
        <Image source={mascotStripeImage} style={s.mascotImage} resizeMode="contain" />
        <Text style={[s.setupTitle, { color: colors.text }]}>{t("businessHub.stripe.setupTitle")}</Text>
        <Text style={[s.setupDesc, { color: colors.textSecondary }]}>
          {t("businessHub.stripe.setupDesc")}
        </Text>
        <TouchableOpacity
          style={[s.setupBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (mainNavigation) {
              mainNavigation.navigate("StripeOnboarding", { screen: "Welcome" });
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={s.setupBtnText}>{t("businessHub.stripe.setupCta")}</Text>
        </TouchableOpacity>
        {requirements.length > 0 && (
          <View style={{ marginTop: 16, gap: 6 }}>
            {requirements.slice(0, 3).map((req: string, i: number) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="alert-circle-outline" size={16} color={STATUS_COLORS.warning} />
                <Text style={[s.reqText, { color: colors.textSecondary }]}>{req}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  const isStatsLoading = stripePayments.loading || stripeAccount.loading;
  const connectionStatus = stripeConnection.status;

  // ── ÉTAT B : Configuré ──
  return (
    <View>
      {/* Banner: Onboarding incomplet → reprendre (seulement si wizard pas terminé) */}
      {connectionStatus === "incomplete" && (
        <View style={[s.resumeBanner, { backgroundColor: (colors as any).warningBackground ?? "#FEF3C7", borderColor: colors.warning ?? "#F59E0B" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="alert-circle" size={22} color={STATUS_COLORS.warning} />
            <Text style={[s.resumeTitle, { color: "#92400E" }]}>
              {t("businessHub.stripe.resumeTitle")}
            </Text>
          </View>
          <Text style={[s.resumeDesc, { color: "#78350F" }]}>
            {t("businessHub.stripe.resumeDesc")}
          </Text>
          <TouchableOpacity
            style={[s.resumeBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (mainNavigation) {
                mainNavigation.navigate("StripeOnboarding", { screen: "Welcome" });
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
            <Text style={s.resumeBtnText}>{t("businessHub.stripe.resumeCta")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner: Vérification en cours par Stripe */}
      {connectionStatus === "pending" && (
        <View style={[s.resumeBanner, { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="time-outline" size={22} color="#3B82F6" />
            <Text style={[s.resumeTitle, { color: "#1E40AF" }]}>
              {t("businessHub.stripe.pendingVerificationTitle")}
            </Text>
          </View>
          <Text style={[s.resumeDesc, { color: "#1E3A5F" }]}>
            {t("businessHub.stripe.pendingVerificationDesc")}
          </Text>
        </View>
      )}

      {/* Banner: Compte restreint */}
      {connectionStatus === "restricted" && (
        <View style={[s.resumeBanner, { backgroundColor: "#FEF2F2", borderColor: "#EF4444" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={22} color="#EF4444" />
            <Text style={[s.resumeTitle, { color: "#991B1B" }]}>
              {t("businessHub.stripe.restrictedTitle")}
            </Text>
          </View>
          <Text style={[s.resumeDesc, { color: "#7F1D1D" }]}>
            {t("businessHub.stripe.restrictedDesc")}
          </Text>
          <TouchableOpacity
            style={[s.resumeBtn, { backgroundColor: "#EF4444" }]}
            onPress={() => {
              if (mainNavigation) {
                mainNavigation.navigate("StripeOnboarding", { screen: "Documents" });
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={s.resumeBtnText}>{t("businessHub.stripe.restrictedFixDocs")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.resumeBtn, { backgroundColor: "#991B1B", marginTop: 8 }]}
            onPress={() => {
              if (mainNavigation) {
                mainNavigation.navigate("SupportNewConversation");
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            <Text style={s.resumeBtnText}>{t("businessHub.stripe.restrictedCta")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats dashboard - with skeleton loading */}
      <View style={s.statsGrid}>
        {isStatsLoading ? (
          <>
            <SkeletonCard colors={colors} />
            <SkeletonCard colors={colors} />
            <SkeletonCard colors={colors} />
            <SkeletonCard colors={colors} />
          </>
        ) : (
          <>
            <View style={[s.statsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[s.statsLabel, { color: colors.textSecondary }]}>{t("businessHub.stripe.totalRevenue")}</Text>
              <Text style={[s.statsValue, { color: colors.text }]}>{fmt(stats.totalRevenue)}</Text>
            </View>
            <View style={[s.statsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[s.statsLabel, { color: colors.textSecondary }]}>{t("businessHub.stripe.currentMonth")}</Text>
              <Text style={[s.statsValue, { color: colors.text }]}>{fmt(stats.monthlyRevenue)}</Text>
            </View>
            <View style={[s.statsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[s.statsLabel, { color: colors.textSecondary }]}>{t("businessHub.stripe.pendingBalance")}</Text>
              <Text style={[s.statsValue, { color: colors.text }]}>{fmt(stats.pendingPayouts)}</Text>
            </View>
            <View style={[s.statsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[s.statsLabel, { color: colors.textSecondary }]}>{t("businessHub.stripe.status")}</Text>
              <Text style={[s.statsValue, { color: isActive ? STATUS_COLORS.success : STATUS_COLORS.warning }]}>
                {isActive ? t("businessHub.stats.stripeActive") : t("businessHub.stats.stripeIncomplete")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Actions rapides */}
      <Text style={[s.actionsTitle, { color: colors.text }]}>{t("businessHub.stripe.quickActions")}</Text>
      <View style={s.actionsGrid}>
        <TouchableOpacity
          style={[s.actionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => onNavigateStripeScreen("PaymentsList")}
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={24} color={colors.primary} />
          <Text style={[s.actionLabel, { color: colors.text }]}>{t("businessHub.stripe.paymentsReceived")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => onNavigateStripeScreen("Payouts")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-down-circle-outline" size={24} color={colors.primary} />
          <Text style={[s.actionLabel, { color: colors.text }]}>{t("businessHub.stripe.payouts")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => onNavigateStripeScreen("StripeSettings")}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
          <Text style={[s.actionLabel, { color: colors.text }]}>{t("businessHub.stripe.settings")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    center: {
      flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60,
    },
    // Setup state
    setupContainer: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 24,
    },
    mascotImage: {
      width: 140,
      height: 140,
      marginBottom: 16,
    },
    setupTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    setupDesc: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    setupBtn: {
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: DESIGN_TOKENS.radius.lg,
    },
    setupBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    reqText: {
      fontSize: 13,
    },
    // Active state
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    statsCard: {
      width: "48%",
      flexGrow: 1,
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      gap: 4,
    },
    statsLabel: {
      fontSize: 12,
    },
    statsValue: {
      fontSize: 18,
      fontWeight: "700",
    },
    actionsTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    actionsGrid: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    actionCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      gap: 6,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
    // Resume onboarding banner
    resumeBanner: {
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    resumeTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    resumeDesc: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 12,
    },
    resumeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    resumeBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
  });

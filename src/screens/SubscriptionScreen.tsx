/**
 * SubscriptionScreen — Subscription paywall
 * Redesigned per Pricing_Screen.json — Coddy mascots, orange SaaS paywall.
 */
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useSubscription } from "../hooks/usePlans";
import { useTranslation } from "../localization";
import { analytics } from "../services/analytics";
import { Plan } from "../services/plansService";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// ── Design tokens (Pricing_Screen.json) ───────────────────────────────────────
const P_ORANGE    = "#FF6B00";
const P_ORANGE_BG = "#FFF3EA";
const P_BORDER    = "#E5E7EB";
const P_TEXT      = "#0B0F14";
const P_SUBTLE    = "#667085";

// ── Mascot / visual config per plan ───────────────────────────────────────────
interface PlanVisual {
  image: ReturnType<typeof require>;
  featured?: boolean;
  badge?: { text: string; style: "solid" | "outline" };
  hasTrial?: boolean;
}

const PLAN_VISUAL: Record<string, PlanVisual> = {
  // New plan IDs (JSON spec)
  invited_worker: {
    image: require("../../assets/images/pricing/free.png"),
  },
  abn_contractor: {
    image: require("../../assets/images/pricing/prestataire.png"),
    featured: true,
    badge: { text: "Most popular", style: "solid" },
    hasTrial: true,
  },
  pro: {
    image: require("../../assets/images/pricing/compagnie.png"),
    hasTrial: true,
  },
  company: {
    image: require("../../assets/images/pricing/enterprise.png"),
    badge: { text: "Best for growing companies", style: "outline" },
    hasTrial: true,
  },
  // Legacy plan IDs (backward-compat)
  free: {
    image: require("../../assets/images/pricing/free.png"),
  },
  expert: {
    image: require("../../assets/images/pricing/prestataire.png"),
    featured: true,
    badge: { text: "Most popular", style: "solid" },
    hasTrial: true,
  },
  unlimited: {
    image: require("../../assets/images/pricing/enterprise.png"),
    badge: { text: "Best for growing companies", style: "outline" },
    hasTrial: true,
  },
  enterprise: {
    image: require("../../assets/images/pricing/enterprise.png"),
    badge: { text: "Best for growing companies", style: "outline" },
    hasTrial: true,
  },
};

interface Props {
  navigation: NativeStackNavigationProp<Record<string, undefined>>;
}

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    plans,
    companyPlan,
    subscriptionStatus,
    isLoading,
    actionLoading,
    refresh,
    subscribe,
    cancel,
    resume,
    upgrade,
    selectPlan,
  } = useSubscription();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const currentPlanId = companyPlan?.plan?.id;
  const subStatus = subscriptionStatus?.subscription_status;
  const isCanceling = subStatus === "canceling";
  const isActive = subStatus === "active";

  const formatLimit = (value: number): string => {
    if (value === -1) return "Unlimited";
    return String(value);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // ── Subscription handlers (logic unchanged) ───────────────────────────────
  const handleSubscribe = async (planId: string) => {
    analytics.trackCustomEvent("subscription_start", "business", { plan_id: planId });
    setProcessingPlanId(planId);
    try {
      const selection = await selectPlan(planId);
      if (selection.requires_subscription) {
        const data = await subscribe(planId);
        if (data.is_trial || !data.clientSecret) {
          Alert.alert(
            "✓ Free trial activated",
            "Your 14-day free trial starts now. No payment will be charged before the end of the trial.",
          );
          await refresh();
          return;
        }
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: data.clientSecret,
          customerEphemeralKeySecret: data.ephemeralKey,
          customerId: data.customerId,
          merchantDisplayName: "Cobbr",
          appearance: {
            colors: {
              primary: P_ORANGE,
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
        });
        if (initError) { Alert.alert("Error", initError.message); return; }
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code === "Canceled") return;
          Alert.alert("Error", presentError.message);
          return;
        }
      }
      Alert.alert("✓", t("subscription.subscribeSuccess"));
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e.message || t("subscription.error"));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleSelectFreePlan = async () => {
    setProcessingPlanId("free");
    try {
      await selectPlan("free");
      Alert.alert("✓", t("subscription.planChanged"));
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e.message || t("subscription.error"));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    analytics.trackCustomEvent("subscription_upgrade", "business", {
      plan_id: planId,
      current_plan: currentPlanId,
    });
    setProcessingPlanId(planId);
    try {
      await upgrade(planId);
      Alert.alert("✓", t("subscription.changePlanSuccess"));
    } catch (e: any) {
      Alert.alert("Error", e.message || t("subscription.error"));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t("subscription.cancelConfirmTitle"),
      t("subscription.cancelConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("subscription.cancelConfirmButton"),
          style: "destructive",
          onPress: async () => {
            analytics.trackCustomEvent("subscription_cancel", "business", {
              current_plan: currentPlanId,
            });
            try {
              await cancel();
              Alert.alert("✓", t("subscription.cancelSuccess"));
            } catch (e: any) {
              Alert.alert("Error", e.message || t("subscription.error"));
            }
          },
        },
      ],
    );
  };

  const handleResume = async () => {
    analytics.trackCustomEvent("subscription_resume", "business", {
      current_plan: currentPlanId,
    });
    try {
      await resume();
      Alert.alert("✓", t("subscription.resumeSuccess"));
    } catch (e: any) {
      Alert.alert("Error", e.message || t("subscription.error"));
    }
  };

  const getActionForPlan = (plan: Plan) => {
    const isCurrent = plan.id === currentPlanId;
    const isPaid = plan.price_monthly > 0;
    const hasActiveSub = isActive || isCanceling;
    if (isCurrent) return null;
    if (!isPaid) {
      if (hasActiveSub) return null;
      return { label: t("subscription.selectPlan"), action: () => handleSelectFreePlan() };
    }
    if (!hasActiveSub) {
      return { label: t("subscription.subscribe"), action: () => handleSubscribe(plan.id) };
    }
    const currentPrice = companyPlan?.plan?.price_monthly || 0;
    const label =
      plan.price_monthly > currentPrice
        ? t("subscription.upgrade")
        : t("subscription.downgrade");
    return { label, action: () => handleChangePlan(plan.id) };
  };

  // ── Usage bar ─────────────────────────────────────────────────────────────
  const renderUsageBar = (current: number, max: number) => {
    const pct = max === -1 ? 0.1 : Math.min(current / max, 1);
    return (
      <View style={s.usageBar}>
        <View style={[
          s.usageBarFill,
          {
            width: `${Math.max(pct * 100, 2)}%`,
            backgroundColor: pct > 0.9 ? colors.error : pct > 0.7 ? colors.warning : P_ORANGE,
          },
        ]} />
      </View>
    );
  };

  // ── Plan card ─────────────────────────────────────────────────────────────
  const renderPlanCard = (plan: Plan) => {
    const isCurrent = plan.id === currentPlanId;
    const visual = PLAN_VISUAL[plan.id] ?? PLAN_VISUAL["free"];
    const isPaid = plan.price_monthly > 0;
    const planAction = getActionForPlan(plan);
    const isProcessing = processingPlanId === plan.id;

    // Build feature bullets from plan data
    const features: string[] = [];
    if (plan.included_users === 1) {
      features.push("1 user");
    } else if (plan.included_users > 1) {
      features.push(`Up to ${plan.included_users} users`);
    }
    if ((plan.max_jobs_created ?? 0) > 0) {
      features.push(
        `${plan.max_jobs_created === -1 ? "Unlimited" : plan.max_jobs_created} jobs / month`,
      );
    }
    if (plan.features?.branding) features.push("Invoice branding");
    if (plan.features?.priority_support) features.push("Priority support");
    if (features.length === 0) features.push("Basic access");

    return (
      <View
        key={plan.id}
        style={[
          s.card,
          visual.featured && s.cardFeatured,
          isCurrent && { borderColor: P_ORANGE, borderWidth: 2 },
        ]}
      >
        {/* Badge row */}
        {(visual.badge || isCurrent) && (
          <View style={s.badgeRow}>
            {visual.badge && !isCurrent ? (
              <View style={[s.badge, visual.badge.style === "solid" ? s.badgeSolid : s.badgeOutline]}>
                {visual.badge.style === "solid" && (
                  <Ionicons name="star" size={11} color="#fff" style={{ marginRight: 4 }} />
                )}
                <Text style={[s.badgeText, visual.badge.style === "solid" ? s.badgeTextSolid : s.badgeTextOutline]}>
                  {visual.badge.text}
                </Text>
              </View>
            ) : isCurrent ? (
              <View style={s.badgeCurrent}>
                <Ionicons name="checkmark-circle" size={12} color={P_ORANGE} style={{ marginRight: 4 }} />
                <Text style={s.badgeCurrentText}>Current plan</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Main body: mascot | content | price */}
        <View style={s.cardBody}>
          <Image source={visual.image} style={s.mascot} resizeMode="contain" />

          <View style={s.cardContent}>
            <View style={s.planNameRow}>
              <Text style={s.planName}>{plan.display_name}</Text>
              {isPaid && visual.hasTrial && (
                <View style={s.trialPill}>
                  <Text style={s.trialPillText}>14-day trial</Text>
                </View>
              )}
            </View>
            <View style={s.featureList}>
              {features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="checkmark" size={13} color={P_ORANGE} />
                  <Text style={s.featureText} numberOfLines={1}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.priceCol}>
            <Text style={s.priceAmount}>
              {plan.price_monthly === 0 ? "$0" : `$${plan.price_monthly}`}
            </Text>
            <Text style={s.pricePeriod}>
              {plan.price_monthly === 0 ? "Free" : "/mo"}
            </Text>
          </View>
        </View>

        {/* CTA button */}
        {planAction ? (
          <Pressable
            onPress={planAction.action}
            disabled={actionLoading || isProcessing}
            style={[
              s.ctaBtn,
              visual.featured ? s.ctaBtnPrimary : s.ctaBtnSecondary,
              (actionLoading || isProcessing) && { opacity: 0.6 },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={visual.featured ? "#fff" : P_ORANGE} />
            ) : (
              <Text style={[s.ctaBtnText, !visual.featured && s.ctaBtnTextSecondary]}>
                {isPaid && visual.hasTrial ? "Start free trial" : planAction.label}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={P_ORANGE} />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Nav header (back button only) */}
      <View style={[s.navHeader, { paddingTop: insets.top + 4 }]}>
        <Pressable
          onPress={() => {
            analytics.trackButtonPress("back_btn", "Subscription");
            navigation.goBack();
          }}
          hitSlop={DESIGN_TOKENS.touch.hitSlop}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={P_TEXT} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Paywall header */}
        <View style={s.paywallHeader}>
          <View style={[s.deco, s.decoTL]} />
          <View style={[s.deco, s.decoTR]} />
          <Text style={s.paywallTitle}>Choose your plan</Text>
          <Text style={s.paywallSubtitle}>Start free and grow with Cobbr</Text>
        </View>

        {/* Trial notice */}
        <View style={s.trialNotice}>
          <Ionicons name="shield-checkmark" size={17} color={P_ORANGE} style={{ marginRight: 7 }} />
          <Text style={s.trialNoticeText}>All paid plans include a 14-day free trial</Text>
        </View>

        {/* Usage section */}
        {companyPlan && (
          <View style={[s.usageCard, { marginHorizontal: 20, marginBottom: 24 }]}>
            <Text style={s.usageTitle}>Your usage</Text>
            <View style={{ marginBottom: 12 }}>
              <View style={s.usageRow}>
                <Text style={s.usageLabel}>Users</Text>
                <Text style={s.usageValue}>
                  {companyPlan.usage.current_users} / {formatLimit(companyPlan.plan.included_users)}
                </Text>
              </View>
              {renderUsageBar(companyPlan.usage.current_users, companyPlan.plan.included_users)}
            </View>
            <View>
              <View style={s.usageRow}>
                <Text style={s.usageLabel}>Jobs this month</Text>
                <Text style={s.usageValue}>
                  {companyPlan.usage.jobs_created_this_month} / {formatLimit(companyPlan.plan.max_jobs_created)}
                </Text>
              </View>
              {renderUsageBar(companyPlan.usage.jobs_created_this_month, companyPlan.plan.max_jobs_created)}
            </View>
          </View>
        )}

        {/* Subscription status / manage */}
        {subscriptionStatus?.subscription_id && (isActive || isCanceling) && (
          <View style={[
            s.subStatusCard,
            { marginHorizontal: 20, marginBottom: 24, borderColor: isCanceling ? colors.warning : colors.success },
          ]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons
                name={isCanceling ? "time-outline" : "checkmark-circle-outline"}
                size={18}
                color={isCanceling ? colors.warning : colors.success}
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontWeight: "700", color: isCanceling ? colors.warning : colors.success }}>
                {isCanceling
                  ? t("subscription.subscriptionCanceling")
                  : t("subscription.subscriptionActive")}
              </Text>
            </View>
            {isCanceling && subscriptionStatus.stripe_details?.current_period_end && (
              <Text style={{ color: P_SUBTLE, fontSize: 13, marginBottom: 12 }}>
                {t("subscription.subscriptionCancelingDetail", {
                  date: formatDate(subscriptionStatus.stripe_details.current_period_end),
                })}
              </Text>
            )}
            {isCanceling ? (
              <Pressable
                onPress={handleResume}
                disabled={actionLoading}
                style={[s.ctaBtn, s.ctaBtnPrimary, actionLoading && { opacity: 0.6 }]}
              >
                <Text style={s.ctaBtnText}>{t("subscription.resumeSubscription")}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleCancel}
                disabled={actionLoading}
                style={[s.ctaBtn, s.ctaBtnDanger, actionLoading && { opacity: 0.6 }]}
              >
                <Text style={[s.ctaBtnText, { color: colors.error }]}>
                  {t("subscription.cancelSubscription")}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Plan cards */}
        <View style={{ paddingHorizontal: 20 }}>
          {plans.map(renderPlanCard)}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Ionicons name="shield-outline" size={15} color={P_SUBTLE} style={{ marginRight: 6 }} />
          <Text style={s.footerText}>Cancel anytime</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  navHeader: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  // Paywall header
  paywallHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    overflow: "hidden",
  },
  paywallTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: P_TEXT,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  paywallSubtitle: {
    fontSize: 15,
    color: P_SUBTLE,
    textAlign: "center",
  },
  deco: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: P_ORANGE,
    opacity: 0.12,
    transform: [{ rotate: "20deg" }],
  },
  decoTL: { top: -14, left: 4 },
  decoTR: { top: -14, right: 4 },
  // Trial notice
  trialNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  trialNoticeText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  // Usage
  usageCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P_BORDER,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: P_TEXT,
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  usageLabel: { fontSize: 13, color: P_SUBTLE },
  usageValue: { fontSize: 13, fontWeight: "600", color: P_TEXT },
  usageBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: P_BORDER,
    overflow: "hidden",
    marginTop: 4,
  },
  usageBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Sub status
  subStatusCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  // Plan card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: P_BORDER,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  cardFeatured: {
    borderColor: P_ORANGE,
    borderWidth: 2,
    shadowColor: P_ORANGE,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSolid: { backgroundColor: P_ORANGE },
  badgeOutline: {
    backgroundColor: P_ORANGE_BG,
    borderWidth: 1,
    borderColor: P_ORANGE,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextSolid: { color: "#fff" },
  badgeTextOutline: { color: P_ORANGE },
  badgeCurrent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: P_ORANGE_BG,
    borderWidth: 1,
    borderColor: P_ORANGE,
  },
  badgeCurrentText: { fontSize: 11, fontWeight: "700", color: P_ORANGE },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mascot: {
    width: 88,
    height: 108,
  },
  cardContent: { flex: 1 },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: "800",
    color: P_TEXT,
  },
  trialPill: {
    backgroundColor: P_ORANGE_BG,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trialPillText: { fontSize: 10, fontWeight: "700", color: P_ORANGE },
  featureList: { gap: 5 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featureText: {
    fontSize: 12,
    color: P_TEXT,
    flex: 1,
  },
  priceCol: {
    alignItems: "flex-end",
    minWidth: 58,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: P_TEXT,
    lineHeight: 26,
  },
  pricePeriod: {
    fontSize: 11,
    color: P_SUBTLE,
    fontWeight: "500",
  },
  // CTA buttons
  ctaBtn: {
    marginTop: 16,
    borderRadius: 16,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnPrimary: { backgroundColor: P_ORANGE },
  ctaBtnSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: P_BORDER,
  },
  ctaBtnDanger: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  ctaBtnTextSecondary: { color: P_TEXT },
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  footerText: { fontSize: 13, color: P_SUBTLE },
});

export default SubscriptionScreen;

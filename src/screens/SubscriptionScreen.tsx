/**
 * SubscriptionScreen — Subscription management screen
 * Displays current plan, usage, subscription status, and plan comparison.
 * Integrates Stripe PaymentSheet for subscribing to paid plans.
 */
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    hasPlanAccess,
    normalizePlanId,
    PLAN_FEATURE_RULES,
} from "../constants/planAccess";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useSubscription } from "../hooks/usePlans";
import { useTranslation } from "../localization";
import { analytics } from "../services/analytics";
import { Plan } from "../services/plansService";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Props {
  navigation: NativeStackNavigationProp<Record<string, undefined>>;
}

const PLAN_COLORS: Record<string, string> = {
  free: "#6B7280",
  pro: "#3B82F6",
  expert: "#8B5CF6",
  unlimited: "#F59E0B",
};

const PLAN_ICONS: Record<string, IoniconsName> = {
  free: "leaf-outline",
  pro: "rocket-outline",
  expert: "diamond-outline",
  unlimited: "infinite-outline",
};

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

  const comparisonPlans = plans.filter((plan) =>
    ["free", "pro", "expert", "unlimited", "enterprise"].includes(
      String(plan.id).toLowerCase(),
    ),
  );

  const comparisonRows: Array<{
    key: string;
    label: string;
    valueForPlan: (plan: Plan) => string;
  }> = [
    {
      key: "included_users",
      label: t("subscription.includedUsers"),
      valueForPlan: (plan) => formatLimit(plan.included_users),
    },
    {
      key: "jobs_per_month",
      label: t("subscription.jobsPerMonth"),
      valueForPlan: (plan) => formatLimit(plan.max_jobs_created),
    },
    {
      key: "commission",
      label: t("subscription.commission"),
      valueForPlan: (plan) => `${plan.platform_fee_percentage}%`,
    },
    {
      key: "advanced_notifications",
      label: PLAN_FEATURE_RULES.advanced_notifications.label,
      valueForPlan: (plan) =>
        hasPlanAccess(
          normalizePlanId(plan.id),
          PLAN_FEATURE_RULES.advanced_notifications.minPlan,
        )
          ? "✓"
          : "-",
    },
    {
      key: "invoice_branding",
      label: PLAN_FEATURE_RULES.invoice_branding.label,
      valueForPlan: (plan) =>
        hasPlanAccess(
          normalizePlanId(plan.id),
          PLAN_FEATURE_RULES.invoice_branding.minPlan,
        )
          ? "✓"
          : "-",
    },
    {
      key: "inter_contractor_billing",
      label: PLAN_FEATURE_RULES.inter_contractor_billing.label,
      valueForPlan: (plan) =>
        hasPlanAccess(
          normalizePlanId(plan.id),
          PLAN_FEATURE_RULES.inter_contractor_billing.minPlan,
        )
          ? "✓"
          : "-",
    },
    {
      key: "priority_support",
      label: PLAN_FEATURE_RULES.priority_support.label,
      valueForPlan: (plan) =>
        hasPlanAccess(
          normalizePlanId(plan.id),
          PLAN_FEATURE_RULES.priority_support.minPlan,
        )
          ? "✓"
          : "-",
    },
  ];

  const formatLimit = (value: number): string => {
    if (value === -1) return t("subscription.unlimited");
    return String(value);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleSubscribe = async (planId: string) => {
    analytics.trackCustomEvent('subscription_start', 'business', { plan_id: planId });
    setProcessingPlanId(planId);
    try {
      // First, record the plan selection in DB
      const selection = await selectPlan(planId);

      // If the plan requires a Stripe subscription, initiate payment
      if (selection.requires_subscription) {
        const data = await subscribe(planId);

        // Trial: clientSecret is null — no immediate payment needed
        if (data.is_trial || !data.clientSecret) {
          Alert.alert(
            "✓ Essai gratuit activé",
            "Votre essai gratuit de 30 jours commence maintenant. Aucun paiement ne sera prélevé avant la fin de la période d'essai.",
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
        });

        if (initError) {
          Alert.alert("Error", initError.message);
          return;
        }

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
    analytics.trackCustomEvent('subscription_upgrade', 'business', { plan_id: planId, current_plan: currentPlanId });
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
            analytics.trackCustomEvent('subscription_cancel', 'business', { current_plan: currentPlanId });
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
    analytics.trackCustomEvent('subscription_resume', 'business', { current_plan: currentPlanId });
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

    if (isCurrent) return null; // No action on current plan

    // Free plan: show "Select" to downgrade (only if no active sub)
    if (!isPaid) {
      if (hasActiveSub) return null; // Must cancel sub first
      return {
        label: t("subscription.selectPlan"),
        action: () => handleSelectFreePlan(),
      };
    }

    if (!hasActiveSub) {
      // No active subscription → subscribe
      return { label: t("subscription.subscribe"), action: () => handleSubscribe(plan.id) };
    }

    // Has active subscription → change plan
    const currentPrice = companyPlan?.plan?.price_monthly || 0;
    const label =
      plan.price_monthly > currentPrice
        ? t("subscription.upgrade")
        : t("subscription.downgrade");
    return { label, action: () => handleChangePlan(plan.id) };
  };

  const renderUsageBar = (current: number, max: number, color: string) => {
    const pct = max === -1 ? 0.1 : Math.min(current / max, 1);
    return (
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.backgroundSecondary,
          overflow: "hidden",
          marginTop: 4,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.max(pct * 100, 2)}%`,
            borderRadius: 4,
            backgroundColor:
              pct > 0.9 ? colors.error : pct > 0.7 ? colors.warning : color,
          }}
        />
      </View>
    );
  };

  const renderPlanCard = (plan: Plan) => {
    const isCurrent = plan.id === currentPlanId;
    const planColor = PLAN_COLORS[plan.id] || colors.primary;
    const planIcon = PLAN_ICONS[plan.id] || "star-outline";

    return (
      <View
        key={plan.id}
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.md,
          borderWidth: isCurrent ? 2 : 1,
          borderColor: isCurrent ? planColor : colors.border,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: planColor + "20",
              justifyContent: "center",
              alignItems: "center",
              marginRight: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Ionicons name={planIcon} size={24} color={planColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {plan.display_name}
            </Text>
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                color: planColor,
                fontWeight: "700",
              }}
            >
              {plan.price_monthly === 0
                ? t("subscription.free")
                : `$${plan.price_monthly}/mo`}
            </Text>
          </View>
          {isCurrent && (
            <View
              style={{
                backgroundColor: planColor + "20",
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                paddingVertical: 4,
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: planColor,
                  textTransform: "uppercase",
                }}
              >
                {t("subscription.currentPlan")}
              </Text>
            </View>
          )}
        </View>

        {/* Features list */}
        <View style={{ gap: DESIGN_TOKENS.spacing.xs }}>
          <FeatureRow
            icon="people-outline"
            label={t("subscription.includedUsers")}
            value={formatLimit(plan.included_users)}
            colors={colors}
          />
          <FeatureRow
            icon="briefcase-outline"
            label={t("subscription.jobsPerMonth")}
            value={formatLimit(plan.max_jobs_created)}
            colors={colors}
          />
          <FeatureRow
            icon="trending-down-outline"
            label={t("subscription.commission")}
            value={`${plan.platform_fee_percentage}%`}
            colors={colors}
          />
          {plan.features?.branding && (
            <FeatureRow
              icon="color-palette-outline"
              label={t("subscription.branding")}
              value="✓"
              colors={colors}
              highlight
            />
          )}
          {plan.features?.priority_support && (
            <FeatureRow
              icon="flash-outline"
              label={t("subscription.prioritySupport")}
              value="✓"
              colors={colors}
              highlight
            />
          )}
        </View>

        {/* Action button */}
        {(() => {
          const planAction = getActionForPlan(plan);
          if (!planAction) return null;
          const isProcessing = processingPlanId === plan.id;
          return (
            <Pressable
              onPress={planAction.action}
              disabled={actionLoading || isProcessing}
              style={{
                marginTop: DESIGN_TOKENS.spacing.md,
                backgroundColor: planColor,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
                alignItems: "center",
                opacity: actionLoading || isProcessing ? 0.6 : 1,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  {planAction.label}
                </Text>
              )}
            </Pressable>
          );
        })()}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
              onPress={() => {
                analytics.trackButtonPress('back_btn', 'Subscription');
                navigation.goBack();
              }}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={{ marginRight: DESIGN_TOKENS.spacing.md }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: DESIGN_TOKENS.typography.title.fontSize,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("subscription.title")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xxl,
        }}
      >
        {/* Current plan usage */}
        {companyPlan && (
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              marginBottom: DESIGN_TOKENS.spacing.xl,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              {t("subscription.yourUsage")}
            </Text>

            {/* Users */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    color: colors.text,
                  }}
                >
                  {t("subscription.users")}
                </Text>
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {companyPlan.usage.current_users} /{" "}
                  {formatLimit(companyPlan.plan.included_users)}
                </Text>
              </View>
              {renderUsageBar(
                companyPlan.usage.current_users,
                companyPlan.plan.included_users,
                PLAN_COLORS[currentPlanId || "free"] || colors.primary,
              )}
              {companyPlan.usage.extra_users > 0 && (
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    color: colors.warning,
                    marginTop: 2,
                  }}
                >
                  +{companyPlan.usage.extra_users}{" "}
                  {t("subscription.extraUsers")} ($
                  {companyPlan.plan.extra_user_price}
                  {t("subscription.perUser")})
                </Text>
              )}
            </View>

            {/* Jobs */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    color: colors.text,
                  }}
                >
                  {t("subscription.jobsThisMonth")}
                </Text>
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {companyPlan.usage.jobs_created_this_month} /{" "}
                  {formatLimit(companyPlan.plan.max_jobs_created)}
                </Text>
              </View>
              {renderUsageBar(
                companyPlan.usage.jobs_created_this_month,
                companyPlan.plan.max_jobs_created,
                PLAN_COLORS[currentPlanId || "free"] || colors.primary,
              )}
              {companyPlan.plan.max_jobs_created !== -1 &&
                companyPlan.usage.jobs_remaining <= 5 &&
                companyPlan.usage.jobs_remaining >= 0 && (
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.error,
                      marginTop: 2,
                    }}
                  >
                    {companyPlan.usage.jobs_remaining}{" "}
                    {t("subscription.jobsRemaining")}
                  </Text>
                )}
            </View>
          </View>
        )}

        {/* Subscription status & actions */}
        {subscriptionStatus &&
          subscriptionStatus.subscription_id &&
          (isActive || isCanceling) && (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.xl,
                borderWidth: 1,
                borderColor: isCanceling ? colors.warning : colors.success,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Ionicons
                  name={isCanceling ? "time-outline" : "checkmark-circle-outline"}
                  size={20}
                  color={isCanceling ? colors.warning : colors.success}
                  style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                />
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    fontWeight: "700",
                    color: isCanceling ? colors.warning : colors.success,
                  }}
                >
                  {isCanceling
                    ? t("subscription.subscriptionCanceling")
                    : t("subscription.subscriptionActive")}
                </Text>
              </View>

              {isCanceling &&
                subscriptionStatus.stripe_details?.current_period_end && (
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                      marginBottom: DESIGN_TOKENS.spacing.md,
                    }}
                  >
                    {t("subscription.subscriptionCancelingDetail", {
                      date: formatDate(
                        subscriptionStatus.stripe_details.current_period_end,
                      ),
                    })}
                  </Text>
                )}

              {isCanceling ? (
                <Pressable
                  onPress={handleResume}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: colors.success,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    alignItems: "center",
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("subscription.resumeSubscription")}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleCancel}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: colors.error,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    alignItems: "center",
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: colors.error, fontWeight: "700" }}>
                    {t("subscription.cancelSubscription")}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

        {/* Plans comparison */}
        <Text
          style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: "700",
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          {t("subscription.allPlans")}
        </Text>

        {plans.map(renderPlanCard)}

        {comparisonPlans.length > 0 && (
          <View
            style={{
              marginTop: DESIGN_TOKENS.spacing.xl,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: "700",
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("subscription.quickCompareTitle") || "Comparatif rapide"}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingBottom: DESIGN_TOKENS.spacing.xs,
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      width: 180,
                      color: colors.textSecondary,
                      fontWeight: "700",
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("subscription.featureColumn") || "Fonctionnalité"}
                  </Text>
                  {comparisonPlans.map((plan) => {
                    const isCurrent = String(plan.id) === String(currentPlanId);
                    return (
                      <View
                        key={`plan-head-${plan.id}`}
                        style={{
                          width: 96,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: isCurrent ? colors.primary : colors.text,
                            fontWeight: "700",
                            textTransform: "capitalize",
                          }}
                        >
                          {plan.display_name || plan.id}
                        </Text>
                        {isCurrent ? (
                          <Text style={{ color: colors.primary, fontSize: 11 }}>
                            {t("subscription.currentBadge") || "actuel"}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                {comparisonRows.map((row, index) => (
                  <View
                    key={row.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: DESIGN_TOKENS.spacing.xs,
                      borderBottomWidth:
                        index < comparisonRows.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        width: 180,
                        color: colors.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      {row.label}
                    </Text>
                    {comparisonPlans.map((plan) => (
                      <Text
                        key={`${row.key}-${plan.id}`}
                        style={{
                          width: 96,
                          textAlign: "center",
                          color: colors.text,
                          fontWeight: "600",
                        }}
                      >
                        {row.valueForPlan(plan)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/** Petite ligne feature avec icône */
const FeatureRow = ({
  icon,
  label,
  value,
  colors,
  highlight,
}: {
  icon: IoniconsName;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  highlight?: boolean;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
    }}
  >
    <Ionicons
      name={icon}
      size={16}
      color={highlight ? colors.success : colors.textMuted}
    />
    <Text
      style={{
        flex: 1,
        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
        color: colors.textSecondary,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
        fontWeight: "600",
        color: highlight ? colors.success : colors.text,
      }}
    >
      {value}
    </Text>
  </View>
);

export default SubscriptionScreen;

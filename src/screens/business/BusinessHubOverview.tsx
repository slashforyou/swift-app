/**
 * BusinessHubOverview - Command center / dashboard du Business Hub
 * Affiche : actions requises, état de la boîte, raccourcis outils, résumé entreprise
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from "react-native";
import type { BusinessTab } from "../../components/business/BusinessTabMenu";
import { ServerData } from "../../constants/ServerData";
import { DESIGN_TOKENS } from "../../constants/Styles";
import {
    hasPlanAccess,
    normalizePlanId,
    PLAN_FEATURE_RULES,
} from "../../constants/planAccess";
import { useTheme } from "../../context/ThemeProvider";
import { useCompanyProfile } from "../../hooks/useCompanyProfile";
import { useSubscription } from "../../hooks/usePlans";
import { useStaff } from "../../hooks/useStaff";
import { useStripeConnection } from "../../hooks/useStripeConnection";
import { useVehicles } from "../../hooks/useVehicles";
import { useTranslation } from "../../localization/useLocalization";
import { analytics, trackCustomEvent } from "../../services/analytics";
import { authenticatedFetch } from "../../utils/auth";

// Palettes de couleurs pour les cards (mode clair)
const CARD_COLORS = {
  staff:    { bg: "#EEF2FF", icon: "#6366F1", accent: "#6366F1" }, // indigo
  vehicles: { bg: "#FFF7ED", icon: "#EA580C", accent: "#EA580C" }, // orange
  partners: { bg: "#F0FDF4", icon: "#16A34A", accent: "#16A34A" }, // green
  stripe:   { bg: "#FDF4FF", icon: "#9333EA", accent: "#9333EA" }, // purple
  // dark mode overrides handled via opacity
};

interface BusinessHubOverviewProps {
  onNavigateTab: (tab: BusinessTab, subTab?: string) => void;
  onDrillDown: (screen: string) => void;
}

export default function BusinessHubOverview({
  onNavigateTab,
  onDrillDown,
}: BusinessHubOverviewProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile, isLoading: profileLoading } = useCompanyProfile();
  const { companyPlan } = useSubscription();
  const stripeConnection = useStripeConnection();
  const { totalActive: staffCount, totalEmployees, totalContractors, isLoading: staffLoading } = useStaff();
  const { totalVehicles, isLoading: vehiclesLoading } = useVehicles();
  const [partnerCount, setPartnerCount] = useState(0);
  const [partnersLoading, setPartnersLoading] = useState(true);

  const loadPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const res = await authenticatedFetch(`${ServerData.serverUrl}v1/companies/relations`);
      if (res.ok) {
        const json = await res.json();
        setPartnerCount(json?.relations?.length ?? json?.data?.length ?? 0);
      }
    } catch {
      // keep 0
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const stripeActive = stripeConnection.status === "active" || stripeConnection.status === "pending";
  const stripeConnected = stripeConnection.isConnected;
  const currentPlan = normalizePlanId(companyPlan?.plan?.id);

  // Card background with dark-mode support
  const cardBg = (lightColor: string) =>
    isDark ? colors.backgroundSecondary : lightColor;

  const statsLoading = staffLoading || vehiclesLoading || partnersLoading;

  // ── Actions requises ──
  const actions: { label: string; icon: string; color: string; onPress: () => void }[] = [];

  if (!stripeConnected && !stripeConnection.loading) {
    actions.push({
      label: t("businessHub.actions.configureStripe"),
      icon: "card-outline",
      color: "#EF4444",
      onPress: () => { analytics.trackButtonPress('hub_action_configure_stripe', 'BusinessHub'); onNavigateTab("Finances", "payments"); },
    });
  }
  if (profile && (!profile.address || !profile.phone || !profile.abn)) {
    actions.push({
      label: t("businessHub.actions.completeProfile"),
      icon: "business-outline",
      color: "#F59E0B",
      onPress: () => { analytics.trackButtonPress('hub_action_complete_profile', 'BusinessHub'); onDrillDown("BusinessInfo"); },
    });
  }
  if (totalVehicles === 0 && !vehiclesLoading) {
    actions.push({
      label: t("businessHub.actions.addVehicle"),
      icon: "car-outline",
      color: "#F59E0B",
      onPress: () => { analytics.trackButtonPress('hub_action_add_vehicle', 'BusinessHub'); onNavigateTab("Resources", "vehicles"); },
    });
  }
  if (staffCount === 0 && !staffLoading) {
    actions.push({
      label: t("businessHub.actions.inviteTeam"),
      icon: "person-add-outline",
      color: "#F59E0B",
      onPress: () => { analytics.trackButtonPress('hub_action_invite_team', 'BusinessHub'); onNavigateTab("Resources", "staff"); },
    });
  }
  if (partnerCount === 0 && !partnersLoading) {
    actions.push({
      label: t("businessHub.actions.addPartner"),
      icon: "people-outline",
      color: "#F59E0B",
      onPress: () => { analytics.trackButtonPress('hub_action_add_partner', 'BusinessHub'); onNavigateTab("Resources", "partners"); },
    });
  }

  // ── Raccourcis ──
  const openUpgradeFromFeature = useCallback((featureKey: keyof typeof PLAN_FEATURE_RULES) => {
    trackCustomEvent("paywall_lock_clicked", "business", {
      source: "business_hub_shortcut",
      feature_key: featureKey,
      current_plan: currentPlan,
    });
    onDrillDown("Subscription");
  }, [currentPlan, onDrillDown]);

  const shortcuts = useMemo(() => {
    const canUseBilling = hasPlanAccess(
      currentPlan,
      PLAN_FEATURE_RULES.inter_contractor_billing.minPlan,
    );
    const canUseBranding = hasPlanAccess(
      currentPlan,
      PLAN_FEATURE_RULES.invoice_branding.minPlan,
    );

    return [
      {
        label: t("businessHub.shortcuts.storage"),
        icon: "filing-outline",
        color: "#EF4444",
        onPress: () => onNavigateTab("Resources", "storage"),
        locked: false,
      },
      {
        label: t("businessHub.shortcuts.contracts"),
        icon: "document-text-outline",
        color: "#16A34A",
        onPress: () => onNavigateTab("Config", "clauses"),
        locked: false,
      },
      {
        label: t("businessHub.subTabs.billing"),
        icon: "swap-horizontal-outline",
        color: "#0EA5E9",
        onPress: () =>
          canUseBilling
            ? onNavigateTab("Finances", "billing")
            : openUpgradeFromFeature("inter_contractor_billing"),
        locked: !canUseBilling,
      },
      {
        label: t("businessHub.subTabs.invoicesTab"),
        icon: "receipt-outline",
        color: "#9333EA",
        onPress: () =>
          canUseBranding
            ? onNavigateTab("Finances", "invoices")
            : openUpgradeFromFeature("invoice_branding"),
        locked: !canUseBranding,
      },
    ];
  }, [currentPlan, onNavigateTab, openUpgradeFromFeature, t]);

  const isLoading = profileLoading || statsLoading || stripeConnection.loading;

  // ── Tutorial / Quickstart ─────────────────────────────────────────────────
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Score d'installation : combien d'éléments critiques sont configurés
  const setupItems = useMemo(() => [
    {
      label: t("businessHub.setup.businessInfo"),
      icon: "business-outline",
      done: !!(profile?.name && profile?.address && profile?.phone && profile?.abn),
      onPress: () => onDrillDown("BusinessInfo"),
    },
    {
      label: t("businessHub.setup.stripe"),
      icon: "card-outline",
      done: stripeConnected,
      onPress: () => onNavigateTab("Finances", "payments"),
    },
    {
      label: t("businessHub.setup.team"),
      icon: "people-outline",
      done: staffCount > 0,
      onPress: () => onNavigateTab("Resources", "staff"),
    },
    {
      label: t("businessHub.setup.vehicles"),
      icon: "car-outline",
      done: totalVehicles > 0,
      onPress: () => onNavigateTab("Resources", "vehicles"),
    },
    {
      label: t("businessHub.setup.partners"),
      icon: "people-circle-outline",
      done: partnerCount > 0,
      onPress: () => onNavigateTab("Resources", "partners"),
    },
  ], [profile, stripeConnected, staffCount, totalVehicles, partnerCount, t, onDrillDown, onNavigateTab]);

  const setupDone  = setupItems.filter(i => i.done).length;
  const setupTotal = setupItems.length;
  const setupPct   = Math.round((setupDone / setupTotal) * 100);

  const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
    elite:    { bg: "#7C3AED", text: "#fff" },
    pro:      { bg: "#2563EB", text: "#fff" },
    basic:    { bg: "#059669", text: "#fff" },
  };
  const planChip = PLAN_COLORS[currentPlan ?? ""] ?? { bg: colors.primary, text: "#fff" };

  const s = getStyles(colors);

  return (
    <View>
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <View style={[s.heroBanner, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary + "0E" }]}>
        <View style={s.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[s.heroTitle, { color: colors.text }]} numberOfLines={1}>
              {profile?.name || t("businessHub.company.default")}
            </Text>
            <Text style={[s.heroSub, { color: colors.textSecondary }]}>
              {t("businessHub.hero.subtitle")}
            </Text>
          </View>
          {currentPlan && (
            <View style={[s.planChip, { backgroundColor: planChip.bg }]}>
              <Text style={[s.planChipText, { color: planChip.text }]}>
                {currentPlan.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        {/* Progress bar de configuration */}
        <View style={s.setupRow}>
          <View style={[s.setupTrack, { backgroundColor: colors.border }]}>
            <View style={[s.setupFill, { width: `${setupPct}%`, backgroundColor: setupDone === setupTotal ? "#10B981" : colors.primary }]} />
          </View>
          <Text style={[s.setupLabel, { color: colors.textSecondary }]}>
            {setupDone}/{setupTotal} {t("businessHub.hero.configured")}
          </Text>
        </View>
      </View>

      {/* ── Quick Start Guide (tutoriel collapsible) ─────────────────────────── */}
      <TouchableOpacity
        style={[s.tutorialHeader, { backgroundColor: isDark ? "#1e3a5f" : "#EFF6FF", borderColor: isDark ? "#2563EB44" : "#BFDBFE" }]}
        onPress={() => setTutorialOpen(o => !o)}
        activeOpacity={0.75}
      >
        <View style={s.tutorialHeaderLeft}>
          <Ionicons name="map-outline" size={20} color="#2563EB" />
          <Text style={[s.tutorialHeaderTitle, { color: isDark ? "#93C5FD" : "#1D4ED8" }]}>
            {t("businessHub.tutorial.title")}
          </Text>
          {setupDone < setupTotal && (
            <View style={s.tutorialBadge}>
              <Text style={s.tutorialBadgeText}>{setupTotal - setupDone}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={tutorialOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#2563EB"
        />
      </TouchableOpacity>
      {tutorialOpen && (
        <View style={[s.tutorialBody, { backgroundColor: isDark ? "#162032" : "#F0F9FF", borderColor: isDark ? "#2563EB33" : "#BAE6FD" }]}>
          {setupItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.tutorialStep, idx < setupItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "#ffffff10" : "#BAE6FD" }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.tutorialStepIcon, { backgroundColor: item.done ? "#10B98120" : "#2563EB15" }]}>
                <Ionicons
                  name={item.done ? "checkmark-circle" : (item.icon as any)}
                  size={20}
                  color={item.done ? "#10B981" : "#2563EB"}
                />
              </View>
              <Text style={[s.tutorialStepLabel, { color: item.done ? colors.textSecondary : colors.text }]}>
                {item.label}
              </Text>
              {item.done
                ? <Ionicons name="checkmark" size={16} color="#10B981" />
                : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          ))}
          <View style={[s.tutorialTip, { backgroundColor: isDark ? "#0f2d4a" : "#E0F2FE" }]}>
            <Ionicons name="information-circle-outline" size={15} color="#0EA5E9" />
            <Text style={[s.tutorialTipText, { color: isDark ? "#7DD3FC" : "#0369A1" }]}>
              {t("businessHub.tutorial.tip")}
            </Text>
          </View>
        </View>
      )}

      {/* ── Bloc A : Actions requises ── */}
      {actions.length > 0 && (
        <View style={[s.actionsCard, { backgroundColor: isDark ? "#7F1D1D40" : "#FEF2F2", borderColor: isDark ? "#EF444440" : "#FECACA" }]}>
          <View style={s.actionsHeader}>
            <View style={[s.actionsBadge, { backgroundColor: "#EF4444" }]}>
              <Text style={s.actionsBadgeText}>{actions.length}</Text>
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              {t("businessHub.actionsRequired")}
            </Text>
          </View>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[s.actionRow, i < actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "#ffffff15" : "#FED7AA" }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.actionIconCircle, { backgroundColor: action.color + "20" }]}>
                <Ionicons name={action.icon as any} size={18} color={action.color} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Bloc B : État de la boîte (grille 2×2 colorée) ── */}
      <View style={s.grid}>
        <TouchableOpacity
          style={[s.statCard, { backgroundColor: cardBg(CARD_COLORS.staff.bg) }]}
          onPress={() => onNavigateTab("Resources", "staff")}
          activeOpacity={0.7}
        >
          <View style={[s.statIconCircle, { backgroundColor: CARD_COLORS.staff.icon + "20" }]}>
            <Ionicons name="people" size={22} color={CARD_COLORS.staff.icon} />
          </View>
          <Text style={[s.statNumber, { color: colors.text }]}>
            {staffLoading ? "…" : staffCount}
          </Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>
            {t("businessHub.stats.activeStaff")}
          </Text>
          {!staffLoading && (totalEmployees > 0 || totalContractors > 0) && (
            <Text style={[s.statDetail, { color: CARD_COLORS.staff.accent }]}>
              {totalEmployees} {t("businessHub.drillDown.employees")} · {totalContractors} {t("businessHub.drillDown.ext")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.statCard, { backgroundColor: cardBg(CARD_COLORS.vehicles.bg) }]}
          onPress={() => onNavigateTab("Resources", "vehicles")}
          activeOpacity={0.7}
        >
          <View style={[s.statIconCircle, { backgroundColor: CARD_COLORS.vehicles.icon + "20" }]}>
            <Ionicons name="car-sport" size={22} color={CARD_COLORS.vehicles.icon} />
          </View>
          <Text style={[s.statNumber, { color: colors.text }]}>
            {vehiclesLoading ? "…" : totalVehicles}
          </Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>
            {t("businessHub.stats.vehicles")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.statCard, { backgroundColor: cardBg(CARD_COLORS.partners.bg) }]}
          onPress={() => onNavigateTab("Resources", "partners")}
          activeOpacity={0.7}
        >
          <View style={[s.statIconCircle, { backgroundColor: CARD_COLORS.partners.icon + "20" }]}>
            <Ionicons name="people-circle-outline" size={22} color={CARD_COLORS.partners.icon} />
          </View>
          <Text style={[s.statNumber, { color: colors.text }]}>
            {partnersLoading ? "…" : partnerCount}
          </Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>
            {t("businessHub.stats.partners")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.statCard, { backgroundColor: cardBg(CARD_COLORS.stripe.bg) }]}
          onPress={() => onNavigateTab("Finances", "payments")}
          activeOpacity={0.7}
        >
          <View style={[s.statIconCircle, { backgroundColor: stripeActive ? "#10B98120" : stripeConnected ? "#F59E0B20" : CARD_COLORS.stripe.icon + "20" }]}>
            <Ionicons name="card" size={22} color={stripeActive ? "#10B981" : stripeConnected ? "#F59E0B" : CARD_COLORS.stripe.icon} />
          </View>
          <Text style={[s.statNumber, { color: colors.text }]}>
            Stripe
          </Text>
          <Text style={[s.statLabel, { color: stripeActive ? "#10B981" : stripeConnected ? "#F59E0B" : colors.textSecondary }]}>
            {stripeConnection.loading ? "…" : stripeActive ? t("businessHub.stats.stripeActive") : stripeConnected ? t("businessHub.stats.stripeIncomplete") : t("businessHub.stats.stripeNotConfigured")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Bloc C : Raccourcis outils ── */}
      <Text style={[s.sectionTitle, { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg }]}>
        {t("businessHub.tools")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.shortcutsRow}>
        {shortcuts.map((shortcut, i) => (
          <TouchableOpacity
            key={i}
            style={[s.shortcutCard, { backgroundColor: isDark ? colors.backgroundSecondary : shortcut.color + "10", borderColor: isDark ? colors.border : shortcut.color + "30" }]}
            onPress={shortcut.onPress}
            activeOpacity={0.7}
          >
            <View style={[s.shortcutIconCircle, { backgroundColor: shortcut.color + "20" }]}>
              <Ionicons name={shortcut.icon as any} size={20} color={shortcut.color} />
            </View>
            <Text style={[s.shortcutLabel, { color: colors.text }]} numberOfLines={2}>
              {shortcut.label}
            </Text>
            {shortcut.locked ? (
              <View style={s.lockChip}>
                <Ionicons name="lock-closed" size={11} color="#B45309" />
                <Text style={s.lockChipText}>PRO</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Bloc D : Résumé entreprise ── */}
      {profile && (
        <TouchableOpacity
          style={[s.companyCard, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary + "08", borderColor: isDark ? colors.border : colors.primary + "25" }]}
          onPress={() => onDrillDown("BusinessInfo")}
          activeOpacity={0.7}
        >
          <View style={[s.companyLogo, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="business" size={28} color={colors.primary} />
          </View>
          <View style={s.companyInfo}>
            <Text style={[s.companyName, { color: colors.text }]} numberOfLines={1}>
              {profile.name || t("businessHub.company.default")}
            </Text>
            <Text style={[s.companyMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {[typeof profile.address === "string" ? profile.address : ((profile.address as any)?.street || (profile.address as any)?.city || ""), profile.abn ? "ABN ✅" : null].filter(Boolean).join("  ·  ") || t("businessHub.company.incomplete")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    // ── Hero ──
    heroBanner: {
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + "25",
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 2,
    },
    heroSub: {
      fontSize: 12,
      fontWeight: "500",
    },
    planChip: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: "flex-start",
    },
    planChipText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    setupRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    setupTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
    },
    setupFill: {
      height: "100%",
      borderRadius: 3,
    },
    setupLabel: {
      fontSize: 12,
      fontWeight: "600",
      minWidth: 60,
    },
    // ── Tutorial ──
    tutorialHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
      marginBottom: 2,
    },
    tutorialHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    tutorialHeaderTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    tutorialBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
    },
    tutorialBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    tutorialBody: {
      borderWidth: 1,
      borderTopWidth: 0,
      borderBottomLeftRadius: DESIGN_TOKENS.radius.lg,
      borderBottomRightRadius: DESIGN_TOKENS.radius.lg,
      marginBottom: DESIGN_TOKENS.spacing.md,
      overflow: "hidden",
    },
    tutorialStep: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
      gap: 10,
    },
    tutorialStepIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    tutorialStepLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
    },
    tutorialTip: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      margin: DESIGN_TOKENS.spacing.sm,
      padding: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    tutorialTipText: {
      fontSize: 12,
      flex: 1,
      lineHeight: 17,
    },
    actionsCard: {
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    actionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    actionsBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    actionsBadgeText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
      gap: 10,
    },
    actionIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    statCard: {
      width: "48%",
      flexGrow: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      gap: 4,
    },
    statIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 12,
      textAlign: "center",
      fontWeight: "500",
    },
    statDetail: {
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
    },
    shortcutsRow: {
      marginTop: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    shortcutCard: {
      width: 92,
      height: 92,
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.sm,
      gap: 6,
    },
    shortcutIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    shortcutLabel: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
    lockChip: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#FDE68A",
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    lockChipText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#B45309",
      textTransform: "uppercase",
    },
    companyCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.md,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    companyLogo: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    companyInfo: {
      flex: 1,
      gap: 2,
    },
    companyName: {
      fontSize: 16,
      fontWeight: "600",
    },
    companyMeta: {
      fontSize: 13,
    },
  });

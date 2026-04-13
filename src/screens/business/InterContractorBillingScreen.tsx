/**
 * InterContractorBillingScreen — Suivi facturation inter-prestataires
 * Intégré dans la navigation Business comme onglet "Facturation"
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization/useLocalization";
import {
    BillingDirection,
    BillingStats,
    BillingStatus,
    BillingTransfer,
    fetchBillingStats,
    fetchBillingTransfers,
    updateBillingTransfer,
} from "../../services/interContractorBillingService";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BillingStatus, { labelKey: string; icon: string; color: string }> = {
  not_billed: { labelKey: "businessHub.billing.statusNotBilled", icon: "document-outline", color: "#9CA3AF" },
  invoiced: { labelKey: "businessHub.billing.statusInvoiced", icon: "send-outline", color: "#F59E0B" },
  paid: { labelKey: "businessHub.billing.statusPaid", icon: "checkmark-circle", color: "#10B981" },
  overdue: { labelKey: "businessHub.billing.statusOverdue", icon: "warning", color: "#EF4444" },
};

const ROLE_LABEL_KEYS: Record<string, string> = {
  full_job: "businessHub.billing.roleFullJob",
  driver: "businessHub.billing.roleDriver",
  offsider: "businessHub.billing.roleOffsider",
  custom: "businessHub.billing.roleCustom",
};

const PRICING_LABEL_KEYS: Record<string, string> = {
  flat: "businessHub.billing.pricingFlat",
  hourly: "businessHub.billing.pricingHourly",
  daily: "businessHub.billing.pricingDaily",
};

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

const InterContractorBillingScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // State
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [transfers, setTransfers] = useState<BillingTransfer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<BillingDirection>("receivable");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | null>(null);

  // ────── Data loading ──────

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setInitialLoading(true);
    try {
      const [statsData, transfersData] = await Promise.all([
        fetchBillingStats(),
        fetchBillingTransfers({
          direction: activeTab,
          status: statusFilter ?? undefined,
        }),
      ]);
      setStats(statsData);
      setTransfers(transfersData.data);
    } catch (err) {
      console.error("❌ [Billing] load error:", err);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    loadData(transfers.length === 0 && !stats);
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  // ────── Actions ──────

  const handleStatusChange = useCallback(
    async (transfer: BillingTransfer, newStatus: BillingStatus) => {
      try {
        await updateBillingTransfer(transfer.id, { billing_status: newStatus });
        // Refresh data
        loadData(false);
      } catch (err: any) {
        Alert.alert(t("businessHub.billing.error"), err.message || t("businessHub.billing.errorStatusUpdate"));
      }
    },
    [loadData],
  );

  const showStatusActions = useCallback(
    (transfer: BillingTransfer) => {
      const options: { text: string; status: BillingStatus }[] = [];

      if (transfer.billing_status !== "invoiced") {
        options.push({ text: t("businessHub.billing.markInvoiced"), status: "invoiced" });
      }
      if (transfer.billing_status !== "paid") {
        options.push({ text: t("businessHub.billing.markPaid"), status: "paid" });
      }
      if (transfer.billing_status !== "overdue") {
        options.push({ text: t("businessHub.billing.markOverdue"), status: "overdue" });
      }
      if (transfer.billing_status !== "not_billed") {
        options.push({ text: t("businessHub.billing.markNotBilled"), status: "not_billed" });
      }

      Alert.alert(
        `Job ${transfer.job_code || `#${transfer.job_id}`}`,
        `${formatAmount(transfer.pricing_amount, transfer.currency)} — ${t(STATUS_CONFIG[transfer.billing_status].labelKey)}`,
        [
          ...options.map((opt) => ({
            text: opt.text,
            onPress: () => handleStatusChange(transfer, opt.status),
          })),
          { text: t("common.cancel"), style: "cancel" as const },
        ],
      );
    },
    [handleStatusChange],
  );

  const handleAddPaymentRef = useCallback(
    (transfer: BillingTransfer) => {
      Alert.prompt?.(
        t("businessHub.billing.paymentRef"),
        t("businessHub.billing.paymentRefPrompt"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("businessHub.billing.save"),
            onPress: async (text?: string) => {
              if (text?.trim()) {
                try {
                  await updateBillingTransfer(transfer.id, {
                    payment_reference: text.trim(),
                  });
                  loadData(false);
                } catch (err: any) {
                  Alert.alert(t("businessHub.billing.error"), err.message);
                }
              }
            },
          },
        ],
        "plain-text",
        transfer.payment_reference || "",
      );
    },
    [loadData],
  );

  // ────── Helpers ──────

  const formatAmount = (amount: number, currency: string) => {
    return `$${Number(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const currentStats = activeTab === "payable" ? stats?.payable : stats?.receivable;

  // ────── Loading state ──────

  if (initialLoading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          {t("businessHub.billing.loading")}
        </Text>
      </View>
    );
  }

  // ────── Render ──────

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Direction tabs ── */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: 4,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {(["receivable", "payable"] as BillingDirection[]).map((dir) => {
          const isActive = activeTab === dir;
          return (
            <Pressable
              key={dir}
              onPress={() => setActiveTab(dir)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: isActive ? colors.primary : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#FFF" : colors.textSecondary,
                  fontWeight: isActive ? "700" : "500",
                  fontSize: 14,
                }}
              >
                {dir === "receivable" ? `💰 ${t("businessHub.billing.incoming")}` : `💸 ${t("businessHub.billing.outgoing")}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Stats cards ── */}
      {currentStats && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <StatCard
            label="Total"
            amount={currentStats.total_amount}
            count={currentStats.total_count}
            currency="AUD"
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            label={t("businessHub.billing.statusNotBilled")}
            amount={currentStats.not_billed_amount}
            count={currentStats.not_billed_count}
            currency="AUD"
            color="#9CA3AF"
            colors={colors}
          />
          <StatCard
            label={t("businessHub.billing.statusInvoiced")}
            amount={currentStats.invoiced_amount}
            count={currentStats.invoiced_count}
            currency="AUD"
            color="#F59E0B"
            colors={colors}
          />
          <StatCard
            label={t("businessHub.billing.statusPaid")}
            amount={currentStats.paid_amount}
            count={currentStats.paid_count}
            currency="AUD"
            color="#10B981"
            colors={colors}
          />
          {(currentStats.overdue_count ?? 0) > 0 && (
            <StatCard
              label={t("businessHub.billing.statusOverdue")}
              amount={currentStats.overdue_amount}
              count={currentStats.overdue_count}
              currency="AUD"
              color="#EF4444"
              colors={colors}
            />
          )}
        </View>
      )}

      {/* ── Status filter chips ── */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <FilterChip
          label={t("businessHub.billing.filterAll")}
          active={statusFilter === null}
          onPress={() => setStatusFilter(null)}
          colors={colors}
        />
        {(Object.keys(STATUS_CONFIG) as BillingStatus[]).map((status) => (
          <FilterChip
            key={status}
            label={t(STATUS_CONFIG[status].labelKey)}
            active={statusFilter === status}
            onPress={() => setStatusFilter(statusFilter === status ? null : status)}
            color={STATUS_CONFIG[status].color}
            colors={colors}
          />
        ))}
      </View>

      {/* ── Transfer list ── */}
      {transfers.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            padding: 40,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
          }}
        >
          <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 12,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {activeTab === "receivable"
              ? t("businessHub.billing.emptyReceivable")
              : t("businessHub.billing.emptyPayable")}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              marginTop: 4,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {t("businessHub.billing.emptyHint")}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {transfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              direction={activeTab}
              onStatusPress={() => showStatusActions(transfer)}
              onRefPress={() => handleAddPaymentRef(transfer)}
              formatAmount={formatAmount}
              formatDate={formatDate}
              colors={colors}
            />
          ))}
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  amount: number | null;
  count: number;
  currency: string;
  color: string;
  colors: any;
}> = ({ label, amount, count, currency, color, colors }) => (
  <View
    style={{
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: color,
    }}
  >
    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 2 }}>
      ${Number(amount ?? 0).toFixed(0)}
    </Text>
    <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>
      {count !== 1 ? `${count} jobs` : `${count} job`}
    </Text>
  </View>
);

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  colors: any;
}> = ({ label, active, onPress, color, colors }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: active ? (color || colors.primary) : colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: active ? (color || colors.primary) : colors.border,
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: active ? "600" : "400",
        color: active ? "#FFF" : colors.textSecondary,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

const TransferCard: React.FC<{
  transfer: BillingTransfer;
  direction: BillingDirection;
  onStatusPress: () => void;
  onRefPress: () => void;
  formatAmount: (amount: number, currency: string) => string;
  formatDate: (d: string | null) => string;
  colors: any;
}> = ({ transfer, direction, onStatusPress, onRefPress, formatAmount, formatDate, colors }) => {
  const { t } = useTranslation();
  const statusCfg = STATUS_CONFIG[transfer.billing_status];
  const partnerName =
    direction === "receivable"
      ? transfer.sender_display_name
      : transfer.recipient_display_name;
  const roleLabel =
    ROLE_LABEL_KEYS[transfer.delegated_role] ? t(ROLE_LABEL_KEYS[transfer.delegated_role]) : (transfer.delegated_role_label || transfer.delegated_role);
  const pricingLabel = PRICING_LABEL_KEYS[transfer.pricing_type] ? t(PRICING_LABEL_KEYS[transfer.pricing_type]) : "";

  return (
    <Pressable
      onPress={onStatusPress}
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header: job code + status badge */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
            {transfer.job_code || `Job #${transfer.job_id}`}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: statusCfg.color + "1A",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
          <Text style={{ color: statusCfg.color, fontSize: 12, fontWeight: "600" }}>
            {t(statusCfg.labelKey)}
          </Text>
        </View>
      </View>

      {/* Partner + role */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
        <Ionicons
          name={direction === "receivable" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
          size={16}
          color={direction === "receivable" ? "#10B981" : "#F59E0B"}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {direction === "receivable" ? t("businessHub.billing.from") : t("businessHub.billing.to")}{" "}
          <Text style={{ fontWeight: "600", color: colors.text }}>{partnerName}</Text>
          {" · "}
          {roleLabel}
        </Text>
      </View>

      {/* Amount + date row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
          {formatAmount(transfer.pricing_amount, transfer.currency)}
          {pricingLabel ? (
            <Text style={{ fontSize: 13, fontWeight: "400", color: colors.textSecondary }}>
              {" "}{pricingLabel}
            </Text>
          ) : null}
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {formatDate(transfer.job_date)}
        </Text>
      </View>

      {/* Payment reference if any */}
      {transfer.payment_reference && (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
          <Ionicons name="pricetag-outline" size={12} color={colors.textTertiary} />
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
            {t("businessHub.billing.ref")} {transfer.payment_reference}
          </Text>
        </View>
      )}

      {/* Due date warning */}
      {transfer.billing_status === "overdue" && transfer.payment_due_date && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
            gap: 4,
            backgroundColor: "#FEE2E2",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Ionicons name="time-outline" size={12} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontSize: 11 }}>
            {t("businessHub.billing.overdueDate")} {formatDate(transfer.payment_due_date)}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default InterContractorBillingScreen;

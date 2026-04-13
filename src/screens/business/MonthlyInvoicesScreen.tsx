/**
 * MonthlyInvoicesScreen — Récapitulatif mensuel des factures
 * Intégré dans la navigation Business > Finances > "Factures"
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization, useTranslation } from "../../localization/useLocalization";
import {
    fetchInvoiceClients,
    fetchMonthlyInvoiceDetail,
    fetchMonthlyInvoices,
    generateMonthlyInvoice,
    InvoiceClient,
    InvoicePeriodType,
    InvoiceStatus,
    MonthlyInvoice,
    MonthlyInvoiceDetail,
    sendMonthlyInvoice,
    updateMonthlyInvoice,
} from "../../services/monthlyInvoiceService";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { labelKey: string; icon: string; color: string }
> = {
  draft: { labelKey: "businessHub.invoices.statusDraft", icon: "create-outline", color: "#9CA3AF" },
  sent: { labelKey: "businessHub.invoices.statusSent", icon: "send-outline", color: "#3B82F6" },
  paid: { labelKey: "businessHub.invoices.statusPaid", icon: "checkmark-circle", color: "#10B981" },
  overdue: { labelKey: "businessHub.invoices.statusOverdue", icon: "warning", color: "#EF4444" },
  cancelled: { labelKey: "businessHub.invoices.statusCancelled", icon: "close-circle", color: "#6B7280" },
};

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

const MonthlyInvoicesScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLocalization();

  const MONTHS = React.useMemo(() => {
    const d = new Date(2024, 0, 1);
    return Array.from({ length: 12 }, (_, i) => {
      d.setMonth(i);
      return d.toLocaleDateString(currentLanguage, { month: "long" });
    });
  }, [currentLanguage]);

  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<MonthlyInvoiceDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(null);

  // ── Generate wizard state ──
  const [wizardVisible, setWizardVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState<"period" | "date" | "client" | "confirm">("period");
  const [wizardPeriodType, setWizardPeriodType] = useState<InvoicePeriodType>("monthly");
  const [wizardYear, setWizardYear] = useState(() => {
    const now = new Date();
    return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  });
  const [wizardMonth, setWizardMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() === 0 ? 12 : now.getMonth();
  });
  const [wizardWeekStart, setWizardWeekStart] = useState<string>("");
  const [wizardClientId, setWizardClientId] = useState<number | null>(null);
  const [wizardClientName, setWizardClientName] = useState<string>(t("businessHub.invoices.allClients"));
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // ────── Data loading ──────

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) setInitialLoading(true);
      try {
        const result = await fetchMonthlyInvoices({
          status: statusFilter ?? undefined,
        });
        setInvoices(result.data);
      } catch (err) {
        console.error("❌ [MonthlyInvoices] load error:", err);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadData(invoices.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  // ────── Actions ──────

  // Helper — get Monday of a given week offset
  const getMonday = (weeksBack = 0) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) - weeksBack * 7;
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  };

  const formatWeekRange = (startStr: string, days: number) => {
    const s = new Date(startStr);
    const e = new Date(s);
    e.setDate(e.getDate() + days);
    const fmt = (d: Date) =>
      d.toLocaleDateString(currentLanguage, { day: "numeric", month: "short" });
    return `${fmt(s)} → ${fmt(e)}`;
  };

  // ── Open wizard ──
  const handleGenerate = useCallback(() => {
    setWizardStep("period");
    setWizardPeriodType("monthly");
    setWizardClientId(null);
    setWizardClientName(t("businessHub.invoices.allClients"));
    const now = new Date();
    setWizardYear(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    setWizardMonth(now.getMonth() === 0 ? 12 : now.getMonth());
    setWizardWeekStart(getMonday(1));
    setWizardVisible(true);
  }, [t]);

  // ── Load clients when reaching client step ──
  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const data = await fetchInvoiceClients();
      setClients(data);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // ── Confirm generation ──
  const handleConfirmGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const invoice = await generateMonthlyInvoice(
        wizardYear,
        wizardMonth,
        wizardPeriodType,
        wizardPeriodType !== "monthly" ? wizardWeekStart : undefined,
        wizardClientId
      );
      setWizardVisible(false);
      if (invoice === null) {
        // No jobs found — show friendly message
        Alert.alert(
          t("businessHub.invoices.noJobsTitle"),
          t("businessHub.invoices.noJobsMessage")
        );
      } else {
        Alert.alert(
          t("businessHub.invoices.generated"),
          `${invoice.invoice_number}\n${invoice.total_jobs} jobs — $${Number(invoice.total_amount).toFixed(2)} AUD`
        );
        loadData(false);
      }
    } catch (err: any) {
      Alert.alert(
        t("businessHub.billing.error"),
        err.message || t("businessHub.invoices.generateError")
      );
    } finally {
      setGenerating(false);
    }
  }, [wizardYear, wizardMonth, wizardPeriodType, wizardWeekStart, wizardClientId, loadData, t]);

  // ── Wizard period label for confirm step ──
  const getWizardPeriodLabel = useCallback(() => {
    if (wizardPeriodType === "monthly") {
      return `${MONTHS[wizardMonth - 1]} ${wizardYear}`;
    }
    const days = wizardPeriodType === "weekly" ? 6 : 13;
    return formatWeekRange(wizardWeekStart, days);
  }, [wizardPeriodType, wizardYear, wizardMonth, wizardWeekStart, MONTHS]);

  // ── Build month options (last 12 months) ──
  const monthOptions = React.useMemo(() => {
    const options: { year: number; month: number; label: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return options;
  }, [MONTHS]);

  // ── Build week options (last 8 weeks for weekly, last 6 for fortnightly) ──
  const weekOptions = React.useMemo(() => {
    const count = wizardPeriodType === "fortnightly" ? 6 : 8;
    const days = wizardPeriodType === "fortnightly" ? 13 : 6;
    const step = wizardPeriodType === "fortnightly" ? 2 : 1;
    const options: { weekStart: string; label: string }[] = [];
    for (let i = 1; i <= count; i++) {
      const ws = getMonday(i * step);
      options.push({
        weekStart: ws,
        label: formatWeekRange(ws, days),
      });
    }
    return options;
  }, [wizardPeriodType, currentLanguage]);

  const handleInvoicePress = useCallback(async (invoice: MonthlyInvoice) => {
    try {
      const detail = await fetchMonthlyInvoiceDetail(invoice.id);
      setSelectedInvoice(detail);
    } catch (err: any) {
      Alert.alert(t("businessHub.billing.error"), err.message || t("businessHub.invoices.loadError"));
    }
  }, []);

  const handleSend = useCallback(
    async (invoice: MonthlyInvoice) => {
      Alert.alert(
        t("businessHub.invoices.sendTitle"),
        t("businessHub.invoices.sendMessage", { number: invoice.invoice_number }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.send", { defaultValue: "Send" }),
            onPress: async () => {
              try {
                const result = await sendMonthlyInvoice(invoice.id);
                Alert.alert(t("businessHub.invoices.sent"), result.message);
                loadData(false);
              } catch (err: any) {
                Alert.alert(t("businessHub.billing.error"), err.message);
              }
            },
          },
        ]
      );
    },
    [loadData]
  );

  const handleStatusChange = useCallback(
    (invoice: MonthlyInvoice) => {
      const options: { text: string; status: InvoiceStatus }[] = [];

      if (invoice.status !== "sent") {
        options.push({ text: t("businessHub.invoices.markSent"), status: "sent" });
      }
      if (invoice.status !== "paid") {
        options.push({ text: t("businessHub.invoices.markPaid"), status: "paid" });
      }
      if (invoice.status !== "overdue") {
        options.push({ text: t("businessHub.invoices.markOverdue"), status: "overdue" });
      }
      if (invoice.status !== "cancelled") {
        options.push({ text: t("businessHub.invoices.markCancelled"), status: "cancelled" });
      }

      Alert.alert(
        invoice.invoice_number,
        `$${Number(invoice.total_amount).toFixed(2)} — ${t(STATUS_CONFIG[invoice.status].labelKey)}`,
        [
          ...options.map((opt) => ({
            text: opt.text,
            onPress: async () => {
              try {
                await updateMonthlyInvoice(invoice.id, {
                  status: opt.status,
                });
                loadData(false);
                if (selectedInvoice?.id === invoice.id) {
                  setSelectedInvoice(null);
                }
              } catch (err: any) {
                Alert.alert(t("businessHub.billing.error"), err.message);
              }
            },
          })),
          { text: t("businessHub.invoices.close"), style: "cancel" as const },
        ]
      );
    },
    [loadData, selectedInvoice]
  );

  // ────── Helpers ──────

  const formatPeriod = (periodStart: string, periodEnd?: string, periodType?: string) => {
    if (periodType === "weekly" || periodType === "fortnightly") {
      const s = new Date(periodStart);
      const e = periodEnd ? new Date(periodEnd) : s;
      const fmt = (d: Date) =>
        d.toLocaleDateString(currentLanguage, { day: "numeric", month: "short", year: "numeric" });
      return `${fmt(s)} → ${fmt(e)}`;
    }
    const d = new Date(periodStart);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ────── Detail view ──────

  if (selectedInvoice) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Pressable
          onPress={() => setSelectedInvoice(null)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "500" }}>
            {t("businessHub.invoices.back")}
          </Text>
        </Pressable>

        {/* Invoice branded header */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: 16,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            borderTopWidth: 3,
            borderTopColor: selectedInvoice.company_primary_color || colors.primary,
          }}
        >
          {/* Company branding row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              gap: 12,
            }}
          >
            {selectedInvoice.company_logo_url ? (
              <Image
                source={{ uri: selectedInvoice.company_logo_url }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.border,
                }}
                resizeMode="contain"
              />
            ) : null}
            <View style={{ flex: 1 }}>
              {selectedInvoice.company_display_name && (
                <Text
                  style={{
                    color: selectedInvoice.company_primary_color || colors.primary,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {selectedInvoice.company_display_name}
                </Text>
              )}
              {selectedInvoice.company_abn && (
                <Text
                  style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}
                >
                  ABN: {selectedInvoice.company_abn}
                </Text>
              )}
            </View>
            <StatusBadge status={selectedInvoice.status} colors={colors} />
          </View>

          {/* Invoice number + period */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {selectedInvoice.invoice_number}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                {formatPeriod(selectedInvoice.period_start, selectedInvoice.period_end, selectedInvoice.period_type)}
              </Text>
            </View>
            {selectedInvoice.due_date && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {t("businessHub.invoices.dueDate")}
                </Text>
                <Text
                  style={{
                    color:
                      selectedInvoice.status === "overdue"
                        ? "#EF4444"
                        : colors.text,
                    fontSize: 14,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {formatDate(selectedInvoice.due_date)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Line items */}
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}
        >
          {t("businessHub.invoices.jobDetails", { count: String(selectedInvoice.items.length) })}
        </Text>

        {selectedInvoice.items.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: 12,
              marginBottom: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                {item.job_code || `Job #${item.job_id}`}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {formatDate(item.job_date)}
                {item.hours_worked
                  ? ` • ${item.hours_worked}h`
                  : item.billing_mode === "flat_rate"
                    ? ` • ${t("businessHub.invoices.flatRate")}`
                    : ""}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
              ${Number(item.amount).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: 16,
            marginTop: DESIGN_TOKENS.spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TotalRow
            label={t("businessHub.invoices.subtotal", { count: String(selectedInvoice.total_jobs) })}
            value={`$${Number(selectedInvoice.subtotal).toFixed(2)}`}
            colors={colors}
          />
          {selectedInvoice.commission_amount > 0 && (
            <TotalRow
              label={t("businessHub.invoices.platformCommission", { rate: String(selectedInvoice.commission_rate) })}
              value={`-$${Number(selectedInvoice.commission_amount).toFixed(2)}`}
              colors={colors}
              valueColor="#EF4444"
            />
          )}
          <TotalRow
            label={t("businessHub.invoices.gst")}
            value={`$${Number(selectedInvoice.tax_amount).toFixed(2)}`}
            colors={colors}
          />
          <View
            style={{
              borderTopWidth: 2,
              borderTopColor: colors.border,
              marginTop: 8,
              paddingTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 17 }}
            >
              Total
            </Text>
            <Text
              style={{ color: selectedInvoice.company_primary_color || colors.primary, fontWeight: "700", fontSize: 17 }}
            >
              ${Number(selectedInvoice.total_amount).toFixed(2)}{" "}
              {selectedInvoice.currency}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {selectedInvoice.status === "draft" && (
            <Pressable
              onPress={() => handleSend(selectedInvoice)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
            >
              <Ionicons name="send" size={18} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
                {t("businessHub.invoices.sendByEmail")}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => handleStatusChange(selectedInvoice)}
            style={{
              flex: selectedInvoice.status === "draft" ? undefined : 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: colors.backgroundSecondary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14 }}>
              {t("businessHub.invoices.status")}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ────── Loading state ──────

  if (initialLoading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          {t("businessHub.invoices.loading")}
        </Text>
      </View>
    );
  }

  // ────── Main list view ──────

  return (
    <>
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Generate button ── */}
      <Pressable
        onPress={handleGenerate}
        disabled={generating}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: DESIGN_TOKENS.radius.lg,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          opacity: generating ? 0.6 : 1,
        }}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Ionicons name="add-circle" size={20} color="#FFF" />
        )}
        <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
          {generating ? t("businessHub.invoices.generating") : t("businessHub.invoices.generateInvoice")}
        </Text>
      </Pressable>

      {/* ── Filter chips ── */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          flexWrap: "wrap",
        }}
      >
        <FilterChip
          label={t("businessHub.invoices.filterAll")}
          active={statusFilter === null}
          onPress={() => setStatusFilter(null)}
          colors={colors}
        />
        {(["draft", "sent", "paid", "overdue"] as InvoiceStatus[]).map(
          (status) => (
            <FilterChip
              key={status}
              label={t(STATUS_CONFIG[status].labelKey)}
              active={statusFilter === status}
              onPress={() =>
                setStatusFilter(statusFilter === status ? null : status)
              }
              color={STATUS_CONFIG[status].color}
              colors={colors}
            />
          )
        )}
      </View>

      {/* ── Invoice list ── */}
      {invoices.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            padding: 40,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 12,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {t("businessHub.invoices.emptyTitle")}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              marginTop: 4,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {t("businessHub.invoices.emptyHint")}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPress={() => handleInvoicePress(invoice)}
              onSend={() => handleSend(invoice)}
              onStatusPress={() => handleStatusChange(invoice)}
              formatPeriod={formatPeriod}
              formatDate={formatDate}
              colors={colors}
            />
          ))}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>

    {/* ═════════ Generate Invoice Wizard Modal ═════════ */}
    <Modal
      visible={wizardVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setWizardVisible(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={() => setWizardVisible(false)}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
            maxHeight: "85%",
          }}
          onPress={() => {}}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          {/* ── Step: PERIOD TYPE ── */}
          {wizardStep === "period" && (
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                {t("businessHub.invoices.generateTitle")}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
                {t("businessHub.invoices.choosePeriodType")}
              </Text>
              {(["monthly", "weekly", "fortnightly"] as InvoicePeriodType[]).map((pt) => (
                <Pressable
                  key={pt}
                  onPress={() => {
                    setWizardPeriodType(pt);
                    setWizardStep("date");
                    if (pt !== "monthly") setWizardWeekStart(getMonday(pt === "fortnightly" ? 2 : 1));
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons
                    name={pt === "monthly" ? "calendar" : pt === "weekly" ? "calendar-outline" : "calendar-number-outline"}
                    size={22}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                      {t(`businessHub.invoices.period${pt.charAt(0).toUpperCase() + pt.slice(1)}`)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {t(`businessHub.invoices.period${pt.charAt(0).toUpperCase() + pt.slice(1)}Desc`)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Step: DATE SELECTION ── */}
          {wizardStep === "date" && (
            <View>
              <Pressable
                onPress={() => setWizardStep("period")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14 }}>{t("businessHub.invoices.back")}</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                {t("businessHub.invoices.selectDate")}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                {t(`businessHub.invoices.selectDate${wizardPeriodType.charAt(0).toUpperCase() + wizardPeriodType.slice(1)}Hint`)}
              </Text>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {wizardPeriodType === "monthly"
                  ? monthOptions.map((opt) => {
                      const selected = opt.year === wizardYear && opt.month === wizardMonth;
                      return (
                        <Pressable
                          key={`${opt.year}-${opt.month}`}
                          onPress={() => {
                            setWizardYear(opt.year);
                            setWizardMonth(opt.month);
                            setWizardStep("client");
                            loadClients();
                          }}
                          style={{
                            padding: 14,
                            backgroundColor: selected ? colors.primary + "15" : colors.backgroundSecondary,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: selected ? colors.primary : colors.border,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: selected ? "600" : "400", fontSize: 15 }}>
                            {opt.label}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={selected ? colors.primary : colors.textSecondary} />
                        </Pressable>
                      );
                    })
                  : weekOptions.map((opt) => {
                      const selected = opt.weekStart === wizardWeekStart;
                      return (
                        <Pressable
                          key={opt.weekStart}
                          onPress={() => {
                            setWizardWeekStart(opt.weekStart);
                            setWizardStep("client");
                            loadClients();
                          }}
                          style={{
                            padding: 14,
                            backgroundColor: selected ? colors.primary + "15" : colors.backgroundSecondary,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: selected ? colors.primary : colors.border,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: selected ? "600" : "400", fontSize: 15 }}>
                            {opt.label}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={selected ? colors.primary : colors.textSecondary} />
                        </Pressable>
                      );
                    })}
              </ScrollView>
            </View>
          )}

          {/* ── Step: CLIENT SELECTION ── */}
          {wizardStep === "client" && (
            <View>
              <Pressable
                onPress={() => setWizardStep("date")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14 }}>{t("businessHub.invoices.back")}</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                {t("businessHub.invoices.selectClient")}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                {t("businessHub.invoices.selectClientHint")}
              </Text>

              {loadingClients ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {/* "All clients" option */}
                  <Pressable
                    onPress={() => {
                      setWizardClientId(null);
                      setWizardClientName(t("businessHub.invoices.allClients"));
                      setWizardStep("confirm");
                    }}
                    style={{
                      padding: 14,
                      backgroundColor: wizardClientId === null ? colors.primary + "15" : colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: wizardClientId === null ? colors.primary : colors.border,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name="people" size={20} color={colors.primary} />
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                        {t("businessHub.invoices.allClients")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </Pressable>

                  {clients.map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => {
                        setWizardClientId(client.id);
                        setWizardClientName(client.display_name);
                        setWizardStep("confirm");
                      }}
                      style={{
                        padding: 14,
                        backgroundColor: wizardClientId === client.id ? colors.primary + "15" : colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: wizardClientId === client.id ? colors.primary : colors.border,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.primary + "20",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                            {(client.first_name?.[0] || "").toUpperCase()}
                            {(client.last_name?.[0] || "").toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: colors.text, fontWeight: "500", fontSize: 15 }}>
                            {client.display_name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {client.total_jobs} {client.total_jobs > 1 ? "jobs" : "job"}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                  ))}

                  {clients.length === 0 && !loadingClients && (
                    <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 12, fontSize: 14 }}>
                      {t("businessHub.invoices.noClients")}
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {/* ── Step: CONFIRM ── */}
          {wizardStep === "confirm" && (
            <View>
              <Pressable
                onPress={() => setWizardStep("client")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14 }}>{t("businessHub.invoices.back")}</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
                {t("businessHub.invoices.confirmTitle")}
              </Text>

              {/* Summary card */}
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {t("businessHub.invoices.periodLabel")}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                    {t(`businessHub.invoices.period${wizardPeriodType.charAt(0).toUpperCase() + wizardPeriodType.slice(1)}`)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {t("businessHub.invoices.dateRange")}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                    {getWizardPeriodLabel()}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {t("businessHub.invoices.client")}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                    {wizardClientName}
                  </Text>
                </View>
              </View>

              {/* Generate button */}
              <Pressable
                onPress={handleConfirmGenerate}
                disabled={generating}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="document-text" size={20} color="#FFF" />
                )}
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                  {generating ? t("businessHub.invoices.generating") : t("common.generate", { defaultValue: "Generate" })}
                </Text>
              </Pressable>

              {/* Cancel */}
              <Pressable
                onPress={() => setWizardVisible(false)}
                style={{ alignSelf: "center", marginTop: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {t("common.cancel")}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: InvoiceStatus; colors: any }> = ({
  status,
  colors,
}) => {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: cfg.color + "1A",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      }}
    >
      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
      <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600" }}>
        {t(cfg.labelKey)}
      </Text>
    </View>
  );
};

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
      backgroundColor: active
        ? color || colors.primary
        : colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: active ? color || colors.primary : colors.border,
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

const TotalRow: React.FC<{
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}> = ({ label, value, colors, valueColor }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    }}
  >
    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
    <Text
      style={{
        color: valueColor || colors.text,
        fontSize: 14,
        fontWeight: "500",
      }}
    >
      {value}
    </Text>
  </View>
);

const InvoiceCard: React.FC<{
  invoice: MonthlyInvoice;
  onPress: () => void;
  onSend: () => void;
  onStatusPress: () => void;
  formatPeriod: (p: string, pe?: string, pt?: string) => string;
  formatDate: (d: string | null) => string;
  colors: any;
}> = ({
  invoice,
  onPress,
  onSend,
  onStatusPress,
  formatPeriod,
  formatDate,
  colors,
}) => {
  const { t } = useTranslation();
  const statusCfg = STATUS_CONFIG[invoice.status];
  void statusCfg; // used for StatusBadge

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}
          >
            {formatPeriod(invoice.period_start, invoice.period_end, invoice.period_type)}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {invoice.invoice_number}
            {invoice.client_name ? ` • ${invoice.client_name}` : ""}
          </Text>
        </View>
        <StatusBadge status={invoice.status} colors={colors} />
      </View>

      {/* Amount + jobs */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 12,
        }}
      >
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {invoice.total_jobs} job{invoice.total_jobs > 1 ? "s" : ""}
          </Text>
          {invoice.due_date && (
            <Text
              style={{
                color:
                  invoice.status === "overdue"
                    ? "#EF4444"
                    : colors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {t("businessHub.invoices.dueDate")}: {formatDate(invoice.due_date)}
            </Text>
          )}
        </View>
        <Text
          style={{ color: colors.text, fontWeight: "700", fontSize: 20 }}
        >
          ${Number(invoice.total_amount).toFixed(2)}
        </Text>
      </View>

      {/* Action buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 10,
        }}
      >
        {invoice.status === "draft" && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onSend();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.primary + "15",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: DESIGN_TOKENS.radius.md,
            }}
          >
            <Ionicons name="send-outline" size={14} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {t("common.send", { defaultValue: "Send" })}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onStatusPress();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.backgroundTertiary || colors.border + "40",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: DESIGN_TOKENS.radius.md,
          }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: "500",
            }}
          >
            {t("businessHub.invoices.actions", { defaultValue: "Actions" })}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default MonthlyInvoicesScreen;

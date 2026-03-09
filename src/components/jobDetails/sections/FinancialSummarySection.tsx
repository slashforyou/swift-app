/**
 * FinancialSummarySection - Résumé financier du job
 * Affiche montant estimé, heures facturables, coût en cours, statut paiement
 */
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface FinancialSummarySectionProps {
  job: JobSummaryData;
}

const FinancialSummarySection: React.FC<FinancialSummarySectionProps> =
  React.memo(({ job }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const timerInfo = job?.timer_info;
    const billableHours = timerInfo?.timer_billable_hours || 0;
    const breakHours = timerInfo?.timer_break_hours || 0;
    const hourlyRate = job?.hourly_rate || job?.rate || 0;
    const amountDue = job?.amount_due;
    const amountPaid = job?.amount_paid;
    const amountTotal = job?.amount_total;
    const paymentStatus = job?.payment_status;

    const hasAnyData =
      billableHours > 0 ||
      amountTotal ||
      amountDue ||
      amountPaid ||
      paymentStatus;

    const formatCurrency = (amount: number | string | null | undefined) => {
      if (amount == null) return "-";
      const num = typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(num)) return "-";
      return `$${num.toFixed(2)}`;
    };

    const formatHours = (hours: number) => {
      if (hours === 0) return "-";
      if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
      }
      return `${hours.toFixed(1)}h`;
    };

    const paymentBadge = useMemo(() => {
      switch (paymentStatus) {
        case "paid":
          return {
            text: t("jobDetails.components.financial.paid"),
            bg: colors.success + "20",
            color: colors.success,
          };
        case "partial":
          return {
            text: t("jobDetails.components.financial.partial"),
            bg: colors.warning + "20",
            color: colors.warning,
          };
        default:
          return {
            text: t("jobDetails.components.financial.unpaid"),
            bg: colors.textSecondary + "20",
            color: colors.textSecondary,
          };
      }
    }, [paymentStatus, colors, t]);

    const themedStyles = useMemo(
      () =>
        StyleSheet.create({
          header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: DESIGN_TOKENS.spacing.md,
          },
          title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
          },
          badge: {
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: 3,
            borderRadius: DESIGN_TOKENS.radius.sm,
          },
          badgeText: {
            fontSize: 12,
            fontWeight: "700",
          },
          grid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: DESIGN_TOKENS.spacing.sm,
          },
          card: {
            flex: 1,
            minWidth: "45%",
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: colors.border + "40",
          },
          cardLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          },
          cardValue: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
          },
          cardValueSmall: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
          },
        }),
      [colors],
    );

    // Don't show section if no financial data at all
    if (!hasAnyData) return null;

    return (
      <SectionCard level="secondary">
        <View style={themedStyles.header}>
          <Text style={themedStyles.title}>
            {t("jobDetails.components.financial.title")}
          </Text>
          <View
            style={[themedStyles.badge, { backgroundColor: paymentBadge.bg }]}
          >
            <Text
              style={[themedStyles.badgeText, { color: paymentBadge.color }]}
            >
              {paymentBadge.text}
            </Text>
          </View>
        </View>

        <View style={themedStyles.grid}>
          {/* Billable hours */}
          {billableHours > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.billableHours")}
              </Text>
              <Text style={themedStyles.cardValue}>
                {formatHours(billableHours)}
              </Text>
            </View>
          )}

          {/* Break time */}
          {breakHours > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.breakTime")}
              </Text>
              <Text style={themedStyles.cardValueSmall}>
                {formatHours(breakHours)}
              </Text>
            </View>
          )}

          {/* Estimated total */}
          {amountTotal != null && amountTotal > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.estimatedTotal")}
              </Text>
              <Text style={themedStyles.cardValue}>
                {formatCurrency(amountTotal)}
              </Text>
            </View>
          )}

          {/* Amount paid */}
          {amountPaid != null && amountPaid > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.amountPaid")}
              </Text>
              <Text style={[themedStyles.cardValue, { color: colors.success }]}>
                {formatCurrency(amountPaid)}
              </Text>
            </View>
          )}

          {/* Amount due */}
          {amountDue != null && amountDue > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.amountDue")}
              </Text>
              <Text style={[themedStyles.cardValue, { color: colors.warning }]}>
                {formatCurrency(amountDue)}
              </Text>
            </View>
          )}

          {/* Estimated cost from timer (rate × hours) */}
          {hourlyRate > 0 && billableHours > 0 && (
            <View style={themedStyles.card}>
              <Text style={themedStyles.cardLabel}>
                {t("jobDetails.components.financial.currentCost")}
              </Text>
              <Text style={themedStyles.cardValue}>
                {formatCurrency(hourlyRate * billableHours)}
              </Text>
            </View>
          )}
        </View>
      </SectionCard>
    );
  });

FinancialSummarySection.displayName = "FinancialSummarySection";

export default FinancialSummarySection;

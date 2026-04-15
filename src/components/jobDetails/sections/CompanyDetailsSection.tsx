/**
 * CompanyDetailsSection - Section modulaire pour les informations d'entreprise
 * Affiche intelligemment les rôles contractee/contractor selon le contexte
 */
import React from "react";
import { Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface CompanyDetailsSectionProps {
  job: JobSummaryData;
}

const CompanyDetailsSection: React.FC<CompanyDetailsSectionProps> = React.memo(
  ({ job }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const hasContractee = !!job?.contractee;
    const hasContractor = !!job?.contractor;

    const isDifferentCompany =
      hasContractee &&
      hasContractor &&
      job.contractee!.company_id !== job.contractor!.company_id;

    if (!hasContractee && !hasContractor) {
      return null;
    }

    const mainCompanyName = isDifferentCompany
      ? job.contractor?.company_name
      : job.contractee?.company_name || job.contractor?.company_name;

    const formatAssignedDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateString;
      }
    };

    return (
      <SectionCard level="secondary">
        <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}
          >
            {isDifferentCompany
              ? t("jobDetails.components.company.titleMulti")
              : t("jobDetails.components.company.titleSingle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {isDifferentCompany
              ? t("jobDetails.components.company.subtitleMulti")
              : t("jobDetails.components.company.subtitleSingle")}
          </Text>
        </View>

        {isDifferentCompany ? (
          <>
            {/* Contractee */}
            <View
              style={{
                marginBottom: DESIGN_TOKENS.spacing.lg,
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.success + "10",
                borderRadius: DESIGN_TOKENS.radius.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.success,
              }}
            >
              <View style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "600",
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("jobDetails.components.company.contracteeRole")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                  }}
                >
                  {t("jobDetails.components.company.receivesPayment")}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  fontWeight: "600",
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {job.contractee!.company_name}
              </Text>

              {job.contractee!.created_by_name && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("jobDetails.components.company.createdBy")}{" "}
                    <Text style={{ fontWeight: "500", color: colors.text }}>
                      {job.contractee!.created_by_name}
                    </Text>
                  </Text>
                </View>
              )}

              {job.contractee!.stripe_account_id && (
                <View
                  style={{
                    marginTop: DESIGN_TOKENS.spacing.sm,
                    paddingTop: DESIGN_TOKENS.spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors.border + "30",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                    }}
                  >
                    Stripe:{" "}
                    <Text style={{ fontFamily: "monospace", fontSize: 10 }}>
                      {job.contractee!.stripe_account_id.substring(0, 16)}...
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Contractor */}
            <View
              style={{
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.info + "10",
                borderRadius: DESIGN_TOKENS.radius.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.info,
              }}
            >
              <View style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "600",
                    marginBottom: DESIGN_TOKENS.spacing.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("jobDetails.components.company.contractorRole")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                  }}
                >
                  {t("jobDetails.components.company.performsWork")}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  fontWeight: "600",
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {job.contractor!.company_name}
              </Text>

              {job.contractor!.assigned_staff_name && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: DESIGN_TOKENS.spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("jobDetails.components.company.assignedStaff")}{" "}
                    <Text style={{ fontWeight: "500", color: colors.text }}>
                      {job.contractor!.assigned_staff_name}
                    </Text>
                  </Text>
                </View>
              )}

              {job.contractor!.assigned_at && (
                <View
                  style={{
                    marginTop: DESIGN_TOKENS.spacing.sm,
                    paddingTop: DESIGN_TOKENS.spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors.border + "30",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("jobDetails.components.company.assignedOn")}{" "}
                    {formatAssignedDate(job.contractor!.assigned_at)}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: "500",
                marginBottom: DESIGN_TOKENS.spacing.xs,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("jobDetails.components.company.companyLabel")}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.text,
                fontWeight: "600",
              }}
            >
              {mainCompanyName}
            </Text>

            {(job.contractee?.created_by_name ||
              job.contractor?.assigned_staff_name) && (
              <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                {job.contractee?.created_by_name && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    {t("jobDetails.components.company.createdBy")}{" "}
                    <Text style={{ fontWeight: "500", color: colors.text }}>
                      {job.contractee!.created_by_name}
                    </Text>
                  </Text>
                )}

                {job.contractor?.assigned_staff_name && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    {t("jobDetails.components.company.assignedStaff")}{" "}
                    <Text style={{ fontWeight: "500", color: colors.text }}>
                      {job.contractor!.assigned_staff_name}
                    </Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </SectionCard>
    );
  },
);

CompanyDetailsSection.displayName = 'CompanyDetailsSection';

export default CompanyDetailsSection;

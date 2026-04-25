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

    return (
      <SectionCard level="secondary">
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          {isDifferentCompany
            ? t("jobDetails.components.company.titleMulti")
            : t("jobDetails.components.company.titleSingle")}
        </Text>

        {isDifferentCompany ? (
          <>
            {/* Contractee */}
            <View
              style={{
                marginBottom: DESIGN_TOKENS.spacing.sm,
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.backgroundTertiary,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.success,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.success,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 4,
                }}
              >
                {t("jobDetails.components.company.contracteeRole")}
              </Text>
              <Text
                style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}
              >
                {job.contractee!.company_name}
              </Text>
              {job.contractee!.created_by_name && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 3,
                  }}
                >
                  {t("jobDetails.components.company.createdBy")}{" "}
                  {job.contractee!.created_by_name}
                </Text>
              )}
            </View>

            {/* Contractor */}
            <View
              style={{
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.backgroundTertiary,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.info,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.info,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 4,
                }}
              >
                {t("jobDetails.components.company.contractorRole")}
              </Text>
              <Text
                style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}
              >
                {job.contractor!.company_name}
              </Text>
              {job.contractor!.assigned_staff_name && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 3,
                  }}
                >
                  {t("jobDetails.components.company.assignedStaff")}{" "}
                  {job.contractor!.assigned_staff_name}
                </Text>
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              padding: DESIGN_TOKENS.spacing.md,
              backgroundColor: colors.backgroundTertiary,
              borderRadius: DESIGN_TOKENS.radius.md,
            }}
          >
            <Text
              style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}
            >
              {mainCompanyName}
            </Text>
            {(job.contractee?.created_by_name ||
              job.contractor?.assigned_staff_name) && (
              <View style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
                {job.contractee?.created_by_name && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 2,
                    }}
                  >
                    {t("jobDetails.components.company.createdBy")}{" "}
                    {job.contractee!.created_by_name}
                  </Text>
                )}
                {job.contractor?.assigned_staff_name && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {t("jobDetails.components.company.assignedStaff")}{" "}
                    {job.contractor!.assigned_staff_name}
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

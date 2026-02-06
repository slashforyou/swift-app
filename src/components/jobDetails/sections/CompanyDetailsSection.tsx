/**
 * CompanyDetailsSection - Section modulaire pour les informations d'entreprise
 * Affiche intelligemment les rôles contractee/contractor selon le contexte
 */
import React from "react";
import { Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import SectionCard from "../SectionCard";

interface CompanyDetailsSectionProps {
  job: any;
}

const CompanyDetailsSection: React.FC<CompanyDetailsSectionProps> = ({
  job,
}) => {
  const { colors } = useTheme();

  // Vérifier si c'est un job multi-entreprise
  const hasContractee = !!job?.contractee;
  const hasContractor = !!job?.contractor;

  // Déterminer si c'est la même entreprise ou non
  const isDifferentCompany =
    hasContractee &&
    hasContractor &&
    job.contractee.company_id !== job.contractor.company_id;

  console.log("🏢 [CompanyDetailsSection] Rendu:", {
    hasContractee,
    hasContractor,
    isDifferentCompany,
    // Détails contractee
    contractee: job?.contractee
      ? {
          id: job.contractee.company_id,
          name: job.contractee.company_name,
        }
      : null,
    // Détails contractor
    contractor: job?.contractor
      ? {
          id: job.contractor.company_id,
          name: job.contractor.company_name,
        }
      : null,
  });

  // Si pas de données d'ownership, ne rien afficher
  if (!hasContractee && !hasContractor) {
    console.log(
      "⚠️ [CompanyDetailsSection] Aucune donnée ownership - composant masqué",
    );
    return null;
  }

  console.log(
    `✅ [CompanyDetailsSection] Affichage: ${isDifferentCompany ? "MULTI-ENTREPRISE (2 sections)" : "JOB INTERNE (1 section)"}`,
  );

  // Nom de l'entreprise principale (contractor ou contractee si même entreprise)
  const mainCompanyName = isDifferentCompany
    ? job.contractor?.company_name
    : job.contractee?.company_name || job.contractor?.company_name;

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
          {isDifferentCompany ? "Entreprises Impliquées" : "Entreprise"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
          }}
        >
          {isDifferentCompany
            ? "Job multi-entreprise - Informations de facturation et d'exécution"
            : "Entreprise responsable du job"}
        </Text>
      </View>

      {/* Si job multi-entreprise, afficher les deux rôles */}
      {isDifferentCompany ? (
        <>
          {/* Contractee (Créateur - Reçoit le paiement) */}
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
                💰 Créateur du job (Contractee)
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontStyle: "italic",
                }}
              >
                Entreprise qui reçoit le paiement
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
              {job.contractee.company_name}
            </Text>

            {job.contractee.created_by_name && (
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
                  👤 Créé par:{" "}
                  <Text style={{ fontWeight: "500", color: colors.text }}>
                    {job.contractee.created_by_name}
                  </Text>
                </Text>
              </View>
            )}

            {job.contractee.stripe_account_id && (
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
                    {job.contractee.stripe_account_id.substring(0, 16)}...
                  </Text>
                </Text>
              </View>
            )}
          </View>

          {/* Contractor (Exécutant) */}
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
                🔧 Exécutant (Contractor)
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontStyle: "italic",
                }}
              >
                Entreprise qui effectue le travail
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
              {job.contractor.company_name}
            </Text>

            {job.contractor.assigned_staff_name && (
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
                  👷 Staff assigné:{" "}
                  <Text style={{ fontWeight: "500", color: colors.text }}>
                    {job.contractor.assigned_staff_name}
                  </Text>
                </Text>
              </View>
            )}

            {job.contractor.assigned_at && (
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
                  Assigné le:{" "}
                  {new Date(job.contractor.assigned_at).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        /* Si même entreprise, afficher seulement l'entreprise principale */
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
            🏢 Entreprise
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
                  👤 Créé par:{" "}
                  <Text style={{ fontWeight: "500", color: colors.text }}>
                    {job.contractee.created_by_name}
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
                  👷 Staff assigné:{" "}
                  <Text style={{ fontWeight: "500", color: colors.text }}>
                    {job.contractor.assigned_staff_name}
                  </Text>
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </SectionCard>
  );
};

export default CompanyDetailsSection;

/**
 * SignaturePreviewSection - Aperçu compact de la signature client
 * Affiche un mini aperçu si le job est signé, avec la date de signature
 */
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface SignaturePreviewSectionProps {
  job: JobSummaryData;
}

const SignaturePreviewSection: React.FC<SignaturePreviewSectionProps> =
  React.memo(({ job }) => {
    const { colors } = useTheme();
    const { t } = useLocalization();

    const signatureUri = job?.signatureDataUrl || job?.signature_blob;
    const signatureDate = job?.signature_date;

    const formattedDate = useMemo(() => {
      if (!signatureDate) return null;
      try {
        return new Date(signatureDate).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return signatureDate;
      }
    }, [signatureDate]);

    const isDataUri = signatureUri?.startsWith("data:");

    const themedStyles = useMemo(
      () =>
        StyleSheet.create({
          header: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: DESIGN_TOKENS.spacing.md,
          },
          title: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginLeft: DESIGN_TOKENS.spacing.xs,
          },
          previewContainer: {
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
            borderColor: colors.border + "60",
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: "center",
          },
          signatureImage: {
            width: "100%",
            height: 80,
          },
          dateRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: DESIGN_TOKENS.spacing.sm,
          },
          dateText: {
            fontSize: 12,
            color: colors.textSecondary,
          },
          checkBadge: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.success + "15",
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: 3,
            borderRadius: DESIGN_TOKENS.radius.sm,
            marginLeft: DESIGN_TOKENS.spacing.sm,
          },
          checkText: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.success,
          },
        }),
      [colors],
    );

    if (!signatureUri) return null;

    return (
      <SectionCard level="secondary">
        <View style={themedStyles.header}>
          <Text style={themedStyles.title}>
            {t("jobDetails.components.signaturePreview.title")}
          </Text>
        </View>

        <View style={themedStyles.previewContainer}>
          {isDataUri ? (
            <Image
              source={{ uri: signatureUri }}
              style={themedStyles.signatureImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={{ uri: signatureUri }}
              style={themedStyles.signatureImage}
              resizeMode="contain"
            />
          )}

          <View style={themedStyles.dateRow}>
            {formattedDate && (
              <Text style={themedStyles.dateText}>
                {t("jobDetails.components.signaturePreview.signedOn")}{" "}
                {formattedDate}
              </Text>
            )}
            <View style={themedStyles.checkBadge}>
              <Text style={themedStyles.checkText}>
                {t("jobDetails.components.signaturePreview.verified")}
              </Text>
            </View>
          </View>
        </View>
      </SectionCard>
    );
  });

SignaturePreviewSection.displayName = "SignaturePreviewSection";

export default SignaturePreviewSection;

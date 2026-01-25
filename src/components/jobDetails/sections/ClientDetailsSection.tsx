/**
 * ClientDetailsSection - Section modulaire pour les informations client
 */
import React from "react";
import { Text, View, Pressable } from "react-native";
import { useTheme } from "../../../context/ThemeProvider";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useLocalization } from "../../../localization/useLocalization";
import SectionCard from "../SectionCard";
import { Button } from "../../ui/Button";
import copyToClipBoard from "../../../services/copyToClipBoard";
import contactLink from "../../../services/contactLink";

interface ClientDetailsSectionProps {
  job: any;
}

const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // Extraire les infos client avec fallbacks robustes
  const client = job?.client || {};

  // Nom: priorité à name, sinon firstName + lastName
  const clientName =
    client.name ||
    (client.firstName && client.lastName
      ? `${client.firstName} ${client.lastName}`.trim()
      : client.firstName || client.lastName || t("jobDetails.client.unknown"));

  // Téléphone avec fallback
  const clientPhone = client.phone || t("jobDetails.client.noPhone");
  const hasPhone = client.phone && client.phone !== "N/A";

  // Email avec fallback
  const clientEmail = client.email || t("jobDetails.client.noEmail");
  const hasEmail = client.email && client.email !== "N/A";

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
          {t("jobDetails.client.title")}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {t("jobDetails.client.subtitle")}
        </Text>
      </View>

      {/* Nom du client */}
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
          {t("jobDetails.client.name")}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.text,
            fontWeight: "500",
          }}
        >
          {clientName}
        </Text>
      </View>

      {/* Numéro de téléphone */}
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
          {t("jobDetails.client.phone")}
        </Text>
        {hasPhone ? (
          <Pressable
            onPress={() => copyToClipBoard(clientPhone)}
            hitSlop={{
              top: DESIGN_TOKENS.touch.hitSlop,
              bottom: DESIGN_TOKENS.touch.hitSlop,
              left: DESIGN_TOKENS.touch.hitSlop,
              right: DESIGN_TOKENS.touch.hitSlop,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.primary,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
            >
              {clientPhone}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            {clientPhone}
          </Text>
        )}
      </View>

      {/* Email */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
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
          {t("jobDetails.client.email")}
        </Text>
        {hasEmail ? (
          <Pressable
            onPress={() => copyToClipBoard(clientEmail)}
            hitSlop={{
              top: DESIGN_TOKENS.touch.hitSlop,
              bottom: DESIGN_TOKENS.touch.hitSlop,
              left: DESIGN_TOKENS.touch.hitSlop,
              right: DESIGN_TOKENS.touch.hitSlop,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.primary,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
            >
              {clientEmail}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            {clientEmail}
          </Text>
        )}
      </View>

      {/* Bouton d'appel - seulement si téléphone disponible */}
      {hasPhone && (
        <Button
          title={`📞 ${t("jobDetails.client.call")}`}
          variant="secondary"
          onPress={() => contactLink(clientPhone, "tel")}
          style={{ width: "100%" }}
        />
      )}
    </SectionCard>
  );
};

export default ClientDetailsSection;

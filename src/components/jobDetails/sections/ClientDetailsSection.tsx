/**
 * ClientDetailsSection - Carte contact client moderne
 * Affiche avatar initiales + nom + actions inline (appeler, email, copier)
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import contactLink from "../../../services/contactLink";
import copyToClipBoard from "../../../services/copyToClipBoard";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface ClientDetailsSectionProps {
  job: JobSummaryData;
}

const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const client = job?.client;

  // Ne rien afficher si aucune donnée client réelle
  const hasRealData =
    client &&
    ((client.firstName && client.firstName !== "Client") ||
      client.lastName ||
      client.name ||
      (client.phone && client.phone !== "N/A" && client.phone !== "") ||
      (client.email && client.email !== "N/A" && client.email !== ""));

  const clientName =
    client?.name ||
    [client?.firstName, client?.lastName].filter(Boolean).join(" ").trim() ||
    t("jobDetails.client.unknown");

  const initials = useMemo(() => {
    const first = (client?.firstName || clientName || "?")[0] || "?";
    const last = (client?.lastName || "")[0] || "";
    return (first + last).toUpperCase();
  }, [client?.firstName, client?.lastName, clientName]);

  const hasPhone =
    client?.phone && client.phone !== "N/A" && client.phone !== "";
  const hasEmail =
    client?.email && client.email !== "N/A" && client.email !== "";

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary + "18",
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.md,
        },
        avatarText: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.primary,
        },
        nameContainer: {
          flex: 1,
        },
        name: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.text,
        },
        label: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        infoRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border + "60",
        },
        infoIcon: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.backgroundTertiary,
          alignItems: "center",
          justifyContent: "center",
          marginRight: DESIGN_TOKENS.spacing.sm,
        },
        infoText: {
          flex: 1,
          fontSize: 15,
          color: colors.text,
        },
        actionBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors],
  );

  if (!hasRealData) return null;

  return (
    <SectionCard level="secondary">
      {/* Avatar + Nom */}
      <View style={themedStyles.header}>
        <View style={themedStyles.avatar}>
          <Text style={themedStyles.avatarText}>{initials}</Text>
        </View>
        <View style={themedStyles.nameContainer}>
          <Text style={themedStyles.name}>{clientName}</Text>
          <Text style={themedStyles.label}>{t("jobDetails.client.title")}</Text>
        </View>
      </View>

      {/* Téléphone */}
      {hasPhone && (
        <View style={themedStyles.infoRow}>
          <View style={themedStyles.infoIcon}>
            <Ionicons name="call-outline" size={16} color={colors.success} />
          </View>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => copyToClipBoard(client!.phone!)}
          >
            <Text style={themedStyles.infoText}>{client!.phone}</Text>
          </Pressable>
          <Pressable
            style={[
              themedStyles.actionBtn,
              { backgroundColor: colors.success + "15" },
            ]}
            onPress={() => contactLink(client!.phone!, "tel")}
          >
            <Ionicons name="call" size={18} color={colors.success} />
          </Pressable>
        </View>
      )}

      {/* Email */}
      {hasEmail && (
        <View style={themedStyles.infoRow}>
          <View style={themedStyles.infoIcon}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
          </View>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => copyToClipBoard(client!.email!)}
          >
            <Text style={themedStyles.infoText}>{client!.email}</Text>
          </Pressable>
          <Pressable
            style={[
              themedStyles.actionBtn,
              { backgroundColor: colors.primary + "15" },
            ]}
            onPress={() => contactLink(client!.email!, "mail")}
          >
            <Ionicons name="mail" size={18} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </SectionCard>
  );
};

export default ClientDetailsSection;

/**
 * AddressesSection - Adresses de pickup/dropoff en style timeline
 * Connecteur vertical entre les étapes pour visualiser le trajet
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import openMap from "../../../services/openMap";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface AddressesSectionProps {
  job: JobSummaryData;
}

const AddressesSection: React.FC<AddressesSectionProps> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const getAddressConfig = (type: string) => {
    switch (type) {
      case "pickup":
        return {
          label: t("jobDetails.components.addresses.pickup"),
          icon: "arrow-up-circle" as const,
          color: colors.success,
        };
      case "dropoff":
        return {
          label: t("jobDetails.components.addresses.dropoff"),
          icon: "arrow-down-circle" as const,
          color: colors.error,
        };
      case "intermediate":
        return {
          label: t("jobDetails.components.addresses.intermediate"),
          icon: "ellipse" as const,
          color: colors.warning,
        };
      default:
        return {
          label: t("jobDetails.components.addresses.location"),
          icon: "location" as const,
          color: colors.primary,
        };
    }
  };

  const addresses = Array.isArray(job.addresses) ? job.addresses : [];

  const s = useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.md,
        },
        timelineRow: {
          flexDirection: "row",
        },
        timelineLeft: {
          width: 32,
          alignItems: "center",
        },
        dot: {
          zIndex: 1,
        },
        connector: {
          flex: 1,
          width: 2,
          backgroundColor: colors.border,
          marginVertical: 2,
        },
        card: {
          flex: 1,
          marginLeft: DESIGN_TOKENS.spacing.sm,
          marginBottom: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.backgroundTertiary,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border + "60",
        },
        typeLabel: {
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        street: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
          lineHeight: 20,
        },
        cityLine: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        navBtn: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: DESIGN_TOKENS.spacing.sm,
          paddingTop: DESIGN_TOKENS.spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border + "40",
        },
        navText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.primary,
          marginLeft: 4,
        },
        empty: {
          padding: DESIGN_TOKENS.spacing.lg,
          alignItems: "center",
        },
        emptyText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
        },
      }),
    [colors],
  );

  if (addresses.length === 0) {
    return (
      <SectionCard level="secondary">
        <Text style={s.title}>
          {t("jobDetails.components.addresses.title")}
        </Text>
        <View style={s.empty}>
          <Ionicons
            name="location-outline"
            size={28}
            color={colors.textSecondary}
          />
          <Text style={s.emptyText}>
            {t("jobDetails.components.addresses.noAddresses")}
          </Text>
        </View>
      </SectionCard>
    );
  }

  return (
    <SectionCard level="secondary">
      <Text style={s.title}>{t("jobDetails.components.addresses.title")}</Text>

      {addresses.map((address, index) => {
        const config = getAddressConfig(address.type);
        const isLast = index === addresses.length - 1;
        const cityParts = [address.city, address.state, address.zip].filter(
          Boolean,
        );

        return (
          <View key={address.id || `addr-${index}`} style={s.timelineRow}>
            {/* Timeline column */}
            <View style={s.timelineLeft}>
              <Ionicons
                name={config.icon}
                size={22}
                color={config.color}
                style={s.dot}
              />
              {!isLast && <View style={s.connector} />}
            </View>

            {/* Address card */}
            <Pressable
              style={s.card}
              onPress={() =>
                openMap(address.street, address.latitude, address.longitude)
              }
            >
              <Text style={[s.typeLabel, { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={s.street}>
                {address.street ||
                  t("jobDetails.components.addresses.noStreet")}
              </Text>
              {cityParts.length > 0 && (
                <Text style={s.cityLine}>{cityParts.join(", ")}</Text>
              )}
              <View style={s.navBtn}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={s.navText}>
                  {t("jobDetails.components.addresses.navigate")}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      })}
    </SectionCard>
  );
};

export default AddressesSection;

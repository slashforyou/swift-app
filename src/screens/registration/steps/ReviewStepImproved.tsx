import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface ReviewStepProps {
  data: BusinessOwnerRegistrationData;
  onBack: () => void;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  isLoading: boolean;
  submitMessage?: {
    type: "error" | "success" | null;
    text: string;
  };
}

const ReviewStepImproved: React.FC<ReviewStepProps> = ({
  data,
  onBack,
  onSubmit,
  onEditStep,
  isLoading,
  submitMessage,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | undefined;
  }) => {
    if (!value) return null;
    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: 6,
          alignItems: "flex-start",
        }}
      >
        <Text
          style={[
            styles.bodySmall,
            { color: colors.textSecondary, minWidth: 100 },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[styles.body, { flex: 1, fontWeight: "500", fontSize: 15 }]}
        >
          {value}
        </Text>
      </View>
    );
  };

  const SectionCard = ({
    emoji,
    title,
    stepNumber,
    children,
  }: {
    emoji: string;
    title: string;
    stepNumber: number;
    children: React.ReactNode;
  }) => (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {emoji} {title}
        </Text>
        <Pressable onPress={() => onEditStep(stepNumber)} disabled={isLoading}>
          <Text style={{ color: colors.primary, fontSize: 14 }}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );

  const localStyles = StyleSheet.create({
    infoBox: {
      padding: 12,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 8,
      marginBottom: 16,
    },
  });

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={hideAlert}
      />

      <View style={localStyles.infoBox}>
        <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
          ℹ️ {t("registration.review.importantNote")}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <SectionCard
          emoji="👤"
          title={t("registration.personalInfo.title")}
          stepNumber={1}
        >
          <InfoRow
            label={t("registration.fields.firstName")}
            value={data.firstName}
          />
          <InfoRow
            label={t("registration.fields.lastName")}
            value={data.lastName}
          />
          <InfoRow label={t("registration.fields.email")} value={data.email} />
          <InfoRow label={t("registration.fields.phone")} value={data.phone} />
          <InfoRow
            label={t("registration.fields.dateOfBirth")}
            value={data.dateOfBirth}
          />
        </SectionCard>

        {/* Business Details */}
        <SectionCard
          emoji="🏢"
          title={t("registration.businessDetails.title")}
          stepNumber={2}
        >
          <InfoRow
            label={t("registration.fields.companyName")}
            value={data.companyName}
          />
          <InfoRow
            label={t("registration.fields.tradingName")}
            value={data.tradingName}
          />
          <InfoRow label={t("registration.fields.abn")} value={data.abn} />
          <InfoRow label={t("registration.fields.acn")} value={data.acn} />
          <InfoRow
            label={t("registration.fields.businessType")}
            value={data.businessType}
          />
          <InfoRow
            label={t("registration.fields.industryType")}
            value={data.industryType}
          />
          <InfoRow
            label={t("registration.fields.companyEmail")}
            value={data.companyEmail}
          />
          <InfoRow
            label={t("registration.fields.companyPhone")}
            value={data.companyPhone}
          />
        </SectionCard>

        {/* Business Address */}
        <SectionCard
          emoji="📍"
          title={t("registration.businessAddress.title")}
          stepNumber={3}
        >
          <InfoRow
            label={t("registration.fields.streetAddress")}
            value={data.streetAddress}
          />
          <InfoRow
            label={t("registration.fields.suburb")}
            value={data.suburb}
          />
          <InfoRow label={t("registration.fields.state")} value={data.state} />
          <InfoRow
            label={t("registration.fields.postcode")}
            value={data.postcode}
          />
        </SectionCard>

        {/* Banking Information */}
        <SectionCard
          emoji="🏦"
          title={t("registration.banking.title")}
          stepNumber={4}
        >
          <InfoRow label={t("registration.fields.bsb")} value={data.bsb} />
          <InfoRow
            label={t("registration.fields.accountNumber")}
            value={data.accountNumber?.replace(/\d(?=\d{4})/g, "*")}
          />
          <InfoRow
            label={t("registration.fields.accountName")}
            value={data.accountName}
          />
        </SectionCard>

        {/* Insurance (if provided) */}
        {(data.insuranceProvider || data.insurancePolicyNumber) && (
          <SectionCard
            emoji="🛡️"
            title={t("registration.insurance.title")}
            stepNumber={5}
          >
            <InfoRow
              label={t("registration.fields.insuranceProvider")}
              value={data.insuranceProvider}
            />
            <InfoRow
              label={t("registration.fields.insurancePolicyNumber")}
              value={data.insurancePolicyNumber}
            />
            <InfoRow
              label={t("registration.fields.insuranceExpiryDate")}
              value={data.insuranceExpiryDate}
            />
          </SectionCard>
        )}

        {/* Subscription Plan */}
        <SectionCard
          emoji="💳"
          title={t("registration.subscription.title")}
          stepNumber={6}
        >
          <InfoRow
            label={t("registration.fields.planType")}
            value={data.planType}
          />
          <InfoRow
            label={t("registration.fields.billingFrequency")}
            value={data.billingFrequency}
          />
          <InfoRow
            label={t("registration.fields.estimatedJobsPerMonth")}
            value={data.estimatedJobsPerMonth}
          />
        </SectionCard>

        {/* Legal Agreements */}
        <SectionCard
          emoji="📋"
          title={t("registration.legal.title")}
          stepNumber={7}
        >
          <View style={{ marginTop: 4 }}>
            <Text
              style={[
                styles.body,
                {
                  color: data.termsAccepted ? colors.success : colors.error,
                  marginBottom: 6,
                  fontSize: 15,
                },
              ]}
            >
              {data.termsAccepted ? "✓" : "✗"}{" "}
              {t("registration.legal.termsAndConditions")}
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: data.privacyAccepted ? colors.success : colors.error,
                  marginBottom: 6,
                  fontSize: 15,
                },
              ]}
            >
              {data.privacyAccepted ? "✓" : "✗"}{" "}
              {t("registration.legal.privacyPolicy")}
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: data.stripeConnectAccepted
                    ? colors.success
                    : colors.error,
                  fontSize: 15,
                },
              ]}
            >
              {data.stripeConnectAccepted ? "✓" : "✗"}{" "}
              {t("registration.legal.stripeConnectAgreement")}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>

      {/* Submit Message - Error or Success */}
      {submitMessage?.type && submitMessage.text && (
        <View
          style={{
            marginTop: 20,
            marginBottom: 12,
            padding: 16,
            borderRadius: 12,
            backgroundColor:
              submitMessage.type === "error"
                ? colors.error + "15"
                : colors.success + "15",
            borderWidth: 1,
            borderColor:
              submitMessage.type === "error" ? colors.error : colors.success,
          }}
        >
          <Text
            style={[
              styles.body,
              {
                color:
                  submitMessage.type === "error"
                    ? colors.error
                    : colors.success,
                textAlign: "center",
                fontWeight: "500",
              },
            ]}
          >
            {submitMessage.type === "error" ? "⚠️ " : "✅ "}
            {submitMessage.text}
          </Text>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <Pressable
          onPress={onBack}
          disabled={isLoading}
          style={[styles.buttonBase, styles.buttonSecondary, { flex: 1 }]}
        >
          <Text style={styles.buttonTextSecondary}>← {t("common.back")}</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={isLoading}
          style={[
            styles.buttonBase,
            styles.buttonPrimary,
            {
              flex: 2,
              backgroundColor: isLoading
                ? colors.textSecondary
                : colors.success || colors.primary,
            },
          ]}
        >
          <Text style={styles.buttonTextPrimary}>
            {isLoading
              ? t("registration.buttons.submitting")
              : `✓ ${t("registration.buttons.submit")}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ReviewStepImproved;

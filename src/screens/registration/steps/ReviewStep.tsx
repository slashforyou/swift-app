// ReviewStep.tsx - Final summary and submit
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  data,
  onBack,
  onSubmit,
  onEditStep,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const SectionHeader = ({
    title,
    stepNumber,
  }: {
    title: string;
    stepNumber: number;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <Text style={[styles.subtitle, { fontWeight: "700" }]}>{title}</Text>
      <Pressable onPress={() => onEditStep(stepNumber)} disabled={isLoading}>
        <Text style={{ color: colors.primary, fontSize: 14 }}>
          {t("registration.buttons.edit")}
        </Text>
      </Pressable>
    </View>
  );

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | undefined;
  }) => {
    if (!value) return null;
    return (
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        <Text
          style={[styles.bodySmall, { color: colors.textSecondary, flex: 1 }]}
        >
          {label}:
        </Text>
        <Text style={[styles.body, { flex: 2, fontWeight: "500" }]}>
          {value}
        </Text>
      </View>
    );
  };

  const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.review.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.review.subtitle")}
        </Text>
      </View>

      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView
        style={{ flex: 1, marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <SectionCard>
          <SectionHeader
            title={t("registration.personalInfo.title")}
            stepNumber={1}
          />
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
        <SectionCard>
          <SectionHeader
            title={t("registration.businessDetails.title")}
            stepNumber={2}
          />
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
        <SectionCard>
          <SectionHeader
            title={t("registration.businessAddress.title")}
            stepNumber={3}
          />
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
          <InfoRow
            label={t("registration.fields.country")}
            value={data.country}
          />
        </SectionCard>

        {/* Banking Information */}
        <SectionCard>
          <SectionHeader
            title={t("registration.banking.title")}
            stepNumber={4}
          />
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
          <SectionCard>
            <SectionHeader
              title={t("registration.insurance.title")}
              stepNumber={5}
            />
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
        <SectionCard>
          <SectionHeader
            title={t("registration.subscription.title")}
            stepNumber={6}
          />
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
        <SectionCard>
          <SectionHeader title={t("registration.legal.title")} stepNumber={7} />
          <View style={{ marginTop: 8 }}>
            <Text
              style={[
                styles.body,
                {
                  color: data.termsAccepted ? colors.success : colors.error,
                  marginBottom: 4,
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
                  marginBottom: 4,
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
                },
              ]}
            >
              {data.stripeConnectAccepted ? "✓" : "✗"}{" "}
              {t("registration.legal.stripeConnectAgreement")}
            </Text>
          </View>
        </SectionCard>

        {/* Important Note */}
        <View
          style={{
            padding: 16,
            backgroundColor: `${colors.primary}10`,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
            ℹ️ {t("registration.review.importantNote")}
          </Text>
        </View>
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          style={[styles.buttonSecondary, { flex: 1 }]}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text style={styles.buttonSecondaryText}>
            ← {t("registration.buttons.back")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.buttonPrimary,
            {
              flex: 2,
              backgroundColor: isLoading
                ? colors.textSecondary
                : colors.success || colors.primary,
            },
          ]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonPrimaryText}>
            {isLoading
              ? t("registration.buttons.submitting")
              : `✓ ${t("registration.buttons.submit")}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ReviewStep;

// LegalAgreementsStep.tsx
import React, { useState } from "react";
import { Linking, Pressable, Text, TouchableOpacity, View } from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface LegalAgreementsStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const LegalAgreementsStep: React.FC<LegalAgreementsStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted);
  const [privacyAccepted, setPrivacyAccepted] = useState(data.privacyAccepted);
  const [stripeConnectAccepted, setStripeConnectAccepted] = useState(
    data.stripeConnectAccepted,
  );
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({ visible: false, type: "info", message: "" });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string,
  ) => {
    setAlert({ visible: true, type, message });
  };

  const handleNext = () => {
    if (!termsAccepted) {
      showAlert("warning", t("registration.validation.termsRequired"));
      return;
    }

    if (!privacyAccepted) {
      showAlert("warning", t("registration.validation.privacyRequired"));
      return;
    }

    if (!stripeConnectAccepted) {
      showAlert("warning", t("registration.validation.stripeConnectRequired"));
      return;
    }

    onNext({ termsAccepted, privacyAccepted, stripeConnectAccepted });
  };

  const Checkbox = ({
    checked,
    onPress,
    label,
    linkUrl,
  }: {
    checked: boolean;
    onPress: () => void;
    label: string;
    linkUrl?: string;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
      }}
      onPress={onPress}
      disabled={isLoading}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : "transparent",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
          marginTop: 2,
        }}
      >
        {checked && (
          <Text
            style={{
              color: colors.background,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            ✓
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.body, { color: colors.text }]}>
          {label}{" "}
          {linkUrl && (
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={(e) => {
                e.stopPropagation();
                Linking.openURL(linkUrl);
              }}
            >
              {t("registration.legal.viewDocument")}
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, paddingVertical: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={[styles.title, { marginBottom: 8 }]}>
          {t("registration.legal.title")}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t("registration.legal.subtitle")}
        </Text>
      </View>

      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />

      <View style={{ marginBottom: 30 }}>
        <Checkbox
          checked={termsAccepted}
          onPress={() => setTermsAccepted(!termsAccepted)}
          label={t("registration.legal.termsAndConditions")}
          linkUrl="https://cobbr.com.au/terms"
        />

        <Checkbox
          checked={privacyAccepted}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
          label={t("registration.legal.privacyPolicy")}
          linkUrl="https://cobbr.com.au/privacy"
        />

        <Checkbox
          checked={stripeConnectAccepted}
          onPress={() => setStripeConnectAccepted(!stripeConnectAccepted)}
          label={t("registration.legal.stripeConnectAgreement")}
          linkUrl="https://stripe.com/connect-account/legal"
        />
      </View>

      <View
        style={{
          padding: 16,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          marginBottom: 30,
        }}
      >
        <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
          🔒 {t("registration.legal.dataSecurityNote")}
        </Text>
      </View>

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
              flex: 1,
              backgroundColor:
                termsAccepted && privacyAccepted && stripeConnectAccepted
                  ? colors.primary
                  : colors.textSecondary,
              opacity:
                termsAccepted && privacyAccepted && stripeConnectAccepted
                  ? 1
                  : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={
            isLoading ||
            !termsAccepted ||
            !privacyAccepted ||
            !stripeConnectAccepted
          }
        >
          <Text style={styles.buttonPrimaryText}>
            {t("registration.buttons.next")} →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default LegalAgreementsStep;

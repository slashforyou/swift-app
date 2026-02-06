import React, { useState } from "react";
import {
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AlertMessage from "../../../components/ui/AlertMessage";
import { TEST_DATA } from "../../../config/testData";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useTranslation } from "../../../localization";
import { BusinessOwnerRegistrationData } from "../../../types/registration";

interface LegalAgreementsStepProps {
  data: BusinessOwnerRegistrationData;
  onNext: (data: Partial<BusinessOwnerRegistrationData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const LegalAgreementsStepImproved: React.FC<LegalAgreementsStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // 🧪 Auto-fill with test data in development mode
  const autoFillData = __DEV__ ? TEST_DATA.legalAgreements : {};

  const [termsAccepted, setTermsAccepted] = useState(
    data.termsAccepted !== undefined
      ? data.termsAccepted
      : __DEV__
        ? autoFillData.termsAccepted
        : false,
  );
  const [privacyAccepted, setPrivacyAccepted] = useState(
    data.privacyAccepted !== undefined
      ? data.privacyAccepted
      : __DEV__
        ? autoFillData.privacyAccepted
        : false,
  );
  const [stripeConnectAccepted, setStripeConnectAccepted] = useState(
    data.stripeConnectAccepted !== undefined
      ? data.stripeConnectAccepted
      : __DEV__
        ? autoFillData.stripeAccepted
        : false,
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

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
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
        marginBottom: 16,
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
              style={{
                color: colors.primary,
                textDecorationLine: "underline",
                fontSize: 14,
              }}
              onPress={(e) => {
                e.stopPropagation();
                Linking.openURL(linkUrl);
              }}
            >
              →
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const localStyles = StyleSheet.create({
    section: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: colors.textSecondary,
      marginBottom: 12,
    },
    infoBox: {
      padding: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      marginTop: 16,
    },
  });

  const allAccepted = termsAccepted && privacyAccepted && stripeConnectAccepted;

  return (
    <ScrollView
      style={{ flex: 1, paddingVertical: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <AlertMessage
        type={alert.type}
        message={alert.message}
        visible={alert.visible}
        onDismiss={hideAlert}
      />

      {/* Section: 📋 Legal Agreements */}
      <View
        style={[
          localStyles.section,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={localStyles.sectionTitle}>
          📋 {t("registration.legal.title")}
        </Text>

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

        <View style={localStyles.infoBox}>
          <Text style={[styles.bodySmall, { color: colors.textSecondary }]}>
            🔒 {t("registration.legal.dataSecurityNote")}
          </Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 24,
          marginBottom: 40,
        }}
      >
        <Pressable
          onPress={onBack}
          disabled={isLoading}
          style={[styles.buttonBase, styles.buttonSecondary, { flex: 1 }]}
        >
          <Text style={styles.buttonTextSecondary}>← {t("common.back")}</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={isLoading || !allAccepted}
          style={[
            styles.buttonBase,
            styles.buttonPrimary,
            {
              flex: 1,
              backgroundColor: allAccepted
                ? colors.primary
                : colors.textSecondary,
              opacity: allAccepted ? 1 : 0.5,
            },
          ]}
        >
          <Text style={styles.buttonTextPrimary}>{t("common.continue")} →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default LegalAgreementsStepImproved;

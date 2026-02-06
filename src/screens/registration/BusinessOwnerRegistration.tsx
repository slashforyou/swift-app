import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ServerData } from "../../constants/ServerData";

import ProgressStepper from "../../components/registration/ProgressStepperModern";
import AnimatedBackground from "../../components/ui/AnimatedBackground";
import HeaderLogo from "../../components/ui/HeaderLogo";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useTranslation } from "../../localization";

import BankingInfoStep from "./steps/BankingInfoStepImproved";
import BusinessAddressStep from "./steps/BusinessAddressStepImproved";
import BusinessDetailsStep from "./steps/BusinessDetailsStepImproved";
import InsuranceStep from "./steps/InsuranceStepImproved";
import LegalAgreementsStep from "./steps/LegalAgreementsStepImproved";
import PersonalInfoStep from "./steps/PersonalInfoStepImproved";
import ReviewStep from "./steps/ReviewStepImproved";
import SubscriptionPlanStep from "./steps/SubscriptionPlanStepImproved";

import {
    BusinessOwnerRegistrationData,
    initialBusinessOwnerData,
} from "../../types/registration";

type RootStackParamList = {
  Connection: undefined;
  SubscribeMailVerification: {
    id: string;
    mail: string;
    firstName: string;
    lastName: string;
  };
};

interface BusinessOwnerRegistrationProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const STORAGE_KEY = "@registration_business_owner_draft";

const BusinessOwnerRegistration: React.FC<BusinessOwnerRegistrationProps> = ({
  navigation,
}) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BusinessOwnerRegistrationData>(
    initialBusinessOwnerData,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "error" | "success" | null;
    text: string;
  }>({ type: null, text: "" });

  const steps = [
    {
      number: 1,
      title: t("registration.personalInfo.title"),
      completed: currentStep > 1,
      icon: "👤",
    },
    {
      number: 2,
      title: t("registration.businessDetails.title"),
      completed: currentStep > 2,
      icon: "🏢",
    },
    {
      number: 3,
      title: t("registration.businessAddress.title"),
      completed: currentStep > 3,
      icon: "📍",
    },
    {
      number: 4,
      title: t("registration.banking.title"),
      completed: currentStep > 4,
      icon: "🏦",
    },
    {
      number: 5,
      title: t("registration.insurance.title"),
      completed: currentStep > 5,
      icon: "🛡️",
    },
    {
      number: 6,
      title: t("registration.subscription.title"),
      completed: currentStep > 6,
      icon: "💳",
    },
    {
      number: 7,
      title: t("registration.legal.title"),
      completed: currentStep > 7,
      icon: "📋",
    },
    {
      number: 8,
      title: t("registration.review.title"),
      completed: currentStep > 8,
      icon: "✓",
    },
  ];

  const loadDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        Alert.alert(
          t("registration.draftFound"),
          t("registration.draftFoundMessage"),
          [
            {
              text: t("common.cancel"),
              style: "cancel",
              onPress: () => clearDraft(),
            },
            {
              text: t("registration.continueDraft"),
              onPress: () => {
                setFormData(parsed.data);
                setCurrentStep(parsed.step || 1);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const saveDraft = async () => {
    try {
      const draft = {
        data: formData,
        step: currentStep,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  // Load saved draft on mount
  useEffect(() => {
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft whenever formData changes
  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(initialBusinessOwnerData)) {
      saveDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

  const handleNext = (stepData: Partial<BusinessOwnerRegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Step 1: Call /swift-app/subscribe with only required fields
      console.log("[REGISTRATION] Calling /swift-app/subscribe...");
      const response = await fetch(`${ServerData.serverUrl}subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log("[REGISTRATION] Response:", response.status, data);

      if (response.status !== 200 || !data.success) {
        const errorMsg =
          data.details?.message ||
          data.message ||
          "Registration failed. Please try again.";
        setSubmitMessage({ type: "error", text: errorMsg });
        return;
      }

      // Step 2: Save remaining data (Steps 2-7) to AsyncStorage for later use
      const pendingProfileData = {
        businessDetails: {
          companyName: formData.companyName,
          tradingName: formData.tradingName,
          abn: formData.abn?.replace(/\s/g, ""),
          acn: formData.acn?.replace(/\s/g, ""),
          businessType: formData.businessType,
          industryType: formData.industryType,
          companyEmail: formData.companyEmail,
          companyPhone: formData.companyPhone,
        },
        businessAddress: {
          streetAddress: formData.streetAddress,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
        },
        bankingInfo: {
          bsb: formData.bsb?.replace(/-/g, ""),
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        },
        insurance: {
          hasInsurance: formData.hasInsurance,
          insuranceProvider: formData.insuranceProvider,
          policyNumber: formData.policyNumber,
          expiryDate: formData.expiryDate,
        },
        subscription: {
          planType: formData.planType,
          billingFrequency: formData.billingFrequency,
        },
        legalAgreements: {
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted,
          stripeAccepted: formData.stripeAccepted,
          acceptedAt: new Date().toISOString(),
        },
      };

      await AsyncStorage.setItem(
        "@pending_business_owner_profile",
        JSON.stringify(pendingProfileData),
      );
      console.log("[REGISTRATION] Profile data saved for later completion");

      // Step 3: Clear registration draft
      await clearDraft();

      // Step 4: Show success message
      setSubmitMessage({
        type: "success",
        text:
          "✅ Account created! Check your email (" +
          formData.email +
          ") for the verification code.",
      });

      // Step 5: Navigate to email verification after a short delay
      setTimeout(() => {
        navigation.navigate("SubscribeMailVerification", {
          id: data.user.id.toString(),
          mail: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }, 1500);
    } catch (error) {
      console.error("[REGISTRATION] Error:", error);
      setSubmitMessage({
        type: "error",
        text: "Failed to create account. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    Alert.alert(t("registration.exitTitle"), t("registration.exitMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("registration.saveAndExit"),
        onPress: () => {
          saveDraft();
          navigation.navigate("Connection");
        },
      },
      {
        text: t("registration.exitWithoutSaving"),
        style: "destructive",
        onPress: () => {
          clearDraft();
          navigation.navigate("Connection");
        },
      },
    ]);
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const renderStep = () => {
    const stepProps = {
      data: formData,
      onNext: handleNext,
      onBack: handleBack,
      isLoading,
    };

    switch (currentStep) {
      case 1:
        return <PersonalInfoStep {...stepProps} />;
      case 2:
        return <BusinessDetailsStep {...stepProps} />;
      case 3:
        return <BusinessAddressStep {...stepProps} />;
      case 4:
        return <BankingInfoStep {...stepProps} />;
      case 5:
        return <InsuranceStep {...stepProps} />;
      case 6:
        return <SubscriptionPlanStep {...stepProps} />;
      case 7:
        return <LegalAgreementsStep {...stepProps} />;
      case 8:
        return (
          <ReviewStep
            {...stepProps}
            onSubmit={handleSubmit}
            onEditStep={handleEditStep}
            submitMessage={submitMessage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground opacity={0.05} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Minimal Header */}
        <HeaderLogo
          size={60}
          variant="square"
          marginVertical={10}
          marginHorizontal={20}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={handleExit}
            disabled={isLoading}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text
              style={[
                styles.body,
                { color: colors.textSecondary, fontSize: 14 },
              ]}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {/* Progress Stepper */}
        <ProgressStepper steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BusinessOwnerRegistration;

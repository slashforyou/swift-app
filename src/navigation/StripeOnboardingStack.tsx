/**
 * StripeOnboardingStack - Stack Navigator pour l'onboarding Stripe natif
 *
 * Flux: Welcome → PersonalInfo → Address → BankAccount → Documents → Review
 *
 * Fonctionnalités:
 * - Navigation sans header (bouton retour custom dans chaque écran)
 * - Passage de paramètres entre écrans
 * - Animation de transition entre cartes
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

// Écrans d'onboarding
import AddressScreen from "../screens/Stripe/OnboardingFlow/AddressScreen";
import BankAccountScreen from "../screens/Stripe/OnboardingFlow/BankAccountScreen";
import CompletionScreen from "../screens/Stripe/OnboardingFlow/CompletionScreen";
import DocumentsScreen from "../screens/Stripe/OnboardingFlow/DocumentsScreen";
import PersonalInfoScreen from "../screens/Stripe/OnboardingFlow/PersonalInfoScreen";
import ReviewScreen from "../screens/Stripe/OnboardingFlow/ReviewScreen";
import WelcomeScreen from "../screens/Stripe/OnboardingFlow/WelcomeScreen";

// Types pour la navigation typée
export type StripeOnboardingStackParamList = {
  Welcome: undefined;
  PersonalInfo: undefined;
  Address: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dob: Date;
      email: string;
      phone: string;
    };
  };
  BankAccount: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dob: Date;
      email: string;
      phone: string;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  Documents: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dob: Date;
      email: string;
      phone: string;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    bankAccount: {
      accountHolderName: string;
      bsb: string;
      accountNumber: string;
    };
  };
  Review: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dob: Date;
      email: string;
      phone: string;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    bankAccount: {
      accountHolderName: string;
      bsb: string;
      accountNumber: string;
    };
    documents: {
      frontImage: string;
      backImage: string;
    };
  };
  Completion: {
    accountStatus?: {
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
    };
  };
};

const Stack = createNativeStackNavigator<StripeOnboardingStackParamList>();

export default function StripeOnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Pas de header natif (bouton retour custom)
        presentation: "card", // Animation de type carte
        gestureEnabled: true, // Permettre le swipe retour
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          gestureEnabled: false, // Désactiver le swipe retour sur l'écran de bienvenue
        }}
      />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          gestureEnabled: false, // Désactiver le swipe retour sur Review
        }}
      />
      <Stack.Screen
        name="Completion"
        component={CompletionScreen}
        options={{
          gestureEnabled: false, // Désactiver le swipe retour sur l'écran final
        }}
      />
    </Stack.Navigator>
  );
}

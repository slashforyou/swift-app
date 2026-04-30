import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTutorial } from "../../hooks/useTutorial";
import { useLocalization } from "../../localization/useLocalization";

interface Step {
  icon: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: "home-outline",
    title: "Vue du jour",
    description: "Retrouvez tous vos jobs du jour ici. Un tap pour voir les détails.",
  },
  {
    icon: "briefcase-outline",
    title: "Détails d'un job",
    description: "Pickup → Transport → Livraison. Chaque étape s'enchaîne en 1 bouton.",
  },
  {
    icon: "calendar-outline",
    title: "Planning",
    description: "Visualisez l'agenda de l'équipe. Glissez pour changer de semaine.",
  },
  {
    icon: "business-outline",
    title: "Business",
    description: "Gérez votre équipe, vos véhicules, devis et finances depuis ici.",
  },
  {
    icon: "person-outline",
    title: "Profil",
    description: "Paramètres, abonnement, et vos préférences personnelles.",
  },
];

export default function OnboardingTutorial() {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { showTutorial, currentStep, nextStep, skipTutorial } = useTutorial();

  if (!showTutorial) return null;

  const step = STEPS[currentStep] ?? STEPS[0];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "center",
          alignItems: "center",
          padding: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 24,
            padding: DESIGN_TOKENS.spacing.xl ?? 28,
            width: "100%",
            maxWidth: 340,
            alignItems: "center",
          }}
        >
          {/* Step indicator */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentStep ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i <= currentStep ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name={step.icon as any} size={36} color={colors.primary} />
          </View>

          {/* Content */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {step.description}
          </Text>

          {/* Actions */}
          <Pressable
            onPress={isLast ? skipTutorial : nextStep}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
              alignItems: "center",
              width: "100%",
              marginBottom: 10,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              {isLast
                ? (t("tutorial.finish") ?? "C'est parti !")
                : (t("tutorial.next") ?? "Suivant")}
            </Text>
          </Pressable>

          <Pressable onPress={skipTutorial} hitSlop={10}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {t("tutorial.skip") ?? "Passer le tutoriel"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

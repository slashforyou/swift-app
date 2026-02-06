import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";

interface Step {
  number: number;
  title: string;
  completed: boolean;
  icon?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
}) => {
  const { colors } = useCommonThemedStyles();

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <View style={styles.container}>
      {/* Thin Progress Bar */}
      <View
        style={[
          styles.progressBarBg,
          { backgroundColor: colors.border + "20" },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      {/* Mini Step Dots */}
      <View style={styles.dotsContainer}>
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.completed;

          return (
            <View
              key={step.number}
              style={[
                styles.dot,
                {
                  backgroundColor: isCompleted
                    ? colors.success
                    : isActive
                      ? colors.primary
                      : colors.border + "40",
                  transform: [{ scale: isActive ? 1.3 : 1 }],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Current Step Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {steps[currentStep - 1]?.icon || "📝"} {steps[currentStep - 1]?.title}
        </Text>
        <Text style={[styles.stepCount, { color: colors.textSecondary }]}>
          {currentStep} / {steps.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  progressBarBg: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  stepCount: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProgressStepper;

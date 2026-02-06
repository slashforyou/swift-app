import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";

interface Step {
  number: number;
  title: string;
  completed: boolean;
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

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.completed;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <View style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isCompleted
                        ? colors.success
                        : isActive
                          ? colors.primary
                          : colors.backgroundSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color:
                          isCompleted || isActive
                            ? colors.background
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {isCompleted ? "✓" : step.number}
                  </Text>
                </View>

                {/* Step Label */}
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isActive ? colors.primary : colors.textSecondary,
                      fontWeight: isActive ? "600" : "400",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              </View>

              {/* Connector Line */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted
                        ? colors.success
                        : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBarContainer,
          { backgroundColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepWrapper: {
    flex: 1,
    alignItems: "center",
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepLabel: {
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  connector: {
    height: 2,
    flex: 0.3,
    marginTop: 19,
    marginHorizontal: -8,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default ProgressStepper;

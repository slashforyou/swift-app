// Modern Job Timeline with animated progress and beautiful design

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';

const JobTimeLine = ({ job }: { job: any }) => {
    const { colors } = useTheme();
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const truckAnimation = useRef(new Animated.Value(0)).current;

    // Calculate progress percentage
    const progressPercentage = job.step.actualStep / Math.max(1, (job.step.steps.length - 1));

    useEffect(() => {
        // Animate progress bar
        Animated.timing(progressAnimation, {
            toValue: progressPercentage,
            duration: 1000,
            useNativeDriver: false,
        }).start();

        // Animate truck position with bounce
        Animated.sequence([
            Animated.timing(truckAnimation, {
                toValue: progressPercentage,
                duration: 800,
                useNativeDriver: false,
            }),
            Animated.spring(truckAnimation, {
                toValue: progressPercentage,
                tension: 100,
                friction: 8,
                useNativeDriver: false,
            }),
        ]).start();
    }, [job.step.actualStep, progressPercentage]);

    const styles = StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.lg,
        },
        progressContainer: {
            position: 'relative',
            height: 60,
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        progressTrack: {
            position: 'absolute',
            top: 25,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: colors.border,
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 4,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        stepsContainer: {
            position: 'absolute',
            top: 18,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
        },
        stepDot: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.background,
            borderWidth: 3,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
        },
        stepDotCompleted: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        stepDotPending: {
            borderColor: colors.border,
        },
        stepDotInner: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.background,
        },
        truck: {
            position: 'absolute',
            top: 5,
            fontSize: 28,
            textShadowColor: colors.shadow,
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
        },
        currentStepCard: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        stepTitle: {
            fontSize: 16,
            fontWeight: '600' as '600',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        stepDescription: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        progressInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        progressText: {
            fontSize: 14,
            fontWeight: '600' as '600',
            color: colors.primary,
        },
        progressPercentage: {
            fontSize: 18,
            fontWeight: '700' as '700',
            color: colors.primary,
        },
    });

    return (
        <View style={styles.container}>
            {/* Progress Info */}
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                    Step {job.step.actualStep + 1} of {job.step.steps.length}
                </Text>
                <Text style={styles.progressPercentage}>
                    {Math.round(progressPercentage * 100)}%
                </Text>
            </View>

            {/* Progress Track with Animation */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <Animated.View 
                        style={[
                            styles.progressBar,
                            {
                                width: progressAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]} 
                    />
                </View>

                {/* Step Dots */}
                <View style={styles.stepsContainer}>
                    {job.step.steps.map((step: any, index: number) => (
                        <View 
                            key={step.id} 
                            style={[
                                styles.stepDot,
                                index <= job.step.actualStep 
                                    ? styles.stepDotCompleted 
                                    : styles.stepDotPending
                            ]}
                        >
                            {index <= job.step.actualStep && (
                                <View style={styles.stepDotInner} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Animated Truck */}
                <Animated.Text
                    style={[
                        styles.truck,
                        {
                            left: truckAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['2%', '95%'],
                            }),
                            transform: [{ scaleX: -1 }], // Effet miroir pour orienter vers la droite
                        },
                    ]}
                >
                    🚛
                </Animated.Text>
            </View>

            {/* Current Step Description */}
            <View style={styles.currentStepCard}>
                <Text style={styles.stepTitle}>
                    Current Step: {job.step.steps[job.step.actualStep]?.title || 'Unknown'}
                </Text>
                <Text style={styles.stepDescription}>
                    {job.step.steps[job.step.actualStep]?.description}
                </Text>
            </View>
        </View>
    );
};

export default JobTimeLine;
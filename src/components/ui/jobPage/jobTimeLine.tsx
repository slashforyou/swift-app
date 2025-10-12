// Modern Job Timeline with animated progress and beautiful design

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import Ionicons from '@react-native-vector-icons/ionicons';
import { generateJobSteps, calculateAnimationProgress, getCurrentStep, calculateProgressPercentage } from '../../../utils/jobStepsUtils';

interface JobTimeLineProps {
    job: any;
    onAdvanceStep?: () => void;
}

const JobTimeLine = ({ job, onAdvanceStep }: JobTimeLineProps) => {
    const { colors } = useTheme();
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const truckAnimation = useRef(new Animated.Value(0)).current;
    const [isStepsExpanded, setIsStepsExpanded] = useState(false); // Rétracté par défaut
    const [stepsRotateAnim] = useState(new Animated.Value(0));

    // Protection contre les données manquantes
    if (!job) {
        return (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>No job data available</Text>
            </View>
        );
    }

    // Utiliser les utilitaires partagés
    const steps = generateJobSteps(job);
    const currentStep = getCurrentStep(job);
    const animationProgress = calculateAnimationProgress(job); // Pour les animations (0-1)
    const displayPercentage = calculateProgressPercentage(job); // Pour l'affichage (0-100)
    


    useEffect(() => {
        // Animate progress bar
        Animated.timing(progressAnimation, {
            toValue: animationProgress,
            duration: 1000,
            useNativeDriver: false,
        }).start();

        // Animate truck position with bounce
        Animated.sequence([
            Animated.timing(truckAnimation, {
                toValue: animationProgress,
                duration: 800,
                useNativeDriver: false,
            }),
            Animated.spring(truckAnimation, {
                toValue: animationProgress,
                tension: 100,
                friction: 8,
                useNativeDriver: false,
            }),
        ]).start();
    }, [currentStep, animationProgress, job?.status]);

    // Toggle pour les étapes
    const toggleSteps = () => {
        setIsStepsExpanded(!isStepsExpanded);
        Animated.timing(stepsRotateAnim, {
            toValue: isStepsExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const stepsRotateInterpolate = stepsRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Fonctions utilitaires pour les statuts
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'En attente';
            case 'in-progress': return 'En cours';
            case 'completed': return 'Terminé';
            case 'cancelled': return 'Annulé';
            default: return 'Statut inconnu';
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'pending': return { backgroundColor: '#FEF3C7' };
            case 'in-progress': return { backgroundColor: colors.primary };
            case 'completed': return { backgroundColor: '#D1FAE5' };
            case 'cancelled': return { backgroundColor: '#FEE2E2' };
            default: return { backgroundColor: colors.border };
        }
    };

    const getStatusTextStyle = (status: string) => {
        switch (status) {
            case 'pending': return { color: '#D97706' };
            case 'in-progress': return { color: colors.background };
            case 'completed': return { color: '#065F46' };
            case 'cancelled': return { color: '#DC2626' };
            default: return { color: colors.textSecondary };
        }
    };

    const getStepDescription = (status: string) => {
        switch (status) {
            case 'pending': return 'Le job est en attente de traitement. L\'équipe va bientôt se rendre sur place.';
            case 'in-progress': return 'L\'équipe est actuellement en train de travailler sur ce job.';
            case 'completed': return 'Le job a été terminé avec succès.';
            case 'cancelled': return 'Ce job a été annulé.';
            default: return 'Statut du job non défini.';
        }
    };

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
        stepCircle: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.background,
            borderWidth: 2,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
        },
        stepCircleCompleted: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        stepCirclePending: {
            backgroundColor: colors.background,
            borderColor: colors.border,
        },
        stepCircleCurrent: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            transform: [{ scale: 1.1 }],
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        stepNumber: {
            fontSize: 12,
            fontWeight: '700' as '700',
        },
        stepNumberCompleted: {
            color: colors.background,
        },
        stepNumberPending: {
            color: colors.textSecondary,
        },
        truck: {
            position: 'absolute',
            top: -14, // Centré avec les cercles des étapes (28px height / 2 - 14px = centré)
            fontSize: 24, // Légèrement plus petit pour un meilleur alignement
            textShadowColor: colors.shadow,
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
            zIndex: 10, // S'assurer qu'il est au-dessus des autres éléments
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
        // Nouveaux styles pour la section améliorée
        stepHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.sm,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        statusBadgeText: {
            fontSize: 12,
            fontWeight: '600' as '600',
        },
        currentStepTitle: {
            fontSize: 18,
            fontWeight: '700' as '700',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        progressIndicator: {
            marginTop: DESIGN_TOKENS.spacing.md,
            paddingTop: DESIGN_TOKENS.spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        progressDots: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
        },
        progressDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        progressDotActive: {
            backgroundColor: colors.primary,
        },
        progressDotInactive: {
            backgroundColor: colors.border,
        },
        // Nouveaux styles pour les améliorations
        compactProgressBar: {
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            marginBottom: DESIGN_TOKENS.spacing.md,
            overflow: 'hidden',
        },
        compactProgressFill: {
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 2,
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.sm,
        },
        nextStepButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.sm,
            borderWidth: 1,
            borderColor: colors.primary,
            gap: 4,
        },
        nextStepText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.primary,
        },
        nextStepTextDisabled: {
            color: colors.textSecondary,
        },
        nextStepButtonDisabled: {
            borderColor: colors.border,
            opacity: 0.5,
        },
        // Styles pour la liste des étapes
        stepsListContainer: {
            marginTop: DESIGN_TOKENS.spacing.md,
            gap: DESIGN_TOKENS.spacing.sm,
        },
        stepListItem: {
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border + '40', // Plus transparent
        },
        stepListHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        stepListIcon: {
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: DESIGN_TOKENS.spacing.sm,
        },
        stepListIconCompleted: {
            backgroundColor: colors.primary,
        },
        stepListIconCurrent: {
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: colors.primary + '40',
        },
        stepListIconPending: {
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: colors.border,
        },
        stepListNumber: {
            fontSize: 10,
            fontWeight: '600',
        },
        stepListNumberCurrent: {
            color: colors.background,
        },
        stepListNumberPending: {
            color: colors.textSecondary,
        },
        stepListTitle: {
            fontSize: 14,
            fontWeight: '600',
            flex: 1,
        },
        stepListTitleCurrent: {
            color: colors.text,
        },
        stepListTitleCompleted: {
            color: colors.textSecondary,
        },
        stepListTitlePending: {
            color: colors.textSecondary,
        },
        stepListDescription: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 16,
            marginLeft: 32, // Aligné avec le titre (20px icon + 12px margin)
        },
    });

    return (
        <View style={styles.container}>
            {/* Progress Info */}
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                    Step {currentStep} of {steps.length}
                </Text>
                <Text style={styles.progressPercentage}>
                    {displayPercentage}%
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

                {/* Step Circles with Numbers */}
                <View style={styles.stepsContainer}>
                    {steps.map((step: any, index: number) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        const isPending = stepNumber > currentStep;
                        
                        return (
                            <View 
                                key={step.id} 
                                style={[
                                    styles.stepCircle,
                                    isCompleted ? styles.stepCircleCompleted : 
                                    isCurrent ? styles.stepCircleCurrent :
                                    styles.stepCirclePending
                                ]}
                            >
                                <Text style={[
                                    styles.stepNumber,
                                    isCompleted || isCurrent ? styles.stepNumberCompleted : styles.stepNumberPending
                                ]}>
                                    {stepNumber}
                                </Text>
                            </View>
                        );
                    })}
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

            {/* Current Step Description - Rétractable */}
            <View style={styles.currentStepCard}>
                {/* Barre de progression compacte */}
                <View style={styles.compactProgressBar}>
                    <Animated.View 
                        style={[
                            styles.compactProgressFill,
                            {
                                width: progressAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]} 
                    />
                </View>

                {/* Header cliquable pour les étapes */}
                <Pressable 
                    onPress={toggleSteps}
                    style={styles.stepHeader}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.currentStepTitle}>
                            {steps[currentStep - 1]?.title || 'Étape en cours'}
                        </Text>
                    </View>
                    
                    <View style={styles.headerActions}>
                        <Pressable
                            style={[
                                styles.nextStepButton,
                                currentStep >= steps.length && styles.nextStepButtonDisabled
                            ]}
                            onPress={() => {
                                if (currentStep < steps.length && onAdvanceStep) {
                                    onAdvanceStep();
                                }
                            }}
                            disabled={currentStep >= steps.length}
                        >
                            <Text style={[
                                styles.nextStepText,
                                currentStep >= steps.length && styles.nextStepTextDisabled
                            ]}>
                                {currentStep >= steps.length ? 'Terminé' : 'Next Step'}
                            </Text>
                            <Ionicons 
                                name="arrow-forward" 
                                size={16} 
                                color={currentStep >= steps.length ? colors.textSecondary : colors.primary}
                            />
                        </Pressable>

                        <Animated.View style={{ transform: [{ rotate: stepsRotateInterpolate }] }}>
                            <Ionicons 
                                name="chevron-down" 
                                size={20} 
                                color={colors.textSecondary} 
                            />
                        </Animated.View>
                    </View>
                </Pressable>
                
                {/* Contenu rétractable - Liste de toutes les étapes */}
                {isStepsExpanded && (
                    <View style={styles.stepsListContainer}>
                        {steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = stepNumber < currentStep;
                            const isCurrent = stepNumber === currentStep;
                            const isPending = stepNumber > currentStep;
                            
                            return (
                                <View key={step.id} style={styles.stepListItem}>
                                    <View style={styles.stepListHeader}>
                                        <View style={[
                                            styles.stepListIcon,
                                            isCompleted ? styles.stepListIconCompleted :
                                            isCurrent ? styles.stepListIconCurrent :
                                            styles.stepListIconPending
                                        ]}>
                                            {isCompleted ? (
                                                <Ionicons name="checkmark" size={12} color={colors.background} />
                                            ) : (
                                                <Text style={[
                                                    styles.stepListNumber,
                                                    isCurrent ? styles.stepListNumberCurrent : styles.stepListNumberPending
                                                ]}>
                                                    {stepNumber}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.stepListTitle,
                                            isCurrent ? styles.stepListTitleCurrent : 
                                            isCompleted ? styles.stepListTitleCompleted :
                                            styles.stepListTitlePending
                                        ]}>
                                            {step.title}
                                        </Text>
                                    </View>
                                    <Text style={styles.stepListDescription}>
                                        {step.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
};

export default JobTimeLine;
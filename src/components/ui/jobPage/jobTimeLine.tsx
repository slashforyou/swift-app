// Modern Job Timeline with animated progress and beautiful design
// ✅ Utilise JobTimerContext pour la source unique de vérité

import Ionicons from '@react-native-vector-icons/ionicons';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useJobTimerContext } from '../../../context/JobTimerProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { formatTime, useLocalization } from '../../../localization';

interface JobTimeLineProps {
    job: any;
    onAdvanceStep?: () => void;
}

const JobTimeLine = ({ job, onAdvanceStep }: JobTimeLineProps) => {
    const { colors } = useTheme();
    const { t, currentLanguage } = useLocalization();
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const truckAnimation = useRef(new Animated.Value(0)).current;
    const [isStepsExpanded, setIsStepsExpanded] = useState(false); // Rétracté par défaut
    const [stepsRotateAnim] = useState(new Animated.Value(0));

    // ✅ Utiliser le timer context pour les steps (source unique de vérité)
    const { currentStep, totalSteps, stepTimes } = useJobTimerContext();

    // Protection contre les données manquantes
    if (!job) {
        return (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>{t('jobDetails.components.jobTimeline.noJobData')}</Text>
            </View>
        );
    }

    // ✅ Récupérer les steps depuis job.steps (configuration)
    const steps = job?.steps || [];

    // ✅ Calculer la progression pour les animations (0-1)
    const animationProgress = React.useMemo(() => {
        if (totalSteps === 0) return 0;
        return currentStep / totalSteps;
    }, [currentStep, totalSteps]);

    // ✅ Calculer le pourcentage pour l'affichage (0-100)
    const displayPercentage = React.useMemo(() => {
        if (totalSteps === 0) return 0;
        return Math.round((currentStep / totalSteps) * 100);
    }, [currentStep, totalSteps]);
    


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
    });// Fonctions utilitaires pour les statuts
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return t('jobDetails.components.jobTimeline.status.pending');
            case 'in-progress': return t('jobDetails.components.jobTimeline.status.inProgress');
            case 'completed': return t('jobDetails.components.jobTimeline.status.completed');
            case 'cancelled': return t('jobDetails.components.jobTimeline.status.cancelled');
            default: return t('jobDetails.components.jobTimeline.status.unknown');
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'pending': return { backgroundColor: `${colors.warning}30` };
            case 'in-progress': return { backgroundColor: colors.primary };
            case 'completed': return { backgroundColor: `${colors.success}30` };
            case 'cancelled': return { backgroundColor: `${colors.error}30` };
            default: return { backgroundColor: colors.border };
        }
    };

    const getStatusTextStyle = (status: string) => {
        switch (status) {
            case 'pending': return { color: colors.warning };
            case 'in-progress': return { color: colors.background };
            case 'completed': return { color: colors.success };
            case 'cancelled': return { color: colors.error };
            default: return { color: colors.textSecondary };
        }
    };

    const getStepDescription = (status: string) => {
        switch (status) {
            case 'pending': return t('jobDetails.components.jobTimeline.statusDescription.pending');
            case 'in-progress': return t('jobDetails.components.jobTimeline.statusDescription.inProgress');
            case 'completed': return t('jobDetails.components.jobTimeline.statusDescription.completed');
            case 'cancelled': return t('jobDetails.components.jobTimeline.statusDescription.cancelled');
            default: return t('jobDetails.components.jobTimeline.statusDescription.unknown');
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
                    {t('jobDetails.components.jobTimeline.stepOf', { current: currentStep, total: steps.length })}
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

                {/* En-tête avec titre et bouton toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN_TOKENS.spacing.sm }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.currentStepTitle}>
                            {steps[currentStep - 1]?.title || t('jobDetails.components.jobTimeline.currentStep')}
                        </Text>
                    </View>
                    
                    {/* Bouton pour voir tous les détails */}
                    <Pressable
                        onPress={toggleSteps}
                        style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                            paddingVertical: DESIGN_TOKENS.spacing.xs,
                            borderRadius: DESIGN_TOKENS.radius.sm,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                        })}
                    >
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                            {isStepsExpanded ? t('jobDetails.components.jobTimeline.hideDetails') : t('jobDetails.components.jobTimeline.showDetails')}
                        </Text>
                        <Animated.View style={{ transform: [{ rotate: stepsRotateInterpolate }] }}>
                            <Ionicons 
                                name="chevron-down" 
                                size={16} 
                                color={colors.primary} 
                            />
                        </Animated.View>
                    </Pressable>
                </View>

                {/* Liste détaillée des étapes - Affichée si étendue */}
                {isStepsExpanded && (
                    <View style={styles.stepsListContainer}>
                        {steps.map((step: any, index: number) => {
                            const stepNumber = index + 1;
                            const isCompleted = stepNumber < currentStep;
                            const isCurrent = stepNumber === currentStep;
                            const stepTime = stepTimes[index];
                            
                            // Formater la durée
                            const formatDuration = (ms: number) => {
                                const totalSeconds = Math.floor(ms / 1000);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                const seconds = totalSeconds % 60;
                                
                                if (hours > 0) {
                                    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
                                }
                                return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
                            };

                            // Formater timestamp (HH:MM)
                            const formatTimestamp = (timestamp: number) => {
                                if (!timestamp) return '';
                                return formatTime(new Date(timestamp), currentLanguage);
                            };
                            
                            return (
                                <View key={step.id} style={styles.stepListItem}>
                                    <View style={styles.stepListHeader}>
                                        {/* Icône step */}
                                        <View style={[
                                            styles.stepListIcon,
                                            isCompleted ? styles.stepListIconCompleted :
                                            isCurrent ? styles.stepListIconCurrent :
                                            styles.stepListIconPending
                                        ]}>
                                            {isCompleted ? (
                                                <Ionicons 
                                                    name="checkmark" 
                                                    size={12} 
                                                    color={colors.background} 
                                                />
                                            ) : (
                                                <Text style={[
                                                    styles.stepListNumber,
                                                    isCurrent ? styles.stepListNumberCurrent : styles.stepListNumberPending
                                                ]}>
                                                    {stepNumber}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Titre et durée */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={[
                                                styles.stepListTitle,
                                                isCurrent ? styles.stepListTitleCurrent :
                                                isCompleted ? styles.stepListTitleCompleted :
                                                styles.stepListTitlePending
                                            ]}>
                                                {step.title || step.name}
                                            </Text>
                                            
                                            {/* Timestamps et durée */}
                                            {stepTime && (
                                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                                    {stepTime.startTime && (
                                                        <>
                                                            {t('jobDetails.components.jobTimeline.startedAt')} {formatTimestamp(stepTime.startTime)}
                                                            {stepTime.endTime && ` • ${t('jobDetails.components.jobTimeline.endedAt')} ${formatTimestamp(stepTime.endTime)}`}
                                                        </>
                                                    )}
                                                    {stepTime.duration > 0 && (
                                                        <Text style={{ fontWeight: '600', color: colors.primary }}>
                                                            {` • ${t('jobDetails.components.jobTimeline.duration')} `}
                                                            <Text style={{ color: colors.text }}>
                                                                {formatDuration(stepTime.duration)}
                                                            </Text>
                                                        </Text>
                                                    )}
                                                    {!stepTime.startTime && t('jobDetails.components.jobTimeline.notStarted')}
                                                </Text>
                                            )}
                                            {!stepTime && isCurrent && (
                                                <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '600' }}>
                                                    {t('jobDetails.components.jobTimeline.inProgress')}
                                                </Text>
                                            )}
                                            {!stepTime && !isCurrent && !isCompleted && (
                                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                                    {t('jobDetails.components.jobTimeline.notStarted')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Description (si disponible) */}
                                    {step.description && (
                                        <Text style={styles.stepListDescription}>
                                            {step.description}
                                        </Text>
                                    )}
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
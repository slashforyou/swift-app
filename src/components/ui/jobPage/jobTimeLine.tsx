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

    // Protection contre les données manquantes
    if (!job) {
        return (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>No job data available</Text>
            </View>
        );
    }

    // Définir les étapes par défaut basées sur le status du job
    const getJobSteps = () => {
        return [
            { id: 1, title: 'Job Created', description: 'Job has been created and assigned', status: 'completed' },
            { id: 2, title: 'En Route', description: 'Team is on the way to the location', status: job?.status === 'pending' ? 'pending' : 'completed' },
            { id: 3, title: 'In Progress', description: 'Work is currently in progress', status: job?.status === 'in-progress' ? 'current' : job?.status === 'completed' ? 'completed' : 'pending' },
            { id: 4, title: 'Completed', description: 'Job has been completed successfully', status: job?.status === 'completed' ? 'completed' : 'pending' }
        ];
    };

    const steps = getJobSteps();
    const currentStepIndex = steps.findIndex(step => step.status === 'current');
    const actualStep = currentStepIndex >= 0 ? currentStepIndex : (job?.status === 'completed' ? steps.length - 1 : 0);
    
    // Calculate progress percentage basé sur le status réel
    const progressPercentage = job?.progress 
        ? (typeof job.progress === 'number' ? job.progress / 100 : parseFloat(job.progress) / 100)
        : actualStep / Math.max(1, (steps.length - 1));
    


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
    }, [actualStep, progressPercentage, job?.status]);

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
    });

    return (
        <View style={styles.container}>
            {/* Progress Info */}
            <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                    Step {actualStep + 1} of {steps.length}
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

                {/* Step Circles with Numbers */}
                <View style={styles.stepsContainer}>
                    {steps.map((step: any, index: number) => (
                        <View 
                            key={step.id} 
                            style={[
                                styles.stepCircle,
                                index <= actualStep 
                                    ? styles.stepCircleCompleted 
                                    : styles.stepCirclePending,
                                index === actualStep && styles.stepCircleCurrent
                            ]}
                        >
                            <Text style={[
                                styles.stepNumber,
                                index <= actualStep ? styles.stepNumberCompleted : styles.stepNumberPending
                            ]}>
                                {index + 1}
                            </Text>
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
                <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>
                        Étape {actualStep + 1}/{steps.length}
                    </Text>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(job?.status)]}>
                        <Text style={[styles.statusBadgeText, getStatusTextStyle(job?.status)]}>
                            {getStatusLabel(job?.status)}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.currentStepTitle}>
                    {steps[actualStep]?.title || 'Étape en cours'}
                </Text>
                
                <Text style={styles.stepDescription}>
                    {steps[actualStep]?.description || getStepDescription(job?.status)}
                </Text>

                {/* Indicateur de progression */}
                <View style={styles.progressIndicator}>
                    <View style={styles.progressDots}>
                        {steps.map((_, index) => (
                            <View 
                                key={index}
                                style={[
                                    styles.progressDot,
                                    index <= actualStep ? styles.progressDotActive : styles.progressDotInactive
                                ]} 
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default JobTimeLine;
/**
 * JobStepAdvanceModal - Modal amélioré pour la gestion des étapes du job
 */
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    Pressable, 
    ScrollView,
    StyleSheet,
    Animated
} from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useToast } from '../../../context/ToastProvider';
import { 
    generateJobSteps, 
    calculateProgressPercentage, 
    getCurrentStep, 
    isStepClickable, 
    getStepName,
    JobStep
} from '../../../utils/jobStepsUtils';

interface JobStepAdvanceModalProps {
    isVisible: boolean;
    onClose: () => void;
    job: any;
    onAdvanceStep: (targetStep: number) => Promise<void>;
}

const JobStepAdvanceModal: React.FC<JobStepAdvanceModalProps> = ({
    isVisible,
    onClose,
    job,
    onAdvanceStep
}) => {
    const { colors } = useTheme();
    const { showSuccess, showError } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);

    // Utiliser les utilitaires partagés
    const jobSteps = generateJobSteps(job);
    const currentStep = getCurrentStep(job);

    useEffect(() => {
        if (isVisible) {
            setSelectedStep(null);
        }
    }, [isVisible]);

    const canAdvanceTo = (stepId: number): boolean => {
        return isStepClickable(stepId, job);
    };

    const handleStepSelection = async (stepId: number) => {
        if (!canAdvanceTo(stepId) || isUpdating) return;

        try {
            setIsUpdating(true);
            setSelectedStep(stepId);
            
            await onAdvanceStep(stepId);
            
            const stepName = getStepName(stepId, job);
            showSuccess('Étape mise à jour', `${stepName} activée avec succès`);
            
            // Fermer le modal après un court délai
            setTimeout(() => {
                onClose();
                setSelectedStep(null);
            }, 1000);
            
        } catch (error) {
            console.error('Error advancing step:', error);
            showError('Erreur', 'Impossible de mettre à jour l\'étape');
        } finally {
            setIsUpdating(false);
            setSelectedStep(null);
        }
    };

    const getStepStatusColor = (step: JobStep): string => {
        switch (step.status) {
            case 'completed':
                return colors.success;
            case 'current':
                return colors.primary;
            case 'pending':
                return colors.border;
            default:
                return colors.border;
        }
    };

    const getStepBackgroundColor = (step: JobStep): string => {
        switch (step.status) {
            case 'completed':
                return colors.success + '15';
            case 'current':
                return colors.primary + '15';
            case 'pending':
                return colors.backgroundSecondary;
            default:
                return colors.backgroundSecondary;
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
            borderTopRightRadius: DESIGN_TOKENS.radius.lg,
            borderBottomLeftRadius: DESIGN_TOKENS.radius.lg,
            borderBottomRightRadius: DESIGN_TOKENS.radius.lg,
            maxHeight: '85%',
            paddingTop: DESIGN_TOKENS.spacing.md,
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        content: {
            padding: DESIGN_TOKENS.spacing.lg,
        },
        header: {
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        title: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        progressOverview: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        progressInfo: {
            flex: 1,
        },
        progressTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        progressSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 2,
        },
        progressPercentage: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.primary,
        },
        stepsContainer: {
            gap: DESIGN_TOKENS.spacing.md,
        },
        stepItem: {
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 2,
            overflow: 'hidden',
        },
        stepContent: {
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
        },
        stepIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: DESIGN_TOKENS.spacing.md,
        },
        stepInfo: {
            flex: 1,
        },
        stepName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 2,
        },
        stepDescription: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        stepActions: {
            alignItems: 'flex-end',
        },
        stepStatus: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginBottom: DESIGN_TOKENS.spacing.xs,
        },
        stepStatusText: {
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
        },
        advanceButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
        },
        advanceButtonDisabled: {
            backgroundColor: colors.border,
        },
        advanceButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.background,
        },
        cancelButton: {
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
            marginTop: DESIGN_TOKENS.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        cancelText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        },
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Terminé';
            case 'current': return 'En cours';
            case 'pending': return 'En attente';
            default: return 'En attente';
        }
    };

    const progressPercentage = calculateProgressPercentage(job);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable onPress={e => e.stopPropagation()}>
                    <View style={styles.container}>
                        {/* Handle */}
                        <View style={styles.handle} />
                        
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Avancement du Job</Text>
                                <Text style={styles.subtitle}>
                                    Gérer les étapes de progression
                                </Text>
                            </View>

                            {/* Progress Overview */}
                            <View style={styles.progressOverview}>
                                <View style={styles.progressInfo}>
                                    <Text style={styles.progressTitle}>
                                        Étape {currentStep} sur {jobSteps.length}
                                    </Text>
                                    <Text style={styles.progressSubtitle}>
                                        Job {job?.code || job?.id}
                                    </Text>
                                </View>
                                <Text style={styles.progressPercentage}>
                                    {progressPercentage}%
                                </Text>
                            </View>

                            {/* Steps List */}
                            <View style={styles.stepsContainer}>
                                {jobSteps.map((step) => {
                                    const stepColor = getStepStatusColor(step);
                                    const stepBgColor = getStepBackgroundColor(step);
                                    const isClickable = canAdvanceTo(step.id);
                                    const isProcessing = selectedStep === step.id && isUpdating;

                                    return (
                                        <Pressable
                                            key={step.id}
                                            onPress={() => isClickable && handleStepSelection(step.id)}
                                            disabled={!isClickable || isUpdating}
                                            style={({ pressed }) => [
                                                styles.stepItem,
                                                {
                                                    backgroundColor: stepBgColor,
                                                    borderColor: stepColor,
                                                    opacity: isClickable ? 1 : 0.6,
                                                    transform: [{ scale: pressed && isClickable ? 0.98 : 1 }],
                                                },
                                            ]}
                                        >
                                            <View style={styles.stepContent}>
                                                <View style={[
                                                    styles.stepIconContainer,
                                                    { backgroundColor: stepColor + '20' }
                                                ]}>
                                                    {isProcessing ? (
                                                        <Ionicons 
                                                            name="sync" 
                                                            size={24} 
                                                            color={stepColor}
                                                        />
                                                    ) : (
                                                        <Ionicons 
                                                            name={step.icon as any || 'radio-button-off'} 
                                                            size={24} 
                                                            color={stepColor}
                                                        />
                                                    )}
                                                </View>

                                                <View style={styles.stepInfo}>
                                                    <Text style={styles.stepName}>{step.name}</Text>
                                                    <Text style={styles.stepDescription}>
                                                        {step.description}
                                                    </Text>
                                                </View>

                                                <View style={styles.stepActions}>
                                                    <View style={[
                                                        styles.stepStatus,
                                                        { backgroundColor: stepColor + '20' }
                                                    ]}>
                                                        <Text style={[
                                                            styles.stepStatusText,
                                                            { color: stepColor }
                                                        ]}>
                                                            {getStatusLabel(step.status)}
                                                        </Text>
                                                    </View>

                                                    {isClickable && step.id === currentStep + 1 && (
                                                        <Pressable
                                                            style={[
                                                                styles.advanceButton,
                                                                isUpdating && styles.advanceButtonDisabled
                                                            ]}
                                                            disabled={isUpdating}
                                                        >
                                                            <Text style={styles.advanceButtonText}>
                                                                {isProcessing ? 'En cours...' : 'Avancer'}
                                                            </Text>
                                                        </Pressable>
                                                    )}
                                                </View>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Cancel Button */}
                        <Pressable
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isUpdating}
                        >
                            <Text style={styles.cancelText}>Fermer</Text>
                        </Pressable>

                        {/* Loading Overlay */}
                        {isUpdating && (
                            <View style={styles.loadingOverlay}>
                                <Ionicons 
                                    name="sync" 
                                    size={32} 
                                    color={colors.primary}
                                />
                                <Text style={{ 
                                    marginTop: 8, 
                                    color: colors.text,
                                    fontWeight: '600'
                                }}>
                                    Mise à jour en cours...
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default JobStepAdvanceModal;
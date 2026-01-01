/**
 * JobStepAdvanceModal - Modal amélioré pour la gestion des étapes du job
 * ✅ Utilise maintenant le JobTimerContext pour la source unique de vérité
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useJobTimerContext } from '../../../context/JobTimerProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useToast } from '../../../context/ToastProvider';
import { useLocalization } from '../../../localization/useLocalization';

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
    const { t } = useLocalization();
    const { showSuccess, showError } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);

    // ✅ Utiliser le timer context pour les steps (source unique de vérité)
    const { currentStep, totalSteps } = useJobTimerContext();

    // ✅ Récupérer les steps depuis le job (configuration)
    const jobSteps = job?.steps || [];

    useEffect(() => {
        if (isVisible) {
            setSelectedStep(null);
        }
    }, [isVisible]);

    // ✅ Calculer le statut de chaque étape
    const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
        if (stepIndex < currentStep) return 'completed';
        if (stepIndex === currentStep) return 'current';
        return 'pending';
    };

    // ✅ Un step est cliquable s'il est l'étape suivante ou déjà atteint
    const canAdvanceTo = (stepIndex: number): boolean => {
        return stepIndex <= currentStep + 1 && stepIndex < totalSteps;
    };

    const handleStepSelection = async (stepIndex: number) => {
        if (!canAdvanceTo(stepIndex) || isUpdating) return;

        try {
            setIsUpdating(true);
            setSelectedStep(stepIndex);
            
            // ✅ Afficher feedback immédiat
            const stepName = jobSteps[stepIndex]?.name || `Étape ${stepIndex + 1}`;
            // TEMP_DISABLED: console.log(`🔄 [MODAL] Advancing to step ${stepIndex + 1}: ${stepName}`);
            
            await onAdvanceStep(stepIndex + 1); // +1 car l'index commence à 0 mais les steps à 1
            
            // TEMP_DISABLED: console.log(`✅ [MODAL] Successfully advanced to step ${stepIndex + 1}`);
            showSuccess(
                t('jobDetails.components.stepAdvanceModal.stepUpdated'), 
                t('jobDetails.components.stepAdvanceModal.stepUpdatedMessage', { stepName })
            );
            
            // Fermer le modal après un court délai pour voir le feedback
            setTimeout(() => {
                onClose();
                setSelectedStep(null);
            }, 1500);
            
        } catch (error) {

            console.error('❌ [MODAL] Error advancing step:', error);
            showError(
                t('jobDetails.components.stepAdvanceModal.syncError'), 
                t('jobDetails.components.stepAdvanceModal.syncErrorMessage')
            );
        } finally {
            setIsUpdating(false);
            setSelectedStep(null);
        }
    };

    const getStepStatusColor = (status: 'completed' | 'current' | 'pending'): string => {
        switch (status) {
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

    const getStepBackgroundColor = (status: 'completed' | 'current' | 'pending'): string => {
        switch (status) {
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

    // ✅ Calculer le pourcentage de progression
    const progressPercentage = React.useMemo(() => {
        if (totalSteps === 0) return 0;
        return Math.round((currentStep / totalSteps) * 100);
    }, [currentStep, totalSteps]);

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
            case 'completed': return t('jobDetails.components.stepAdvanceModal.statusCompleted');
            case 'current': return t('jobDetails.components.stepAdvanceModal.statusCurrent');
            case 'pending': return t('jobDetails.components.stepAdvanceModal.statusPending');
            default: return t('jobDetails.components.stepAdvanceModal.statusPending');
        }
    };

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
                                <Text style={styles.title}>{t('jobDetails.components.stepAdvanceModal.title')}</Text>
                                <Text style={styles.subtitle}>
                                    {t('jobDetails.components.stepAdvanceModal.subtitle')}
                                </Text>
                            </View>

                            {/* Progress Overview */}
                            <View style={styles.progressOverview}>
                                <View style={styles.progressInfo}>
                                    <Text style={styles.progressTitle}>
                                        {t('jobDetails.components.stepAdvanceModal.stepProgress', { current: currentStep, total: jobSteps.length })}
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
                                {jobSteps.map((step: any, index: number) => {
                                    const status = getStepStatus(index);
                                    const stepColor = getStepStatusColor(status);
                                    const stepBgColor = getStepBackgroundColor(status);
                                    const isClickable = canAdvanceTo(index);
                                    const isProcessing = selectedStep === index && isUpdating;

                                    return (
                                        <Pressable
                                            key={step.id || index}
                                            onPress={() => isClickable && handleStepSelection(index)}
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
                                                    <Text style={styles.stepName}>{step.name || t('jobDetails.steps.intermediate')}</Text>
                                                    <Text style={styles.stepDescription}>
                                                        {step.description || t('jobDetails.components.stepAdvanceModal.noDescription')}
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
                                                            {getStatusLabel(status)}
                                                        </Text>
                                                    </View>

                                                    {isClickable && index === currentStep + 1 && (
                                                        <Pressable
                                                            style={[
                                                                styles.advanceButton,
                                                                isUpdating && styles.advanceButtonDisabled
                                                            ]}
                                                            disabled={isUpdating}
                                                        >
                                                            <Text style={styles.advanceButtonText}>
                                                                {isProcessing ? t('jobDetails.components.stepAdvanceModal.advancing') : t('jobDetails.components.stepAdvanceModal.advance')}
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
                            <Text style={styles.cancelText}>{t('jobDetails.components.stepAdvanceModal.close')}</Text>
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
                                    {t('jobDetails.components.stepAdvanceModal.updating')}
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
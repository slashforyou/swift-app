/**
 * StepValidationBadge - Badge affichant l'état de validation du step avec correction
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useToast } from '../../context/ToastProvider';
import { useLocalization } from '../../localization/useLocalization';
import {
    correctJobStep,
    validateJobStep,
    type StepValidationResult
} from '../../utils/stepValidator';

interface StepValidationBadgeProps {
    job: any;
    timeline?: any[];
    onStepCorrected?: (newStep: number) => void;
}

export const StepValidationBadge: React.FC<StepValidationBadgeProps> = ({ 
    job, 
    timeline,
    onStepCorrected 
}) => {
    const { colors } = useTheme();
    const { showSuccess, showError } = useToast();
    const { t } = useLocalization();
    const [validation, setValidation] = useState<StepValidationResult | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    // Valider le step à chaque changement
    useEffect(() => {
        if (!job) return;
        
        const result = validateJobStep(job, timeline);
        setValidation(result);
        
        // Log pour debugging
        if (!result.isValid) {
            }
    }, [job, timeline]);

    // Ne rien afficher si tout est OK
    if (!validation || validation.isValid) {
        return null;
    }

    // Ne pas afficher pour les warnings de faible gravité
    if (validation.severity === 'info' && !validation.shouldCorrect) {
        return null;
    }

    const handleCorrect = async () => {
        // Utiliser job.code au lieu de job.id (l'API attend le code du job, pas l'ID numérique)
        const jobCode = job?.code || job?.id;
        if (!validation || !jobCode) return;

        setIsCorrect(true);

        try {
            // TEMP_DISABLED: console.log('🔧 [STEP VALIDATION] Correcting step...');
            
            const result = await correctJobStep(jobCode, validation);
            
            if (result.success && result.newStep !== undefined) {
                showSuccess(t('jobDetails.components.stepValidation.stepCorrected', { currentStep: validation.currentStep, newStep: result.newStep }));
                
                // Notifier le parent du changement
                if (onStepCorrected) {
                    onStepCorrected(result.newStep);
                }
            } else {
                showError(result.message);
            }
            
        } catch (error) {

            console.error('❌ [STEP VALIDATION] Error correcting:', error);
            showError(t('jobDetails.components.stepValidation.correctionError'));
        } finally {
            setIsCorrect(false);
        }
    };

    const getBadgeColor = () => {
        switch (validation.severity) {
            case 'critical': return colors.error;
            case 'warning': return colors.warning;
            default: return colors.info;
        }
    };

    const getIcon = () => {
        switch (validation.severity) {
            case 'critical': return '🔴';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
                <Text style={styles.icon}>{getIcon()}</Text>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.background }]}>{t('jobDetails.components.stepValidation.inconsistencyDetected')}</Text>
                    <Text style={[styles.message, { color: colors.background }]}>{validation.reason}</Text>
                    <Text style={[styles.suggestion, { color: colors.background }]}>
                        {t('jobDetails.components.stepValidation.suggestion', { expectedStep: validation.expectedStep, totalSteps: job?.steps?.length || 5 })}
                    </Text>
                </View>
            </View>

            {validation.shouldCorrect && (
                <Pressable 
                    style={[styles.button, { backgroundColor: colors.text }, isCorrect && styles.buttonDisabled]}
                    onPress={handleCorrect}
                    disabled={isCorrect}
                >
                    {isCorrect ? (
                        <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                        <>
                            <Text style={[styles.buttonText, { color: colors.background }]}>{t('jobDetails.components.stepValidation.autoCorrect')}</Text>
                        </>
                    )}
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: DESIGN_TOKENS.spacing.lg,
        marginVertical: DESIGN_TOKENS.spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    badge: {
        padding: DESIGN_TOKENS.spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    icon: {
        fontSize: 24,
        marginRight: DESIGN_TOKENS.spacing.sm,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 4,
        opacity: 0.95,
    },
    suggestion: {
        color: '#FFFFFF',
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.85,
    },
    button: {
        backgroundColor: '#1F2937',
        padding: DESIGN_TOKENS.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

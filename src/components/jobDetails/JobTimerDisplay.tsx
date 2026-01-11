/**
 * JobTimerDisplay - Composant fusionné simplifié
 * Combine le chrono + la progression sur une seule ligne
 * 
 * Affichage :
 * ┌────────────────────────────────────────────────────────┐
 * │ ⏱️ 02:34:18                          🚛 En route (2/5) │
 * │ ○────●────○────○────○                          [Pause] │
 * │ [⏭️ Étape suivante]  [🏁 Terminer]                     │
 * └────────────────────────────────────────────────────────┘
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimerContext } from '../../context/JobTimerProvider';
import { useTheme } from '../../context/ThemeProvider';
import { useTranslation } from '../../localization';

interface JobTimerDisplayProps {
    job: any;
    onOpenSignatureModal?: () => void;
    onOpenPaymentPanel?: () => void;
}

const JobTimerDisplay: React.FC<JobTimerDisplayProps> = ({ job, onOpenSignatureModal, onOpenPaymentPanel }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    
    const { 
        totalElapsed,
        billableTime,
        formatTime,
        isRunning,
        isOnBreak,
        isCompleted,
        currentStep,
        totalSteps,
        togglePause, // ✅ V1.0: Simple Play/Pause toggle
        nextStep,
        stopTimer,
    } = useJobTimerContext();
    
    // 🔍 DEBUG: Log chaque fois que le composant re-render
    React.useEffect(() => {
        // TEMP_DISABLED: console.log(`🔍 [JobTimerDisplay] Rendering: Step ${currentStep}/${totalSteps}, Job Step ${job?.step?.actualStep}`);
    }, [currentStep, totalSteps, job?.step?.actualStep]);

    // 🔍 DEBUG: Log des boutons
    React.useEffect(() => {
        // TEMP_DISABLED: console.log(`🔍 [BUTTON DEBUG] Running: ${isRunning}, Break: ${isOnBreak}, Step: ${currentStep}/${totalSteps}`);
    }, [isRunning, isOnBreak, currentStep, totalSteps]);

    // Config de l'étape actuelle
    const currentStepConfig = React.useMemo(() => {
        if (!job?.steps || currentStep === 0 || currentStep > job.steps.length) return null;
        return job.steps[currentStep - 1]; // currentStep est 1-indexed
    }, [job?.steps, currentStep]);

    // ✅ Vérifier si le job est vraiment terminé (status completed)
    const isJobCompleted = job?.status === 'completed';
    
    // Vérifier si on est à la dernière étape
    const isAtFinalStep = currentStep === totalSteps;
    
    // ✅ Le timer est "figé" si le job est completed OU à l'étape finale
    const isTimerFrozen = isJobCompleted || isAtFinalStep;
    
    // Log pour debug
    React.useEffect(() => {
        // TEMP_DISABLED: console.log(`🔍 [TIMER FROZEN DEBUG] Status: ${job?.status}, Frozen: ${isTimerFrozen}, Step: ${currentStep}/${totalSteps}`);
    }, [job?.status, isJobCompleted, currentStep, totalSteps, isAtFinalStep, isTimerFrozen]);
    
    // Vérifier si signature présente
    // ✅ Vérifier signature (local OU API)
    const hasSignature = job?.signature_blob || job?.job?.signature_blob || job?.signatureDataUrl || job?.signatureFileUri;
    
    // Vérifier si paiement nécessaire
    const needsPayment = job?.payment_status === null && parseFloat(job?.amount_due || '0') > 0;

    // Handler pour terminer le job
    const handleStopTimer = () => {
        if (!hasSignature) {
            Alert.alert(
                '✍️ Signature requise',
                'Vous devez faire signer le client avant de finaliser le job.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { 
                        text: 'Signer maintenant', 
                        onPress: () => onOpenSignatureModal?.(),
                        style: 'default'
                    }
                ]
            );
            return;
        }

        Alert.alert(
            '🏁 Terminer le job',
            'Êtes-vous sûr ? La facturation sera déclenchée immédiatement.',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Terminer', onPress: stopTimer, style: 'destructive' }
            ]
        );
    };

    // Handler pour passer à l'étape suivante
    const handleNextStep = () => {
        const nextStepNumber = currentStep + 1;
        const nextStepName = job?.steps?.[currentStep]?.name || `Étape ${nextStepNumber}`;
        
        Alert.alert(
            '⏭️ Étape suivante',
            `Passer à "${nextStepName}" (${nextStepNumber}/${totalSteps}) ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Continuer', onPress: nextStep }
            ]
        );
    };

    // Ne rien afficher si pas commencé
    if (currentStep === 0) {
        return null;
    }

    return (
        <View style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.xl,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderWidth: 2,
            borderColor: isJobCompleted ? colors.success : (isRunning ? colors.primary : colors.border),
        }}>
            {/* LIGNE 1: Temps + Step actuel */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
                {/* Temps */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Ionicons 
                        name={isJobCompleted ? "checkmark-circle" : "time"} 
                        size={20} 
                        color={isJobCompleted ? colors.success : (isRunning ? colors.primary : colors.textSecondary)} 
                        style={{ marginRight: 8 }}
                    />
                    <Text style={{
                        fontSize: 28,
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        color: isJobCompleted ? colors.success : (isRunning ? colors.primary : colors.text),
                    }}>
                        {formatTime(totalElapsed, false)}
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        color: isJobCompleted ? colors.success : (isRunning ? colors.primary : colors.textSecondary),
                    }}>
                        :{String(Math.floor((totalElapsed / 1000) % 60)).padStart(2, '0')}
                    </Text>
                    {isJobCompleted && (
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.success,
                            marginLeft: 8,
                        }}>
                            (Terminé)
                        </Text>
                    )}
                </View>

                {/* Step actuel avec emoji */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: currentStepConfig?.color + '20' || colors.primary + '20',
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    borderWidth: 1,
                    borderColor: currentStepConfig?.color || colors.primary,
                }}>
                    <Text style={{ fontSize: 20, marginRight: 6 }}>
                        {isJobCompleted ? '✅' : (currentStepConfig?.emoji || '🚛')}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: currentStepConfig?.color || colors.primary,
                    }}>
                        {currentStepConfig?.name || `Étape ${currentStep}`} ({currentStep}/{totalSteps})
                    </Text>
                </View>
            </View>

            {/* LIGNE 2: Mini progression avec cercles */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: DESIGN_TOKENS.spacing.lg,
                paddingHorizontal: 4,
            }}>
                {/* Cercles des steps */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    gap: 8,
                }}>
                    {job?.steps?.map((step: any, index: number) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        const isPending = stepNumber > currentStep;

                        return (
                            <React.Fragment key={step.id || index}>
                                {/* Cercle du step */}
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: isCompleted || isCurrent ? colors.primary : colors.background,
                                    borderWidth: 2,
                                    borderColor: isCompleted || isCurrent ? colors.primary : colors.border,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transform: isCurrent ? [{ scale: 1.2 }] : [{ scale: 1 }],
                                }}>
                                    {isCompleted ? (
                                        <Ionicons name="checkmark" size={12} color={colors.background} />
                                    ) : (
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '700',
                                            color: isCurrent ? colors.background : colors.textSecondary,
                                        }}>
                                            {stepNumber}
                                        </Text>
                                    )}
                                </View>

                                {/* Ligne entre les steps (sauf pour le dernier) */}
                                {index < job.steps.length - 1 && (
                                    <View style={{
                                        flex: 1,
                                        height: 2,
                                        backgroundColor: stepNumber < currentStep ? colors.primary : colors.border,
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>

            {/* LIGNE 2.5: Boutons de contrôle (sous la timeline) */}
            <View style={{
                flexDirection: 'row',
                gap: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                {/* ✅ Bouton Play/Pause/Commencer */}
                {!isTimerFrozen && (
                    <Pressable
                        onPress={togglePause}
                        style={({ pressed }) => ({
                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            backgroundColor: pressed 
                                ? (isRunning ? colors.warning + 'DD' : colors.success + 'DD')
                                : (isRunning ? colors.warning : colors.success),
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            flex: 1,
                            justifyContent: 'center',
                        })}
                    >
                        <Ionicons 
                            name={isRunning ? 'pause' : 'play'} 
                            size={18} 
                            color={colors.background} 
                        />
                        <Text style={{
                            color: colors.background,
                            fontSize: 16,
                            fontWeight: '600',
                        }}>
                            {isRunning ? t('job.timer.pause') : t('job.timer.start')}
                        </Text>
                    </Pressable>
                )}

                {/* ✅ Bouton Étape suivante / Terminer */}
                {isRunning && !isOnBreak && (
                    <Pressable
                        onPress={currentStep < totalSteps ? handleNextStep : handleStopTimer}
                        style={({ pressed }) => ({
                            flex: 1,
                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            backgroundColor: pressed 
                                ? colors.primary + 'DD' 
                                : colors.primary,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        })}
                    >
                        <Ionicons 
                            name={currentStep < totalSteps ? 'arrow-forward' : 'checkmark-circle'} 
                            size={18} 
                            color={colors.background} 
                        />
                        <Text style={{
                            color: colors.background,
                            fontSize: 16,
                            fontWeight: '600',
                        }}>
                            {currentStep < totalSteps ? 'Étape suivante' : 'Terminer'}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* LIGNE 3: Boutons d'action pour jobs terminés */}
            {/* ✅ CORRECTION: Si job terminé (completed), afficher bouton Signature ou Paiement */}
            {isJobCompleted && (
                <View style={{
                    flexDirection: 'row',
                    gap: DESIGN_TOKENS.spacing.md,
                }}>
                    {!hasSignature ? (
                        // Pas de signature: Bouton "Signer"
                        <Pressable
                            onPress={() => onOpenSignatureModal?.()}
                            style={({ pressed }) => ({
                                flex: 1,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                backgroundColor: pressed ? colors.primary + 'DD' : colors.primary,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            })}
                        >
                            <Ionicons name="create" size={18} color={colors.background} />
                            <Text style={{
                                color: colors.background,
                                fontSize: 15,
                                fontWeight: '600',
                            }}>
                                Signature requise
                            </Text>
                        </Pressable>
                    ) : needsPayment ? (
                        // Signature OK, mais paiement nécessaire
                        <Pressable
                            onPress={() => {
                                if (onOpenPaymentPanel) {
                                    onOpenPaymentPanel();
                                } else {
                                    Alert.alert('Paiement', 'Configuration du paiement nécessaire');
                                }
                            }}
                            style={({ pressed }) => ({
                                flex: 1,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                backgroundColor: pressed ? colors.success + 'DD' : colors.success,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            })}
                        >
                            <Ionicons name="card" size={18} color={colors.background} />
                            <Text style={{
                                color: colors.background,
                                fontSize: 15,
                                fontWeight: '600',
                            }}>
                                Passer au paiement
                            </Text>
                        </Pressable>
                    ) : (
                        // Tout est terminé
                        <View style={{
                            flex: 1,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            backgroundColor: colors.success + '20',
                            borderWidth: 2,
                            borderColor: colors.success,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={{
                                color: colors.success,
                                fontSize: 15,
                                fontWeight: '600',
                            }}>
                                Job terminé et payé
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Footer: Temps facturable */}
            <View style={{
                marginTop: DESIGN_TOKENS.spacing.md,
                paddingTop: DESIGN_TOKENS.spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
                <View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Temps facturable
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                        {formatTime(billableTime)}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Temps total
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                        {formatTime(totalElapsed)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default JobTimerDisplay;

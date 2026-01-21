/**
 * Composant Clock - Affiche le chronométrage en cours du job
 * Utilisé sur la page Summary au-dessus de la timeline
 * ✅ Utilise maintenant JobTimerContext pour un état centralisé
 * ✅ Intègre le système de steps dynamiques
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimerContext } from '../../context/JobTimerProvider';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { useLocalization } from '../../localization/useLocalization';

interface JobClockProps {
    job: any;
    onOpenSignatureModal?: () => void; // ✅ Callback pour ouvrir modal signature
}

const JobClock: React.FC<JobClockProps> = ({ job, onOpenSignatureModal }) => {
    const { colors } = useCommonThemedStyles();
    const { t } = useLocalization();
    
    // ✅ Utiliser le context au lieu du hook direct
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

    // ✅ Obtenir la config de l'étape actuelle depuis le système de steps
    const currentStepConfig = React.useMemo(() => {
        if (!job?.steps || currentStep >= job.steps.length) return null;
        return job.steps[currentStep];
    }, [job?.steps, currentStep]);

    // ✅ Handler pour terminer le job avec vérification signature
    const handleStopTimer = () => {
        // Vérifier si signature requise
        const hasSignature = job?.signatureDataUrl || job?.signatureFileUri;
        
        if (!hasSignature) {
            Alert.alert(
                t('jobDetails.components.jobClock.signatureRequired'),
                t('jobDetails.components.jobClock.signatureRequiredMessage'),
                [
                    { text: t('jobDetails.components.jobClock.cancel'), style: 'cancel' },
                    { 
                        text: t('jobDetails.components.jobClock.signNow'), 
                        onPress: () => {
                            if (onOpenSignatureModal) {
                                onOpenSignatureModal();
                            } else {
                                Alert.alert(t('jobDetails.components.jobClock.error'), t('jobDetails.components.jobClock.signatureModalUnavailable'));
                            }
                        },
                        style: 'default'
                    }
                ]
            );
            return;
        }

        // Signature OK, confirmer l'arrêt
        Alert.alert(
            t('jobDetails.components.jobClock.finishJob'),
            t('jobDetails.components.jobClock.finishJobConfirm'),
            [
                { text: t('jobDetails.components.jobClock.cancel'), style: 'cancel' },
                { 
                    text: t('jobDetails.components.jobClock.finish'), 
                    onPress: stopTimer,
                    style: 'destructive'
                }
            ]
        );
    };

    // Ne pas afficher si le job n'a pas commencé
    if (currentStep === 0) {
        return null;
    }

    return (
        <View style={{
            backgroundColor: isRunning ? colors.backgroundSecondary : colors.backgroundTertiary,
            borderRadius: DESIGN_TOKENS.radius.xl,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            borderWidth: isRunning ? 2 : 1,
            borderColor: isRunning ? colors.tint : colors.border,
        }}>
            {/* Header avec statut */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: DESIGN_TOKENS.spacing.sm,
                }}>
                    <View style={{
                        backgroundColor: isRunning ? colors.tint : colors.textSecondary,
                        borderRadius: 50,
                        padding: DESIGN_TOKENS.spacing.xs,
                    }}>
                        <Ionicons 
                            name={isRunning ? 'time' : 'checkmark-circle'} 
                            size={16} 
                            color={colors.background} 
                        />
                    </View>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text,
                    }}>
                        {isRunning ? t('jobDetails.components.jobClock.jobInProgress') : t('jobDetails.components.jobClock.jobFinished')}
                    </Text>
                </View>
                
                {/* ✅ Badge du step actuel avec config dynamique */}
                <View style={{
                    backgroundColor: currentStepConfig 
                        ? currentStepConfig.color + '20' 
                        : colors.tint + '20',
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                }}>
                    {currentStepConfig && (
                        <Ionicons 
                            name={currentStepConfig.icon as any} 
                            size={12} 
                            color={currentStepConfig.color} 
                        />
                    )}
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: currentStepConfig ? currentStepConfig.color : colors.tint,
                    }}>
                        {currentStepConfig 
                            ? `${currentStepConfig.shortName || currentStepConfig.name} (${currentStep + 1}/${totalSteps})`
                            : `${t('jobDetails.components.jobClock.stepNumber')} ${currentStep + 1}/${totalSteps}`
                        }
                    </Text>
                </View>
            </View>

            {/* Temps principal avec secondes */}
            <View style={{
                alignItems: 'center',
                marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: isRunning && !isOnBreak ? colors.tint : colors.text,
                        fontFamily: 'monospace',
                    }}>
                        {formatTime(totalElapsed, false)}
                    </Text>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: isRunning && !isOnBreak ? colors.tint : colors.textSecondary,
                        fontFamily: 'monospace',
                        marginLeft: 4,
                    }}>
                        :{String(Math.floor((totalElapsed / 1000) % 60)).padStart(2, '0')}
                    </Text>
                </View>
                <Text style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 4,
                }}>
                    {isOnBreak ? t('jobDetails.components.jobClock.onPause') : t('jobDetails.components.jobClock.totalElapsedTime')}
                </Text>
            </View>

            {/* ✅ V1.0: Bouton Play/Pause simplifié */}
            {isRunning && (
                <View style={{
                    alignItems: 'center',
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                }}>
                    <Pressable
                        onPress={togglePause}
                        style={({ pressed }: { pressed: boolean }) => ({
                            backgroundColor: isOnBreak 
                                ? (pressed ? colors.success + 'DD' : colors.success) 
                                : (pressed ? colors.warning + 'DD' : colors.warning),
                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DESIGN_TOKENS.spacing.xs,
                            minWidth: 120,
                            justifyContent: 'center',
                        })}
                    >
                        <Ionicons 
                            name={isOnBreak ? 'play' : 'pause'} 
                            size={16} 
                            color={colors.background} 
                        />
                        <Text style={{
                            color: colors.background,
                            fontWeight: '600',
                            fontSize: 14,
                        }}>
                            {isOnBreak ? 'Play' : 'Pause'}
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* ✅ Nouveaux boutons d'action */}
            {isRunning && !isOnBreak && (
                <View style={{
                    flexDirection: 'row',
                    gap: DESIGN_TOKENS.spacing.sm,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    {/* Bouton Étape suivante (sauf si dernière étape) */}
                    {currentStep < totalSteps && (
                        <Pressable
                            onPress={() => {
                                Alert.alert(
                                    t('jobDetails.components.jobClock.nextStep'),
                                    t('jobDetails.components.jobClock.goToStep', { current: currentStep + 1, total: totalSteps }),
                                    [
                                        { text: t('jobDetails.components.jobClock.cancel'), style: 'cancel' },
                                        { 
                                            text: t('jobDetails.components.jobClock.confirm'), 
                                            onPress: nextStep,
                                            style: 'default'
                                        }
                                    ]
                                );
                            }}
                            style={({ pressed }: { pressed: boolean }) => ({
                                flex: 1,
                                backgroundColor: pressed ? colors.tint + 'DD' : colors.tint,
                                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.xs,
                                justifyContent: 'center',
                            })}
                        >
                            <Ionicons 
                                name="arrow-forward" 
                                size={16} 
                                color={colors.background} 
                            />
                            <Text style={{
                                color: colors.background,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                {t('jobDetails.components.jobClock.nextStep')}
                            </Text>
                        </Pressable>
                    )}

                    {/* ✅ Bouton Arrêter (dernière étape) avec vérification signature */}
                    {currentStep === totalSteps - 1 && (
                        <Pressable
                            onPress={handleStopTimer}
                            style={({ pressed }: { pressed: boolean }) => ({
                                flex: currentStep < totalSteps ? 1 : undefined,
                                backgroundColor: pressed ? colors.error + 'DD' : colors.error,
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.xs,
                                justifyContent: 'center',
                            })}
                        >
                            <Ionicons 
                                name="flag" 
                                size={16} 
                                color={colors.background} 
                            />
                            <Text style={{
                                color: colors.background,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                {t('jobDetails.components.jobClock.finish')}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* Informations de coût */}
            <View style={{
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 2,
                    }}>
                        {t('jobs.timer.billableTime')}
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.text,
                    }}>
                        {formatTime(billableTime)}
                    </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 2,
                    }}>
                        {t('jobs.timer.totalTime')}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.text,
                    }}>
                        {formatTime(totalElapsed)}
                    </Text>
                </View>
            </View>


        </View>
    );
};

export default JobClock;
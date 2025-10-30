/**
 * Composant Clock - Affiche le chronométrage en cours du job
 * Utilisé sur la page Summary au-dessus de la timeline
 * ✅ Utilise maintenant JobTimerContext pour un état centralisé
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimerContext } from '../../context/JobTimerProvider';

interface JobClockProps {
    job: any;
}

const JobClock: React.FC<JobClockProps> = ({ job }) => {
    const { colors } = useCommonThemedStyles();
    
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
        startBreak,
        stopBreak,
        nextStep,
        stopTimer,
    } = useJobTimerContext();

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
                        {isRunning ? 'Job en cours' : 'Job terminé'}
                    </Text>
                </View>
                
                {/* Badge du step actuel */}
                <View style={{
                    backgroundColor: colors.tint + '20',
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.md,
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: colors.tint,
                    }}>
                        Étape {currentStep}/6
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
                    {isOnBreak ? '⏸️ En pause' : 'Temps total écoulé'}
                </Text>
            </View>

            {/* Bouton Break */}
            {isRunning && (
                <View style={{
                    alignItems: 'center',
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                }}>
                    <Pressable
                        onPress={isOnBreak ? stopBreak : startBreak}
                        style={({ pressed }: { pressed: boolean }) => ({
                            backgroundColor: isOnBreak 
                                ? (pressed ? '#10B981DD' : '#10B981') 
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
                            {isOnBreak ? 'Reprendre' : 'Pause'}
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
                                    'Étape suivante',
                                    `Passer à l'étape ${currentStep + 1}/${totalSteps} ?`,
                                    [
                                        { text: 'Annuler', style: 'cancel' },
                                        { 
                                            text: 'Confirmer', 
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
                                Étape suivante
                            </Text>
                        </Pressable>
                    )}

                    {/* Bouton Arrêter (dernière étape) */}
                    {currentStep === totalSteps - 1 && (
                        <Pressable
                            onPress={() => {
                                Alert.alert(
                                    'Terminer le job',
                                    'Êtes-vous sûr de vouloir terminer ce job ? Le timer sera arrêté et le paiement sera calculé.',
                                    [
                                        { text: 'Annuler', style: 'cancel' },
                                        { 
                                            text: 'Terminer', 
                                            onPress: stopTimer,
                                            style: 'destructive'
                                        }
                                    ]
                                );
                            }}
                            style={({ pressed }: { pressed: boolean }) => ({
                                flex: currentStep < totalSteps ? 1 : undefined,
                                backgroundColor: pressed ? '#EF4444DD' : '#EF4444',
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
                                name="stop" 
                                size={16} 
                                color={colors.background} 
                            />
                            <Text style={{
                                color: colors.background,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                Terminer
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
                        Temps facturable
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
                        Temps total
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
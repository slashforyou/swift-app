/**
 * Composant Clock - Affiche le chronométrage en cours du job
 * Utilisé sur la page Summary au-dessus de la timeline
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimer } from '../../hooks/useJobTimer';

interface JobClockProps {
    job: any;
}

const JobClock: React.FC<JobClockProps> = ({ job }) => {
    const { colors } = useCommonThemedStyles();
    const jobId = job?.job?.code || job?.code || 'unknown';
    const currentStep = job?.job?.current_step || job?.current_step || 0;
    
    const { 
        totalElapsed, 
        billableTime,
        formatTime, 
        isRunning,
        isOnBreak,
        startBreak,
        stopBreak,
        startTimerWithJobData,
        calculateCost,
        HOURLY_RATE_AUD 
    } = useJobTimer(jobId, currentStep);

    // Auto-démarrer si le job a déjà commencé
    React.useEffect(() => {
        if (currentStep >= 1 && !isRunning) {
            startTimerWithJobData(job);
        }
    }, [currentStep, isRunning, job, startTimerWithJobData]);

    const costData = calculateCost(billableTime);

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
                    marginBottom: DESIGN_TOKENS.spacing.lg,
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
                        Coût estimé actuel
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.text,
                    }}>
                        ${costData.cost.toFixed(0)} AUD
                    </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 2,
                    }}>
                        Heures facturables
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.text,
                    }}>
                        {costData.hours.toFixed(1)}h
                    </Text>
                    <Text style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                    }}>
                        @ ${HOURLY_RATE_AUD}/h
                    </Text>
                </View>
            </View>

            {/* Note sur la facturation */}
            {isRunning && (
                <Text style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: DESIGN_TOKENS.spacing.sm,
                    fontStyle: 'italic',
                }}>
                    Inclut minimum 2h + call-out 30min • Arrondi demi-heure
                </Text>
            )}
        </View>
    );
};

export default JobClock;
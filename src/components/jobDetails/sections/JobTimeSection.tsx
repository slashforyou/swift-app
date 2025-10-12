/**
 * Composant JobTimeSection - Section détaillée des temps du job
 * Affiche le temps écoulé, les détails par étape et le calcul de coût
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../../hooks/useCommonStyles';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useJobTimer } from '../../../hooks/useJobTimer';

interface JobTimeSectionProps {
    job: any;
}

const JobTimeSection: React.FC<JobTimeSectionProps> = ({ job }) => {
    const { colors } = useCommonThemedStyles();
    const jobId = job?.job?.code || job?.code || 'unknown';
    const currentStep = job?.job?.current_step || job?.current_step || 0;
    
    const { 
        timerData,
        totalElapsed, 
        billableTime,
        formatTime, 
        isRunning,
        isOnBreak,
        startBreak,
        stopBreak,
        startTimerWithJobData
    } = useJobTimer(jobId, currentStep);

    // Auto-démarrer si le job a déjà commencé
    React.useEffect(() => {
        if (currentStep >= 1 && !isRunning) {
            startTimerWithJobData(job);
        }
    }, [currentStep, isRunning, job, startTimerWithJobData]);

    // Ne pas afficher si le job n'a pas commencé
    if (currentStep === 0 || !timerData) {
        return (
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: DESIGN_TOKENS.spacing.sm,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.textSecondary + '20',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    </View>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.text,
                        flex: 1
                    }}>
                        Suivi du Temps
                    </Text>
                </View>
                
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}>
                    Le chronométrage démarrera dès le lancement du job
                </Text>
            </View>
        );
    }

    return (
        <View style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
        }}>
            {/* Header de section */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Ionicons name="time" size={18} color={colors.primary} />
                </View>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    flex: 1
                }}>
                    Suivi du Temps
                </Text>
                <View style={{
                    backgroundColor: isRunning ? colors.primary : colors.textSecondary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: colors.background,
                    }}>
                        {isRunning ? 'EN COURS' : 'TERMINÉ'}
                    </Text>
                </View>
            </View>

            {/* Temps total et statut */}
            <View style={{
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'baseline',
                    }}>
                        <Text style={{
                            fontSize: 28,
                            fontWeight: '700',
                            color: isRunning && !isOnBreak ? colors.primary : colors.text,
                            fontFamily: 'monospace',
                        }}>
                            {formatTime(totalElapsed, false)}
                        </Text>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: isRunning && !isOnBreak ? colors.primary : colors.textSecondary,
                            fontFamily: 'monospace',
                            marginLeft: 2,
                        }}>
                            :{String(Math.floor((totalElapsed / 1000) % 60)).padStart(2, '0')}
                        </Text>
                    </View>
                    <View style={{
                        alignItems: 'flex-end',
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                            marginBottom: 2,
                        }}>
                            Étape actuelle
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text,
                        }}>
                            {currentStep}/6
                        </Text>
                    </View>
                </View>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: DESIGN_TOKENS.spacing.xs,
                }}>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                    }}>
                        Total: {formatTime(totalElapsed)}
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                    }}>
                        Facturable: {formatTime(billableTime)}
                    </Text>
                </View>
                {isOnBreak && (
                    <Text style={{
                        fontSize: 12,
                        color: colors.warning,
                        textAlign: 'center',
                        marginTop: DESIGN_TOKENS.spacing.xs,
                        fontWeight: '600',
                    }}>
                        ⏸️ En pause (non facturable)
                    </Text>
                )}
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
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DESIGN_TOKENS.spacing.sm,
                            minWidth: 140,
                            justifyContent: 'center',
                        })}
                    >
                        <Ionicons 
                            name={isOnBreak ? 'play' : 'pause'} 
                            size={20} 
                            color={colors.background} 
                        />
                        <Text style={{
                            color: colors.background,
                            fontWeight: '700',
                            fontSize: 16,
                        }}>
                            {isOnBreak ? 'Reprendre travail' : 'Prendre une pause'}
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Détail par étapes */}
            <View style={{
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    Détail par étapes
                </Text>
                
                <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                >
                    {timerData.stepTimes.map((stepTime: any, index: number) => (
                        <View 
                            key={`step-${stepTime.step}`}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                borderBottomWidth: index < timerData.stepTimes.length - 1 ? 1 : 0,
                                borderBottomColor: colors.border,
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.sm,
                                flex: 1,
                            }}>
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: stepTime.endTime ? colors.primary : colors.warning,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: colors.background,
                                    }}>
                                        {stepTime.step}
                                    </Text>
                                </View>
                                <Text style={{
                                    fontSize: 14,
                                    color: colors.text,
                                    flex: 1,
                                }}>
                                    {stepTime.stepName}
                                </Text>
                            </View>
                            
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: stepTime.endTime ? colors.text : colors.primary,
                                fontFamily: 'monospace',
                            }}>
                                {stepTime.endTime 
                                    ? formatTime(stepTime.duration || 0)
                                    : formatTime(Date.now() - stepTime.startTime)
                                }
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Calcul de coût */}
            <View style={{
                backgroundColor: colors.background,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.lg,
                borderWidth: 2,
                borderColor: colors.primary + '30',
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: DESIGN_TOKENS.spacing.sm,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    <Ionicons name="calculator-outline" size={20} color={colors.primary} />
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text,
                    }}>
                        Calcul de Coût
                    </Text>
                </View>

                <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            Temps total
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {(totalElapsed / (1000 * 60 * 60)).toFixed(2)}h
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            Temps pauses
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                            -{((totalElapsed - billableTime) / (1000 * 60 * 60)).toFixed(2)}h
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            Temps facturable
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {(billableTime / (1000 * 60 * 60)).toFixed(2)}h
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default JobTimeSection;
/**
 * Composant JobTimeSection - Section détaillée des temps du job
 * Affiche le temps écoulé, les détails par étape et le calcul de coût
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
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
        formatTime, 
        isRunning, 
        calculateCost,
        HOURLY_RATE_AUD 
    } = useJobTimer(jobId, currentStep);

    const costData = calculateCost(totalElapsed);

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
                    <Text style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: isRunning ? colors.primary : colors.text,
                        fontFamily: 'monospace',
                    }}>
                        {formatTime(totalElapsed)}
                    </Text>
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
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                }}>
                    Temps total écoulé depuis le début du job
                </Text>
            </View>

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
                            Temps brut
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {costData.rawHours.toFixed(2)}h
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            Heures facturables
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {costData.hours.toFixed(1)}h
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            Taux horaire
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            ${HOURLY_RATE_AUD}/h AUD
                        </Text>
                    </View>

                    <View style={{
                        height: 1,
                        backgroundColor: colors.border,
                        marginVertical: DESIGN_TOKENS.spacing.xs,
                    }} />

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '700', 
                            color: colors.text 
                        }}>
                            Coût total
                        </Text>
                        <Text style={{ 
                            fontSize: 20, 
                            fontWeight: '700', 
                            color: colors.primary 
                        }}>
                            ${costData.cost.toFixed(0)} AUD
                        </Text>
                    </View>
                </View>

                <Text style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: DESIGN_TOKENS.spacing.md,
                    fontStyle: 'italic',
                }}>
                    Inclut minimum 2h + call-out 30min • Arrondi demi-heure (7min+)
                </Text>
            </View>
        </View>
    );
};

export default JobTimeSection;
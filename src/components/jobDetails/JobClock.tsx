/**
 * Composant Clock - Affiche le chronométrage en cours du job
 * Utilisé sur la page Summary au-dessus de la timeline
 */

import React from 'react';
import { View, Text } from 'react-native';
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
        formatTime, 
        isRunning, 
        calculateCost,
        HOURLY_RATE_AUD 
    } = useJobTimer(jobId, currentStep);

    const costData = calculateCost(totalElapsed);

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

            {/* Temps principal */}
            <View style={{
                alignItems: 'center',
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <Text style={{
                    fontSize: 36,
                    fontWeight: '700',
                    color: isRunning ? colors.tint : colors.text,
                    fontFamily: 'monospace',
                }}>
                    {formatTime(totalElapsed)}
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginTop: DESIGN_TOKENS.spacing.xs,
                }}>
                    Temps écoulé
                </Text>
            </View>

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
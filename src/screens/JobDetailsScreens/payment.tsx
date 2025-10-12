/**
 * Payment Page - Gestion moderne des paiements conforme au design Summary
 * Utilise le timer en temps réel pour calculer les coûts
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import Ionicons from '@react-native-vector-icons/ionicons';
import PaymentWindow from './paymentWindow';
import { useJobTimer } from '../../hooks/useJobTimer';

// Interfaces
interface PaymentProps {
    job: any;
    setJob: (job: any) => void;
}

const PaymentScreen: React.FC<PaymentProps> = ({ job, setJob }) => {
    const { colors } = useTheme();
    const [paymentWindowVisible, setPaymentWindowVisible] = useState<string | null>(null);

    // Utiliser le hook timer pour les calculs en temps réel
    const jobId = job?.job?.code || job?.code || 'unknown';
    const currentStep = job?.job?.current_step || job?.current_step || 0;
    
    const { 
        timerData,
        totalElapsed,
        billableTime,
        formatTime,
        calculateCost,
        HOURLY_RATE_AUD,
        isRunning
    } = useJobTimer(jobId, currentStep);

    // Calculer le coût en temps réel
    const getRealTimePaymentInfo = () => {
        const costData = calculateCost(billableTime);
        const estimatedCost = job?.job?.estimatedCost || job?.estimatedCost || 0;
        const currentCost = costData.cost;
        
        return {
            estimated: estimatedCost,
            current: currentCost,
            billableHours: costData.hours,
            actualTime: billableTime,
            totalTime: totalElapsed,
            currency: 'AUD',
            status: determinePaymentStatus(currentCost, estimatedCost),
            isPaid: job?.job?.isPaid || job?.isPaid || false,
            isRunning
        };
    };

    const determinePaymentStatus = (actualCost: number, estimatedCost: number) => {
        if (actualCost === 0) return 'pending';
        if (actualCost < estimatedCost) return 'partial';
        return 'completed';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
        }).format(amount);
    };

    const getStatusInfo = (status: string) => {
        const statusMap = {
            'pending': { 
                label: 'En attente', 
                color: '#F59E0B', 
                bgColor: '#FEF3C7',
                icon: 'time-outline'
            },
            'partial': { 
                label: 'Partiel', 
                color: '#3B82F6', 
                bgColor: '#DBEAFE',
                icon: 'card-outline'
            },
            'completed': { 
                label: 'Payé', 
                color: '#10B981', 
                bgColor: '#D1FAE5',
                icon: 'checkmark-circle-outline'
            }
        };
        return statusMap[status as keyof typeof statusMap] || statusMap.pending;
    };

    const paymentInfo = getRealTimePaymentInfo();
    const statusInfo = getStatusInfo(paymentInfo.status);

    // Vérifier si le job est terminé (actualStep = nombre total d'étapes)
    const isJobCompleted = () => {
        const stepData = job?.step || job?.job?.step;
        if (!stepData) return false;
        return stepData.actualStep >= stepData.steps.length;
    };

    const handlePayment = () => {
        if (!isJobCompleted()) {
            Alert.alert("Job en cours", "Le paiement ne sera disponible qu'une fois le job terminé.");
            return;
        }
        
        if (paymentInfo.status === 'pending') {
            setPaymentWindowVisible('paymentWindow');
        } else {
            Alert.alert("Information", "Le paiement pour ce job a déjà été traité.");
        }
    };

    if (paymentWindowVisible === 'paymentWindow') {
        return (
            <PaymentWindow 
                job={job}
                setJob={setJob}
                visibleCondition={paymentWindowVisible}
                setVisibleCondition={setPaymentWindowVisible}
            />
        );
    }

    return (
        <ScrollView 
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.md }}
        >
            {/* Header avec statuts et bouton de paiement */}
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                {/* Titre */}
                <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    Paiement du Job
                </Text>
                
                {/* Badges de statut */}
                <View style={{ 
                    flexDirection: 'row', 
                    gap: DESIGN_TOKENS.spacing.sm, 
                    flexWrap: 'wrap',
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    {/* Badge de statut du job */}
                    <View style={{
                        backgroundColor: isJobCompleted() ? '#D1FAE5' : '#FEF3C7',
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        paddingHorizontal: DESIGN_TOKENS.spacing.md,
                        paddingVertical: DESIGN_TOKENS.spacing.xs,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: DESIGN_TOKENS.spacing.xs,
                    }}>
                        <Ionicons 
                            name={isJobCompleted() ? 'checkmark-circle-outline' : 'time-outline'} 
                            size={16} 
                            color={isJobCompleted() ? '#10B981' : '#F59E0B'} 
                        />
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: isJobCompleted() ? '#10B981' : '#F59E0B',
                        }}>
                            {isJobCompleted() ? 'Job terminé' : 'Job en cours'}
                        </Text>
                    </View>
                    
                    {/* Badge de statut de paiement */}
                    <View style={{
                        backgroundColor: statusInfo.bgColor,
                        borderRadius: DESIGN_TOKENS.radius.lg,
                        paddingHorizontal: DESIGN_TOKENS.spacing.md,
                        paddingVertical: DESIGN_TOKENS.spacing.xs,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: DESIGN_TOKENS.spacing.xs,
                    }}>
                        <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: statusInfo.color,
                        }}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                {/* Bouton de paiement en dessous des badges */}
                {paymentInfo.status === 'pending' && (
                    <Pressable
                        onPress={handlePayment}
                        style={({ pressed }) => ({
                            backgroundColor: isJobCompleted() 
                                ? (pressed ? colors.tint + 'DD' : colors.tint)
                                : colors.backgroundTertiary,
                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: DESIGN_TOKENS.spacing.sm,
                            minHeight: 56,
                            opacity: isJobCompleted() ? 1 : 0.6,
                            alignSelf: 'flex-start', // Le bouton prend sa taille naturelle
                        })}
                    >
                        <Ionicons 
                            name="card" 
                            size={20} 
                            color={isJobCompleted() ? colors.background : colors.textSecondary} 
                        />
                        <Text style={{
                            color: isJobCompleted() ? colors.background : colors.textSecondary,
                            fontWeight: '700',
                            fontSize: 16,
                        }}>
                            {isJobCompleted() ? 'Payer maintenant' : 'Job en cours...'}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Suivi du temps en temps réel */}
            {paymentInfo.isRunning && (
                <View style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.lg,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    borderWidth: 2,
                    borderColor: colors.primary + '30',
                }}>
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
                            Temps en cours
                        </Text>
                        <View style={{
                            backgroundColor: '#10B981',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#FFFFFF',
                            }} />
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: '#FFFFFF',
                            }}>
                                LIVE
                            </Text>
                        </View>
                    </View>

                    <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                Temps total écoulé
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                {formatTime(paymentInfo.totalTime)}
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
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                {formatTime(paymentInfo.actualTime)}
                            </Text>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                Coût en cours
                            </Text>
                            <Text style={{ 
                                fontSize: 18, 
                                fontWeight: '700', 
                                color: colors.primary 
                            }}>
                                {formatCurrency(paymentInfo.current)}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Résumé financier */}
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Résumé Financier
                </Text>

                <View style={{ gap: DESIGN_TOKENS.spacing.lg }}>
                    {/* Coût estimé */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: DESIGN_TOKENS.spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                marginBottom: 4,
                            }}>
                                Coût estimé
                            </Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: colors.text,
                            }}>
                                {formatCurrency(paymentInfo.estimated)}
                            </Text>
                        </View>
                        <Ionicons name="calculator" size={20} color={colors.textSecondary} />
                    </View>

                    {/* Coût réel */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: DESIGN_TOKENS.spacing.md,
                        borderBottomWidth: paymentInfo.current !== paymentInfo.estimated ? 1 : 0,
                        borderBottomColor: colors.border,
                    }}>
                        <View>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                marginBottom: 4,
                            }}>
                                {paymentInfo.status === 'completed' ? 'Coût final' : 'Coût actuel'}
                            </Text>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: paymentInfo.status === 'completed' ? '#10B981' : colors.text,
                            }}>
                                {formatCurrency(paymentInfo.current)}
                            </Text>
                        </View>
                        <Ionicons 
                            name={paymentInfo.status === 'completed' ? 'checkmark-circle' : 'time'} 
                            size={24} 
                            color={paymentInfo.status === 'completed' ? '#10B981' : colors.textSecondary} 
                        />
                    </View>

                    {/* Différence si applicable */}
                    {paymentInfo.current !== paymentInfo.estimated && (
                        <View style={{
                            backgroundColor: paymentInfo.current > paymentInfo.estimated ? '#FEF3C7' : '#D1FAE5',
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            padding: DESIGN_TOKENS.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DESIGN_TOKENS.spacing.sm,
                        }}>
                            <Ionicons 
                                name={paymentInfo.current > paymentInfo.estimated ? 'trending-up' : 'trending-down'} 
                                size={20} 
                                color={paymentInfo.current > paymentInfo.estimated ? '#F59E0B' : '#10B981'} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: paymentInfo.current > paymentInfo.estimated ? '#92400E' : '#047857',
                                }}>
                                    {paymentInfo.current > paymentInfo.estimated ? 'Coût supplémentaire' : 'Économie réalisée'}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '700',
                                    color: paymentInfo.current > paymentInfo.estimated ? '#F59E0B' : '#10B981',
                                }}>
                                    {formatCurrency(Math.abs(paymentInfo.current - paymentInfo.estimated))}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Détails de facturation */}
                <View style={{
                    backgroundColor: colors.backgroundTertiary + '50',
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginTop: DESIGN_TOKENS.spacing.md,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: DESIGN_TOKENS.spacing.sm,
                        marginBottom: DESIGN_TOKENS.spacing.sm,
                    }}>
                        <Ionicons name="calculator" size={16} color={colors.textSecondary} />
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.textSecondary,
                        }}>
                            Détails de facturation
                        </Text>
                    </View>
                    
                    <View style={{ gap: DESIGN_TOKENS.spacing.xs }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                Heures facturables:
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>
                                {paymentInfo.billableHours.toFixed(1)}h
                            </Text>
                        </View>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                Taux horaire:
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>
                                {formatCurrency(HOURLY_RATE_AUD)}/h
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Informations du job */}
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                }}>
                    Détails du Job
                </Text>

                <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
                    <View>
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                            marginBottom: 4,
                        }}>
                            Titre
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: colors.text,
                        }}>
                            {job?.job?.title || job?.title || 'Job sans titre'}
                        </Text>
                    </View>

                    {job?.client && (
                        <View>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                marginBottom: 4,
                            }}>
                                Client
                            </Text>
                            <Text style={{
                                fontSize: 16,
                                color: colors.text,
                            }}>
                                {job.client.name || `${job.client.firstName} ${job.client.lastName}`}
                            </Text>
                        </View>
                    )}

                    <View>
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                            marginBottom: 4,
                        }}>
                            Durée estimée
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: colors.text,
                        }}>
                            {job?.job?.estimatedDuration ? `${Math.round(job.job.estimatedDuration / 60)} heures` : 'Non définie'}
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default PaymentScreen;
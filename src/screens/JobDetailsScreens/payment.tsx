/**
 * Payment Page - Gestion moderne des paiements conforme au design Summary
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import Ionicons from '@react-native-vector-icons/ionicons';
import PaymentWindow from './paymentWindow';

// Interfaces
interface PaymentProps {
    job: any;
    setJob: (job: any) => void;
}

const PaymentScreen: React.FC<PaymentProps> = ({ job, setJob }) => {
    const { colors } = useTheme();
    const [paymentWindowVisible, setPaymentWindowVisible] = useState<string | null>(null);

    // Extraire les informations de coût depuis les données du job
    const getPaymentInfo = () => {
        // Utiliser estimatedCost et actualCost depuis job.job (données API réelles)
        const jobData = job?.job || job;
        const estimatedCost = jobData?.estimatedCost || 0;
        const actualCost = jobData?.actualCost || estimatedCost;
        
        return {
            estimated: estimatedCost,
            actual: actualCost,
            currency: 'EUR', // Défaut pour le marché français
            status: determinePaymentStatus(actualCost, estimatedCost),
            isPaid: actualCost > 0 && actualCost >= estimatedCost
        };
    };

    const determinePaymentStatus = (actualCost: number, estimatedCost: number) => {
        if (actualCost === 0) return 'pending';
        if (actualCost < estimatedCost) return 'partial';
        return 'completed';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
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

    const paymentInfo = getPaymentInfo();
    const statusInfo = getStatusInfo(paymentInfo.status);

    const handlePayment = () => {
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
            {/* Header avec bouton de paiement */}
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                marginBottom: DESIGN_TOKENS.spacing.lg,
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                }}>
                    <View>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: '700',
                            color: colors.text,
                            marginBottom: DESIGN_TOKENS.spacing.xs,
                        }}>
                            Paiement du Job
                        </Text>
                        <View style={{
                            backgroundColor: statusInfo.bgColor,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.xs,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DESIGN_TOKENS.spacing.xs,
                            alignSelf: 'flex-start',
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

                    {paymentInfo.status === 'pending' && (
                        <Pressable
                            onPress={handlePayment}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.tint + 'DD' : colors.tint,
                                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                paddingVertical: DESIGN_TOKENS.spacing.sm,
                                borderRadius: DESIGN_TOKENS.radius.lg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: DESIGN_TOKENS.spacing.xs,
                            })}
                        >
                            <Ionicons name="card" size={18} color={colors.background} />
                            <Text style={{
                                color: colors.background,
                                fontWeight: '600',
                                fontSize: 14,
                            }}>
                                Payer maintenant
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

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
                        borderBottomWidth: paymentInfo.actual !== paymentInfo.estimated ? 1 : 0,
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
                                {formatCurrency(paymentInfo.actual)}
                            </Text>
                        </View>
                        <Ionicons 
                            name={paymentInfo.status === 'completed' ? 'checkmark-circle' : 'time'} 
                            size={24} 
                            color={paymentInfo.status === 'completed' ? '#10B981' : colors.textSecondary} 
                        />
                    </View>

                    {/* Différence si applicable */}
                    {paymentInfo.actual !== paymentInfo.estimated && (
                        <View style={{
                            backgroundColor: paymentInfo.actual > paymentInfo.estimated ? '#FEF3C7' : '#D1FAE5',
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            padding: DESIGN_TOKENS.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: DESIGN_TOKENS.spacing.sm,
                        }}>
                            <Ionicons 
                                name={paymentInfo.actual > paymentInfo.estimated ? 'trending-up' : 'trending-down'} 
                                size={20} 
                                color={paymentInfo.actual > paymentInfo.estimated ? '#F59E0B' : '#10B981'} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: paymentInfo.actual > paymentInfo.estimated ? '#92400E' : '#047857',
                                }}>
                                    {paymentInfo.actual > paymentInfo.estimated ? 'Coût supplémentaire' : 'Économie réalisée'}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '700',
                                    color: paymentInfo.actual > paymentInfo.estimated ? '#F59E0B' : '#10B981',
                                }}>
                                    {formatCurrency(Math.abs(paymentInfo.actual - paymentInfo.estimated))}
                                </Text>
                            </View>
                        </View>
                    )}
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
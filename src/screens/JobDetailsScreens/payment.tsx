/**
 * Payment Page - Gestion moderne des paiements avec sécurité renforcée
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import Ionicons from '@react-native-vector-icons/ionicons';
import PaymentWindow from './paymentWindow';
interface JobPaymentProps {
    job: any;
    setJob: React.Dispatch<React.SetStateAction<any>>;
}

interface PaymentInfoProps {
    label: string;
    value: string | number;
    format?: 'currency' | 'date' | 'text';
    currency?: string;
}

interface CardItemProps {
    card: any;
    index: number;
    onSelect?: (card: any) => void;
    onEdit?: (card: any) => void;
    onDelete?: (cardId: number) => void;
    isSelected?: boolean;
}

interface StatusBadgeProps {
    status: string;
}

// États de paiement avec couleurs sémantiques
const PAYMENT_STATUSES = {
    'unsettled': { color: '#FFF3CD', borderColor: '#F0AD4E', textColor: '#856404', icon: 'time', label: 'Pending Payment' },
    'pending': { color: '#CCE5FF', borderColor: '#007AFF', textColor: '#0056CC', icon: 'hourglass', label: 'Processing' },
    'accepted': { color: '#D4EDDA', borderColor: '#28A745', textColor: '#155724', icon: 'checkmark-circle', label: 'Accepted' },
    'rejected': { color: '#F8D7DA', borderColor: '#DC3545', textColor: '#721C24', icon: 'close-circle', label: 'Rejected' },
    'paid': { color: '#D4EDDA', borderColor: '#28A745', textColor: '#155724', icon: 'checkmark-done', label: 'Paid' },
};

// Utilitaires de formatage
const formatCurrency = (amount: string | number, currency: string = 'AUD'): string => {
    if (amount === 'N/A' || !amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return amount.toString();
    
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency,
    }).format(numAmount);
};

const formatDate = (dateString: string): string => {
    if (dateString === 'N/A' || !dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-AU');
    } catch {
        return dateString;
    }
};

const maskCardNumber = (cardNumber: string): string => {
    if (!cardNumber || cardNumber === 'N/A') return 'N/A';
    // Masque tout sauf les 4 derniers chiffres
    return cardNumber.replace(/\d(?=\d{4})/g, '•');
};

// Composant Badge de statut
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const statusInfo = PAYMENT_STATUSES[status as keyof typeof PAYMENT_STATUSES] || PAYMENT_STATUSES.unsettled;
    
    return (
        <HStack gap="xs" align="center" style={{
            backgroundColor: statusInfo.color,
            borderWidth: 1,
            borderColor: statusInfo.borderColor,
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignSelf: 'flex-start',
        }}>
            <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.textColor} />
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                fontWeight: '600',
                color: statusInfo.textColor,
            }}>
                {statusInfo.label}
            </Text>
        </HStack>
    );
};

// Composant Info de paiement
const PaymentInfo: React.FC<PaymentInfoProps> = ({ label, value, format = 'text', currency = 'AUD' }) => {
    const { colors } = useCommonThemedStyles();
    
    const formatValue = (val: string | number) => {
        switch (format) {
            case 'currency':
                return formatCurrency(val, currency);
            case 'date':
                return formatDate(val.toString());
            default:
                return val?.toString() || 'N/A';
        }
    };

    return (
        <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                fontWeight: '500',
                color: colors.textSecondary,
            }}>
                {label}
            </Text>
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                fontWeight: format === 'currency' ? '600' : '400',
                color: colors.text,
            }}>
                {formatValue(value)}
            </Text>
        </VStack>
    );
};

// Composant Carte de crédit sécurisé
const CardItem: React.FC<CardItemProps> = ({ card, index, onSelect, onEdit, onDelete, isSelected = false }) => {
    const { colors } = useCommonThemedStyles();
    
    const handleEdit = () => {
        Alert.alert("Edit Card", "Feature coming soon! You'll be able to edit card details here.");
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Card",
            "Are you sure you want to delete this card?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete?.(card.id) }
            ]
        );
    };

    const getCardBrand = (cardNumber: string) => {
        if (cardNumber.startsWith('4')) return { name: 'Visa', icon: 'card', color: '#1A1F71' };
        if (cardNumber.startsWith('5')) return { name: 'Mastercard', icon: 'card', color: '#EB001B' };
        return { name: 'Card', icon: 'card', color: colors.tint };
    };

    const brand = getCardBrand(card.cardNumber);

    return (
        <Pressable
            onPress={() => onSelect?.(card)}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={({ pressed }) => ({
                backgroundColor: pressed 
                    ? colors.backgroundSecondary 
                    : (isSelected ? colors.backgroundTertiary : colors.background),
                borderWidth: 2,
                borderColor: isSelected ? colors.tint : colors.border,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                minHeight: DESIGN_TOKENS.touch.minSize,
            })}
            accessibilityRole="button"
            accessibilityLabel={`Card ending in ${card.cardNumber.slice(-4)}`}
            accessibilityState={{ selected: isSelected }}
        >
            <VStack gap="md">
                <HStack gap="md" align="center" justify="space-between">
                    <HStack gap="sm" align="center">
                        <View style={{
                            backgroundColor: brand.color,
                            padding: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.sm,
                        }}>
                            <Ionicons name={brand.icon as any} size={20} color={colors.background} />
                        </View>
                        <VStack gap="xs">
                            <Text style={{
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                fontWeight: '600',
                                color: colors.text,
                            }}>
                                {brand.name}
                            </Text>
                            <Text style={{
                                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                color: colors.textSecondary,
                            }}>
                                {maskCardNumber(card.cardNumber)}
                            </Text>
                        </VStack>
                    </HStack>
                    
                    {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                    )}
                </HStack>

                <HStack gap="lg" align="center" justify="space-between">
                    <VStack gap="xs">
                        <Text style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: colors.textSecondary,
                        }}>
                            Card Holder
                        </Text>
                        <Text style={{
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            color: colors.text,
                        }}>
                            {card.cardHolderName}
                        </Text>
                    </VStack>
                    
                    <VStack gap="xs">
                        <Text style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: colors.textSecondary,
                        }}>
                            Expires
                        </Text>
                        <Text style={{
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            color: colors.text,
                        }}>
                            {card.expiryDate}
                        </Text>
                    </VStack>
                    
                    <HStack gap="sm">
                        <Pressable
                            onPress={handleEdit}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                padding: DESIGN_TOKENS.spacing.xs,
                                backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Edit card"
                        >
                            <Ionicons name="create" size={16} color={colors.tint} />
                        </Pressable>
                        
                        <Pressable
                            onPress={handleDelete}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                            style={({ pressed }) => ({
                                padding: DESIGN_TOKENS.spacing.xs,
                                backgroundColor: pressed ? 'rgba(220, 53, 69, 0.1)' : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Delete card"
                        >
                            <Ionicons name="trash" size={16} color="#DC3545" />
                        </Pressable>
                    </HStack>
                </HStack>
            </VStack>
        </Pressable>
    );
};

const JobPayment: React.FC<JobPaymentProps> = ({ job, setJob }) => {
    const { colors } = useCommonThemedStyles();
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<any>(null);

    const handleMakePayment = () => {
        if (job.payment?.status === 'unsettled') {
            setPaymentStatus('paymentWindow');
        } else {
            Alert.alert("Payment", "This payment has already been processed.");
        }
    };

    const handleAddCard = () => {
        Alert.alert("Add Card", "Feature coming soon! You'll be able to add a new payment card here.");
    };

    const handleDeleteCard = (cardId: number) => {
        const updatedJob = {
            ...job,
            payment: {
                ...job.payment,
                savedCards: job.payment?.savedCards?.filter((card: any) => card.id !== cardId) || []
            }
        };
        setJob(updatedJob);
    };

    const paymentData = job.payment;
    const hasPayment = paymentData && Object.keys(paymentData).length > 0;

    // Render PaymentWindow if payment status is set
    if (paymentStatus === 'paymentWindow') {
        return (
            <PaymentWindow 
                job={job}
                setJob={setJob}
                visibleCondition={paymentStatus}
                setVisibleCondition={setPaymentStatus}
            />
        );
    }

    return (
        <VStack gap="lg">
                {/* Header avec status */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="lg">
                        <HStack gap="md" align="center" justify="space-between">
                            <VStack gap="xs">
                                <Text style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: colors.text,
                                }}>
                                    Payment Information
                                </Text>
                                {hasPayment && (
                                    <StatusBadge status={paymentData.status || 'unsettled'} />
                                )}
                            </VStack>
                            
                            {paymentData?.status === 'unsettled' && (
                                <Pressable
                                    onPress={handleMakePayment}
                                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                    style={({ pressed }) => ({
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                                        paddingHorizontal: DESIGN_TOKENS.spacing.md,
                                        backgroundColor: pressed 
                                            ? colors.backgroundSecondary
                                            : colors.tint,
                                        borderRadius: DESIGN_TOKENS.radius.md,
                                        minHeight: DESIGN_TOKENS.touch.minSize,
                                    })}
                                    accessibilityRole="button"
                                    accessibilityLabel="Make payment"
                                >
                                    <Text style={{ 
                                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                        fontWeight: '600',
                                        color: colors.background,
                                        marginRight: DESIGN_TOKENS.spacing.xs,
                                    }}>
                                        Pay Now
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.background} />
                                </Pressable>
                            )}
                        </HStack>

                        {!hasPayment && (
                            <VStack gap="sm" style={{ alignItems: 'center', paddingVertical: DESIGN_TOKENS.spacing.lg }}>
                                <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
                                <Text style={{
                                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                }}>
                                    No payment information available
                                </Text>
                            </VStack>
                        )}
                    </VStack>
                </Card>

                {/* Détails de paiement */}
                {hasPayment && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="sm">
                            <Text style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                color: colors.text,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}>
                                Payment Summary
                            </Text>
                            
                            <PaymentInfo 
                                label="Total Amount" 
                                value={paymentData.amount} 
                                format="currency" 
                                currency={paymentData.currency}
                            />
                            <PaymentInfo 
                                label="Amount Paid" 
                                value={paymentData.amountPaid} 
                                format="currency" 
                                currency={paymentData.currency}
                            />
                            <PaymentInfo 
                                label="Outstanding Balance" 
                                value={paymentData.amountToBePaid} 
                                format="currency" 
                                currency={paymentData.currency}
                            />
                            <PaymentInfo 
                                label="Due Date" 
                                value={paymentData.dueDate} 
                                format="date"
                            />
                            {paymentData.paymentMethod && paymentData.paymentMethod !== 'N/A' && (
                                <PaymentInfo 
                                    label="Payment Method" 
                                    value={paymentData.paymentMethod}
                                />
                            )}
                            {paymentData.transactionId && paymentData.transactionId !== 'N/A' && (
                                <PaymentInfo 
                                    label="Transaction ID" 
                                    value={paymentData.transactionId}
                                />
                            )}
                        </VStack>
                    </Card>
                )}

                {/* Détails fiscaux */}
                {paymentData?.taxe && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="sm">
                            <HStack gap="sm" align="center" style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                                <Ionicons name="receipt" size={20} color={colors.tint} />
                                <Text style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: colors.text,
                                }}>
                                    Tax Breakdown
                                </Text>
                            </HStack>
                            
                            <PaymentInfo 
                                label="Subtotal (exc. tax)" 
                                value={paymentData.taxe.amountWithoutTax} 
                                format="currency"
                                currency={paymentData.currency}
                            />
                            <PaymentInfo 
                                label={`GST (${paymentData.taxe.gstRate}%)`} 
                                value={paymentData.taxe.gst} 
                                format="currency"
                                currency={paymentData.currency}
                            />
                        </VStack>
                    </Card>
                )}

                {/* Cartes sauvegardées */}
                {paymentData?.savedCards && paymentData.savedCards.length > 0 && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="lg">
                            <HStack gap="md" align="center" justify="space-between">
                                <HStack gap="sm" align="center">
                                    <Ionicons name="card" size={20} color={colors.tint} />
                                    <Text style={{
                                        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                        color: colors.text,
                                    }}>
                                        Saved Cards
                                    </Text>
                                </HStack>
                                
                                <Pressable
                                    onPress={handleAddCard}
                                    hitSlop={DESIGN_TOKENS.touch.hitSlop}
                                    style={({ pressed }) => ({
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: DESIGN_TOKENS.spacing.xs,
                                        paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                                        backgroundColor: pressed 
                                            ? colors.backgroundSecondary
                                            : colors.backgroundTertiary,
                                        borderRadius: DESIGN_TOKENS.radius.sm,
                                        minHeight: DESIGN_TOKENS.touch.minSize * 0.8,
                                    })}
                                    accessibilityRole="button"
                                    accessibilityLabel="Add new card"
                                >
                                    <Ionicons name="add" size={16} color={colors.tint} />
                                    <Text style={{ 
                                        marginLeft: DESIGN_TOKENS.spacing.xs,
                                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                        fontWeight: '500',
                                        color: colors.tint 
                                    }}>
                                        Add Card
                                    </Text>
                                </Pressable>
                            </HStack>
                            
                            <VStack gap="sm">
                                {paymentData.savedCards.map((card: any, index: number) => (
                                    <CardItem
                                        key={card.id || index}
                                        card={card}
                                        index={index}
                                        onSelect={setSelectedCard}
                                        onDelete={handleDeleteCard}
                                        isSelected={selectedCard?.id === card.id}
                                    />
                                ))}
                            </VStack>
                        </VStack>
                    </Card>
                )}
        </VStack>
    );
};

export default JobPayment;

/**
 * PaymentDetailModal - Modal affichant les détails d'un paiement Stripe
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import type { Payment } from '../../hooks/useStripe';

interface PaymentDetailModalProps {
  visible: boolean;
  payment: Payment | null;
  onClose: () => void;
}

export default function PaymentDetailModal({
  visible,
  payment,
  onClose,
}: PaymentDetailModalProps) {
  const { colors } = useTheme();

  if (!payment) return null;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return colors.success;
      case 'processing':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'Successful';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'checkmark-circle';
      case 'processing':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return 'card';
      case 'bank_transfer':
        return 'business';
      default:
        return 'cash';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return 'Cash';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Payment Details
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Amount Card */}
          <View style={[styles.amountCard, { backgroundColor: getStatusColor(payment.status) }]}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={[styles.amountValue, { color: colors.buttonPrimaryText }]}>
              {formatCurrency(payment.amount, payment.currency)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons
                name={getStatusIcon(payment.status) as any}
                size={16}
                color={colors.buttonPrimaryText}
              />
              <Text style={[styles.statusText, { color: colors.buttonPrimaryText }]}>{getStatusLabel(payment.status)}</Text>
            </View>
          </View>

          {/* Customer Section */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Customer
            </Text>

            <View style={styles.customerInfo}>
              <View style={[styles.customerAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {payment.customer || 'Anonymous Customer'}
                </Text>
                <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>
                  Customer via {getMethodLabel(payment.method)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Transaction Details
            </Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="finger-print-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Payment ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {payment.id}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Description
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {payment.description || 'No description'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Date & Time
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(payment.date)} at {formatTime(payment.date)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={getMethodIcon(payment.method) as any} size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Payment Method
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {getMethodLabel(payment.method)}
                </Text>
              </View>
            </View>
          </View>

          {/* Fee Breakdown */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Fee Breakdown
            </Text>

            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                Subtotal
              </Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>
                {formatCurrency(payment.amount, payment.currency)}
              </Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                Processing Fee (2.9% + $0.30)
              </Text>
              <Text style={[styles.feeValue, { color: colors.textSecondary }]}>
                -{formatCurrency(payment.amount * 0.029 + 0.30, payment.currency)}
              </Text>
            </View>

            <View style={[styles.feeRow, styles.feeTotalRow]}>
              <Text style={[styles.feeTotalLabel, { color: colors.text }]}>
                Net Amount
              </Text>
              <Text style={[styles.feeTotalValue, { color: colors.primary }]}>
                {formatCurrency(payment.amount - (payment.amount * 0.029 + 0.30), payment.currency)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => {/* TODO: Implement receipt download */}}
            >
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Download Receipt
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => {/* TODO: Implement refund */}}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.warning} />
              <Text style={[styles.actionButtonText, { color: colors.warning }]}>
                Issue Refund
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.lg,
  },
  amountCard: {
    padding: DESIGN_TOKENS.spacing.xl,
    borderRadius: DESIGN_TOKENS.radius.lg,
    alignItems: 'center',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: 999,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  feeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: DESIGN_TOKENS.spacing.sm,
    paddingTop: DESIGN_TOKENS.spacing.md,
  },
  feeTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  feeTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

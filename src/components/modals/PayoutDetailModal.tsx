/**
 * PayoutDetailModal - Modal affichant les détails d'un payout Stripe
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
import type { Payout } from '../../hooks/useStripe';

interface PayoutDetailModalProps {
  visible: boolean;
  payout: Payout | null;
  onClose: () => void;
}

export default function PayoutDetailModal({
  visible,
  payout,
  onClose,
}: PayoutDetailModalProps) {
  const { colors } = useTheme();

  if (!payout) return null;

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

  const getStatusColor = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'in_transit':
        return colors.warning;
      case 'pending':
        return colors.info;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return 'Completed';
      case 'in_transit':
        return 'In Transit';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'in_transit':
        return 'airplane';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
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
            Payout Details
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Amount Card */}
          <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(payout.amount, payout.currency)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons
                name={getStatusIcon(payout.status) as any}
                size={16}
                color={colors.buttonPrimaryText}
              />
              <Text style={styles.statusText}>{getStatusLabel(payout.status)}</Text>
            </View>
          </View>

          {/* Details Section */}
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
                  Payout ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {payout.id}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Created Date
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(payout.arrivalDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Expected Arrival
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(payout.arrivalDate)} at {formatTime(payout.arrivalDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Type
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {payout.type === 'bank_account' ? 'Bank Transfer' : payout.type}
                </Text>
              </View>
            </View>
          </View>

          {/* Bank Details */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Destination
            </Text>

            <View style={styles.bankInfo}>
              <View style={[styles.bankIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="business-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.bankDetails}>
                <Text style={[styles.bankName, { color: colors.text }]}>
                  Bank Account
                </Text>
                <Text style={[styles.bankAccount, { color: colors.textSecondary }]}>
                  •••• •••• •••• (ending with bank account)
                </Text>
              </View>
            </View>
          </View>

          {/* Status Timeline */}
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Status Timeline
            </Text>

            <View style={styles.timeline}>
              <TimelineItem
                icon="checkmark-circle"
                title="Payout Created"
                subtitle={formatDate(payout.arrivalDate)}
                isCompleted={true}
                isLast={false}
                colors={colors}
              />
              <TimelineItem
                icon="airplane"
                title="In Transit"
                subtitle={payout.status === 'in_transit' || payout.status === 'paid' ? 'Processing...' : 'Pending'}
                isCompleted={payout.status === 'in_transit' || payout.status === 'paid'}
                isLast={false}
                colors={colors}
              />
              <TimelineItem
                icon="checkmark-done-circle"
                title="Delivered"
                subtitle={payout.status === 'paid' ? formatDate(payout.arrivalDate) : 'Pending'}
                isCompleted={payout.status === 'paid'}
                isLast={true}
                colors={colors}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  icon: string;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  isLast: boolean;
  colors: any;
}

const TimelineItem = ({ icon, title, subtitle, isCompleted, isLast, colors }: TimelineItemProps) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineLeft}>
      <View style={[
        styles.timelineIcon,
        { backgroundColor: isCompleted ? colors.success : colors.border }
      ]}>
        <Ionicons
          name={icon as any}
          size={16}
          color={isCompleted ? colors.buttonPrimaryText : colors.textSecondary}
        />
      </View>
      {!isLast && (
        <View style={[
          styles.timelineLine,
          { backgroundColor: isCompleted ? colors.success : colors.border }
        ]} />
      )}
    </View>
    <View style={styles.timelineContent}>
      <Text style={[styles.timelineTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.timelineSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  </View>
);

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
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 14,
  },
  timeline: {
    paddingLeft: DESIGN_TOKENS.spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: DESIGN_TOKENS.spacing.sm,
    paddingBottom: DESIGN_TOKENS.spacing.md,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 13,
  },
});

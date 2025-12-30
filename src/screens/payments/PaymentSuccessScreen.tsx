/**
 * PaymentSuccessScreen - Écran de confirmation de paiement réussi
 * Interface moderne avec animation de succès et navigation
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useEffect } from 'react'
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Context
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useTranslation } from '../../localization/useLocalization'

// Types
interface PaymentSuccessData {
  paymentId: string
  amount: number
  currency: string
  description: string
  jobId?: string
  customerEmail?: string
  timestamp: Date
}

interface PaymentSuccessScreenProps {
  paymentData: PaymentSuccessData
  onContinue: () => void
  onDownloadReceipt?: () => void
  onSendReceipt?: () => void
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  paymentData,
  onContinue,
  onDownloadReceipt,
  onSendReceipt
}) => {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const scaleValue = React.useRef(new Animated.Value(0)).current

  // Animation d'entrée du cercle de succès
  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }).start()
  }, [scaleValue])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.xl,
      alignItems: 'center',
    },
    successCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: DESIGN_TOKENS.spacing.xxxl,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    subHeaderText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    detailsCard: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      width: '100%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.md,
    },
    amountValue: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      color: colors.success,
      fontWeight: 'bold',
    },
    actionsContainer: {
      width: '100%',
      gap: DESIGN_TOKENS.spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
    },
    tertiaryButton: {
      backgroundColor: 'transparent',
      padding: DESIGN_TOKENS.spacing.sm,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.backgroundTertiary,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    tertiaryButtonText: {
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: '500',
    },
    receiptActions: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
    },
    receiptButton: {
      flex: 1,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Animation de succès */}
        <Animated.View 
          style={[
            styles.successCircle,
            { transform: [{ scale: scaleValue }] }
          ]}
        >
          <Ionicons name="checkmark" size={60} color={colors.backgroundTertiary} />
        </Animated.View>

        {/* Textes de confirmation */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerText}>{t('payment.success.title')}</Text>
          <Text style={styles.subHeaderText}>
            {t('payment.success.subtitle')}
          </Text>
        </View>

        {/* Détails du paiement */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment.success.amount')}</Text>
            <Text style={[styles.detailValue, styles.amountValue]}>
              {formatCurrency(paymentData.amount, paymentData.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment.success.paymentId')}</Text>
            <Text style={styles.detailValue}>{paymentData.paymentId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment.success.description')}</Text>
            <Text style={styles.detailValue}>{paymentData.description}</Text>
          </View>

          {paymentData.jobId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('payment.success.jobId')}</Text>
              <Text style={styles.detailValue}>{paymentData.jobId}</Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>{t('payment.success.dateTime')}</Text>
            <Text style={styles.detailValue}>{formatDate(paymentData.timestamp)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Actions de reçu */}
          {(onDownloadReceipt || onSendReceipt) && (
            <View style={styles.receiptActions}>
              {onDownloadReceipt && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, styles.receiptButton]}
                  onPress={onDownloadReceipt}
                  accessibilityLabel="Download receipt"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="download-outline" size={18} color={colors.text} />
                    <Text style={styles.secondaryButtonText}>{t('payment.buttons.download')}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {onSendReceipt && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, styles.receiptButton]}
                  onPress={onSendReceipt}
                  accessibilityLabel="Email receipt"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="mail-outline" size={18} color={colors.text} />
                    <Text style={styles.secondaryButtonText}>{t('payment.buttons.email')}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bouton principal */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onContinue}
            accessibilityLabel="Continue to next screen"
          >
            <Text style={styles.primaryButtonText}>{t('payment.buttons.continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={onContinue}
            accessibilityLabel="Back to dashboard"
          >
            <Text style={styles.tertiaryButtonText}>{t('payment.buttons.backToDashboard')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default PaymentSuccessScreen
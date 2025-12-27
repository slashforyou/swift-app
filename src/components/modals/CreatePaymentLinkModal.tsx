/**
 * CreatePaymentLinkModal - Modal pour créer un lien de paiement Stripe
 * Permet de générer des liens partageables par SMS/email
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import * as Clipboard from 'expo-clipboard'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useStripePaymentLinks } from '../../hooks/useStripe'
import type { PaymentLink } from '../../services/StripeService'

interface CreatePaymentLinkModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: (paymentLink: PaymentLink) => void
  // Pré-remplissage optionnel pour les jobs
  prefill?: {
    amount?: number
    description?: string
    customerEmail?: string
    jobId?: string
  }
}

export default function CreatePaymentLinkModal({
  visible,
  onClose,
  onSuccess,
  prefill
}: CreatePaymentLinkModalProps) {
  const { colors } = useTheme()
  const { createPaymentLink, creating, error } = useStripePaymentLinks()

  // Form state
  const [amount, setAmount] = useState(prefill?.amount?.toString() || '')
  const [description, setDescription] = useState(prefill?.description || '')
  const [customerEmail, setCustomerEmail] = useState(prefill?.customerEmail || '')
  const [currency] = useState('AUD')

  // Result state
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null)

  const resetForm = () => {
    setAmount(prefill?.amount?.toString() || '')
    setDescription(prefill?.description || '')
    setCustomerEmail(prefill?.customerEmail || '')
    setCreatedLink(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCreate = async () => {
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0')
      return
    }

    try {
      const paymentLink = await createPaymentLink({
        amount: Math.round(amountValue * 100), // Convertir en centimes
        currency: currency.toLowerCase(),
        description: description || undefined,
        customer_email: customerEmail || undefined,
        metadata: prefill?.jobId ? { job_id: prefill.jobId } : undefined
      })

      setCreatedLink(paymentLink)
      onSuccess?.(paymentLink)
    } catch (err) {
      Alert.alert('Error', error || 'Failed to create payment link')
    }
  }

  const handleCopyLink = async () => {
    if (createdLink?.url) {
      await Clipboard.setStringAsync(createdLink.url)
      Alert.alert('Copied!', 'Payment link copied to clipboard')
    }
  }

  const handleShareLink = async () => {
    if (createdLink?.url) {
      try {
        await Share.share({
          message: `Payment Link: ${createdLink.url}`,
          url: createdLink.url,
          title: 'Share Payment Link'
        })
      } catch (err) {
        console.error('Share error:', err)
      }
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(num)
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end'
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
      borderTopRightRadius: DESIGN_TOKENS.radius.xl,
      maxHeight: '90%'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    headerTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg
    },
    inputGroup: {
      marginBottom: DESIGN_TOKENS.spacing.lg
    },
    label: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs
    },
    labelOptional: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontWeight: 'normal' as const
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border
    },
    currencyPrefix: {
      paddingLeft: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '600' as const,
      color: colors.text
    },
    amountInput: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '600' as const,
      color: colors.text
    },
    currencySuffix: {
      paddingRight: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary
    },
    previewCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      alignItems: 'center'
    },
    previewAmount: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs
    },
    previewDescription: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: DESIGN_TOKENS.spacing.sm
    },
    createButtonDisabled: {
      opacity: 0.6
    },
    createButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600' as const,
      color: colors.buttonPrimaryText
    },
    // Success state
    successContainer: {
      padding: DESIGN_TOKENS.spacing.lg,
      alignItems: 'center'
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: DESIGN_TOKENS.spacing.lg
    },
    successTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm
    },
    successText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: DESIGN_TOKENS.spacing.lg
    },
    linkBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      width: '100%',
      marginBottom: DESIGN_TOKENS.spacing.lg
    },
    linkText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.primary,
      textAlign: 'center'
    },
    actionButtons: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      width: '100%'
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md
    },
    actionButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600' as const,
      color: colors.text
    },
    doneButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      width: '100%',
      marginTop: DESIGN_TOKENS.spacing.lg,
      alignItems: 'center'
    },
    doneButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600' as const,
      color: colors.buttonPrimaryText
    },
    errorText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.error,
      marginTop: DESIGN_TOKENS.spacing.sm
    }
  })

  // Render success state
  if (createdLink) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Payment Link Created</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>

              <Text style={styles.successTitle}>Link Ready!</Text>
              <Text style={styles.successText}>
                Your payment link has been created. Share it with your customer via SMS, email, or any messaging app.
              </Text>

              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={2}>
                  {createdLink.url}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                  <Ionicons name="copy-outline" size={20} color={colors.text} />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShareLink}>
                  <Ionicons name="share-outline" size={20} color={colors.text} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  // Render form
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Payment Link</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Amount Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewAmount}>
                {formatCurrency(amount || '0')}
              </Text>
              <Text style={styles.previewDescription}>
                {description || 'Payment request'}
              </Text>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.currencySuffix}>{currency}</Text>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.labelOptional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Moving service - Job #123"
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
            </View>

            {/* Customer Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Customer Email <Text style={styles.labelOptional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={customerEmail}
                onChangeText={setCustomerEmail}
                placeholder="client@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (creating || !amount) && styles.createButtonDisabled
              ]}
              onPress={handleCreate}
              disabled={creating || !amount}
            >
              {creating ? (
                <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color={colors.buttonPrimaryText} />
                  <Text style={styles.createButtonText}>Create Payment Link</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/**
 * StripePaymentScreen - Écran de paiement Stripe intégré
 * Utilise le design system moderne et l'API Stripe
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Context
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'

// Types
interface PaymentData {
  amount: number
  currency: string
  description: string
  jobId?: string
}

interface StripePaymentScreenProps {
  paymentData: PaymentData
  onSuccess: (paymentIntent: any) => void
  onCancel: () => void
}

export const StripePaymentScreen: React.FC<StripePaymentScreenProps> = ({
  paymentData,
  onSuccess,
  onCancel
}) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // États du formulaire de paiement
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  // Validation du formulaire
  const isFormValid = cardNumber && expiryDate && cvv && cardholderName

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulation de l'API Stripe
      // TODO: Intégrer avec la vraie API Stripe
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock payment intent success
      const mockPaymentIntent = {
        id: 'pi_mock_success',
        status: 'succeeded',
        amount: paymentData.amount * 100, // En centimes
        currency: paymentData.currency
      }

      onSuccess(mockPaymentIntent)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      Alert.alert('Payment Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD'
    }).format(amount)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.md,
    },
    card: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    elevatedCard: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      textAlign: 'center',
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    description: {
      textAlign: 'center',
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
    },
    amount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.sm,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      backgroundColor: colors.backgroundTertiary,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
    },
    inputHalf: {
      flex: 1,
    },
    button: {
      backgroundColor: colors.primary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    buttonText: {
      color: colors.backgroundTertiary,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    buttonTextSecondary: {
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    errorCard: {
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.error,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    errorText: {
      color: colors.error,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    securityCard: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    securityText: {
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.elevatedCard}>
          <Text style={styles.header}>Secure Payment</Text>
          <Text style={styles.description}>{paymentData.description}</Text>
        </View>

        {/* Montant */}
        <View style={styles.card}>
          <Text style={styles.amount}>
            {formatCurrency(paymentData.amount, paymentData.currency)}
          </Text>
        </View>

        {/* Formulaire de carte */}
        <View style={styles.elevatedCard}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Cardholder Name"
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Cardholder name input"
          />

          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
            maxLength={19}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Card number input"
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="MM/YY"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
              maxLength={5}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Card expiry date input"
            />

            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="123"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Card CVV input"
            />
          </View>
        </View>

        {/* Zone d'erreur */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Boutons d'action */}
        <TouchableOpacity
          style={[
            styles.button,
            (!isFormValid || loading) && { backgroundColor: colors.textSecondary }
          ]}
          onPress={handlePayment}
          disabled={!isFormValid || loading}
          accessibilityLabel="Process payment button"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : `Pay ${formatCurrency(paymentData.amount, paymentData.currency)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={onCancel}
          disabled={loading}
          accessibilityLabel="Cancel payment button"
        >
          <Text style={styles.buttonTextSecondary}>Cancel</Text>
        </TouchableOpacity>

        {/* Informations de sécurité */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Your payment is secured by Stripe SSL encryption
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default StripePaymentScreen
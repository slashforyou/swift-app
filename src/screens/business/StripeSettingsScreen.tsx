/**
 * StripeSettingsScreen - Configuration Stripe Connect
 * Gestion des paramètres du compte Stripe, webhooks, et configuration
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Context
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useStripeAccount } from '../../hooks/useStripe'

// Types
interface StripeConfig {
  accountId: string
  displayName: string
  country: string
  currency: string
  isLive: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  webhooksEnabled: boolean
  instantPayouts: boolean
  emailReceipts: boolean
  smsNotifications: boolean
}

interface StripeSettingsScreenProps {
  navigation?: any
}

export default function StripeSettingsScreen({ navigation }: StripeSettingsScreenProps) {
  const { colors } = useTheme()

  // Utilisation du hook Stripe pour récupérer les vraies données
  const { account, balance, loading: isLoading, error, refresh, updateSettings } = useStripeAccount()

  // Configuration transformée à partir des données du compte
  const config = account ? {
    accountId: account.stripe_account_id,
    displayName: account.business_name,
    country: account.country,
    currency: account.default_currency,
    isLive: false, // Toujours en test pour le développement
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    webhooksEnabled: true, // Valeur par défaut
    instantPayouts: false, // Valeur par défaut
    emailReceipts: true, // Valeur par défaut
    smsNotifications: false // Valeur par défaut
  } : null

  const handleToggleSwitch = async (key: string, value: boolean) => {
    try {
      // Utilise la fonction updateSettings du hook pour vraiment sauvegarder
      await updateSettings({ [key]: value })
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres')
    }
  }

  const handleAccountSetup = () => {
    Alert.alert(
      'Setup Stripe Account',
      'You will be redirected to Stripe to complete your account setup.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // TODO: Ouvrir Stripe Connect Onboarding
            // TEMP_DISABLED: console.log('Open Stripe Connect onboarding')
          } 
        }
      ]
    )
  }

  const handleWebhooksSetup = () => {
    Alert.alert(
      'Webhook Configuration',
      'Webhooks allow real-time updates from Stripe. Configure your webhook endpoints.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Configure', 
          onPress: () => {
            // TODO: Navigation vers configuration webhooks
            // TEMP_DISABLED: console.log('Configure webhooks')
          } 
        }
      ]
    )
  }

  const handleTestPayment = () => {
    Alert.alert(
      'Test Payment',
      'This will create a test payment to verify your Stripe integration.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Test Payment', 
          onPress: () => {
            // TODO: Créer un paiement test
            // TEMP_DISABLED: console.log('Create test payment')
          } 
        }
      ]
    )
  }

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Stripe',
      'Are you sure you want to disconnect your Stripe account? This will disable payment processing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => {
            // TODO: Déconnecter le compte Stripe
            // TEMP_DISABLED: console.log('Disconnect Stripe account')
          } 
        }
      ]
    )
  }

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch',
    onPress,
    icon,
    danger = false 
  }: {
    title: string
    subtitle?: string
    value?: boolean
    onValueChange?: (value: boolean) => void
    type?: 'switch' | 'button'
    onPress?: () => void
    icon: string
    danger?: boolean
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, type === 'switch' && styles.settingRowSwitch]}
      onPress={type === 'button' ? onPress : undefined}
      disabled={type === 'switch'}
    >
      <View style={styles.settingIcon}>
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? colors.error : colors.textSecondary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {type === 'switch' && value !== undefined && onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={value ? colors.primary : colors.textSecondary}
        />
      )}
      {type === 'button' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.backgroundSecondary,
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    sectionHeader: {
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
    },
    accountCard: {
      backgroundColor: colors.backgroundSecondary,
      margin: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    accountIcon: {
      width: 48,
      height: 48,
      backgroundColor: colors.primary + '20',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    accountId: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: DESIGN_TOKENS.spacing.xs,
    },
    statusText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: '600',
    },
    accountDetails: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    detailValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: '500',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingRowSwitch: {
      backgroundColor: colors.backgroundSecondary,
    },
    settingIcon: {
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '500',
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    },
  })

  // Loading ou erreur - affichage d'un écran simple
  if (isLoading || !config) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.settingTitle, { textAlign: 'center' }]}>
          {isLoading ? 'Chargement...' : 'Aucune donnée de compte disponible'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Stripe Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Account Overview */}
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.accountIcon}>
              <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{config.displayName}</Text>
              <Text style={styles.accountId}>
                {config.accountId.slice(0, 20)}...
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: config.isLive
                    ? colors.success + '20'
                    : colors.warning + '20'
                }
              ]}
            >
              <Ionicons
                name={config.isLive ? "checkmark-circle" : "warning"}
                size={14}
                color={config.isLive ? colors.success : colors.warning}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: config.isLive ? colors.success : colors.warning
                  }
                ]}
              >
                {config.isLive ? 'Live' : 'Test'}
              </Text>
            </View>
          </View>

          <View style={styles.accountDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Country</Text>
              <Text style={styles.detailValue}>{config.country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Currency</Text>
              <Text style={styles.detailValue}>{config.currency}</Text>
            </View>
          </View>
        </View>

        {/* Account Setup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Setup</Text>
          </View>
          
          <SettingRow
            title="Complete Account Setup"
            subtitle="Finish your Stripe Connect onboarding"
            icon="settings"
            type="button"
            onPress={handleAccountSetup}
          />
          
          <SettingRow
            title="Test Integration"
            subtitle="Create a test payment to verify setup"
            icon="flash"
            type="button"
            onPress={handleTestPayment}
          />
        </View>

        {/* Payment Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Settings</Text>
          </View>
          
          <SettingRow
            title="Instant Payouts"
            subtitle="Receive payments within minutes (fees apply)"
            icon="flash"
            value={config.instantPayouts}
            onValueChange={(value) => handleToggleSwitch('instantPayouts', value)}
          />
          
          <SettingRow
            title="Email Receipts"
            subtitle="Send automatic receipts to customers"
            icon="mail"
            value={config.emailReceipts}
            onValueChange={(value) => handleToggleSwitch('emailReceipts', value)}
          />
          
          <SettingRow
            title="SMS Notifications"
            subtitle="Get notified of payments via SMS"
            icon="chatbubble"
            value={config.smsNotifications}
            onValueChange={(value) => handleToggleSwitch('smsNotifications', value)}
          />
        </View>

        {/* Developer Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Developer Settings</Text>
          </View>
          
          <SettingRow
            title="Webhooks"
            subtitle="Configure real-time event notifications"
            icon="globe"
            value={config.webhooksEnabled}
            onValueChange={(value) => handleToggleSwitch('webhooksEnabled', value)}
          />
          
          <SettingRow
            title="Webhook Configuration"
            subtitle="Manage webhook endpoints and events"
            icon="code-slash"
            type="button"
            onPress={handleWebhooksSetup}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
          </View>
          
          <SettingRow
            title="Disconnect Account"
            subtitle="Remove Stripe integration from your app"
            icon="unlink"
            type="button"
            onPress={handleDisconnect}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
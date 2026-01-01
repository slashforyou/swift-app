/**
 * StripeSettingsScreen - Configuration Stripe Connect
 * Gestion des paramètres du compte Stripe, webhooks, et configuration
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import {
    Alert,
    Linking,
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
import { useStripeAccount, useStripeSettings } from '../../hooks/useStripe'
import { useTranslation } from '../../localization/useLocalization'
import { getStripeConnectOnboardingLink } from '../../services/StripeService'

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
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)

  // Utilisation du hook Stripe pour récupérer les vraies données
  const { account, balance, loading: isLoading, error, refresh, updateSettings } = useStripeAccount()
  
  // Hook pour les paramètres avancés
  const { settings, updateSettings: updateStripeSettings, saving } = useStripeSettings()

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
    } catch (_error) {

      Alert.alert(t('common.error'), t('stripe.settings.alerts.errorUpdate'))
    }
  }

  const handleAccountSetup = async () => {
    Alert.alert(
      t('stripe.settings.alerts.setupTitle'),
      t('stripe.settings.alerts.setupMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.continue'), 
          onPress: async () => {
            try {
              setIsProcessing(true)
              const onboardingUrl = await getStripeConnectOnboardingLink()
              if (onboardingUrl) {
                await Linking.openURL(onboardingUrl)
              }
            } catch (_err) {
              Alert.alert(t('common.error'), t('stripe.settings.alerts.setupMessage'))
            } finally {
              setIsProcessing(false)
            }
          } 
        }
      ]
    )
  }

  const handleWebhooksSetup = () => {
    Alert.alert(
      t('stripe.settings.alerts.webhookTitle'),
      t('stripe.settings.alerts.webhookMessage'),
      [
        { text: t('common.ok') }
      ]
    )
  }

  const handleTestPayment = () => {
    Alert.alert(
      t('stripe.settings.alerts.testPaymentTitle'),
      t('stripe.settings.alerts.testPaymentMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('stripe.settings.alerts.createTestPayment'), 
          onPress: () => {
            // Navigation vers StripeHub pour créer un lien de paiement
            if (navigation?.navigate) {
              navigation.navigate('StripeHub')
            }
          } 
        }
      ]
    )
  }

  const handleDisconnect = () => {
    Alert.alert(
      t('stripe.settings.alerts.disconnectTitle'),
      t('stripe.settings.alerts.disconnectMessage'),
      [
        { text: t('common.ok') }
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
          {isLoading ? t('stripe.settings.loading') : t('stripe.settings.noAccountData')}
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
        <Text style={styles.title}>{t('stripe.settings.title')}</Text>
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
                {config.isLive ? t('stripe.settings.liveMode') : t('stripe.settings.testMode')}
              </Text>
            </View>
          </View>

          <View style={styles.accountDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('stripe.settings.country')}</Text>
              <Text style={styles.detailValue}>{config.country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('stripe.settings.currency')}</Text>
              <Text style={styles.detailValue}>{config.currency}</Text>
            </View>
          </View>
        </View>

        {/* Account Setup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stripe.settings.sections.accountSetup')}</Text>
          </View>
          
          <SettingRow
            title={t('stripe.settings.completeSetup')}
            subtitle={t('stripe.settings.completeSetupDesc')}
            icon="settings"
            type="button"
            onPress={handleAccountSetup}
          />
          
          <SettingRow
            title={t('stripe.settings.testIntegration')}
            subtitle={t('stripe.settings.testIntegrationDesc')}
            icon="flash"
            type="button"
            onPress={handleTestPayment}
          />
        </View>

        {/* Payment Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stripe.settings.sections.paymentSettings')}</Text>
          </View>
          
          <SettingRow
            title={t('stripe.settings.instantPayouts')}
            subtitle={t('stripe.settings.instantPayoutsDesc')}
            icon="flash"
            value={config.instantPayouts}
            onValueChange={(value) => handleToggleSwitch('instantPayouts', value)}
          />
          
          <SettingRow
            title={t('stripe.settings.emailReceipts')}
            subtitle={t('stripe.settings.emailReceiptsDesc')}
            icon="mail"
            value={config.emailReceipts}
            onValueChange={(value) => handleToggleSwitch('emailReceipts', value)}
          />
          
          <SettingRow
            title={t('stripe.settings.smsNotifications')}
            subtitle={t('stripe.settings.smsNotificationsDesc')}
            icon="chatbubble"
            value={config.smsNotifications}
            onValueChange={(value) => handleToggleSwitch('smsNotifications', value)}
          />
        </View>

        {/* Developer Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stripe.settings.sections.developerSettings')}</Text>
          </View>
          
          <SettingRow
            title={t('stripe.settings.webhooks')}
            subtitle={t('stripe.settings.webhooksDesc')}
            icon="globe"
            value={config.webhooksEnabled}
            onValueChange={(value) => handleToggleSwitch('webhooksEnabled', value)}
          />
          
          <SettingRow
            title={t('stripe.settings.webhookConfig')}
            subtitle={t('stripe.settings.webhookConfigDesc')}
            icon="code-slash"
            type="button"
            onPress={handleWebhooksSetup}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stripe.settings.sections.dangerZone')}</Text>
          </View>
          
          <SettingRow
            title={t('stripe.settings.disconnectAccount')}
            subtitle={t('stripe.settings.disconnectAccountDesc')}
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
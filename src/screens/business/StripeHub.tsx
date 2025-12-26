/**
 * StripeHub - Hub de gestion des paiements Stripe
 * Remplace JobsBillingScreen avec une interface moderne pour Stripe
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import {
    Alert,
    RefreshControl,
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
import { useStripeConnection } from '../../hooks/useStripeConnection'
// Components
import CreatePaymentLinkModal from '../../components/modals/CreatePaymentLinkModal'
import { StripeConnectWebView } from '../../components/stripe/StripeConnectWebView'

// Types
interface StripeHubProps {
  navigation?: any  // Navigation prop pour permettre la navigation vers d'autres écrans
}
interface StripeStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingPayouts: number
  successfulPayments: number
  currency: string
}

interface StripeAccount {
  id: string
  displayName: string
  country: string
  isActive: boolean
  defaultCurrency: string
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export default function StripeHub({ navigation }: StripeHubProps) {
  const { colors } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false)

  // Hook pour détecter la connexion Stripe réelle
  const stripeConnection = useStripeConnection()
  
  // TEMPORAIRE: Désactiver tous les hooks Stripe pour identifier le problème
  // const stripeAccount = useStripeAccount()
  // const stripePayments = useStripePayments()
  // const stripePayouts = useStripePayouts()

  // Mock data pour tester l'interface
  const stripeAccount = { 
    account: {
      default_currency: 'AUD',
      charges_enabled: false,
      business_name: 'Swift Moving Services',
      stripe_account_id: 'acct_mock123456789'
    },
    loading: false,
    error: null,
    balance: { pending: 0, available: 0 },
    refresh: () => Promise.resolve()
  }
  const stripePayments = { 
    payments: [], 
    loading: false, 
    error: null,
    refresh: () => Promise.resolve()
  }
  const stripePayouts = { 
    payouts: [], 
    loading: false, 
    error: null,
    refresh: () => Promise.resolve()
  }

  // Calculer les stats réelles à partir des données Stripe
  const stripeStats = React.useMemo(() => {
    // TEMPORAIRE: Mock stats pour éviter les erreurs
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingPayouts: 0,
      successfulPayments: 0,
      currency: 'AUD'
    };
    
    /* VERSION ORIGINALE COMMENTÉE
    const totalRevenue = stripePayments.payments.reduce((total, payment) => {
      return payment.status === 'succeeded' ? total + payment.amount : total;
    }, 0);
    
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = stripePayments.payments
      .filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentMonth && payment.status === 'succeeded';
      })
      .reduce((total, payment) => total + payment.amount, 0);
    
    const pendingPayouts = stripeAccount.balance.pending;
    const successfulPayments = stripePayments.payments.filter(p => p.status === 'succeeded').length;
    
    return {
      totalRevenue,
      monthlyRevenue,
      pendingPayouts,
      successfulPayments,
      currency: stripeAccount.account?.default_currency || 'AUD'
    };
    */
  }, [stripePayments.payments, stripeAccount.balance, stripeAccount.account]);

  // WebView states
  const [showStripeWebView, setShowStripeWebView] = useState(false)
  const [stripeAccountLink, setStripeAccountLink] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // 🔄 NOUVEAU: Refresh les vraies données Stripe
    try {
      await Promise.all([
        stripeAccount.refresh(),
        stripePayments.refresh(),
        stripePayouts.refresh(),
        stripeConnection.refresh()
      ]);
    } catch (error) {

      console.error('Error refreshing Stripe data:', error);
    }
    setIsLoading(false)
  }

  const handleStripeConnect = async () => {
    try {
      // TEMP_DISABLED: console.log('🔧 TEMPORAIRE: Test avec URL Stripe valide');
      
      // TEMPORAIRE: Désactiver l'appel API pour tester
      // const onboardingUrl = await createStripeConnectAccountAndLink();
      
      // URL de test valide pour vérifier que le WebView fonctionne
      const onboardingUrl = 'https://stripe.com/connect';
      // TEMP_DISABLED: console.log('🔧 Using test URL:', onboardingUrl);
      
      // Ouvrir la WebView intégrée avec le lien d'onboarding Express
      setStripeAccountLink(onboardingUrl)
      setShowStripeWebView(true)
      
    } catch (error) {

      console.error('❌ Error creating Stripe Connect Express account:', error);
      Alert.alert(
        'Erreur de Connexion', 
        'Impossible de créer votre compte Stripe Connect. Veuillez réessayer plus tard.'
      );
    }
  };

  // WebView handlers
  const handleWebViewClose = () => {
    setShowStripeWebView(false)
    setStripeAccountLink(null)
  }

  const handleWebViewSuccess = () => {
    // TEMP_DISABLED: console.log('✅ Stripe Connect onboarding completed!')
    setShowStripeWebView(false)
    setStripeAccountLink(null)
    // Refresh connection status
    stripeConnection.refresh()
    Alert.alert(
      'Connexion Réussie!',
      'Votre compte Stripe Connect a été configuré avec succès.',
      [{ text: 'OK', style: 'default' }]
    )
  }

  const handleWebViewError = (error: string) => {
    console.error('❌ Stripe Connect WebView error:', error)
    Alert.alert(
      'Erreur',
      'Une erreur s\'est produite lors de la configuration Stripe.',
      [{ text: 'OK', style: 'default' }]
    )
  }

  const handleTestConnection = () => {
    Alert.alert(
      '🔍 Test Connexion Stripe',
      `Statut: ${stripeConnection.status}\n` +
      `Connecté: ${stripeConnection.isConnected ? 'Oui' : 'Non'}\n` +
      `Chargement: ${stripeConnection.loading ? 'Oui' : 'Non'}\n` +
      `Détails: ${stripeConnection.details || 'Aucun'}\n` +
      `Erreur: ${stripeConnection.error || 'Aucune'}`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Retester', onPress: () => stripeConnection.refresh() }
      ]
    )
  }

  const handleViewPayments = () => {
    // TEMP_DISABLED: console.log('Navigate to payments list')
    // Navigation vers la liste des paiements
    if (navigation?.navigate) {
      navigation.navigate('PaymentsList')
    }
  }

  const handleViewPayouts = () => {
    // TEMP_DISABLED: console.log('Navigate to payouts')
    // Navigation vers les payouts
    if (navigation?.navigate) {
      navigation.navigate('Payouts')
    }
  }

  const handleCreatePaymentLink = () => {
    // Ouvrir le modal de création de lien de paiement
    setShowPaymentLinkModal(true)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
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
    card: {
      backgroundColor: colors.backgroundTertiary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    cardTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: DESIGN_TOKENS.spacing.md,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    statLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: '500',
    },
    actionTextPrimary: {
      color: colors.backgroundTertiary,
    },
    accountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    accountText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DESIGN_TOKENS.spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    quickActionText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'center',
    },
  })

  // Écran d'onboarding pour utilisateur non connecté à Stripe
  const renderOnboardingScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { justifyContent: 'center', paddingHorizontal: 20 }]}>
        {/* Loading état */}
        {stripeConnection.loading && (
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              Vérification de votre compte Stripe...
            </Text>
          </View>
        )}

        {/* État non connecté */}
        {!stripeConnection.loading && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{
                backgroundColor: colors.warning + '20',
                width: 80,
                height: 80,
                borderRadius: 40,
                marginBottom: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ionicons name="warning" size={40} color={colors.warning} />
              </View>
              
              <Text style={[styles.title, { textAlign: 'center', marginBottom: 10 }]}>
                Activez les Paiements Stripe
              </Text>
              
              <Text style={{
                textAlign: 'center', 
                color: colors.textSecondary,
                lineHeight: 22,
                fontSize: 14 
              }}>
                Créez votre compte Stripe Connect pour accepter des paiements via notre plateforme. 
                Vos données restent sécurisées et vous gardez le contrôle total.
              </Text>
            </View>

            {/* Boutons d'action */}
            <View style={{ gap: 15 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary, {
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12
                }]}
                onPress={handleStripeConnect}
              >
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text style={[styles.actionText, { 
                  color: 'white', 
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 10
                }]}>
                  Créer mon Compte Stripe
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, {
                  backgroundColor: colors.backgroundSecondary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border
                }]}
                onPress={handleTestConnection}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.actionText, { 
                  color: colors.textSecondary,
                  fontSize: 14 
                }]}>
                  Retester la Connexion
                </Text>
              </TouchableOpacity>
            </View>

            {/* Informations de statut */}
            <View style={{
              marginTop: 30,
              padding: 15,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <Text style={[styles.actionText, { 
                color: colors.textSecondary,
                fontSize: 12,
                textAlign: 'center' 
              }]}>
                Statut: {stripeConnection.status} • {stripeConnection.details}
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );

  // Écran principal pour utilisateur connecté à Stripe
  const renderConnectedScreen = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header avec statut du compte */}
        <View style={styles.header}>
          <Text style={styles.title}>Stripe Payments</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: (stripeConnection.isConnected && stripeAccount.account?.charges_enabled)
                  ? colors.successLight
                  : colors.warningLight
              }
            ]}
          >
            <Ionicons
              name={(stripeConnection.isConnected && stripeAccount.account?.charges_enabled) ? "checkmark-circle" : "warning"}
              size={14}
              color={(stripeConnection.isConnected && stripeAccount.account?.charges_enabled) ? colors.success : colors.warning}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: (stripeConnection.isConnected && stripeAccount.account?.charges_enabled) ? colors.success : colors.warning
                }
              ]}
            >
              {(stripeConnection.isConnected && stripeAccount.account?.charges_enabled) ? 'Active' : 'Setup Required'}
            </Text>
          </View>
        </View>

        {/* Informations du compte Stripe */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <TouchableOpacity onPress={handleStripeConnect}>
              <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.accountInfo}>
            <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.accountText}>
              {stripeAccount.account?.business_name || 'Swift Moving Services'}
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Ionicons name="card-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.accountText}>
              Account ID: {stripeAccount.account?.stripe_account_id ? 
                `${stripeAccount.account.stripe_account_id.slice(0, 20)}...` : 
                'Not connected'
              }
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleStripeConnect}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleViewPayouts}
            >
              <Ionicons
                name="wallet-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Payouts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleCreatePaymentLink}
            >
              <Ionicons
                name="link-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionText}>Payment Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Revenue Overview</Text>
            <Ionicons name="trending-up" size={20} color={colors.success} />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(stripeStats.totalRevenue)}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(stripeStats.monthlyRevenue)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(stripeStats.pendingPayouts)}
              </Text>
              <Text style={styles.statLabel}>Pending Payouts</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stripeStats.successfulPayments}</Text>
              <Text style={styles.statLabel}>Successful Payments</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: DESIGN_TOKENS.spacing.md }]}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleCreatePaymentLink}
          >
            <Ionicons name="add-circle" size={20} color={colors.backgroundTertiary} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>
              Create Payment Link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewPayments}>
            <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionText}>View All Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewPayouts}>
            <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionText}>Manage Payouts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleStripeConnect}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionText}>Account Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={handleTestConnection}>
            <Ionicons name="bug-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>🔍 Test Connexion</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={{ alignItems: 'center', marginTop: DESIGN_TOKENS.spacing.xl }}>
          <Text style={[styles.accountText, { textAlign: 'center' }]}>
            Powered by Stripe • Secure payments worldwide
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Logique d'affichage conditionnelle selon le statut de connexion Stripe
  if (stripeConnection.loading) {
    return renderOnboardingScreen(); // Afficher le loading
  }
  
  if (!stripeConnection.isConnected || stripeConnection.status === 'not_connected') {
    return (
      <>
        {renderOnboardingScreen()}
        
        {/* WebView Stripe Connect intégrée */}
        <StripeConnectWebView
          visible={showStripeWebView}
          onClose={handleWebViewClose}
          onSuccess={handleWebViewSuccess}
          onError={handleWebViewError}
          accountLinkUrl={stripeAccountLink || undefined}
        />
      </>
    );
  }
  
  return (
    <>
      {renderConnectedScreen()}
      
      {/* WebView Stripe Connect intégrée (pour utilisateurs connectés qui veulent reconfigurer) */}
      <StripeConnectWebView
        visible={showStripeWebView}
        onClose={handleWebViewClose}
        onSuccess={handleWebViewSuccess}
        onError={handleWebViewError}
        accountLinkUrl={stripeAccountLink || undefined}
      />

      {/* Modal de création de lien de paiement */}
      <CreatePaymentLinkModal
        visible={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        onSuccess={(paymentLink) => {
          // Lien créé avec succès
        }}
      />
    </>
  );
}
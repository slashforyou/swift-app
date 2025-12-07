import { Ionicons } from '@expo/vector-icons'
import React, { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { WebView } from 'react-native-webview'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'

interface StripeConnectWebViewProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (error: string) => void
  accountLinkUrl?: string
}

export const StripeConnectWebView: React.FC<StripeConnectWebViewProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  accountLinkUrl
}) => {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const webViewRef = useRef<WebView>(null)

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: DESIGN_TOKENS.spacing.md,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      backgroundColor: colors.backgroundTertiary,
    },
    webViewContainer: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    loadingText: {
      marginTop: DESIGN_TOKENS.spacing.md,
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.lg,
    },
    errorIcon: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    errorTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    errorText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    retryButton: {
      marginTop: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    retryButtonText: {
      color: 'white',
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
  })

  const handleNavigationStateChange = (navState: any) => {
    console.log('🌐 WebView navigation:', navState.url)
    
    // Détection des URLs de succès (backend configure: https://swiftapp.altivo.fr/settings/stripe/success)
    if (navState.url.includes('/settings/stripe/success') || 
        navState.url.includes('swiftapp://stripe/success')) {
      console.log('✅ Stripe Connect Express onboarding completed successfully')
      onSuccess?.()
      onClose()
      return
    }
    
    // Détection des URLs de refresh/retry (backend configure: https://swiftapp.altivo.fr/settings/stripe/refresh)
    if (navState.url.includes('/settings/stripe/refresh') || 
        navState.url.includes('swiftapp://stripe/refresh')) {
      console.log('🔄 Stripe Connect refresh requested')
      webViewRef.current?.reload()
      return
    }
    
    // Détection d'erreurs Stripe
    if (navState.url.includes('error') || navState.url.includes('cancel')) {
      console.log('❌ Stripe Connect cancelled or error')
      setError('Connexion annulée ou erreur lors de la configuration')
      return
    }
  }

  const handleError = (error: any) => {
    console.error('❌ WebView error:', error)
    setError('Erreur lors du chargement de Stripe. Vérifiez votre connexion internet.')
    onError?.('WebView loading error')
  }

  const handleLoad = () => {
    setLoading(false)
    console.log('✅ Stripe Connect WebView loaded successfully')
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    webViewRef.current?.reload()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modal}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundSecondary} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            Création de votre Compte Stripe
          </Text>
          
          <View style={{ width: 40 }}>
            {/* Spacer pour centrer le titre */}
          </View>
        </View>

        {/* Contenu */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons 
              name="alert-circle-outline" 
              size={64} 
              color={colors.error} 
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>Erreur de Connexion</Text>
            <Text style={styles.errorText}>{error}</Text>
            
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.webViewContainer}>
            {/* Loading indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Chargement de Stripe Connect...
                </Text>
              </View>
            )}

            {/* WebView */}
            {accountLinkUrl && (
              <WebView
                ref={webViewRef}
                source={{ uri: accountLinkUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onError={handleError}
                onLoad={handleLoad}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                style={{ backgroundColor: colors.background }}
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15"
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}
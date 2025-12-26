/**
 * BusinessInfoPage - Page d'informations business bien structurée
 * Affiche les informations de l'entreprise avec sections organisées (cont        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>       <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>nu seulement, header géré par Business.tsx)
 */
import React from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

// Components
import { AutoTestButton } from '../../components/DevTools/AutoTestInterface'
import { ErrorTestButton } from '../../components/DevTools/ErrorTestButton'
import { SimpleSessionLogButton } from '../../components/DevTools/SimpleSessionLogViewer'
import { HStack, VStack } from '../../components/primitives/Stack'

// Hooks & Utils
import { DESIGN_TOKENS, useCommonThemedStyles } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useBusinessInfo } from '../../hooks/business'
import { useLocalization } from '../../localization/useLocalization'

// Types
interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

// Composant InfoRow pour afficher une ligne d'information
const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const { colors } = useTheme()
  
  return (
    <HStack style={styles.infoRow}>
      {icon && (
        <Text style={styles.infoIcon}>{icon}</Text>
      )}
      <VStack style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {value}
        </Text>
      </VStack>
    </HStack>
  )
}

// Composant StatCard pour afficher une statistique
const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ 
  label, 
  value, 
  color 
}) => {
  const { colors } = useTheme()
  
  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.statValue, { color: color || colors.primary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  )
}

/**
 * Composant principal BusinessInfoPage
 */
const BusinessInfoPage: React.FC = () => {
  const { colors } = useTheme()
  const { t } = useLocalization()
  const commonStyles = useCommonThemedStyles()
  
  // Hook business info avec gestion d'état
  const {
    currentBusiness: businessData,
    businessStats,
    isLoading,
    error,
    refreshData
  } = useBusinessInfo()

  // Gestion des erreurs
  React.useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error)
    }
  }, [error])

  // État de chargement
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t('common.loading')}
        </Text>
      </View>
    )
  }

  // Aucune donnée disponible
  if (!businessData) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No business information available
        </Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Section des statistiques */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Statistics Overview
        </Text>
        
        <HStack style={styles.statsRow}>
          <StatCard
            label="Total Vehicles"
            value={businessStats?.totalVehicles || 0}
            color="#007AFF"
          />
          <StatCard
            label="Active Jobs"
            value={businessStats?.activeJobs || 0}
            color="#34C759"
          />
          <StatCard
            label="Completed Jobs"
            value={businessStats?.completedJobs || 0}
            color="#FF9500"
          />
        </HStack>
      </VStack>

      {/* Section des informations générales */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Company Information
        </Text>
        
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <InfoRow
            icon="🏢"
            label="Company Name"
            value={businessData.name || 'Swift Removals'}
          />
          
          <InfoRow
            icon="🆔"
            label="ABN (Australian Business Number)"
            value={businessData.abn || 'Not specified'}
          />
          
          <InfoRow
            icon="📅"
            label="Established Date"
            value={new Date(businessData.created_at).toLocaleDateString('en-AU')}
          />
          
          <InfoRow
            icon="💼"
            label="Business Type"
            value={businessData.businessType || 'Moving Services'}
          />
        </View>
      </VStack>

      {/* Section des coordonnées */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Contact Details
        </Text>
        
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <InfoRow
            icon="📱"
            label="Phone"
            value={businessData.phone || '+61 2 9000 0000'}
          />
          
          <InfoRow
            icon="✉️"
            label="Email"
            value={businessData.email || 'info@swiftremoval.com.au'}
          />
          
          <InfoRow
            icon="🌐"
            label="Website"
            value={businessData.website || 'www.swiftremoval.com.au'}
          />
        </View>
      </VStack>

      {/* Section de l'adresse */}
      <VStack style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Business Address
        </Text>
        
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <InfoRow
            icon="📍"
            label="Street Address"
            value={businessData.address || '123 Business Street'}
          />
          
          <InfoRow
            icon="🏙️"
            label="City"
            value={businessData.city || 'Sydney'}
          />
          
          <InfoRow
            icon="🗺️"
            label="State"
            value={businessData.state || 'NSW'}
          />
          
          <InfoRow
            icon="📮"
            label="Postcode"
            value={businessData.postcode || '2000'}
          />
        </View>
      </VStack>

      {/* Espacement final */}
      <View style={styles.bottomSpacer} />
      
      {/* Boutons de développement (dev only) */}
      <SimpleSessionLogButton />
      <ErrorTestButton />
      <AutoTestButton />
    </ScrollView>
  )
}

/**
 * Styles du composant
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  statsRow: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  infoCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: 12,
  },
  infoRow: {
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: DESIGN_TOKENS.spacing.sm,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  bottomSpacer: {
    height: DESIGN_TOKENS.spacing.xl,
  },
})

export default BusinessInfoPage

import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

// Components
import BusinessHeader from '../../components/business/BusinessHeader'
import { HStack, VStack } from '../../components/primitives/Stack'
import { Card } from '../../components/ui/Card'

// Hooks & Utils
import { DESIGN_TOKENS, useCommonThemedStyles } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useBusinessInfo } from '../../hooks/business'
import { useLocalization } from '../../localization/useLocalization'

// Composant InfoRow pour afficher les informations
interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const { colors } = useTheme();
  return (
    <HStack gap="sm" align="flex-start" style={{ paddingVertical: 8 }}>
      {icon && (
        <Text style={{ fontSize: 16, color: colors.primary, width: 24, textAlign: 'center' }}>
          {icon}
        </Text>
      )}
      <VStack gap="xs" style={{ flex: 1 }}>
        <Text style={{
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '500',
          textTransform: 'uppercase',
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 16,
          color: colors.text,
          fontWeight: '400',
        }}>
          {value}
        </Text>
      </VStack>
    </HStack>
  );
};

/**
 * Business Info Screen
 * Displays business information and settings
 */
export default function BusinessInfoScreen() {
  const { t } = useLocalization()
  const commonStyles = useCommonThemedStyles()
  const { colors } = useTheme()
  
  // Hook business
  const { 
    currentBusiness, 
    businessStats, 
    isLoading, 
    error 
  } = useBusinessInfo()

  const styles = StyleSheet.create({
    container: {
      ...commonStyles.container,
    },
    content: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.lg,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    statCard: {
      flex: 1,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  })

  // Données par défaut si pas d'API
  const businessData = currentBusiness || {
    name: "Swift Removals Pty Ltd",
    abn: "51 824 753 556",
    address: "123 Moving Solutions Drive",
    city: "Sydney",
    state: "NSW",
    postcode: "2000",
    phone: "+61 2 9123 4567",
    email: "contact@swift-removals.com.au",
    website: "www.swift-removals.com.au",
    businessType: "Moving & Storage Services",
    created_at: new Date().toISOString(),
  };

  const stats = businessStats || {
    totalEmployees: 25,
    activeJobs: 8,
    completedJobs: 142,
    totalVehicles: 12,
    activeVehicles: 8,
    monthlyRevenue: 45000,
    averageJobValue: 850,
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <BusinessHeader title={t('business.info.title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading business information...
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <BusinessHeader title={t('business.info.title')} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats rapides */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalEmployees}</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeJobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
        </View>

        {/* Informations principales */}
        <Card style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <VStack gap="sm">
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Company Information
            </Text>
            
            <InfoRow
              icon="🏢"
              label="Company Name"
              value={businessData.name}
            />
            
            <InfoRow
              icon="📍"
              label="Address"
              value={`${businessData.address}, ${businessData.city} ${businessData.state} ${businessData.postcode}`}
            />
            
            <InfoRow
              icon="📞"
              label="Phone"
              value={businessData.phone}
            />
            
            <InfoRow
              icon="📧"
              label="Email"
              value={businessData.email}
            />
            
            {businessData.website && (
              <InfoRow
                icon="🌐"
                label="Website"
                value={businessData.website}
              />
            )}
          </VStack>
        </Card>

        {/* Informations légales */}
        <Card>
          <VStack gap="sm">
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Business Registration
            </Text>
            
            {businessData.abn && (
              <InfoRow
                icon="🆔"
                label="ABN"
                value={businessData.abn}
              />
            )}
            
            <InfoRow
              icon="💼"
              label="Business Type"
              value={businessData.businessType}
            />
            
            <InfoRow
              icon="📅"
              label="Established"
              value={new Date(businessData.created_at).toLocaleDateString('en-AU')}
            />
          </VStack>
        </Card>
      </ScrollView>
    </View>
  )
}
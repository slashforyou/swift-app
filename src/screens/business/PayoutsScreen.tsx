/**
 * PayoutsScreen - Gestion des virements Stripe
 * Affiche l'historique des payouts et les prochains virements
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Components
import PayoutDetailModal from '../../components/modals/PayoutDetailModal'

// Context
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useStripePayouts, type Payout } from '../../hooks/useStripe'

// Types
interface PayoutsScreenProps {
  navigation?: any
}

export default function PayoutsScreen({ navigation }: PayoutsScreenProps) {
  const { colors } = useTheme()
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)

  // Utilisation du hook Stripe pour récupérer les vraies données
  const { payouts, loading: isLoading, error, refresh, createPayout } = useStripePayouts()

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return colors.success
      case 'in_transit':
        return colors.warning
      case 'pending':
        return colors.primary
      case 'failed':
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  const getStatusIcon = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle'
      case 'in_transit':
        return 'airplane'
      case 'pending':
        return 'time'
      case 'failed':
        return 'close-circle'
      default:
        return 'help-circle'
    }
  }

  const getStatusLabel = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return 'Completed'
      case 'in_transit':
        return 'In Transit'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const handleRefresh = async () => {
    // Utilisation du refresh du hook Stripe
    refresh()
  }

  const handlePayoutPress = (payout: Payout) => {
    setSelectedPayout(payout)
  }

  const filteredPayouts = payouts.filter(payout => {
    switch (selectedTab) {
      case 'pending':
        return payout.status === 'pending' || payout.status === 'in_transit'
      case 'completed':
        return payout.status === 'paid'
      default:
        return true
    }
  })

  const totalPending = payouts
    .filter(p => p.status === 'pending' || p.status === 'in_transit')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalCompleted = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const renderPayout = ({ item }: { item: Payout }) => (
    <TouchableOpacity
      style={[styles.payoutCard, { backgroundColor: colors.backgroundSecondary }]}
      onPress={() => handlePayoutPress(item)}
    >
      <View style={styles.payoutHeader}>
        <View style={styles.payoutInfo}>
          <Text style={[styles.payoutAmount, { color: colors.text }]}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <Text style={[styles.payoutBank, { color: colors.textSecondary }]}>
            Compte bancaire (depuis type)
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.payoutDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Created: {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Arrival: {formatDate(item.arrivalDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Frais inclus
          </Text>
        </View>
      </View>
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
    summaryContainer: {
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    summaryGrid: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.background,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    summaryAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    summaryLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    tabButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.backgroundSecondary,
    },
    content: {
      flex: 1,
    },
    payoutCard: {
      margin: DESIGN_TOKENS.spacing.md,
      marginBottom: 0,
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    payoutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    payoutInfo: {
      flex: 1,
    },
    payoutAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    payoutBank: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
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
    payoutDetails: {
      gap: DESIGN_TOKENS.spacing.xs,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    detailText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.xl,
    },
    emptyText: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.md,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payouts</Text>
      </View>

      {/* Résumé et onglets */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalPending)}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalCompleted)}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && styles.tabButtonActive
              ]}
              onPress={() => setSelectedTab(tab.key as typeof selectedTab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.tabTextActive
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des payouts */}
      <View style={styles.content}>
        {filteredPayouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              No payouts found for this category
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPayouts}
            renderItem={renderPayout}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={{
              paddingBottom: DESIGN_TOKENS.spacing.lg,
            }}
          />
        )}
      </View>

      {/* Modal de détail du payout */}
      <PayoutDetailModal
        visible={selectedPayout !== null}
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />
    </SafeAreaView>
  )
}
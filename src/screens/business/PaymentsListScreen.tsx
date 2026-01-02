/**
 * PaymentsListScreen - Liste des paiements Stripe
 * Affiche l'historique des paiements avec filtres et recherche
 */
import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Components
import PaymentDetailModal from '../../components/modals/PaymentDetailModal'

// Context
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useStripePayments, type Payment } from '../../hooks/useStripe'
import { formatDateTime, formatCurrency as formatLocalizedCurrency, useLocalization } from '../../localization'

interface PaymentsListScreenProps {
  navigation?: any
}

export default function PaymentsListScreen({ navigation }: PaymentsListScreenProps) {
  const { colors } = useTheme()
  const { t, currentLanguage } = useLocalization()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'succeeded' | 'processing' | 'failed'>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Utilisation du hook Stripe pour récupérer les vraies données
  const { payments, loading: isLoading, error, refresh } = useStripePayments()

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return formatLocalizedCurrency(amount * 100, currentLanguage, currency)
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, currentLanguage, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return colors.success
      case 'processing':
        return colors.warning
      case 'failed':
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'checkmark-circle'
      case 'processing':
        return 'time'
      case 'failed':
        return 'close-circle'
      default:
        return 'help-circle'
    }
  }

  const handleRefresh = async () => {
    // Utilisation du refresh du hook Stripe
    refresh()
  }

  const handlePaymentPress = (payment: Payment) => {
    setSelectedPayment(payment)
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.id.includes(searchQuery)
    const matchesFilter = selectedFilter === 'all' || payment.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const renderPayment = ({ item }: { item: Payment }) => (
    <TouchableOpacity
      style={[styles.paymentCard, { backgroundColor: colors.backgroundSecondary }]}
      onPress={() => handlePaymentPress(item)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={[styles.paymentAmount, { color: colors.text }]}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.customer || t('stripe.payments.anonymous')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.method === 'card' ? t('stripe.payments.creditCard') : t('stripe.payments.bankTransfer')}
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
    searchContainer: {
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
    },
    filtersContainer: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    filterButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterTextActive: {
      color: colors.backgroundSecondary,
    },
    content: {
      flex: 1,
    },
    paymentCard: {
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
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    paymentDescription: {
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
    paymentDetails: {
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
        <Text style={styles.title}>{t('stripe.payments.title')}</Text>
      </View>

      {/* Barre de recherche et filtres */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('stripe.payments.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersContainer}>
          {[
            { key: 'all', label: t('stripe.payments.filterAll') },
            { key: 'succeeded', label: t('stripe.payments.filterSucceeded') },
            { key: 'processing', label: t('stripe.payments.filterProcessing') },
            { key: 'failed', label: t('stripe.payments.filterFailed') },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.key as typeof selectedFilter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des paiements */}
      <View style={styles.content}>
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all'
                ? t('stripe.payments.noPaymentsFound')
                : t('stripe.payments.noPaymentsYet')
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPayments}
            renderItem={renderPayment}
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

      {/* Modal détail paiement */}
      <PaymentDetailModal
        visible={selectedPayment !== null}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </SafeAreaView>
  )
}
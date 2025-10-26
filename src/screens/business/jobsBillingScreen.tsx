import Ionicons from '@react-native-vector-icons/ionicons'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { HStack, VStack } from '../../components/primitives/Stack'
import { Card } from '../../components/ui/Card'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { JobBilling, useJobsBilling } from '../../hooks/useJobsBilling'

type PaymentStatusFilter = 'all' | 'unpaid' | 'partial' | 'paid';

export default function JobsBillingScreen() {
  const { colors } = useTheme()
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all')
  const [processingJob, setProcessingJob] = useState<string | null>(null)

  const {
    jobs,
    isLoading,
    error,
    totalUnpaid,
    totalPartial,
    totalPaid,
    refreshJobs,
    createInvoice,
    processRefund,
  } = useJobsBilling()

  // Filtrer les jobs selon le statut sélectionné
  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true
    return job.billing.paymentStatus === statusFilter
  })

  // Formatage de la monnaie
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  // Formatage de la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Obtenir les informations de style pour chaque statut
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return { 
          color: '#10B981', 
          bgColor: '#D1FAE5',
          icon: 'checkmark-circle' as const,
          label: 'Payé'
        }
      case 'partial':
        return { 
          color: '#3B82F6', 
          bgColor: '#DBEAFE',
          icon: 'card' as const,
          label: 'Partiel'
        }
      default:
        return { 
          color: '#F59E0B', 
          bgColor: '#FEF3C7',
          icon: 'time' as const,
          label: 'Non payé'
        }
    }
  }

  // Actions de facturation
  const handleCreateInvoice = async (job: JobBilling) => {
    try {
      setProcessingJob(job.id)
      await createInvoice(job.id)
      Alert.alert('Succès', 'Facture créée avec succès')
    } catch (error) {
      console.error('Error creating invoice:', error)
      Alert.alert('Erreur', 'Impossible de créer la facture')
    } finally {
      setProcessingJob(null)
    }
  }

  const handleRefund = (job: JobBilling) => {
    const maxRefund = job.billing.actualCost || 0
    
    Alert.prompt(
      'Remboursement',
      `Montant à rembourser (max: ${formatCurrency(maxRefund)})`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async (value) => {
            const amount = parseFloat(value || '0')
            if (amount > 0 && amount <= maxRefund) {
              try {
                setProcessingJob(job.id)
                await processRefund(job.id, amount)
                Alert.alert('Succès', `Remboursement de ${formatCurrency(amount)} traité`)
              } catch (error) {
                console.error('Error processing refund:', error)
                Alert.alert('Erreur', 'Impossible de traiter le remboursement')
              } finally {
                setProcessingJob(null)
              }
            } else {
              Alert.alert('Erreur', 'Montant invalide')
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    )
  }

  if (isLoading && jobs.length === 0) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>
          Chargement de la facturation...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshJobs} />
      }
    >
      {/* Header avec statistiques */}
      <View style={{ padding: DESIGN_TOKENS.spacing.lg }}>
        <Text 
          testID="billing-screen-title"
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
          Facturation des Jobs
        </Text>

        {/* Statistiques rapides */}
        <HStack gap="sm" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <View testID="stats-unpaid-card" style={{ flex: 1 }}>
            <Card style={{ padding: DESIGN_TOKENS.spacing.md }}>
              <VStack gap="xs" align="center">
                <Text testID="stats-unpaid-value" style={{ fontSize: 18, fontWeight: '700', color: '#F59E0B' }}>
                  {totalUnpaid}
                </Text>
                <Text testID="stats-unpaid-label" style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Non payés
                </Text>
              </VStack>
            </Card>
          </View>

          <View testID="stats-partial-card" style={{ flex: 1 }}>
            <Card style={{ padding: DESIGN_TOKENS.spacing.md }}>
              <VStack gap="xs" align="center">
                <Text testID="stats-partial-value" style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6' }}>
                  {totalPartial}
                </Text>
                <Text testID="stats-partial-label" style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Partiels
                </Text>
              </VStack>
            </Card>
          </View>

          <View testID="stats-paid-card" style={{ flex: 1 }}>
            <Card style={{ padding: DESIGN_TOKENS.spacing.md }}>
              <VStack gap="xs" align="center">
                <Text testID="stats-paid-value" style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
                  {totalPaid}
                </Text>
                <Text testID="stats-paid-label" style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Payés
                </Text>
              </VStack>
            </Card>
          </View>
        </HStack>

        {/* Filtres de statut */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack gap="sm">
            {(['all', 'unpaid', 'partial', 'paid'] as PaymentStatusFilter[]).map((filter) => (
              <Pressable
                key={filter}
                testID={`filter-${filter}`}
                onPress={() => setStatusFilter(filter)}
                style={{
                  backgroundColor: statusFilter === filter ? colors.primary : colors.backgroundSecondary,
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: statusFilter === filter ? colors.background : colors.text,
                  fontWeight: statusFilter === filter ? '600' : '400',
                  fontSize: 14,
                }}>
                  {filter === 'all' ? 'Tous' : 
                   filter === 'unpaid' ? 'Non payés' :
                   filter === 'partial' ? 'Partiels' : 'Payés'}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
      </View>

      {/* Messages d'erreur */}
      {error && (
        <View testID="error-message" style={{ padding: DESIGN_TOKENS.spacing.lg }}>
          <Card style={{ backgroundColor: '#FEF2F2', borderColor: '#F87171', borderWidth: 1 }}>
            <HStack gap="md" align="center">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={{ color: '#DC2626', flex: 1 }}>
                {error}
              </Text>
            </HStack>
          </Card>
        </View>
      )}

      {/* Liste des jobs */}
      <View style={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg, paddingBottom: DESIGN_TOKENS.spacing.xl }}>
        {filteredJobs.length === 0 ? (
          <View testID="empty-state">
            <Card style={{ padding: DESIGN_TOKENS.spacing.xl, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={{ 
                color: colors.textSecondary, 
                fontSize: 16, 
                marginTop: DESIGN_TOKENS.spacing.md,
                textAlign: 'center'
              }}>
                {statusFilter === 'all' 
                  ? 'Aucun job facturé trouvé'
                  : `Aucun job ${statusFilter === 'unpaid' ? 'non payé' : statusFilter === 'partial' ? 'partiellement payé' : 'payé'} trouvé`}
              </Text>
            </Card>
          </View>
        ) : (
          <VStack gap="md">
            {filteredJobs.map((job) => {
              const statusStyle = getStatusStyle(job.billing.paymentStatus)
              const isProcessing = processingJob === job.id

              return (
                <Card key={job.id} style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                  <VStack gap="md">
                    {/* Header du job */}
                    <HStack justify="space-between" align="center">
                      <VStack gap="xs">
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                          {job.code || job.id}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {job.client.name || `${job.client.firstName} ${job.client.lastName}`}
                        </Text>
                      </VStack>

                      <View style={{
                        backgroundColor: statusStyle.bgColor,
                        paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                        paddingVertical: DESIGN_TOKENS.spacing.xs,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
                        <Text style={{ color: statusStyle.color, fontSize: 12, fontWeight: '600' }}>
                          {statusStyle.label}
                        </Text>
                      </View>
                    </HStack>

                    {/* Informations du job */}
                    <VStack gap="xs">
                      <HStack justify="space-between">
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Date</Text>
                        <Text style={{ color: colors.text, fontSize: 14 }}>
                          {formatDate(job.time.startWindowStart)}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Adresse</Text>
                        <Text style={{ 
                          color: colors.text, 
                          fontSize: 14, 
                          flex: 1, 
                          textAlign: 'right',
                          marginLeft: DESIGN_TOKENS.spacing.sm
                        }} numberOfLines={1}>
                          {job.addresses[0]?.street || 'Non définie'}
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Estimé</Text>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                          {formatCurrency(job.billing.estimatedCost)}
                        </Text>
                      </HStack>

                      {job.billing.actualCost !== undefined && job.billing.actualCost > 0 && (
                        <HStack justify="space-between">
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Réel</Text>
                          <Text style={{ 
                            color: job.billing.actualCost > job.billing.estimatedCost ? '#F59E0B' : '#10B981', 
                            fontSize: 14, 
                            fontWeight: '600' 
                          }}>
                            {formatCurrency(job.billing.actualCost)}
                          </Text>
                        </HStack>
                      )}
                    </VStack>

                    {/* Actions */}
                    <HStack gap="sm" style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                      {job.billing.paymentStatus === 'unpaid' && (
                        <Pressable
                          onPress={() => handleCreateInvoice(job)}
                          disabled={isProcessing}
                          style={({ pressed }) => ({
                            backgroundColor: pressed ? colors.primaryHover : colors.primary,
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            flex: 1,
                            justifyContent: 'center',
                            opacity: isProcessing ? 0.6 : 1,
                          })}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color={colors.background} />
                          ) : (
                            <>
                              <Ionicons name="receipt" size={16} color={colors.background} />
                              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                                Facturer
                              </Text>
                            </>
                          )}
                        </Pressable>
                      )}

                      {(job.billing.paymentStatus === 'paid' || job.billing.paymentStatus === 'partial') && 
                       job.billing.actualCost && job.billing.actualCost > 0 && (
                        <Pressable
                          onPress={() => handleRefund(job)}
                          disabled={isProcessing}
                          style={({ pressed }) => ({
                            backgroundColor: pressed ? '#DC2626' : '#EF4444',
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            flex: 1,
                            justifyContent: 'center',
                            opacity: isProcessing ? 0.6 : 1,
                          })}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color={colors.background} />
                          ) : (
                            <>
                              <Ionicons name="arrow-undo" size={16} color={colors.background} />
                              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                                Rembourser
                              </Text>
                            </>
                          )}
                        </Pressable>
                      )}
                    </HStack>
                  </VStack>
                </Card>
              )
            })}
          </VStack>
        )}
      </View>
    </ScrollView>
  )
}
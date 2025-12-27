/**
 * ReportsScreen - Tableau de bord analytique Stripe
 * Affichage des statistiques de paiements avec filtres avancés et exports
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Hooks et services
import { useStripeReports } from '../../hooks/useStripeReports';

// Composants spécialisés
import { ReportsFilters as ReportsFiltersComponent } from '../../components/reports/ReportsFilters';

// Contexte et styles
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface ReportsScreenProps {
  onBack?: () => void;
}

// Types pour les filtres
export interface ReportsFilters {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  status: 'all' | 'succeeded' | 'pending' | 'failed';
  paymentMethod: 'all' | 'card' | 'bank_transfer' | 'wallet';
  minAmount?: number;
  maxAmount?: number;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  // Styles locaux utilisant le thème
  const businessStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: DESIGN_TOKENS.spacing.xl,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      textAlign: 'center' as const,
    },
    subtitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    sectionTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    section: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: 'center' as const,
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600' as const,
    },
  };
  
  // États locaux
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<ReportsFilters>({
    period: 'month',
    status: 'all',
    paymentMethod: 'all'
  });

  // Hook données Stripe
  const {
    reportsData,
    isLoading,
    error,
    refreshReports,
    exportData
  } = useStripeReports(filters);

  // Rafraîchissement
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshReports();
    setIsRefreshing(false);
  }, [refreshReports]);

  // Export des données
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      Alert.alert(
        'Export en cours',
        `Génération du rapport ${format.toUpperCase()}...`
      );
      await exportData(format);
      Alert.alert('Succès', `Rapport ${format.toUpperCase()} généré avec succès`);
    } catch (error) {

      Alert.alert('Erreur', 'Impossible de générer le rapport');
    }
  }, [exportData]);

  useEffect(() => {
    // Chargement initial des données
  }, []);

  if (error) {
    return (
      <View style={businessStyles.container}>
        <View style={businessStyles.centerContainer}>
          <Ionicons name="warning" size={48} color={colors.error} />
          <Text style={[businessStyles.title, { marginTop: DESIGN_TOKENS.spacing.md }]}>
            Erreur de chargement
          </Text>
          <Text style={[businessStyles.subtitle, { textAlign: 'center', marginTop: DESIGN_TOKENS.spacing.sm }]}>
            Impossible de charger les rapports Stripe.{'\n'}
            Vérifiez votre connexion.
          </Text>
          <TouchableOpacity
            style={[businessStyles.primaryButton, { marginTop: DESIGN_TOKENS.spacing.lg }]}
            onPress={onRefresh}
          >
            <Text style={businessStyles.primaryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bouton retour flottant */}
        {onBack && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              left: DESIGN_TOKENS.spacing.lg,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={onBack}
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={businessStyles.container}>
      {/* Header simplifié avec bouton retour intégré */}
      <View style={{
        backgroundColor: colors.background,
        paddingTop: DESIGN_TOKENS.spacing.xl,
        paddingBottom: DESIGN_TOKENS.spacing.lg,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: DESIGN_TOKENS.spacing.md
        }}>
          {/* Bouton retour à gauche du titre */}
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={{
                marginRight: DESIGN_TOKENS.spacing.md,
                padding: DESIGN_TOKENS.spacing.sm,
              }}
              accessibilityLabel="Retour"
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {/* Titre simplifié */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '600',
              color: colors.text,
            }}>
              Rapports
            </Text>
          </View>
          
          {/* Actions export simples */}
          <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.sm }}>
            <TouchableOpacity
              style={{
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              }}
              onPress={() => handleExport('csv')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              }}
              onPress={() => handleExport('pdf')}
              activeOpacity={0.7}
            >
              <Ionicons name="document" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats rapides simplifiées */}
        {reportsData && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text
              }}>
                {(reportsData.metrics.totalRevenue / 100).toFixed(0)}€
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500'
              }}>
                Revenus
              </Text>
            </View>
            
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text
              }}>
                {reportsData.metrics.totalTransactions}
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500'
              }}>
                Transactions
              </Text>
            </View>
            
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text
              }}>
                {reportsData.metrics.successRate.toFixed(0)}%
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500'
              }}>
                Succès
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Contenu principal */}
      <ScrollView
        style={businessStyles.scrollView}
        contentContainerStyle={businessStyles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Panneau de filtres - Interface interactive */}
        <View style={[businessStyles.section, { marginBottom: DESIGN_TOKENS.spacing.lg }]}>
          <ReportsFiltersComponent 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </View>

        {/* Statistiques principales - Cards modernes */}
        <View style={[businessStyles.section, { marginBottom: DESIGN_TOKENS.spacing.lg }]}>
          <Text style={[businessStyles.sectionTitle, { 
            marginBottom: DESIGN_TOKENS.spacing.md,
            fontSize: 20,
            fontWeight: '600'
          }]}>
            📈 Métriques détaillées
          </Text>
          
          {reportsData ? (
            <View>
              {/* Première ligne - Revenus et Transactions */}
              <View style={{
                flexDirection: 'row',
                marginBottom: DESIGN_TOKENS.spacing.md,
                gap: DESIGN_TOKENS.spacing.md
              }}>
                {/* Card Revenus totaux */}
                <View style={{
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.success,
                        marginBottom: DESIGN_TOKENS.spacing.xs
                      }}>
                        {(reportsData.metrics.totalRevenue / 100).toFixed(0)}€
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontWeight: '500'
                      }}>
                        Revenus totaux
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: DESIGN_TOKENS.spacing.xs
                      }}>
                        Ce mois
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: colors.success,
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Ionicons name="trending-up" size={20} color={colors.background} />
                    </View>
                  </View>
                </View>

                {/* Card Transactions */}
                <View style={{
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.primary,
                        marginBottom: DESIGN_TOKENS.spacing.xs
                      }}>
                        {reportsData.metrics.totalTransactions}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontWeight: '500'
                      }}>
                        Transactions
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: DESIGN_TOKENS.spacing.xs
                      }}>
                        Total
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Ionicons name="card" size={20} color={colors.background} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Deuxième ligne - Taux de succès et Montant moyen */}
              <View style={{
                flexDirection: 'row',
                marginBottom: DESIGN_TOKENS.spacing.md,
                gap: DESIGN_TOKENS.spacing.md
              }}>
                {/* Card Taux de succès */}
                <View style={{
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.info,
                        marginBottom: DESIGN_TOKENS.spacing.xs
                      }}>
                        {reportsData.metrics.successRate.toFixed(0)}%
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontWeight: '500'
                      }}>
                        Taux de succès
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: DESIGN_TOKENS.spacing.xs
                      }}>
                        Performance
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: colors.info,
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                    </View>
                  </View>
                </View>

                {/* Card Montant moyen */}
                <View style={{
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.warning,
                        marginBottom: DESIGN_TOKENS.spacing.xs
                      }}>
                        {(reportsData.metrics.averageAmount / 100).toFixed(0)}€
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        fontWeight: '500'
                      }}>
                        Montant moyen
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: DESIGN_TOKENS.spacing.xs
                      }}>
                        Par transaction
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: colors.warning,
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Ionicons name="stats-chart" size={20} color={colors.background} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Troisième ligne - En attente (card simple) */}
              {reportsData.metrics.pendingAmount > 0 && (
                <View style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  padding: DESIGN_TOKENS.spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: colors.warning,
                      marginBottom: DESIGN_TOKENS.spacing.xs
                    }}>
                      {(reportsData.metrics.pendingAmount / 100).toFixed(2)}€ en attente
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      fontWeight: '500'
                    }}>
                      Paiements en cours de traitement
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: colors.warning,
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="time" size={20} color={colors.background} />
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{
              padding: DESIGN_TOKENS.spacing.xl,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center'
            }}>
              <Ionicons name="analytics" size={48} color={colors.textSecondary} />
              <Text style={{ 
                color: colors.textSecondary, 
                textAlign: 'center',
                marginTop: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                fontWeight: '500'
              }}>
                Chargement des métriques...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportsScreen;
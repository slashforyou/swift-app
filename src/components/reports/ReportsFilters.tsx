/**
 * ReportsFilters - Panneau de filtres pour les rapports Stripe
 * Permet de filtrer par période, statut, méthode de paiement et montant
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types
import { ReportsFilters as FiltersType } from '../../hooks/useStripeReports';

// Contexte et styles
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface ReportsFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' }
] as const;

const STATUS_OPTIONS: readonly ({ value: 'all' | 'succeeded' | 'pending' | 'failed'; label: string; icon: string; colorKey?: 'success' | 'warning' | 'error' })[] = [
  { value: 'all', label: 'Tous les statuts', icon: 'apps' },
  { value: 'succeeded', label: 'Réussis', icon: 'checkmark-circle', colorKey: 'success' },
  { value: 'pending', label: 'En attente', icon: 'time', colorKey: 'warning' },
  { value: 'failed', label: 'Échoués', icon: 'close-circle', colorKey: 'error' }
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'Toutes les méthodes', icon: 'card' },
  { value: 'card', label: 'Carte bancaire', icon: 'card' },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: 'business' },
  { value: 'wallet', label: 'Portefeuille digital', icon: 'wallet' }
] as const;

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [tempMinAmount, setTempMinAmount] = useState(filters.minAmount?.toString() || '');
  const [tempMaxAmount, setTempMaxAmount] = useState(filters.maxAmount?.toString() || '');

  // Style de base pour les options
  const optionStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    marginRight: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  };

  const selectedOptionStyle = {
    ...optionStyle,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  };

  // Mise à jour des filtres
  const updateFilters = (updates: Partial<FiltersType>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Gestion des montants
  const handleAmountSubmit = () => {
    updateFilters({
      minAmount: tempMinAmount ? parseFloat(tempMinAmount) : undefined,
      maxAmount: tempMaxAmount ? parseFloat(tempMaxAmount) : undefined
    });
    setShowAmountModal(false);
  };

  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {/* Header avec toggle */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? DESIGN_TOKENS.spacing.lg : 0
        }}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.text
        }}>
          Filtres avancés
        </Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View>
          {/* Filtre période */}
          <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Période
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PERIOD_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={filters.period === option.value ? selectedOptionStyle : optionStyle}
                  onPress={() => updateFilters({ period: option.value })}
                >
                  <Text style={{
                    color: filters.period === option.value ? colors.primary : colors.text,
                    fontSize: 14,
                    fontWeight: filters.period === option.value ? '600' : '400'
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtre statut */}
          <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Statut des paiements
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={filters.status === option.value ? selectedOptionStyle : optionStyle}
                  onPress={() => updateFilters({ status: option.value })}
                >
                  <Ionicons 
                    name={option.icon as any}
                    size={16} 
                    color={filters.status === option.value 
                      ? colors.primary 
                      : (option.colorKey ? colors[option.colorKey] : colors.textSecondary)
                    }
                    style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
                  />
                  <Text style={{
                    color: filters.status === option.value ? colors.primary : colors.text,
                    fontSize: 14,
                    fontWeight: filters.status === option.value ? '600' : '400'
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtre méthode de paiement */}
          <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Méthode de paiement
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PAYMENT_METHOD_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={filters.paymentMethod === option.value ? selectedOptionStyle : optionStyle}
                  onPress={() => updateFilters({ paymentMethod: option.value })}
                >
                  <Ionicons 
                    name={option.icon as any}
                    size={16} 
                    color={filters.paymentMethod === option.value 
                      ? colors.primary 
                      : colors.textSecondary
                    }
                    style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
                  />
                  <Text style={{
                    color: filters.paymentMethod === option.value ? colors.primary : colors.text,
                    fontSize: 14,
                    fontWeight: filters.paymentMethod === option.value ? '600' : '400'
                  }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtre montant */}
          <View>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.sm
            }}>
              Montant
            </Text>
            <TouchableOpacity
              style={{
                ...optionStyle,
                justifyContent: 'space-between',
                width: '100%',
                marginRight: 0
              }}
              onPress={() => setShowAmountModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name="cash" 
                  size={16} 
                  color={colors.textSecondary}
                  style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
                />
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {filters.minAmount || filters.maxAmount
                    ? `${filters.minAmount || 0}€ - ${filters.maxAmount || '∞'}€`
                    : 'Tous les montants'
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Bouton reset */}
          <TouchableOpacity
            style={{
              marginTop: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.error,
              backgroundColor: colors.background,
              alignItems: 'center'
            }}
            onPress={() => onFiltersChange({
              period: 'month',
              status: 'all',
              paymentMethod: 'all'
            })}
          >
            <Text style={{ color: colors.error, fontSize: 14, fontWeight: '500' }}>
              Réinitialiser les filtres
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal montant */}
      <Modal
        visible={showAmountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            width: '80%',
            maxWidth: 400,
            padding: DESIGN_TOKENS.spacing.xl,
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              textAlign: 'center'
            }}>
              Filtrer par montant
            </Text>

            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text style={{ fontSize: 14, color: colors.text, marginBottom: DESIGN_TOKENS.spacing.xs }}>
                Montant minimum (€)
              </Text>
              <TextInput
                style={{
                  padding: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  fontSize: 16
                }}
                value={tempMinAmount}
                onChangeText={setTempMinAmount}
                keyboardType="numeric"
                placeholder="Ex: 50"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
              <Text style={{ fontSize: 14, color: colors.text, marginBottom: DESIGN_TOKENS.spacing.xs }}>
                Montant maximum (€)
              </Text>
              <TextInput
                style={{
                  padding: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  fontSize: 16
                }}
                value={tempMaxAmount}
                onChangeText={setTempMaxAmount}
                keyboardType="numeric"
                placeholder="Ex: 1000"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                  marginRight: DESIGN_TOKENS.spacing.sm,
                  alignItems: 'center'
                }}
                onPress={() => setShowAmountModal(false)}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.primary,
                  marginLeft: DESIGN_TOKENS.spacing.sm,
                  alignItems: 'center'
                }}
                onPress={handleAmountSubmit}
              >
                <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                  Appliquer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
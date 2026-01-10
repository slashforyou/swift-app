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
import { useTranslation } from '../../localization';

interface ReportsFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

// Option values (labels are translated in component)
const PERIOD_VALUES = ['day', 'week', 'month', 'quarter', 'year', 'custom'] as const;
const STATUS_VALUES = [
  { value: 'all' as const, icon: 'apps' },
  { value: 'succeeded' as const, icon: 'checkmark-circle', colorKey: 'success' as const },
  { value: 'pending' as const, icon: 'time', colorKey: 'warning' as const },
  { value: 'failed' as const, icon: 'close-circle', colorKey: 'error' as const },
];
const PAYMENT_METHOD_VALUES = [
  { value: 'all' as const, icon: 'card' },
  { value: 'card' as const, icon: 'card' },
  { value: 'bank_transfer' as const, icon: 'business' },
  { value: 'wallet' as const, icon: 'wallet' },
];

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
          {t('reports.filters.title')}
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
              {t('reports.filters.period.label')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PERIOD_VALUES.map(value => {
                const labelKey = {
                  day: 'today',
                  week: 'thisWeek',
                  month: 'thisMonth',
                  quarter: 'thisQuarter',
                  year: 'thisYear',
                  custom: 'custom',
                }[value] as keyof typeof t;
                return (
                <TouchableOpacity
                  key={value}
                  style={filters.period === value ? selectedOptionStyle : optionStyle}
                  onPress={() => updateFilters({ period: value })}
                >
                  <Text style={{
                    color: filters.period === value ? colors.primary : colors.text,
                    fontSize: 14,
                    fontWeight: filters.period === value ? '600' : '400'
                  }}>
                    {t(`reports.filters.period.${labelKey}`)}
                  </Text>
                </TouchableOpacity>
              )})}
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
              {t('reports.filters.status.label')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {STATUS_VALUES.map(option => (
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
                    {t(`reports.filters.status.${option.value}`)}
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
              {t('reports.filters.paymentMethod.label')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PAYMENT_METHOD_VALUES.map(option => {
                const labelKey = {
                  all: 'all',
                  card: 'card',
                  bank_transfer: 'bankTransfer',
                  wallet: 'wallet',
                }[option.value];
                return (
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
                    {t(`reports.filters.paymentMethod.${labelKey}`)}
                  </Text>
                </TouchableOpacity>
              )})}
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
              {t('reports.filters.amount.label')}
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
                    : t('reports.filters.amount.all')
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
              {t('reports.filters.reset')}
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
              {t('reports.filters.amount.modalTitle')}
            </Text>

            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text style={{ fontSize: 14, color: colors.text, marginBottom: DESIGN_TOKENS.spacing.xs }}>
                {t('reports.filters.amount.min')}
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
                placeholder={t('reports.filters.amount.minPlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
              <Text style={{ fontSize: 14, color: colors.text, marginBottom: DESIGN_TOKENS.spacing.xs }}>
                {t('reports.filters.amount.max')}
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
                placeholder={t('reports.filters.amount.maxPlaceholder')}
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
                  {t('reports.filters.cancel')}
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
                  {t('reports.filters.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
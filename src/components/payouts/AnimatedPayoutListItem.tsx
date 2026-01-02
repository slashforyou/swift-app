/**
 * AnimatedPayoutListItem - Item de liste avec animations
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import { useLocalization, formatCurrency, formatDateShort } from '../../localization';
import type { Payout } from '../../types/payouts';

interface AnimatedPayoutListItemProps {
  payout: Payout;
  onPress?: () => void;
  index?: number;
}

const AnimatedPayoutListItem: React.FC<AnimatedPayoutListItemProps> = ({
  payout,
  onPress,
  index = 0,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLocalization();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const formatAmount = (amount: number, currency: string) => {
    return formatCurrency(amount, currentLanguage, currency.toUpperCase());
  };

  const formatDate = (timestamp: number) => {
    return formatDateShort(new Date(timestamp * 1000), currentLanguage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
      case 'in_transit':
        return colors.warning;
      case 'failed':
      case 'canceled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'in_transit':
        return 'airplane';
      case 'failed':
        return 'close-circle';
      case 'canceled':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'in_transit':
        return 'En transit';
      case 'failed':
        return 'Échec';
      case 'canceled':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: colors.background,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        activeOpacity={0.7}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.lg,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: colors.text,
            }}>
              {formatAmount(payout.amount, payout.currency)}
            </Text>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.textSecondary,
              marginTop: DESIGN_TOKENS.spacing.xs,
            }}>
              {formatDate(payout.created)}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: getStatusColor(payout.status) + '20',
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.sm,
          }}>
            <Ionicons
              name={getStatusIcon(payout.status) as any}
              size={14}
              color={getStatusColor(payout.status)}
              style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
            />
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              color: getStatusColor(payout.status),
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}>
              {getStatusLabel(payout.status)}
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons
              name={payout.type === 'bank_account' ? 'business' : 'card'}
              size={16}
              color={colors.textSecondary}
              style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
            />
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.textSecondary,
            }}>
              {payout.type === 'bank_account' ? 'Compte bancaire' : 'Carte'}
            </Text>
          </View>

          {payout.method === 'instant' && (
            <View style={{
              backgroundColor: colors.primary + '20',
              paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              paddingVertical: DESIGN_TOKENS.spacing.xs,
              borderRadius: DESIGN_TOKENS.radius.sm,
            }}>
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.xs,
                color: colors.primary,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              }}>
                Instantané
              </Text>
            </View>
          )}
        </View>

        {payout.description && (
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
            color: colors.textSecondary,
            marginTop: DESIGN_TOKENS.spacing.sm,
            fontStyle: 'italic',
          }}>
            {payout.description}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedPayoutListItem;
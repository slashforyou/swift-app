/**
 * AnimatedBalanceCard - Carte de solde avec animations
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Card } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import type { PayoutBalance } from '../../types/payouts';

interface AnimatedBalanceCardProps {
  balance: PayoutBalance;
  loading?: boolean;
  onRefresh?: () => void;
}

const AnimatedBalanceCard: React.FC<AnimatedBalanceCardProps> = ({
  balance,
  loading = false,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const availableAmount = balance.available[0]?.amount || 0;
  const pendingAmount = balance.pending[0]?.amount || 0;
  const currency = balance.available[0]?.currency || 'eur';

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
  };

  if (loading) {
    return (
      <Card padding="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <View style={{
          height: 120,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            color: colors.textSecondary,
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
          }}>
            Chargement du solde...
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Card padding="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}>
              Solde disponible
            </Text>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xxl,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: colors.success,
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}>
              {formatAmount(availableAmount)}
            </Text>
          </View>

          {onRefresh && (
            <View style={{
              backgroundColor: colors.primaryLight,
              borderRadius: DESIGN_TOKENS.borderRadius.full,
              padding: DESIGN_TOKENS.spacing.sm,
            }}>
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.xs,
                color: colors.primary,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              }}>
                Actualiser
              </Text>
            </View>
          )}
        </View>

        {pendingAmount > 0 && (
          <View style={{
            marginTop: DESIGN_TOKENS.spacing.md,
            paddingTop: DESIGN_TOKENS.spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}>
              En attente
            </Text>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.lg,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: colors.warning,
            }}>
              {formatAmount(pendingAmount)}
            </Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

export default AnimatedBalanceCard;
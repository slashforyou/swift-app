/**
 * BalanceCardSkeleton - Skeleton loader pour la carte de solde
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Card } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';

interface BalanceCardSkeletonProps {
  animated?: boolean;
}

const BalanceCardSkeleton: React.FC<BalanceCardSkeletonProps> = ({
  animated = true,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animated, opacity]);

  const SkeletonLine = ({ width, height = 16, style = {} }: { width: string | number; height?: number; style?: any }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: DESIGN_TOKENS.radius.xs,
          opacity: animated ? opacity : 0.3,
        },
        style,
      ]}
    />
  );

  return (
    <Card style={{ 
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.lg 
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <View style={{ flex: 1 }}>
          <SkeletonLine width="60%" height={14} style={{ marginBottom: DESIGN_TOKENS.spacing.xs }} />
          <SkeletonLine width="80%" height={32} style={{ marginBottom: DESIGN_TOKENS.spacing.sm }} />
        </View>

        <SkeletonLine 
          width={60} 
          height={32} 
          style={{ borderRadius: DESIGN_TOKENS.radius.full }} 
        />
      </View>

      <View style={{
        marginTop: DESIGN_TOKENS.spacing.md,
        paddingTop: DESIGN_TOKENS.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        <SkeletonLine width="40%" height={14} style={{ marginBottom: DESIGN_TOKENS.spacing.xs }} />
        <SkeletonLine width="60%" height={20} />
      </View>
    </Card>
  );
};

export default BalanceCardSkeleton;
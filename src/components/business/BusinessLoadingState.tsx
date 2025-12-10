/**
 * BusinessLoadingState - États de chargement pour les composants business
 * Composant unifié avec skeletons et indicateurs de chargement
 */

import React from 'react';
import { ActivityIndicator, Dimensions, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider';
import { Body, BodySmall } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';

const { width } = Dimensions.get('window');

interface BusinessLoadingProps {
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  type?: 'inline' | 'fullscreen' | 'card';
  message?: string;
}

/**
 * Composant de loading inline pour les sections business
 */
export const BusinessInlineLoading: React.FC<BusinessLoadingProps> = ({
  loading = true,
  error = null,
  children,
  type = 'inline',
  message = 'Chargement...'
}) => {
  const { colors } = useTheme();

  if (error) {
    return (
      <View style={{
        padding: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error,
        borderRadius: DESIGN_TOKENS.radius.md,
        marginVertical: DESIGN_TOKENS.spacing.sm
      }}>
        <Body style={{ color: colors.errorButtonText, textAlign: 'center' }}>
          {error}
        </Body>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{
        padding: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: type === 'fullscreen' ? 200 : 80
      }}>
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
        />
        <BodySmall style={{ 
          color: colors.textSecondary,
          textAlign: 'center' 
        }}>
          {message}
        </BodySmall>
      </View>
    );
  }

  return children ? <>{children}</> : null;
};

/**
 * Loading skeleton pour les cartes business
 */
export const BusinessCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  const skeletonStyle = {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: DESIGN_TOKENS.radius.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm
  };

  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.md
    }}>
      {/* Header skeleton */}
      <View style={[skeletonStyle, { height: 20, width: '60%' }]} />
      <View style={[skeletonStyle, { height: 16, width: '80%' }]} />
      
      {/* Content skeleton */}
      <View style={[skeletonStyle, { height: 14, width: '100%', marginTop: DESIGN_TOKENS.spacing.md }]} />
      <View style={[skeletonStyle, { height: 14, width: '90%' }]} />
      <View style={[skeletonStyle, { height: 14, width: '70%' }]} />
    </View>
  );
};

/**
 * Loading état fullscreen
 */
export const BusinessFullscreenLoading: React.FC<{ message?: string }> = ({ 
  message = 'Chargement des données...' 
}) => {
  const { colors } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: DESIGN_TOKENS.spacing.xl
    }}>
      <ActivityIndicator 
        size="large" 
        color={colors.primary} 
        style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}
      />
      <Body style={{ 
        color: colors.textSecondary,
        textAlign: 'center' 
      }}>
        {message}
      </Body>
    </View>
  );
};

export default BusinessInlineLoading;
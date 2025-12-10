/**
 * Stripe Components - Composants pour l'interface Stripe Connect
 */

import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { DESIGN_TOKENS } from '../../design-system/tokens';

// Types pour les composants Stripe
export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'required' | 'completed' | 'currently_due'; // Ajout de currently_due
  priority: 'high' | 'medium' | 'low';
}

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  icon?: string; // Ajout de la propriété icon optionnelle
}

// Composant pour afficher les requirements Stripe
export const StripeRequirementCard: React.FC<{ requirement: RequirementItem }> = ({ 
  requirement 
}) => {
  const { colors } = useTheme();
  
  const getStatusColor = () => {
    switch (requirement.status) {
      case 'completed': return colors.success;
      case 'required': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
      marginBottom: DESIGN_TOKENS.spacing.sm,
    }}>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.md,
        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
        color: colors.text,
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {requirement.title}
      </Text>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 20,
      }}>
        {requirement.description}
      </Text>
    </View>
  );
};

// Composant pour les statistiques Stripe
export const StripeStatCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
  const { colors } = useTheme();

  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
    }}>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {stat.label}
      </Text>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize['2xl'],
        fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
        color: colors.text,
      }}>
        {stat.value}
      </Text>
      {stat.change && (
        <Text style={{
          fontSize: DESIGN_TOKENS.typography.fontSize.xs,
          color: stat.trend === 'up' ? colors.success : 
                stat.trend === 'down' ? colors.error : colors.textSecondary,
          marginTop: DESIGN_TOKENS.spacing.xs,
        }}>
          {stat.change}
        </Text>
      )}
    </View>
  );
};

// Composant pour l'état de connexion Stripe
export const StripeConnectionStatus: React.FC<{
  isConnected: boolean;
  accountStatus?: string;
}> = ({ isConnected, accountStatus = 'unknown' }) => {
  const { colors } = useTheme();

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        color: colors.success,
        text: 'Compte connecté',
        description: 'Votre compte Stripe est actif et opérationnel',
      };
    }
    return {
      color: colors.error,
      text: 'Compte non connecté', 
      description: 'Connectez votre compte Stripe pour accepter les paiements',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: 'center',
    }}>
      <View style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: statusInfo.color,
        opacity: 0.1,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }} />
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.lg,
        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
        color: statusInfo.color,
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {statusInfo.text}
      </Text>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {statusInfo.description}
      </Text>
      {accountStatus && accountStatus !== 'unknown' && (
        <Text style={{
          fontSize: DESIGN_TOKENS.typography.fontSize.xs,
          color: colors.textMuted,
          marginTop: DESIGN_TOKENS.spacing.sm,
        }}>
          Status: {accountStatus}
        </Text>
      )}
    </View>
  );
};

// ActionButton component
export const ActionButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}> = ({ title, onPress, variant = 'primary', disabled = false }) => {
  const { colors } = useTheme();
  
  return (
    <View style={{
      backgroundColor: variant === 'primary' ? colors.primary : colors.background,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
    }}>
      <Text style={{
        color: variant === 'primary' ? colors.background : colors.primary,
        textAlign: 'center',
        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
      }}>
        {title}
      </Text>
    </View>
  );
};

// InfoSection component  
export const InfoSection: React.FC<{
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ title, description, children }) => {
  const { colors } = useTheme();
  
  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: DESIGN_TOKENS.spacing.md,
    }}>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.lg,
        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
        color: colors.text,
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: children ? DESIGN_TOKENS.spacing.md : 0,
      }}>
        {description}
      </Text>
      {children}
    </View>
  );
};

// QuickStats component
export const QuickStats: React.FC<{ stats: StatItem[] }> = ({ stats }) => {
  const { colors } = useTheme();
  
  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }}>
      {stats.map((stat, index) => (
        <View
          key={stat.id}
          style={{
            width: '48%',
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}
        >
          <StripeStatCard stat={stat} />
        </View>
      ))}
    </View>
  );
};

// StatusCard component
export const StatusCard: React.FC<{
  title: string;
  status: 'success' | 'warning' | 'error' | 'info';
  description: string;
  actions?: React.ReactNode;
}> = ({ title, status, description, actions }) => {
  const { colors } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.primary;
      default: return colors.textSecondary;
    }
  };
  
  return (
    <View style={{
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: getStatusColor(),
      marginBottom: DESIGN_TOKENS.spacing.md,
    }}>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.lg,
        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
        color: getStatusColor(),
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: actions ? DESIGN_TOKENS.spacing.md : 0,
      }}>
        {description}
      </Text>
      {actions}
    </View>
  );
};

// RequirementsList component
export const RequirementsList: React.FC<{ requirements: RequirementItem[] }> = ({ 
  requirements 
}) => {
  return (
    <View>
      {requirements.map((requirement) => (
        <StripeRequirementCard key={requirement.id} requirement={requirement} />
      ))}
    </View>
  );
};
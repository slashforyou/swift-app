/**
 * RoleBadge Component
 * Badge pour afficher le rôle d'un utilisateur
 * Phase 2 - STAFF-03
 * 
 * @example
 * <RoleBadge role="admin" />
 * <RoleBadge role={user.role} size="lg" showIcon />
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { SystemRoleCode, getRoleDisplayName } from '../../services/rolesService';

// ============================================================================
// Types
// ============================================================================

export interface RoleBadgeProps {
  /** Role code */
  role: SystemRoleCode | string | null | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show role icon */
  showIcon?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Display style variant */
  variant?: 'filled' | 'outline' | 'subtle';
}

// Role configurations
const ROLE_CONFIG: Record<string, { 
  color: string; 
  icon: keyof typeof Ionicons.glyphMap;
  priority: number;
}> = {
  owner: {
    color: '#8B5CF6', // Purple
    icon: 'diamond-outline',
    priority: 1,
  },
  admin: {
    color: '#EC4899', // Pink
    icon: 'shield-checkmark-outline',
    priority: 2,
  },
  manager: {
    color: '#3B82F6', // Blue
    icon: 'briefcase-outline',
    priority: 3,
  },
  technician: {
    color: '#10B981', // Green
    icon: 'construct-outline',
    priority: 4,
  },
  viewer: {
    color: '#6B7280', // Gray
    icon: 'eye-outline',
    priority: 5,
  },
  supervisor: {
    color: '#F59E0B', // Amber
    icon: 'clipboard-outline',
    priority: 6,
  },
  mover: {
    color: '#06B6D4', // Cyan
    icon: 'cube-outline',
    priority: 7,
  },
};

const DEFAULT_ROLE_CONFIG = {
  color: '#6B7280',
  icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
  priority: 99,
};

// ============================================================================
// Component
// ============================================================================

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  style,
  variant = 'subtle',
}) => {
  const { colors } = useTheme();

  if (!role) {
    return null;
  }

  const roleConfig = ROLE_CONFIG[role] || DEFAULT_ROLE_CONFIG;
  const displayName = getRoleDisplayName(role);

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingH: DESIGN_TOKENS.spacing.sm,
      paddingV: 3,
      fontSize: 10,
      iconSize: 10,
    },
    md: {
      paddingH: DESIGN_TOKENS.spacing.md,
      paddingV: 5,
      fontSize: 12,
      iconSize: 12,
    },
    lg: {
      paddingH: DESIGN_TOKENS.spacing.lg,
      paddingV: 7,
      fontSize: 14,
      iconSize: 14,
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: roleConfig.color,
          borderColor: roleConfig.color,
          textColor: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: roleConfig.color,
          textColor: roleConfig.color,
        };
      case 'subtle':
      default:
        return {
          backgroundColor: `${roleConfig.color}15`,
          borderColor: 'transparent',
          textColor: roleConfig.color,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={roleConfig.icon}
          size={config.iconSize}
          color={variantStyles.textColor}
        />
      )}
      
      <Text
        style={[
          styles.name,
          {
            fontSize: config.fontSize,
            color: variantStyles.textColor,
          },
        ]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
    </View>
  );
};

// ============================================================================
// RoleIndicator - Minimal inline role display
// ============================================================================

export interface RoleIndicatorProps {
  role: SystemRoleCode | string | null | undefined;
  showLabel?: boolean;
  size?: number;
}

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  role,
  showLabel = false,
  size = 16,
}) => {
  const { colors } = useTheme();

  if (!role) {
    return null;
  }

  const roleConfig = ROLE_CONFIG[role] || DEFAULT_ROLE_CONFIG;
  const displayName = getRoleDisplayName(role);

  return (
    <View style={styles.indicatorContainer}>
      <View
        style={[
          styles.indicatorDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: roleConfig.color,
          },
        ]}
      >
        <Ionicons
          name={roleConfig.icon}
          size={size * 0.6}
          color="#FFFFFF"
        />
      </View>
      
      {showLabel && (
        <Text style={[styles.indicatorLabel, { color: colors.textMuted }]}>
          {displayName}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// RoleList - Display roles sorted by priority
// ============================================================================

export interface RoleListProps {
  roles: (SystemRoleCode | string)[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  style?: ViewStyle;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  size = 'sm',
  maxDisplay = 3,
  style,
}) => {
  const { colors } = useTheme();

  // Sort by priority
  const sortedRoles = [...roles].sort((a, b) => {
    const priorityA = ROLE_CONFIG[a]?.priority ?? 99;
    const priorityB = ROLE_CONFIG[b]?.priority ?? 99;
    return priorityA - priorityB;
  });

  const displayedRoles = sortedRoles.slice(0, maxDisplay);
  const remainingCount = sortedRoles.length - maxDisplay;

  return (
    <View style={[styles.listContainer, style]}>
      {displayedRoles.map((role, index) => (
        <RoleBadge
          key={`${role}-${index}`}
          role={role}
          size={size}
          showIcon={false}
        />
      ))}
      
      {remainingCount > 0 && (
        <View
          style={[
            styles.moreIndicator,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.moreText, { color: colors.textMuted }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Helper to get role color
// ============================================================================

export function getRoleColor(role: SystemRoleCode | string): string {
  return ROLE_CONFIG[role]?.color ?? DEFAULT_ROLE_CONFIG.color;
}

export function getRoleIcon(role: SystemRoleCode | string): keyof typeof Ionicons.glyphMap {
  return ROLE_CONFIG[role]?.icon ?? DEFAULT_ROLE_CONFIG.icon;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  name: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Indicator styles
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  indicatorDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // List styles
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  moreIndicator: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: 3,
    borderRadius: DESIGN_TOKENS.radius.full,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default RoleBadge;

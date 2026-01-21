/**
 * PermissionGate Component
 * Contrôle l'affichage des composants enfants basé sur les permissions
 * Phase 2 - STAFF-03
 * 
 * @example
 * <PermissionGate permission="jobs.create">
 *   <CreateJobButton />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate 
 *   permissions={['staff.edit', 'staff.delete']} 
 *   requireAll={false}
 *   fallback={<Text>Accès refusé</Text>}
 * >
 *   <StaffManagement />
 * </PermissionGate>
 */

import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { usePermissions } from '../../hooks/usePermissions';

// ============================================================================
// Types
// ============================================================================

export interface PermissionGateProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions to check */
  permissions?: string[];
  /** If true, all permissions must be granted. If false, any permission grants access */
  requireAll?: boolean;
  /** Content to show when access is granted */
  children: ReactNode;
  /** Content to show when access is denied (optional) */
  fallback?: ReactNode;
  /** Show loading state while checking permissions */
  showLoading?: boolean;
  /** Show a default "access denied" message if no fallback provided */
  showDeniedMessage?: boolean;
  /** Required role(s) - alternative to permission check */
  roles?: ('owner' | 'admin' | 'manager' | 'technician' | 'viewer')[];
  /** If true, check passes if user is owner (bypasses all checks) */
  allowOwnerBypass?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback,
  showLoading = true,
  showDeniedMessage = false,
  roles,
  allowOwnerBypass = true,
}) => {
  const { colors } = useTheme();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isAdmin,
    isManager,
    isTechnician,
    isViewer,
    isLoading,
    isInitialized,
  } = usePermissions();

  // Loading state
  if (showLoading && isLoading && !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Owner bypass
  if (allowOwnerBypass && isOwner) {
    return <>{children}</>;
  }

  // Role-based check
  if (roles && roles.length > 0) {
    const roleMap = {
      owner: isOwner,
      admin: isAdmin,
      manager: isManager,
      technician: isTechnician,
      viewer: isViewer,
    };
    
    const hasRequiredRole = roles.some(role => roleMap[role]);
    if (!hasRequiredRole) {
      return renderDenied();
    }
    return <>{children}</>;
  }

  // Permission-based check
  const allPermissions = permission 
    ? [permission, ...permissions] 
    : permissions;

  if (allPermissions.length === 0) {
    // No permissions specified, allow access
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(allPermissions)
    : hasAnyPermission(allPermissions);

  if (!hasAccess) {
    return renderDenied();
  }

  return <>{children}</>;

  // ---------------------------------------------------------------------------
  // Render denied state
  // ---------------------------------------------------------------------------
  
  function renderDenied() {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showDeniedMessage) {
      return (
        <View style={[styles.deniedContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={24} 
            color={colors.textMuted} 
          />
          <Text style={[styles.deniedText, { color: colors.textMuted }]}>
            Accès non autorisé
          </Text>
        </View>
      );
    }
    
    return null;
  }
};

// ============================================================================
// Convenience Components
// ============================================================================

/** Only visible to owners */
export const OwnerOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['owner']} fallback={fallback} allowOwnerBypass={false}>
    {children}
  </PermissionGate>
);

/** Only visible to admins and owners */
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['owner', 'admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

/** Only visible to managers, admins, and owners */
export const ManagerOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['owner', 'admin', 'manager']} fallback={fallback}>
    {children}
  </PermissionGate>
);

/** Can create jobs */
export const CanCreateJob: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate permission="jobs.create" fallback={fallback}>
    {children}
  </PermissionGate>
);

/** Can manage staff */
export const CanManageStaff: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate 
    permissions={['staff.create', 'staff.edit', 'staff.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/** Can manage teams */
export const CanManageTeams: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate permission="teams.manage" fallback={fallback}>
    {children}
  </PermissionGate>
);

/** Can process payments */
export const CanProcessPayments: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate permission="payments.process" fallback={fallback}>
    {children}
  </PermissionGate>
);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    padding: DESIGN_TOKENS.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedContainer: {
    padding: DESIGN_TOKENS.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  deniedText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PermissionGate;

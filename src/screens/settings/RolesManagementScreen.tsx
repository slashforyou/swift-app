/**
 * RolesManagementScreen - Gestion des rôles et permissions
 * Interface pour créer, modifier et supprimer les rôles de l'entreprise
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import { AdminOnly } from '../../components/PermissionGate';
import { Screen } from '../../components/primitives/Screen';
import { HStack, VStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';

// Hooks & Utils
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useRoles } from '../../hooks/useRoles';
import { useTranslation } from '../../localization';
import {
    AVAILABLE_PERMISSIONS,
    PERMISSION_CATEGORIES,
    Role,
    getPermissionDisplayName,
} from '../../services/rolesService';

// ============================================================================
// Types
// ============================================================================

interface RolesManagementScreenProps {
  navigation?: any;
}

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onViewPermissions: (role: Role) => void;
  colors: any;
}

interface PermissionCategoryProps {
  category: string;
  permissions: readonly string[];
  selectedPermissions: string[];
  onToggle: (permission: string) => void;
  colors: any;
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ROLE_ICONS: Record<string, string> = {
  owner: 'shield-checkmark',
  admin: 'key',
  manager: 'briefcase',
  dispatcher: 'git-branch',
  crew_leader: 'people',
  mover: 'body',
  viewer: 'eye',
  custom: 'create',
};

const ROLE_COLORS: Record<string, string> = {
  owner: '#8B5CF6',
  admin: '#EF4444',
  manager: '#3B82F6',
  dispatcher: '#10B981',
  crew_leader: '#F59E0B',
  mover: '#6366F1',
  viewer: '#6B7280',
  custom: '#EC4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  jobs: '📋 Jobs',
  staff: '👥 Personnel',
  vehicles: '🚛 Véhicules',
  clients: '🏢 Clients',
  teams: '👨‍👩‍👧‍👦 Équipes',
  finances: '💰 Finances',
  reports: '📊 Rapports',
  settings: '⚙️ Paramètres',
  roles: '🔐 Rôles',
};

// ============================================================================
// Sub-Components
// ============================================================================

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onEdit,
  onDelete,
  onViewPermissions,
  colors,
}) => {
  const roleColor = ROLE_COLORS[role.name] || ROLE_COLORS.custom;
  const roleIcon = ROLE_ICONS[role.name] || ROLE_ICONS.custom;

  return (
    <Card
      style={{
        marginBottom: DESIGN_TOKENS.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: roleColor,
      }}
    >
      <VStack gap="md">
        {/* Header */}
        <HStack gap="md" align="center" justify="space-between">
          <HStack gap="md" align="center" style={{ flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${roleColor}20`,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name={roleIcon as any} size={24} color={roleColor} />
            </View>
            <VStack gap="xs" style={{ flex: 1 }}>
              <HStack gap="sm" align="center">
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  {role.display_name}
                </Text>
                {role.is_system && (
                  <View
                    style={{
                      backgroundColor: colors.primary + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: colors.primary,
                      }}
                    >
                      SYSTÈME
                    </Text>
                  </View>
                )}
              </HStack>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  color: colors.textSecondary,
                }}
                numberOfLines={2}
              >
                {role.description || 'Aucune description'}
              </Text>
            </VStack>
          </HStack>
        </HStack>

        {/* Stats */}
        <HStack gap="lg" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
          <VStack align="center">
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: roleColor,
              }}
            >
              {role.permissions?.length || 0}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
              }}
            >
              Permissions
            </Text>
          </VStack>
          <View
            style={{
              width: 1,
              height: 30,
              backgroundColor: colors.border,
            }}
          />
          <VStack align="center">
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {role.staff_count || 0}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
              }}
            >
              Membres
            </Text>
          </VStack>
          <View
            style={{
              width: 1,
              height: 30,
              backgroundColor: colors.border,
            }}
          />
          <VStack align="center">
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.textSecondary,
              }}
            >
              {role.scope || 'all'}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
              }}
            >
              Scope
            </Text>
          </VStack>
        </HStack>

        {/* Actions */}
        <HStack gap="sm" justify="flex-end">
          <TouchableOpacity
            onPress={() => onViewPermissions(role)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.sm,
            }}
          >
            <Ionicons name="list" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Voir
            </Text>
          </TouchableOpacity>

          {role.is_editable && (
            <TouchableOpacity
              onPress={() => onEdit(role)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.primary + '15',
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.primary }}>
                Modifier
              </Text>
            </TouchableOpacity>
          )}

          {!role.is_system && (
            <TouchableOpacity
              onPress={() => onDelete(role)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.error + '15',
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
              <Text style={{ fontSize: 13, color: colors.error }}>
                Supprimer
              </Text>
            </TouchableOpacity>
          )}
        </HStack>
      </VStack>
    </Card>
  );
};

const PermissionCategory: React.FC<PermissionCategoryProps> = ({
  category,
  permissions,
  selectedPermissions,
  onToggle,
  colors,
  disabled = false,
}) => {
  const allSelected = permissions.every((p) =>
    selectedPermissions.includes(p)
  );
  const someSelected =
    !allSelected && permissions.some((p) => selectedPermissions.includes(p));

  const toggleAll = () => {
    if (disabled) return;
    permissions.forEach((p) => {
      const isSelected = selectedPermissions.includes(p);
      if (allSelected && isSelected) {
        onToggle(p);
      } else if (!allSelected && !isSelected) {
        onToggle(p);
      }
    });
  };

  return (
    <VStack
      gap="sm"
      style={{
        backgroundColor: colors.backgroundSecondary,
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <TouchableOpacity onPress={toggleAll} disabled={disabled}>
        <HStack align="center" justify="space-between">
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.text,
            }}
          >
            {CATEGORY_LABELS[category] || category}
          </Text>
          <Ionicons
            name={
              allSelected
                ? 'checkbox'
                : someSelected
                ? 'remove-circle'
                : 'square-outline'
            }
            size={22}
            color={allSelected ? colors.success : colors.textSecondary}
          />
        </HStack>
      </TouchableOpacity>

      <VStack gap="xs">
        {permissions.map((permission) => {
          const isSelected = selectedPermissions.includes(permission);
          return (
            <TouchableOpacity
              key={permission}
              onPress={() => onToggle(permission)}
              disabled={disabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 8,
                backgroundColor: isSelected
                  ? colors.primary + '10'
                  : 'transparent',
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isSelected ? colors.primary : colors.textSecondary,
                }}
              >
                {getPermissionDisplayName(permission)}
              </Text>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isSelected ? colors.primary : colors.border}
              />
            </TouchableOpacity>
          );
        })}
      </VStack>
    </VStack>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function RolesManagementScreen({
  navigation,
}: RolesManagementScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Roles hook
  const {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles,
    systemRoles,
  } = useRoles();

  // Modal states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [] as string[],
    scope: 'all' as 'all' | 'team' | 'assigned',
  });
  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreateNew = useCallback(() => {
    setSelectedRole(null);
    setIsCreating(true);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      scope: 'all',
    });
    setIsEditModalVisible(true);
  }, []);

  const handleEdit = useCallback((role: Role) => {
    setSelectedRole(role);
    setIsCreating(false);
    setFormData({
      name: role.name,
      display_name: role.display_name || role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])],
      scope: role.scope || 'all',
    });
    setIsEditModalVisible(true);
  }, []);

  const handleViewPermissions = useCallback((role: Role) => {
    setSelectedRole(role);
    setIsViewModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (role: Role) => {
      Alert.alert(
        t('roles.confirmDelete.title'),
        t('roles.confirmDelete.message', { name: role.display_name || role.name, count: role.staff_count || 0 }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRole(role.id);
                Alert.alert(t('common.success'), t('roles.alerts.deleteSuccess'));
              } catch {
                Alert.alert(t('common.error'), t('roles.alerts.deleteError'));
              }
            },
          },
        ]
      );
    },
    [deleteRole, t]
  );

  const handleSave = useCallback(async () => {
    // Validation
    if (!formData.display_name.trim()) {
      Alert.alert(t('common.error'), t('roles.validation.nameRequired'));
      return;
    }
    if (isCreating && !formData.name.trim()) {
      Alert.alert(t('common.error'), t('roles.validation.slugRequired'));
      return;
    }
    if (formData.permissions.length === 0) {
      Alert.alert(t('common.error'), t('roles.validation.permissionsRequired'));
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createRole({
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions,
          scope: formData.scope,
        });
        Alert.alert(t('common.success'), t('roles.alerts.createSuccess'));
      } else if (selectedRole) {
        await updateRole(selectedRole.id, {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions,
          scope: formData.scope,
        });
        Alert.alert(t('common.success'), t('roles.alerts.updateSuccess'));
      }
      setIsEditModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), t('roles.alerts.genericError'));
    } finally {
      setIsSaving(false);
    }
  }, [formData, isCreating, selectedRole, createRole, updateRole, t]);

  const togglePermission = useCallback((permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <Screen>
        <VStack
          gap="md"
          align="center"
          justify="center"
          style={{ flex: 1, padding: DESIGN_TOKENS.spacing.xl }}
        >
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={{ color: colors.error, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refreshRoles}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: DESIGN_TOKENS.radius.md,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Réessayer</Text>
          </TouchableOpacity>
        </VStack>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <VStack
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <HStack align="center" justify="space-between">
          <HStack gap="md" align="center">
            {navigation && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.backgroundSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
            <VStack>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                Rôles & Permissions
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                {roles.length} rôles • {systemRoles.length} système
              </Text>
            </VStack>
          </HStack>

          <AdminOnly>
            <TouchableOpacity
              onPress={handleCreateNew}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Nouveau
              </Text>
            </TouchableOpacity>
          </AdminOnly>
        </HStack>
      </VStack>

      {/* Content */}
      {isLoading ? (
        <VStack align="center" justify="center" style={{ flex: 1 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            Chargement des rôles...
          </Text>
        </VStack>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
          }}
          renderItem={({ item }) => (
            <RoleCard
              role={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewPermissions={handleViewPermissions}
              colors={colors}
            />
          )}
          ListEmptyComponent={
            <VStack align="center" gap="md" style={{ paddingVertical: 40 }}>
              <Ionicons
                name="shield-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                Aucun rôle
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Créez votre premier rôle personnalisé
              </Text>
            </VStack>
          }
        />
      )}

      {/* Edit/Create Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
          }}
        >
          {/* Modal Header */}
          <HStack
            align="center"
            justify="space-between"
            style={{
              paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingBottom: DESIGN_TOKENS.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={{ color: colors.error, fontSize: 16 }}>
                Annuler
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {isCreating ? 'Nouveau rôle' : 'Modifier le rôle'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </HStack>

          {/* Modal Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {/* Name field (only for new roles) */}
            {isCreating && (
              <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  {t('roles.form.slugLabel')}
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder={t('roles.form.slugPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    padding: DESIGN_TOKENS.spacing.md,
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  {t('roles.form.slugHint')}
                </Text>
              </VStack>
            )}

            {/* Display name */}
            <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {t('roles.form.displayNameLabel')}
              </Text>
              <TextInput
                value={formData.display_name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, display_name: text }))
                }
                placeholder={t('roles.form.displayNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </VStack>

            {/* Description */}
            <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {t('roles.form.descriptionLabel')}
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
                placeholder={t('roles.form.descriptionPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                  fontSize: 16,
                  color: colors.text,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </VStack>

            {/* Scope */}
            <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {t('roles.form.scopeLabel')}
              </Text>
              <HStack gap="sm">
                {(['all', 'team', 'assigned'] as const).map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, scope }))
                    }
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      backgroundColor:
                        formData.scope === scope
                          ? colors.primary
                          : colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.sm,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor:
                        formData.scope === scope
                          ? colors.primary
                          : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          formData.scope === scope
                            ? '#fff'
                            : colors.textSecondary,
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {scope === 'all'
                        ? 'Tout'
                        : scope === 'team'
                        ? 'Équipe'
                        : 'Assigné'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </HStack>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {formData.scope === 'all'
                  ? 'Accès à toutes les ressources de l\'entreprise'
                  : formData.scope === 'team'
                  ? 'Accès limité aux ressources de son équipe'
                  : 'Accès limité aux ressources assignées directement'}
              </Text>
            </VStack>

            {/* Permissions */}
            <VStack gap="sm">
              <HStack align="center" justify="space-between">
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.text,
                  }}
                >
                  Permissions
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.primary,
                    fontWeight: '600',
                  }}
                >
                  {formData.permissions.length} / {AVAILABLE_PERMISSIONS.length}
                </Text>
              </HStack>

              {Object.entries(PERMISSION_CATEGORIES).map(
                ([category, permissions]) => (
                  <PermissionCategory
                    key={category}
                    category={category}
                    permissions={permissions}
                    selectedPermissions={formData.permissions}
                    onToggle={togglePermission}
                    colors={colors}
                    disabled={selectedRole?.name === 'owner'}
                  />
                )
              )}
            </VStack>
          </ScrollView>
        </View>
      </Modal>

      {/* View Permissions Modal */}
      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
          }}
        >
          {/* Modal Header */}
          <HStack
            align="center"
            justify="space-between"
            style={{
              paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingBottom: DESIGN_TOKENS.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ width: 60 }} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {selectedRole?.display_name}
            </Text>
            <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                Fermer
              </Text>
            </TouchableOpacity>
          </HStack>

          {/* Permissions List */}
          <ScrollView
            contentContainerStyle={{
              padding: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {selectedRole?.permissions?.includes('*') ? (
              <VStack
                align="center"
                gap="md"
                style={{
                  padding: DESIGN_TOKENS.spacing.xl,
                  backgroundColor: colors.primary + '10',
                  borderRadius: DESIGN_TOKENS.radius.lg,
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={48}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    textAlign: 'center',
                  }}
                >
                  Accès complet
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  Ce rôle a toutes les permissions
                </Text>
              </VStack>
            ) : (
              Object.entries(PERMISSION_CATEGORIES).map(
                ([category, permissions]) => {
                  const activePerms = permissions.filter((p) =>
                    selectedRole?.permissions?.includes(p)
                  );
                  if (activePerms.length === 0) return null;

                  return (
                    <PermissionCategory
                      key={category}
                      category={category}
                      permissions={activePerms}
                      selectedPermissions={selectedRole?.permissions || []}
                      onToggle={() => {}}
                      colors={colors}
                      disabled
                    />
                  );
                }
              )
            )}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

/**
 * TeamsManagementScreen - Gestion des équipes
 * Interface pour créer, modifier et supprimer les équipes de l'entreprise
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
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
import { PermissionGate } from '../../components/PermissionGate';
import { Screen } from '../../components/primitives/Screen';
import { HStack, VStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';

// Hooks & Utils
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useTeams } from '../../hooks/useTeams';
import { useStaff } from '../../hooks/useStaff';
import { Team } from '../../services/teamsService';

// ============================================================================
// Types
// ============================================================================

interface TeamsManagementScreenProps {
  navigation?: any;
}

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onViewMembers: (team: Team) => void;
  colors: any;
}

interface MemberSelectorProps {
  availableMembers: StaffMemberOption[];
  selectedMemberIds: number[];
  onToggle: (memberId: number) => void;
  colors: any;
}

interface StaffMemberOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TEAM_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const getTeamColor = (index: number): string => {
  return TEAM_COLORS[index % TEAM_COLORS.length];
};

// ============================================================================
// Sub-Components
// ============================================================================

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  onViewMembers,
  colors,
}) => {
  const teamColor = getTeamColor(team.id);

  return (
    <Card
      style={{
        marginBottom: DESIGN_TOKENS.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: teamColor,
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
                backgroundColor: `${teamColor}20`,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="people" size={24} color={teamColor} />
            </View>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {team.name}
              </Text>
              {team.description && (
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                    color: colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {team.description}
                </Text>
              )}
            </VStack>
          </HStack>

          {/* Actions */}
          <HStack gap="sm">
            <TouchableOpacity
              onPress={() => onViewMembers(team)}
              style={{
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <PermissionGate permission="teams.write">
              <TouchableOpacity
                onPress={() => onEdit(team)}
                style={{
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </PermissionGate>
            <PermissionGate permission="teams.write">
              <TouchableOpacity
                onPress={() => onDelete(team)}
                style={{
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: `${colors.error}15`,
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </PermissionGate>
          </HStack>
        </HStack>

        {/* Stats */}
        <HStack gap="lg" style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
          <HStack gap="xs" align="center">
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {team.member_count} membre{team.member_count > 1 ? 's' : ''}
            </Text>
          </HStack>
          {team.leader && (
            <HStack gap="xs" align="center">
              <Ionicons name="star-outline" size={16} color={colors.warning} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Chef: {team.leader.first_name} {team.leader.last_name}
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Members Preview */}
        {team.members.length > 0 && (
          <View style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
            <HStack gap="xs" style={{ flexWrap: 'wrap' }}>
              {team.members.slice(0, 5).map((member, index) => (
                <View
                  key={member.id}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: getTeamColor(index),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: index > 0 ? -8 : 0,
                    borderWidth: 2,
                    borderColor: colors.backgroundSecondary,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
                    {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                  </Text>
                </View>
              ))}
              {team.members.length > 5 && (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.backgroundSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: -8,
                    borderWidth: 2,
                    borderColor: colors.backgroundSecondary,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>
                    +{team.members.length - 5}
                  </Text>
                </View>
              )}
            </HStack>
          </View>
        )}
      </VStack>
    </Card>
  );
};

const MemberSelector: React.FC<MemberSelectorProps> = ({
  availableMembers,
  selectedMemberIds,
  onToggle,
  colors,
}) => {
  return (
    <VStack gap="sm">
      {availableMembers.map((member) => {
        const isSelected = selectedMemberIds.includes(member.id);
        return (
          <TouchableOpacity
            key={member.id}
            onPress={() => onToggle(member.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: DESIGN_TOKENS.spacing.md,
              backgroundColor: isSelected ? `${colors.primary}15` : colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: isSelected ? 1 : 0,
              borderColor: colors.primary,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? '#fff' : colors.text,
                }}
              >
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </Text>
            </View>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {member.email}
              </Text>
            </VStack>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
      {availableMembers.length === 0 && (
        <Text style={{ textAlign: 'center', color: colors.textSecondary, padding: DESIGN_TOKENS.spacing.lg }}>
          Aucun membre disponible
        </Text>
      )}
    </VStack>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const TeamsManagementScreen: React.FC<TeamsManagementScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Hooks
  const {
    teams,
    isLoading,
    error,
    loadTeams,
    refreshTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getMemberName,
  } = useTeams();

  const { staff, refreshStaff } = useStaff();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLeaderId, setFormLeaderId] = useState<number | null>(null);
  const [formMemberIds, setFormMemberIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadTeams();
    refreshStaff();
  }, [loadTeams, refreshStaff]);

  // Convert staff to member options
  const staffMemberOptions: StaffMemberOption[] = staff.map((s) => ({
    id: parseInt(s.id.toString(), 10),
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    role: s.role,
  }));

  // Filter teams by search
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setFormName('');
    setFormDescription('');
    setFormLeaderId(null);
    setFormMemberIds([]);
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback((team: Team) => {
    setSelectedTeam(team);
    setFormName(team.name);
    setFormDescription(team.description || '');
    setFormLeaderId(team.leader_id);
    setFormMemberIds(team.members.map((m) => m.id));
    setShowEditModal(true);
  }, []);

  const handleOpenView = useCallback((team: Team) => {
    setSelectedTeam(team);
    setShowViewModal(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedTeam(null);
    resetForm();
  }, [resetForm]);

  const handleToggleMember = useCallback((memberId: number) => {
    setFormMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const handleCreate = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'équipe est requis');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createTeam({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        leader_id: formLeaderId || undefined,
        member_ids: formMemberIds.length > 0 ? formMemberIds : undefined,
      });

      if (result) {
        Alert.alert('Succès', 'Équipe créée avec succès');
        handleCloseModals();
      } else {
        Alert.alert('Erreur', 'Impossible de créer l\'équipe');
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSaving(false);
    }
  }, [formName, formDescription, formLeaderId, formMemberIds, createTeam, handleCloseModals]);

  const handleUpdate = useCallback(async () => {
    if (!selectedTeam) return;
    if (!formName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'équipe est requis');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateTeam(selectedTeam.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        leader_id: formLeaderId,
        member_ids: formMemberIds,
      });

      if (result) {
        Alert.alert('Succès', 'Équipe mise à jour avec succès');
        handleCloseModals();
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour l\'équipe');
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTeam, formName, formDescription, formLeaderId, formMemberIds, updateTeam, handleCloseModals]);

  const handleDelete = useCallback((team: Team) => {
    Alert.alert(
      'Supprimer l\'équipe',
      `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTeam(team.id);
            if (success) {
              Alert.alert('Succès', 'Équipe supprimée avec succès');
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer l\'équipe');
            }
          },
        },
      ]
    );
  }, [deleteTeam]);

  // ---------------------------------------------------------------------------
  // Render Functions
  // ---------------------------------------------------------------------------

  const renderTeamCard = useCallback(
    ({ item }: { item: Team }) => (
      <TeamCard
        team={item}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onViewMembers={handleOpenView}
        colors={colors}
      />
    ),
    [colors, handleOpenEdit, handleDelete, handleOpenView]
  );

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: DESIGN_TOKENS.spacing.xxl,
      }}
    >
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
          color: colors.textSecondary,
          marginTop: DESIGN_TOKENS.spacing.md,
          textAlign: 'center',
        }}
      >
        {searchQuery ? 'Aucune équipe trouvée' : 'Aucune équipe créée'}
      </Text>
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.body.fontSize,
          color: colors.textSecondary,
          marginTop: DESIGN_TOKENS.spacing.sm,
          textAlign: 'center',
          paddingHorizontal: DESIGN_TOKENS.spacing.xl,
        }}
      >
        {searchQuery
          ? 'Essayez de modifier votre recherche'
          : 'Créez votre première équipe pour organiser vos déménageurs'}
      </Text>
    </View>
  );

  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseModals}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={handleCloseModals}>
            <Text style={{ fontSize: 16, color: colors.primary }}>Annuler</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
            {isEdit ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
          </Text>
          <TouchableOpacity
            onPress={isEdit ? handleUpdate : handleCreate}
            disabled={isSaving || !formName.trim()}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  color: formName.trim() ? colors.primary : colors.textSecondary,
                  fontWeight: '600',
                }}
              >
                {isEdit ? 'Enregistrer' : 'Créer'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
        >
          {/* Name */}
          <VStack gap="sm" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
              {"Nom de l'équipe *"}
            </Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="Ex: Équipe Paris Nord"
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.text,
              }}
            />
          </VStack>

          {/* Description */}
          <VStack gap="sm" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
              Description (optionnel)
            </Text>
            <TextInput
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Description de l'équipe..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </VStack>

          {/* Leader Selection */}
          <VStack gap="sm" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
              {"Chef d'équipe (optionnel)"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -DESIGN_TOKENS.spacing.lg }}
              contentContainerStyle={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg }}
            >
              <TouchableOpacity
                onPress={() => setFormLeaderId(null)}
                style={{
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.xl,
                  backgroundColor: formLeaderId === null ? colors.primary : colors.backgroundSecondary,
                  marginRight: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: formLeaderId === null ? '#fff' : colors.text,
                  }}
                >
                  Aucun
                </Text>
              </TouchableOpacity>
              {staffMemberOptions.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => setFormLeaderId(member.id)}
                  style={{
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.xl,
                    backgroundColor: formLeaderId === member.id ? colors.primary : colors.backgroundSecondary,
                    marginRight: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: formLeaderId === member.id ? '#fff' : colors.text,
                    }}
                  >
                    {member.firstName} {member.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </VStack>

          {/* Members Selection */}
          <VStack gap="sm">
            <HStack justify="space-between" align="center">
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                {"Membres de l'équipe"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {formMemberIds.length} sélectionné{formMemberIds.length > 1 ? 's' : ''}
              </Text>
            </HStack>
            <MemberSelector
              availableMembers={staffMemberOptions}
              selectedMemberIds={formMemberIds}
              onToggle={handleToggleMember}
              colors={colors}
            />
          </VStack>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderViewModal = () => (
    <Modal
      visible={showViewModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseModals}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ width: 60 }} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
            {selectedTeam?.name || 'Équipe'}
          </Text>
          <TouchableOpacity onPress={handleCloseModals}>
            <Text style={{ fontSize: 16, color: colors.primary }}>Fermer</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
        >
          {selectedTeam && (
            <VStack gap="lg">
              {/* Team Info */}
              <Card>
                <VStack gap="md">
                  <HStack gap="md" align="center">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: `${getTeamColor(selectedTeam.id)}20`,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons
                        name="people"
                        size={28}
                        color={getTeamColor(selectedTeam.id)}
                      />
                    </View>
                    <VStack gap="xs" style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '600',
                          color: colors.text,
                        }}
                      >
                        {selectedTeam.name}
                      </Text>
                      {selectedTeam.description && (
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {selectedTeam.description}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  {/* Stats */}
                  <HStack gap="lg">
                    <VStack gap="xs" align="center" style={{ flex: 1 }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                        {selectedTeam.member_count}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Membres
                      </Text>
                    </VStack>
                    <View style={{ width: 1, backgroundColor: colors.border }} />
                    <VStack gap="xs" align="center" style={{ flex: 1 }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.warning }}>
                        {selectedTeam.leader ? '1' : '0'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Chef
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Card>

              {/* Leader */}
              {selectedTeam.leader && (
                <VStack gap="sm">
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {"Chef d'équipe"}
                  </Text>
                  <Card>
                    <HStack gap="md" align="center">
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: colors.warning,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="star" size={24} color="#fff" />
                      </View>
                      <VStack gap="xs" style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                          {getMemberName(selectedTeam.leader)}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {selectedTeam.leader.email}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>
                </VStack>
              )}

              {/* Members */}
              <VStack gap="sm">
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  Membres ({selectedTeam.members.length})
                </Text>
                {selectedTeam.members.length > 0 ? (
                  selectedTeam.members.map((member) => (
                    <Card key={member.id}>
                      <HStack gap="md" align="center">
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </Text>
                        </View>
                        <VStack gap="xs" style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                            {getMemberName(member)}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {member.email}
                          </Text>
                        </VStack>
                        {member.role === 'leader' && (
                          <View
                            style={{
                              paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                              paddingVertical: 2,
                              backgroundColor: `${colors.warning}20`,
                              borderRadius: DESIGN_TOKENS.radius.sm,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: colors.warning, fontWeight: '600' }}>
                              CHEF
                            </Text>
                          </View>
                        )}
                      </HStack>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Text style={{ textAlign: 'center', color: colors.textSecondary }}>
                      Aucun membre dans cette équipe
                    </Text>
                  </Card>
                )}
              </VStack>

              {/* Created date */}
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: DESIGN_TOKENS.spacing.md,
                }}
              >
                Créée le {new Date(selectedTeam.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </VStack>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <HStack justify="space-between" align="center">
            <HStack gap="md" align="center">
              {navigation?.canGoBack() && (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
              <VStack gap="xs">
                <Text
                  style={{
                    fontSize: DESIGN_TOKENS.typography.title.fontSize,
                    fontWeight: '700',
                    color: colors.text,
                  }}
                >
                  Équipes
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {teams.length} équipe{teams.length > 1 ? 's' : ''}
                </Text>
              </VStack>
            </HStack>

            <PermissionGate permission="teams.write">
              <TouchableOpacity
                onPress={handleOpenCreate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  gap: DESIGN_TOKENS.spacing.xs,
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Nouvelle</Text>
              </TouchableOpacity>
            </PermissionGate>
          </HStack>

          {/* Search */}
          <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher une équipe..."
                placeholderTextColor={colors.textSecondary}
                style={{
                  flex: 1,
                  paddingVertical: DESIGN_TOKENS.spacing.md,
                  paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                  fontSize: 16,
                  color: colors.text,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        {isLoading && teams.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: DESIGN_TOKENS.spacing.md, color: colors.textSecondary }}>
              Chargement des équipes...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text
              style={{
                fontSize: 16,
                color: colors.error,
                textAlign: 'center',
                marginTop: DESIGN_TOKENS.spacing.md,
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => loadTeams()}
              style={{
                marginTop: DESIGN_TOKENS.spacing.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.primary,
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredTeams}
            renderItem={renderTeamCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              padding: DESIGN_TOKENS.spacing.lg,
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
            }}
            ListEmptyComponent={renderEmptyState}
            refreshing={isLoading}
            onRefresh={refreshTeams}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Modals */}
        {renderFormModal(false)}
        {renderFormModal(true)}
        {renderViewModal()}
      </View>
    </Screen>
  );
};

export default TeamsManagementScreen;

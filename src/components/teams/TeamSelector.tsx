/**
 * TeamSelector Component
 * Sélecteur d'équipe avec recherche et affichage des membres
 * Phase 2 - STAFF-02
 * 
 * @example
 * <TeamSelector
 *   selectedTeamId={job.team_id}
 *   onSelect={(team) => updateJob({ team_id: team.id })}
 * />
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useTeams } from '../../hooks/useTeams';
import { Team } from '../../services/teamsService';

// ============================================================================
// Types
// ============================================================================

export interface TeamSelectorProps {
  /** Currently selected team ID */
  selectedTeamId?: number | null;
  /** Callback when a team is selected */
  onSelect: (team: Team | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Allow deselection (clear selection) */
  allowClear?: boolean;
  /** Disable the selector */
  disabled?: boolean;
  /** Show member count in list */
  showMemberCount?: boolean;
  /** Filter to only active teams */
  activeOnly?: boolean;
  /** Custom label */
  label?: string;
  /** Error message */
  error?: string;
}

// ============================================================================
// Component
// ============================================================================

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeamId,
  onSelect,
  placeholder = 'Sélectionner une équipe',
  allowClear = true,
  disabled = false,
  showMemberCount = true,
  activeOnly = true,
  label,
  error,
}) => {
  const { colors } = useTheme();
  const { teams, isLoading, getTeamColor, isTeamActive } = useTeams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected team
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    return teams.find(t => t.id === selectedTeamId) ?? null;
  }, [selectedTeamId, teams]);

  // Filter teams
  const filteredTeams = useMemo(() => {
    let result = teams;
    
    if (activeOnly) {
      result = result.filter(isTeamActive);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [teams, searchQuery, activeOnly, isTeamActive]);

  // Handlers
  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setSearchQuery('');
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback((team: Team) => {
    onSelect(team);
    handleClose();
  }, [onSelect, handleClose]);

  const handleClear = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderSelectedValue = () => {
    if (!selectedTeam) {
      return (
        <Text style={[styles.placeholder, { color: colors.textMuted }]}>
          {placeholder}
        </Text>
      );
    }

    return (
      <View style={styles.selectedTeam}>
        <View 
          style={[
            styles.teamColorDot, 
            { backgroundColor: getTeamColor(selectedTeam) }
          ]} 
        />
        <Text style={[styles.selectedTeamName, { color: colors.text }]}>
          {selectedTeam.name}
        </Text>
        {showMemberCount && (
          <Text style={[styles.memberCount, { color: colors.textMuted }]}>
            ({selectedTeam.member_count})
          </Text>
        )}
      </View>
    );
  };

  const renderTeamItem = ({ item }: { item: Team }) => {
    const isSelected = item.id === selectedTeamId;
    
    return (
      <TouchableOpacity
        style={[
          styles.teamItem,
          { backgroundColor: isSelected ? colors.primaryLight : colors.backgroundSecondary },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.teamItemContent}>
          <View 
            style={[
              styles.teamColorDot, 
              { backgroundColor: getTeamColor(item) }
            ]} 
          />
          <View style={styles.teamInfo}>
            <Text style={[styles.teamName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.description && (
              <Text 
                style={[styles.teamDescription, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.teamItemRight}>
          {showMemberCount && (
            <View style={[styles.memberBadge, { backgroundColor: colors.background }]}>
              <Ionicons name="people-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.memberBadgeText, { color: colors.textMuted }]}>
                {item.member_count}
              </Text>
            </View>
          )}
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selector,
          { 
            backgroundColor: colors.backgroundSecondary,
            borderColor: error ? colors.error : colors.border,
          },
          disabled && styles.selectorDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {renderSelectedValue()}
        
        <View style={styles.selectorRight}>
          {selectedTeam && allowClear && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colors.textMuted} 
          />
        </View>
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      {/* Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner une équipe
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredTeams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {searchQuery ? 'Aucune équipe trouvée' : 'Aucune équipe disponible'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTeams}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTeamItem}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  clearButton: {
    padding: 2,
  },
  placeholder: {
    fontSize: 14,
  },
  selectedTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedTeamName: {
    fontSize: 14,
    fontWeight: '500',
  },
  memberCount: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DESIGN_TOKENS.spacing.lg,
    marginVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  teamItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  teamItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: 2,
    borderRadius: DESIGN_TOKENS.radius.sm,
    gap: 4,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: DESIGN_TOKENS.spacing.xs,
  },
});

export default TeamSelector;

/**
 * StaffCrewScreen - Gestion complète du personnel
 * Affiche les employés et prestataires avec possibilité d'ajout
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import AddStaffModal from '../../components/modals/AddStaffModal'
import EditStaffModal from '../../components/modals/EditStaffModal'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useStaff } from '../../hooks/useStaff'
import { useTranslation } from '../../localization/useLocalization'
import { Contractor, Employee, StaffMember } from '../../types/staff'

export default function StaffCrewScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const {
    staff,
    employees,
    contractors,
    isLoading,
    error,
    totalActive,
    totalEmployees,
    totalContractors,
    totalTeams,
    averageEmployeeRate,
    refreshStaff,
    inviteEmployee,
    searchContractor,
    addContractor,
    updateStaff,
    removeStaff,
    inviteContractor,
  } = useStaff()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'employee' | 'contractor'>('all')

  useEffect(() => {
    refreshStaff()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshStaff()
    setIsRefreshing(false)
  }

  const handleAddStaff = () => {
    setIsModalVisible(true)
  }

  const handleRemoveStaff = (member: StaffMember) => {
    Alert.alert(
      t('staff.alerts.removeConfirm.title'),
      t('staff.alerts.removeConfirm.message', { memberName: `${member.firstName} ${member.lastName}` }),
      [
        { text: t('staff.actions.cancel'), style: 'cancel' },
        {
          text: t('staff.actions.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStaff(member.id)
              Alert.alert('Succès', `${member.firstName} ${member.lastName} a été supprimé`)
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer ce membre')
            }
          },
        },
      ]
    )
  }

  const handleEditStaff = (member: StaffMember) => {
    setSelectedMember(member)
    setIsEditModalVisible(true)
  }

  const handleSaveStaff = async (staffId: string, updateData: Partial<StaffMember>) => {
    await updateStaff(staffId, updateData)
  }

  const filteredStaff = staff.filter((member) => {
    if (filterType === 'all') return true
    return member.type === filterType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981'
      case 'inactive':
        return '#6B7280'
      case 'pending':
        return '#F59E0B'
      default:
        return colors.textSecondary
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('staff.status.active')
      case 'inactive':
        return t('staff.status.inactive')
      case 'pending':
        return t('staff.status.pending')
      default:
        return status
    }
  }

  const getTypeLabel = (type: 'employee' | 'contractor') => {
    return type === 'employee' ? t('staff.types.employee') : t('staff.types.contractor')
  }

  const getTypeIcon = (type: 'employee' | 'contractor') => {
    return type === 'employee' ? 'person' : 'briefcase'
  }

  if (isLoading && staff.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text testID="loading-text" style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('staff.titles.loading')}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header avec stats */}
        <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
          <Text testID="screen-title" style={[styles.title, { color: colors.text }]}>
            {t('staff.titles.main')}
          </Text>
          <Text testID="screen-subtitle" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('staff.titles.subtitle')}
          </Text>

          {/* Stats rapides */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text testID="stat-active-value" style={[styles.statValue, { color: colors.text }]}>
                {totalActive}
              </Text>
              <Text testID="stat-active-label" style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('staff.stats.active')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="person" size={24} color="#10B981" />
              <Text testID="stat-employees-value" style={[styles.statValue, { color: colors.text }]}>
                {totalEmployees}
              </Text>
              <Text testID="stat-employees-label" style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('staff.stats.employees')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={24} color="#8B5CF6" />
              <Text testID="stat-contractors-value" style={[styles.statValue, { color: colors.text }]}>
                {totalContractors}
              </Text>
              <Text testID="stat-contractors-label" style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('staff.stats.contractors')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={24} color="#F59E0B" />
              <Text testID="stat-avgrate-value" style={[styles.statValue, { color: colors.text }]}>
                ${averageEmployeeRate.toFixed(0)}
              </Text>
              <Text testID="stat-avgrate-label" style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('staff.stats.averageRate')}
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton Ajouter un membre */}
        <Pressable
          testID="add-staff-button"
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddStaff}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t('staff.actions.add')}</Text>
        </Pressable>

        {/* Filtres */}
        <View style={styles.filterContainer}>
          <Pressable
            testID="filter-all"
            style={[
              styles.filterButton,
              { backgroundColor: colors.backgroundSecondary },
              filterType === 'all' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: colors.text },
                filterType === 'all' && { color: '#FFFFFF' },
              ]}
            >
              {t('staff.filters.all')} ({staff.length})
            </Text>
          </Pressable>
          <Pressable
            testID="filter-employee"
            style={[
              styles.filterButton,
              { backgroundColor: colors.backgroundSecondary },
              filterType === 'employee' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterType('employee')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: colors.text },
                filterType === 'employee' && { color: '#FFFFFF' },
              ]}
            >
              {t('staff.filters.employees')} ({totalEmployees})
            </Text>
          </Pressable>
          <Pressable
            testID="filter-contractor"
            style={[
              styles.filterButton,
              { backgroundColor: colors.backgroundSecondary },
              filterType === 'contractor' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterType('contractor')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: colors.text },
                filterType === 'contractor' && { color: '#FFFFFF' },
              ]}
            >
              {t('staff.filters.contractors')} ({totalContractors})
            </Text>
          </Pressable>
        </View>

        {/* Message d'erreur */}
        {error && (
          <View testID="error-message" style={[styles.errorContainer, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Liste du personnel */}
        {filteredStaff.length === 0 ? (
          <View testID="empty-state" style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text testID="empty-text" style={[styles.emptyText, { color: colors.text }]}>
              {t('staff.empty.title')}
            </Text>
            <Text testID="empty-subtext" style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {t('staff.empty.subtitle')}
            </Text>
          </View>
        ) : (
          <View style={styles.staffList}>
            {filteredStaff.map((member) => (
              <View
                key={member.id}
                testID={`staff-card-${member.id}`}
                style={[styles.staffCard, { backgroundColor: colors.backgroundSecondary }]}
              >
                {/* En-tête de la carte */}
                <View style={styles.staffCardHeader}>
                  <View style={styles.staffCardHeaderLeft}>
                    <View
                      style={[
                        styles.staffTypeIcon,
                        {
                          backgroundColor:
                            member.type === 'employee' ? '#10B98120' : '#8B5CF620',
                        },
                      ]}
                    >
                      <Ionicons
                        name={getTypeIcon(member.type)}
                        size={20}
                        color={member.type === 'employee' ? '#10B981' : '#8B5CF6'}
                      />
                    </View>
                    <View>
                      <Text testID={`staff-name-${member.id}`} style={[styles.staffName, { color: colors.text }]}>
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text testID={`staff-type-${member.id}`} style={[styles.staffType, { color: colors.textSecondary }]}>
                        {getTypeLabel(member.type)}
                      </Text>
                    </View>
                  </View>
                  <View
                    testID={`staff-status-${member.id}`}
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(member.status)}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                      {getStatusLabel(member.status)}
                    </Text>
                  </View>
                </View>

                {/* Informations */}
                <View style={styles.staffInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {member.role}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {member.team}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {member.email}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      {member.phone}
                    </Text>
                  </View>

                  {/* Informations spécifiques selon le type */}
                  {member.type === 'employee' ? (
                    <>
                      <View style={styles.infoRow}>
                        <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                          ${(member as Employee).hourlyRate}/h
                        </Text>
                      </View>
                      {(member as Employee).tfn && (
                        <View style={styles.infoRow}>
                          <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            TFN: {(member as Employee).tfn}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.infoRow}>
                        <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                          ${(member as Contractor).rate}
                          {(member as Contractor).rateType === 'hourly' && '/h'}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                          ABN: {(member as Contractor).abn}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="ribbon-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                          Status: {(member as Contractor).contractStatus}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.staffActions}>
                  <Pressable
                    testID={`edit-button-${member.id}`}
                    style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleEditStaff(member)}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                      {t('staff.actions.edit')}
                    </Text>
                  </Pressable>
                  <Pressable
                    testID={`remove-button-${member.id}`}
                    style={[styles.actionButton, { backgroundColor: '#DC262620' }]}
                    onPress={() => handleRemoveStaff(member)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                      {t('staff.actions.remove')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal d'ajout */}
      <AddStaffModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onInviteEmployee={inviteEmployee}
        onSearchContractor={searchContractor}
        onAddContractor={addContractor}
        onInviteContractor={inviteContractor}
      />

      {/* Modal d'édition */}
      <EditStaffModal
        visible={isEditModalVisible}
        member={selectedMember}
        onClose={() => {
          setIsEditModalVisible(false)
          setSelectedMember(null)
        }}
        onSave={handleSaveStaff}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontSize: 16,
  },
  header: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  filterButton: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.xl * 2,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  staffList: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  staffCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  staffCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  staffTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  staffType: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: 4,
    borderRadius: DESIGN_TOKENS.radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  staffInfo: {
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  staffActions: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
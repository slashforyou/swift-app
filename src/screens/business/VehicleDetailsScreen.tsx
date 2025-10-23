/**
 * VehicleDetailsScreen - Page détaillée d'un véhicule
 * Affichage complet des informations avec historique et actions
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import EditVehicleModal, { VehicleEditData } from '../../components/modals/EditVehicleModal'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useVehicleDetails } from '../../hooks/useVehicles'
import { VehicleAPI } from '../../services/vehiclesService'

// =====================================
// HELPER FUNCTIONS - Type Mapping
// =====================================

/**
 * Convert API vehicle type to UI type
 */
const apiToUIType = (apiType: VehicleAPI['type']): Vehicle['type'] => {
  const mapping: Record<VehicleAPI['type'], Vehicle['type']> = {
    'truck': 'moving-truck',
    'van': 'van',
    'trailer': 'trailer',
    'ute': 'ute',
    'dolly': 'dolly',
    'tool': 'tools',
  }
  return mapping[apiType] || 'moving-truck'
}

/**
 * Convert API vehicle to UI vehicle format
 */
const apiToVehicle = (api: VehicleAPI): Vehicle => ({
  id: api.id,
  name: `${api.make} ${api.model}`,
  type: apiToUIType(api.type),
  registration: api.registration,
  make: api.make,
  model: api.model,
  year: api.year,
  status: api.status,
  nextService: api.nextService,
  location: api.location,
  capacity: api.capacity || '',
  assignedTo: api.assignedStaff || '',
  mileage: 0, // TODO: Add to API
  purchaseDate: '', // TODO: Add to API
  lastService: '', // TODO: Add to API
})

// Types
interface Vehicle {
  id: string
  name: string
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
  registration: string
  make: string
  model: string
  year: number
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service'
  nextService: string
  location: string
  capacity?: string
  assignedTo?: string
  mileage?: number
  purchaseDate?: string
  lastService?: string
}

interface MaintenanceRecord {
  id: string
  date: string
  type: 'routine' | 'repair' | 'inspection' | 'emergency'
  description: string
  cost: number
  performedBy: string
}

interface VehicleDetailsScreenProps {
  // Option 1: Pass vehicleId to use hook
  vehicleId?: string
  // Option 2: Pass vehicle object directly (legacy mode)
  vehicle?: Vehicle
  onBack: () => void
  onUpdate?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

export default function VehicleDetailsScreen({
  vehicleId,
  vehicle: vehicleProp,
  onBack,
  onUpdate,
  onDelete,
}: VehicleDetailsScreenProps) {
  const { colors } = useTheme()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)

  // Use hook if vehicleId is provided
  const {
    vehicle: apiVehicle,
    maintenanceHistory: apiMaintenanceHistory,
    isLoading,
    error,
    updateVehicle: updateVehicleApi,
    addMaintenanceRecord,
    refetch,
  } = useVehicleDetails(vehicleId || '')

  // Determine which vehicle to use (hook or prop)
  const vehicle = vehicleId && apiVehicle 
    ? apiToVehicle(apiVehicle)
    : vehicleProp

  // Use API maintenance history if available, otherwise use empty array
  const maintenanceHistory = vehicleId && apiMaintenanceHistory.length > 0
    ? apiMaintenanceHistory
    : []

  const getTypeEmoji = (type: Vehicle['type']): string => {
    const emojis = {
      'moving-truck': '🚛',
      'van': '🚐',
      'trailer': '🚜',
      'ute': '🛻',
      'dolly': '🛒',
      'tools': '🔧',
    }
    return emojis[type] || '🚛'
  }

  const getTypeLabel = (type: Vehicle['type']): string => {
    const labels = {
      'moving-truck': 'Moving Truck',
      'van': 'Van',
      'trailer': 'Trailer',
      'ute': 'Ute',
      'dolly': 'Dolly',
      'tools': 'Tools/Equipment',
    }
    return labels[type] || 'Vehicle'
  }

  const getStatusColor = (status: Vehicle['status']): { bg: string; text: string } => {
    const colors = {
      available: { bg: '#10B981', text: '#10B981' },
      'in-use': { bg: '#F59E0B', text: '#F59E0B' },
      maintenance: { bg: '#EF4444', text: '#EF4444' },
      'out-of-service': { bg: '#6B7280', text: '#6B7280' },
    }
    return colors[status] || colors['out-of-service']
  }

  const getStatusLabel = (status: Vehicle['status']): string => {
    const labels = {
      available: 'Available',
      'in-use': 'In Use',
      maintenance: 'Maintenance',
      'out-of-service': 'Out of Service',
    }
    return labels[status] || 'Unknown'
  }

  const getMaintenanceTypeIcon = (type: MaintenanceRecord['type']): string => {
    const icons = {
      routine: 'checkmark-circle',
      repair: 'build',
      inspection: 'eye',
      emergency: 'alert-circle',
    }
    return icons[type] || 'document'
  }

  const getMaintenanceTypeColor = (type: MaintenanceRecord['type']): string => {
    const colors = {
      routine: '#10B981',
      repair: '#EF4444',
      inspection: '#F59E0B',
      emergency: '#DC2626',
    }
    return colors[type] || '#6B7280'
  }

  const handleUpdateVehicle = async (data: VehicleEditData) => {
    if (!vehicle) return
    
    // If using hook (vehicleId provided), use API
    if (vehicleId && updateVehicleApi) {
      try {
        const result = await updateVehicleApi({
          make: data.make,
          model: data.model,
          year: data.year,
          registration: data.registration,
          capacity: data.capacity,
          nextService: data.nextService,
          location: data.location,
        })
        
        if (result) {
          setIsEditModalVisible(false)
          Alert.alert('Success', 'Vehicle updated successfully! 🎉')
          await refetch() // Refresh data
        } else {
          Alert.alert('Error', error || 'Unable to update vehicle')
        }
      } catch (err) {
        console.error('Error updating vehicle:', err)
        Alert.alert('Error', 'An error occurred while updating the vehicle')
      }
    } else if (onUpdate) {
      // Legacy mode: use callback
      const updatedVehicle: Vehicle = {
        ...vehicle,
        make: data.make,
        model: data.model,
        year: data.year,
        registration: data.registration,
        capacity: data.capacity,
        nextService: data.nextService,
        location: data.location,
        name: `${data.make} ${data.model}`,
      }
      onUpdate(updatedVehicle)
      setIsEditModalVisible(false)
    }
  }

  const handleDelete = () => {
    if (!vehicle || !onDelete) return
    
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(vehicle),
        },
      ]
    )
  }

  const handleChangeStatus = () => {
    if (!vehicle || !onUpdate) return
    
    Alert.alert(
      'Change Status',
      'Select new status',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Available',
          onPress: () => onUpdate({ ...vehicle, status: 'available' }),
        },
        {
          text: 'In Use',
          onPress: () => onUpdate({ ...vehicle, status: 'in-use' }),
        },
        {
          text: 'Maintenance',
          onPress: () => onUpdate({ ...vehicle, status: 'maintenance' }),
        },
        {
          text: 'Out of Service',
          onPress: () => onUpdate({ ...vehicle, status: 'out-of-service' }),
        },
      ]
    )
  }

  const handleScheduleService = () => {
    Alert.alert('Schedule Service', 'This feature will be available soon')
  }

  const handleAssignStaff = () => {
    Alert.alert('Assign Staff', 'This feature will be available soon')
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading vehicle details...</Text>
      </View>
    )
  }

  // Error state
  if (error && !vehicle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Error loading vehicle</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <Pressable
          onPress={refetch}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  // No vehicle found
  if (!vehicle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🚛</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Vehicle not found</Text>
      </View>
    )
  }

  const statusColors = getStatusColor(vehicle.status)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Vehicle Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Card */}
        <View style={[styles.vehicleCard, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.vehicleHeader}>
            <View style={[styles.vehicleIcon, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.vehicleEmoji}>{getTypeEmoji(vehicle.type)}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleName, { color: colors.text }]}>
                {vehicle.name}
              </Text>
              <Text style={[styles.vehicleType, { color: colors.textSecondary }]}>
                {getTypeLabel(vehicle.type)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {getStatusLabel(vehicle.status)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Vehicle Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Registration
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.registration}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Year
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.year}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Make
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.make}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="car-sport-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Model
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.model}
                  </Text>
                </View>
              </View>
            </View>

            {vehicle.capacity && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Capacity
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {vehicle.capacity}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Location
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.location}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="build-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Next Service
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {vehicle.nextService}
                  </Text>
                </View>
              </View>
            </View>

            {vehicle.assignedTo && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Assigned To
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.primary }]}>
                      {vehicle.assignedTo}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <Pressable
              style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleChangeStatus}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Change Status
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleScheduleService}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Schedule Service
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleAssignStaff}
            >
              <Ionicons name="people-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Assign Staff
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {/* Maintenance History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Maintenance History
          </Text>
          <View style={styles.maintenanceList}>
            {maintenanceHistory.map((record) => (
              <View
                key={record.id}
                style={[
                  styles.maintenanceCard,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <View style={styles.maintenanceHeader}>
                  <View style={styles.maintenanceLeft}>
                    <Ionicons
                      name={getMaintenanceTypeIcon(record.type) as any}
                      size={24}
                      color={getMaintenanceTypeColor(record.type)}
                    />
                    <View>
                      <Text style={[styles.maintenanceDescription, { color: colors.text }]}>
                        {record.description}
                      </Text>
                      <Text style={[styles.maintenanceDate, { color: colors.textSecondary }]}>
                        {record.date} • {record.performedBy}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.maintenanceCost, { color: colors.text }]}>
                    ${record.cost}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditVehicleModal
        visible={isEditModalVisible}
        vehicle={
          vehicle
            ? {
                id: vehicle.id,
                type: vehicle.type,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                registration: vehicle.registration,
                capacity: vehicle.capacity || '',
                nextService: vehicle.nextService,
                location: vehicle.location,
              }
            : null
        }
        onClose={() => setIsEditModalVisible(false)}
        onUpdateVehicle={handleUpdateVehicle}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DESIGN_TOKENS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: DESIGN_TOKENS.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  vehicleCard: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleEmoji: {
    fontSize: 30,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vehicleType: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: DESIGN_TOKENS.spacing.lg,
  },
  detailsGrid: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  actionCard: {
    width: '48%',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  maintenanceList: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  maintenanceCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceLeft: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
    flex: 1,
  },
  maintenanceDescription: {
    fontSize: 14,
    fontWeight: '600',
  },
  maintenanceDate: {
    fontSize: 12,
    marginTop: 2,
  },
  maintenanceCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})

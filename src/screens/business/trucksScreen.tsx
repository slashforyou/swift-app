/**
 * TrucksScreen - Gestion complète de la flotte de véhicules
 * Interface moderne avec statistiques, filtres et actions
 */
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

// Components
import AddVehicleModal from '../../components/modals/AddVehicleModal'
import { HStack, VStack } from '../../components/primitives/Stack'
import { Card } from '../../components/ui/Card'

// Hooks & Utils
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useVehicles } from '../../hooks/useVehicles'
import { VehicleAPI } from '../../services/vehiclesService'

// Types
interface Vehicle {
  id: string;
  name: string;
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools';
  registration: string;
  make: string;
  model: string;
  year: number;
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  nextService: string;
  location: string;
  capacity?: string;
  assignedTo?: string;
}

interface SectionHeaderProps {
  icon: string;
  title: string;
  description?: string;
  onActionPress?: () => void;
  actionText?: string;
}

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
 * Convert UI vehicle type to API type
 */
const uiToAPIType = (uiType: Vehicle['type']): VehicleAPI['type'] => {
  const mapping: Record<Vehicle['type'], VehicleAPI['type']> = {
    'moving-truck': 'truck',
    'van': 'van',
    'trailer': 'trailer',
    'ute': 'ute',
    'dolly': 'dolly',
    'tools': 'tool',
  }
  return mapping[uiType] || 'truck'
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
})

// Composant pour les headers de section
const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  icon, 
  title, 
  description, 
  onActionPress, 
  actionText 
}) => {
  const { colors } = useTheme();
  return (
    <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
      <HStack gap="sm" align="center" justify="space-between">
        <HStack gap="sm" align="center" style={{ flex: 1 }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, color: colors.primary }}>
              {icon}
            </Text>
          </View>
          <Text testID="section-title" style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: colors.text,
            flex: 1
          }}>
            {title}
          </Text>
        </HStack>
        {onActionPress && actionText && (
          <TouchableOpacity
            testID="add-vehicle-button"
            onPress={onActionPress}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              borderRadius: DESIGN_TOKENS.radius.sm,
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontSize: 14, 
              fontWeight: '600' 
            }}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </HStack>
      {description && (
        <Text testID="section-description" style={{
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
          marginLeft: 44, // Aligné avec le texte du titre
        }}>
          {description}
        </Text>
      )}
    </VStack>
  );
};

// Fonction pour obtenir l'emoji selon le type de véhicule de déménagement
const getVehicleEmoji = (type: Vehicle['type']): string => {
  const emojis = {
    'moving-truck': '🚛',
    'van': '🚐',
    'trailer': '🚜',
    'ute': '🛻',
    'dolly': '🛒',
    'tools': '🔧'
  };
  return emojis[type] || '🚛';
};

// Fonction pour obtenir le label du type
const getTypeLabel = (type: Vehicle['type']): string => {
  const labels = {
    'moving-truck': 'Moving Truck',
    'van': 'Van',
    'trailer': 'Trailer',
    'ute': 'Ute',
    'dolly': 'Dolly',
    'tools': 'Tools'
  };
  return labels[type] || 'Vehicle';
};

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = (status: Vehicle['status']): { bg: string; text: string } => {
  const colors = {
    available: { bg: '#10B981', text: '#10B981' },
    'in-use': { bg: '#F59E0B', text: '#F59E0B' },
    maintenance: { bg: '#EF4444', text: '#EF4444' },
    'out-of-service': { bg: '#6B7280', text: '#6B7280' }
  };
  return colors[status] || colors['out-of-service'];
};

// Fonction pour obtenir le label du statut
const getStatusLabel = (status: Vehicle['status']): string => {
  const labels = {
    available: 'Available',
    'in-use': 'In Use',
    maintenance: 'Maintenance',
    'out-of-service': 'Out of Service'
  };
  return labels[status] || 'Unknown';
};

// Composant pour une carte véhicule
const VehicleCard: React.FC<{ 
  vehicle: Vehicle; 
  onPress: () => void;
  onEdit: (vehicle: Vehicle, event?: any) => void;
  onDelete: (vehicle: Vehicle, event?: any) => void;
}> = ({ 
  vehicle, 
  onPress,
  onEdit,
  onDelete
}) => {
  const { colors } = useTheme();
  const statusColors = getStatusColor(vehicle.status);
  
  return (
    <TouchableOpacity testID={`vehicle-card-${vehicle.id}`} onPress={onPress}>
      <Card style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
        <VStack gap="sm">
          <HStack gap="md" align="center" justify="space-between">
            <HStack gap="md" align="center" style={{ flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '10',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text testID={`vehicle-emoji-${vehicle.id}`} style={{ fontSize: 20 }}>
                  {getVehicleEmoji(vehicle.type)}
                </Text>
              </View>
              <VStack gap="xs" style={{ flex: 1 }}>
                <Text testID={`vehicle-name-${vehicle.id}`} style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                }}>
                  {vehicle.name}
                </Text>
                <Text testID={`vehicle-details-${vehicle.id}`} style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                }}>
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </Text>
              </VStack>
            </HStack>
            <View testID={`vehicle-status-${vehicle.id}`} style={{
              backgroundColor: statusColors.bg + '20',
              paddingHorizontal: DESIGN_TOKENS.spacing.sm,
              paddingVertical: DESIGN_TOKENS.spacing.xs,
              borderRadius: DESIGN_TOKENS.radius.sm,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: statusColors.text,
                textTransform: 'capitalize',
              }}>
                {vehicle.status.replace('-', ' ')}
              </Text>
            </View>
          </HStack>
          
          <HStack gap="lg" style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500',
              }}>
                Registration
              </Text>
              <Text testID={`vehicle-registration-${vehicle.id}`} style={{
                fontSize: 14,
                color: colors.text,
              }}>
                {vehicle.registration}
              </Text>
            </VStack>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500',
              }}>
                Next Service
              </Text>
              <Text testID={`vehicle-service-${vehicle.id}`} style={{
                fontSize: 14,
                color: colors.text,
              }}>
                {vehicle.nextService}
              </Text>
            </VStack>
          </HStack>
          
          {vehicle.assignedTo && (
            <HStack gap="md" style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              <Text style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500',
              }}>
                Assigned to:
              </Text>
              <Text testID={`vehicle-assigned-${vehicle.id}`} style={{
                fontSize: 14,
                color: colors.primary,
                fontWeight: '600',
              }}>
                {vehicle.assignedTo}
              </Text>
            </HStack>
          )}

          {/* Actions buttons */}
          <HStack gap="sm" style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
            <TouchableOpacity
              testID={`vehicle-edit-button-${vehicle.id}`}
              onPress={(e) => onEdit(vehicle, e)}
              style={{
                flex: 1,
                backgroundColor: colors.primary + '10',
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.sm,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: colors.primary,
                fontWeight: '600',
                fontSize: 14,
              }}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`vehicle-delete-button-${vehicle.id}`}
              onPress={(e) => onDelete(vehicle, e)}
              style={{
                flex: 1,
                backgroundColor: '#FF3B3020',
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.sm,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#FF3B30',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Delete
              </Text>
            </TouchableOpacity>
          </HStack>
        </VStack>
      </Card>
    </TouchableOpacity>
  );
};

/**
 * Vehicles & Equipment Management Screen
 * Displays and manages company vehicles, equipment and maintenance
 */
export default function TrucksScreen() {
  const { colors } = useTheme()

  // Hook pour la gestion des véhicules via API
  const {
    vehicles: apiVehicles,
    isLoading: isLoadingVehicles,
    error: vehiclesError,
    totalVehicles,
    availableCount,
    inUseCount,
    maintenanceCount,
    refetch,
    addVehicle: addVehicleApi,
    editVehicle: editVehicleApi,
    removeVehicle: removeVehicleApi,
  } = useVehicles()

  // Convert API vehicles to UI format
  const mockVehicles = apiVehicles.map(apiToVehicle)

  // État local pour la gestion
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const styles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
    },
    quickStats: {
      flexDirection: 'row',
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    statCard: {
      flex: 1,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    typeFilterContainer: {
      flexDirection: 'row',
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    typeFilter: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      marginRight: DESIGN_TOKENS.spacing.sm,
      borderWidth: 1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: DESIGN_TOKENS.spacing.sm,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  })

  // Filtres et données
  const vehicleTypes = ['all', 'moving-truck', 'van', 'trailer', 'ute', 'dolly', 'tools'];
  const filteredVehicles = selectedType === 'all' 
    ? mockVehicles 
    : mockVehicles.filter(vehicle => vehicle.type === selectedType);

  // Utiliser les statistiques du hook API
  const availableVehicles = availableCount;
  const inUseVehicles = inUseCount;
  const maintenanceVehicles = maintenanceCount;

  const handleAddVehicle = () => {
    setIsAddModalVisible(true);
  };

  const handleSubmitVehicle = async (vehicleData: any) => {
    try {
      // Convert UI type to API type before sending
      const apiType = uiToAPIType(vehicleData.type)
      
      const result = await addVehicleApi({
        ...vehicleData,
        type: apiType,
      })
      
      if (result) {
        setIsAddModalVisible(false);
        Alert.alert('Success', 'Vehicle added successfully! 🎉')
        await refetch() // Refresh the list
      } else {
        Alert.alert('Error', vehiclesError || 'Unable to add vehicle')
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      Alert.alert('Error', 'An error occurred while adding the vehicle')
    }
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    // TODO: Ouvrir détails du véhicule
    console.log('View vehicle details:', vehicle.id);
  };

  const handleEditVehicle = (vehicle: Vehicle, event?: any) => {
    // Empêcher la propagation au parent TouchableOpacity
    event?.stopPropagation?.();
    
    Alert.alert(
      'Modifier le véhicule',
      `Modification de ${vehicle.name}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteVehicle = (vehicle: Vehicle, event?: any) => {
    // Empêcher la propagation au parent TouchableOpacity
    event?.stopPropagation?.();
    
    Alert.alert(
      'Supprimer le véhicule',
      `Êtes-vous sûr de vouloir supprimer ${vehicle.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeVehicleApi(vehicle.id);
              // Le hook useVehicles mettra automatiquement à jour la liste
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le véhicule');
            }
          }
        }
      ]
    );
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  // Loading state
  if (isLoadingVehicles) {
    return (
      <View testID="loading-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text testID="loading-text" style={{ marginTop: 16, color: colors.textSecondary }}>Loading vehicles...</Text>
      </View>
    )
  }

  // Error state
  if (vehiclesError && mockVehicles.length === 0) {
    return (
      <View testID="error-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text testID="error-title" style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Error loading vehicles</Text>
        <Text testID="error-message" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>{vehiclesError}</Text>
        <TouchableOpacity
          testID="retry-button"
          onPress={refetch}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Statistiques rapides */}
      <View style={styles.quickStats}>
        <Card style={styles.statCard}>
          <Text testID="stat-available-value" style={styles.statNumber}>{availableVehicles}</Text>
          <Text testID="stat-available-label" style={styles.statLabel}>Available</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text testID="stat-inuse-value" style={styles.statNumber}>{inUseVehicles}</Text>
          <Text testID="stat-inuse-label" style={styles.statLabel}>In Use</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text testID="stat-maintenance-value" style={styles.statNumber}>{maintenanceVehicles}</Text>
          <Text testID="stat-maintenance-label" style={styles.statLabel}>Maintenance</Text>
        </Card>
      </View>

      {/* Filtres par type */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}
      >
        <View style={styles.typeFilterContainer}>
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type}
              testID={`filter-type-${type}`}
              style={[
                styles.typeFilter,
                {
                  backgroundColor: selectedType === type ? colors.primary + '20' : 'transparent',
                  borderColor: selectedType === type ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleTypeFilter(type)}
            >
              <Text style={{
                color: selectedType === type ? colors.primary : colors.textSecondary,
                fontWeight: selectedType === type ? '600' : '400',
                fontSize: 14,
              }}>
                {type === 'all' ? 'All Vehicles' : `${getVehicleEmoji(type as Vehicle['type'])} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Liste des véhicules */}
      <Card style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <VStack gap="sm">
          <SectionHeader 
            icon="🚛" 
            title="Vehicles & Equipment"
            description="Manage your fleet, equipment and maintenance schedules"
            actionText="Add Vehicle"
            onActionPress={handleAddVehicle}
          />
          
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => handleVehiclePress(vehicle)}
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
              />
            ))
          ) : (
            <View testID="empty-state" style={styles.emptyState}>
              <Text testID="empty-state-icon" style={styles.emptyIcon}>🚗</Text>
              <Text testID="empty-state-title" style={[styles.emptyTitle, { color: colors.text }]}>
                No vehicles found
              </Text>
              <Text testID="empty-state-message" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                Try adjusting your filters or add a new vehicle to get started
              </Text>
            </View>
          )}
        </VStack>
      </Card>

      {/* Modal d'ajout de véhicule */}
      <AddVehicleModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddVehicle={handleSubmitVehicle}
      />
    </ScrollView>
  )
}
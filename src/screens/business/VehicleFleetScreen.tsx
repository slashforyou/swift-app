/**
 * VehicleFleetScreen - Écran de gestion de la flotte de véhicules
 * Spécialisé pour les entreprises de déménagement
 */
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Components
import { HStack, VStack } from '../../components/primitives/Stack';

// Constants & Utils
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useBusinessVehicles, type BusinessVehicle } from '../../hooks/business';

/**
 * Composant principal - Écran de gestion de flotte
 */
const VehicleFleetScreen: React.FC = () => {
  const { colors } = useTheme();
  
  // Hook business vehicles
  const {
    vehicles,
    isLoading,
    isCreating,
    error,
    createVehicle,
    refreshVehicles,
    getVehicleStats
  } = useBusinessVehicles();

  // États locaux
  const [selectedFilter, setSelectedFilter] = useState<BusinessVehicle['status'] | 'all'>('all');

  // Gestion d'erreurs
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Ajout d'un véhicule
  const handleAddVehicle = useCallback(async () => {
    // Données exemple pour test
    const vehicleData = {
      name: `Vehicle ${vehicles.length + 1}`,
      type: 'moving-truck' as const,
      registration: `REG${vehicles.length + 1}`,
      make: 'Test Make',
      model: 'Test Model',
      year: '2023',
      nextService: '2024-12-31',
      location: 'Sydney Depot',
      capacity: '5m³'
    };
    
    const vehicle = await createVehicle(vehicleData);
    if (vehicle) {
      Alert.alert('Success', 'Vehicle added successfully');
    }
  }, [createVehicle, vehicles.length]);

  // Rafraîchissement
  const onRefresh = useCallback(async () => {
    await refreshVehicles();
  }, [refreshVehicles]);

  // Filtrage des véhicules
  const filteredVehicles = selectedFilter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === selectedFilter);

  // Stats des véhicules
  const vehicleStats = getVehicleStats();
  
  // Calcul des stats corrigées pour l'affichage
  const displayStats = {
    total: vehicleStats.total,
    available: vehicles.filter(v => v.status === 'available').length,
    inUse: vehicles.filter(v => v.status === 'in-use').length,
    maintenance: vehicleStats.maintenance,
    outOfService: vehicles.filter(v => v.status === 'out-of-service').length,
  };

  /**
   * Composant de filtres
   */
  const renderFilters = () => {
    const filters: Array<{key: BusinessVehicle['status'] | 'all', label: string}> = [
      { key: 'all', label: 'All' },
      { key: 'available', label: 'Available' },
      { key: 'in-use', label: 'In Use' },
      { key: 'maintenance', label: 'Maintenance' },
      { key: 'out-of-service', label: 'Out of Service' }
    ];

    return (
      <HStack style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedFilter === filter.key 
                  ? colors.primary 
                  : colors.backgroundSecondary 
              }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              { 
                color: selectedFilter === filter.key 
                  ? colors.background
                  : colors.text 
              }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </HStack>
    );
  };

  /**
   * Composant de stats
   */
  const renderStats = () => (
    <VStack style={styles.statsContainer}>
      <HStack style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {displayStats.total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Total Vehicles
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {displayStats.available}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Available
          </Text>
        </View>
      </HStack>

      <HStack style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>
            {displayStats.maintenance}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Maintenance
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statNumber, { color: colors.textSecondary }]}>
            {displayStats.outOfService}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Out of Service
          </Text>
        </View>
      </HStack>
    </VStack>
  );

  /**
   * Composant de véhicule
   */
  const renderVehicle = (vehicle: BusinessVehicle) => {
    const statusColorMap: Record<string, string> = {
      'available': colors.success,
      'in-use': colors.info, 
      'maintenance': colors.warning,
      'out-of-service': colors.textSecondary
    };
    const statusColor = statusColorMap[vehicle.status] || colors.textSecondary;

    return (
      <View key={vehicle.id} style={[styles.vehicleCard, { backgroundColor: colors.backgroundSecondary }]}>
        <HStack style={styles.vehicleHeader}>
          <VStack style={styles.vehicleInfo}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={[styles.vehiclePlate, { color: colors.textSecondary }]}>
              {vehicle.registration}
            </Text>
          </VStack>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {vehicle.status.toUpperCase()}
            </Text>
          </View>
        </HStack>

        <VStack style={styles.vehicleDetails}>
          <HStack style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Year:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {vehicle.year}
            </Text>
          </HStack>

          <HStack style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Capacity:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {vehicle.capacity || 'N/A'}
            </Text>
          </HStack>

          <HStack style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Next Service:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {vehicle.nextService ? new Date(vehicle.nextService).toLocaleDateString() : 'N/A'}
            </Text>
          </HStack>
        </VStack>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading vehicles...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec bouton d'ajout */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Vehicle Fleet
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddVehicle}
          disabled={isCreating}
        >
          <Text style={[styles.addButtonText, { color: colors.background }]}>
            {isCreating ? 'Adding...' : '+ Add Vehicle'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Stats */}
        {renderStats()}

        {/* Filtres */}
        {renderFilters()}

        {/* Liste des véhicules */}
        <VStack style={styles.vehiclesList}>
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map(renderVehicle)
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {selectedFilter === 'all' 
                  ? 'No vehicles found. Add your first vehicle to get started.'
                  : `No ${selectedFilter} vehicles found.`
                }
              </Text>
            </View>
          )}
        </VStack>
      </ScrollView>
    </View>
  );
};

/**
 * Styles du composant
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  statsContainer: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  statsRow: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: DESIGN_TOKENS.spacing.xs,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  filtersContainer: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: DESIGN_TOKENS.spacing.xs,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  vehiclesList: {
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  vehicleCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: 8,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  vehicleHeader: {
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  vehiclePlate: {
    fontSize: 14,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleDetails: {},
  detailRow: {
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VehicleFleetScreen;
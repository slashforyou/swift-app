/**
 * TrucksScreen - Gestion complète de la flotte de véhicules
 * Interface moderne avec statistiques, filtres et actions
 */
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Components
import AddVehicleModal from "../../components/modals/AddVehicleModal";
import { HStack, VStack } from "../../components/primitives/Stack";
import VehicleDetailsScreen from "./VehicleDetailsScreen";

// Hooks & Utils
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useVehicles as useVehiclesContext } from "../../context/VehiclesProvider";
import { useVehicles, type VehicleAPI } from "../../hooks/useVehicles";
import { useTranslation } from "../../localization/useLocalization";

// Types
interface Vehicle {
  id: string;
  name: string;
  type: "moving-truck" | "van" | "trailer" | "ute" | "dolly" | "tools";
  registration: string;
  make: string;
  model: string;
  year: number;
  status: "available" | "in-use" | "maintenance" | "out-of-service";
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
const apiToUIType = (apiType: VehicleAPI["type"]): Vehicle["type"] => {
  const mapping: Record<VehicleAPI["type"], Vehicle["type"]> = {
    truck: "moving-truck",
    van: "van",
    trailer: "trailer",
    ute: "ute",
    dolly: "dolly",
    tool: "tools",
  };
  return mapping[apiType] || "moving-truck";
};

/**
 * Convert UI vehicle type to API type
 */
const uiToAPIType = (uiType: Vehicle["type"]): VehicleAPI["type"] => {
  const mapping: Record<Vehicle["type"], VehicleAPI["type"]> = {
    "moving-truck": "truck",
    van: "van",
    trailer: "trailer",
    ute: "ute",
    dolly: "dolly",
    tools: "tool",
  };
  return mapping[uiType] || "truck";
};

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
  capacity: api.capacity || "",
  assignedTo: api.assignedStaff || "",
});

// Composant pour les headers de section
const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  onActionPress,
  actionText,
}) => {
  const { colors } = useTheme();
  return (
    <VStack gap="xs" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
      <HStack gap="sm" align="center" justify="space-between">
        <HStack gap="sm" align="center" style={{ flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: colors.primary }}>{icon}</Text>
          </View>
          <Text
            testID="section-title"
            style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: "600",
              color: colors.text,
              flex: 1,
            }}
          >
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
            <Text
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </HStack>
      {description && (
        <Text
          testID="section-description"
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
            marginLeft: 44, // Aligné avec le texte du titre
          }}
        >
          {description}
        </Text>
      )}
    </VStack>
  );
};

// Fonction pour obtenir l'emoji selon le type de véhicule de déménagement
const getVehicleEmoji = (type: Vehicle["type"]): string => {
  const emojis = {
    "moving-truck": "🚛",
    van: "🚐",
    trailer: "🚜",
    ute: "🛻",
    dolly: "🛒",
    tools: "🔧",
  };
  return emojis[type] || "🚛";
};

// Fonction pour obtenir le label du type
const getTypeLabel = (type: Vehicle["type"]): string => {
  const labels = {
    "moving-truck": "Moving Truck",
    van: "Van",
    trailer: "Trailer",
    ute: "Ute",
    dolly: "Dolly",
    tools: "Tools",
  };
  return labels[type] || "Vehicle";
};

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = (
  status: Vehicle["status"],
  themeColors: any,
): { bg: string; text: string } => {
  const statusColors = {
    available: { bg: themeColors.success, text: themeColors.success },
    "in-use": { bg: themeColors.warning, text: themeColors.warning },
    maintenance: { bg: themeColors.error, text: themeColors.error },
    "out-of-service": {
      bg: themeColors.textSecondary,
      text: themeColors.textSecondary,
    },
  };
  return statusColors[status] || statusColors["out-of-service"];
};

// Fonction pour obtenir le label du statut
const getStatusLabel = (status: Vehicle["status"]): string => {
  const labels = {
    available: "Available",
    "in-use": "In Use",
    maintenance: "Maintenance",
    "out-of-service": "Out of Service",
  };
  return labels[status] || "Unknown";
};

// Composant pour une carte véhicule
const VehicleCard: React.FC<{
  vehicle: Vehicle;
  onPress: () => void;
  onEdit: (vehicle: Vehicle, event?: any) => void;
  onDelete: (vehicle: Vehicle, event?: any) => void;
}> = ({ vehicle, onPress, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const statusColors = getStatusColor(vehicle.status, colors);

  return (
    <TouchableOpacity testID={`vehicle-card-${vehicle.id}`} onPress={onPress}>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}>
        <VStack gap="sm">
          <HStack gap="md" align="center" justify="space-between">
            <HStack gap="md" align="center" style={{ flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary + "10",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  testID={`vehicle-emoji-${vehicle.id}`}
                  style={{ fontSize: 20 }}
                >
                  {getVehicleEmoji(vehicle.type)}
                </Text>
              </View>
              <VStack gap="xs" style={{ flex: 1 }}>
                <Text
                  testID={`vehicle-name-${vehicle.id}`}
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {vehicle.name}
                </Text>
                <Text
                  testID={`vehicle-details-${vehicle.id}`}
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </Text>
              </VStack>
            </HStack>
            <View
              testID={`vehicle-status-${vehicle.id}`}
              style={{
                backgroundColor: statusColors.bg + "20",
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                paddingVertical: DESIGN_TOKENS.spacing.xs,
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: statusColors.text,
                  textTransform: "capitalize",
                }}
              >
                {vehicle.status.replace("-", " ")}
              </Text>
            </View>
          </HStack>

          <HStack gap="lg" style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Registration
              </Text>
              <Text
                testID={`vehicle-registration-${vehicle.id}`}
                style={{
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {vehicle.registration}
              </Text>
            </VStack>
            <VStack gap="xs" style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Next Service
              </Text>
              <Text
                testID={`vehicle-service-${vehicle.id}`}
                style={{
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {vehicle.nextService}
              </Text>
            </VStack>
          </HStack>

          {vehicle.assignedTo && (
            <HStack gap="md" style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Assigned to:
              </Text>
              <Text
                testID={`vehicle-assigned-${vehicle.id}`}
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
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
                backgroundColor: colors.primary + "10",
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`vehicle-delete-button-${vehicle.id}`}
              onPress={(e) => onDelete(vehicle, e)}
              style={{
                flex: 1,
                backgroundColor: colors.error + "20",
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.error,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </HStack>
        </VStack>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Vehicles & Equipment Management Screen
 * Displays and manages company vehicles, equipment and maintenance
 */
export default function TrucksScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Context pour la gestion d'état des véhicules
  const {
    vehicles: contextVehicles,
    addVehicle: addVehicleToContext,
    updateVehicle: updateVehicleInContext,
    deleteVehicle: deleteVehicleFromContext,
  } = useVehiclesContext();

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
  } = useVehicles();

  // Utiliser les véhicules du context pour le state local
  const mockVehicles = contextVehicles.map((v) => ({
    id: v.id,
    name: `${v.make} ${v.model}`,
    type: v.type,
    registration: v.registration,
    make: v.make,
    model: v.model,
    year: v.year,
    status: v.status,
    nextService: v.nextService || "",
    location: v.location || "",
    capacity: v.capacity,
  }));

  // État local pour la gestion
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const styles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
    },
    quickStats: {
      flexDirection: "row",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    statCard: {
      flex: 1,
      marginHorizontal: DESIGN_TOKENS.spacing.xs,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    typeFilterContainer: {
      flexDirection: "row",
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
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      textAlign: "center",
    },
    emptyMessage: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
  });

  // Filtres et données
  const vehicleTypes = [
    "all",
    "moving-truck",
    "van",
    "trailer",
    "ute",
    "dolly",
    "tools",
  ];
  const vehicleStatuses = [
    "all",
    "available",
    "in-use",
    "maintenance",
    "out-of-service",
  ];

  // Fonction helper pour compter les véhicules par type
  const getVehicleCountByType = (type: string) => {
    if (type === "all") return mockVehicles.length;
    return mockVehicles.filter((v) => v.type === type).length;
  };

  // Filtrage combiné (type + status)
  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const typeMatch = selectedType === "all" || vehicle.type === selectedType;
    const statusMatch =
      selectedStatus === "all" || vehicle.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  // Calculer les statistiques directement depuis mockVehicles (context)
  const availableVehicles = mockVehicles.filter(
    (v) => v.status === "available",
  ).length;
  const inUseVehicles = mockVehicles.filter(
    (v) => v.status === "in-use",
  ).length;
  const maintenanceVehicles = mockVehicles.filter(
    (v) => v.status === "maintenance",
  ).length;

  const handleAddVehicle = () => {
    setIsAddModalVisible(true);
  };

  const handleSubmitVehicle = async (vehicleData: any) => {
    try {
      await addVehicleToContext({
        type: vehicleData.type,
        make: vehicleData.make,
        model: vehicleData.model,
        year: parseInt(vehicleData.year) || new Date().getFullYear(),
        registration: vehicleData.registration,
        status: "available",
        capacity: vehicleData.capacity,
        location: vehicleData.location,
        nextService: vehicleData.nextService,
      });

      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      Alert.alert(
        t("vehicles.alerts.addError.title"),
        t("vehicles.alerts.addError.message"),
      );
    }
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleEditVehicle = (vehicle: Vehicle, event?: any) => {
    event?.stopPropagation?.();

    Alert.alert(
      t("vehicles.actions.edit"),
      t("vehicles.alerts.editConfirm.message", { vehicleName: vehicle.name }),
      [{ text: t("common.ok") }],
    );
  };

  const handleDeleteVehicle = (vehicle: Vehicle, event?: any) => {
    // Empêcher la propagation au parent TouchableOpacity
    event?.stopPropagation?.();

    Alert.alert(
      t("vehicles.actions.delete"),
      t("vehicles.alerts.deleteConfirm.message", { vehicleName: vehicle.name }),
      [
        { text: t("vehicles.actions.cancel"), style: "cancel" },
        {
          text: t("vehicles.actions.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVehicleFromContext(vehicle.id);
              Alert.alert(
                t("vehicles.alerts.deleteSuccess.title"),
                t("vehicles.alerts.deleteSuccess.message"),
              );
            } catch (error) {
              Alert.alert(
                t("vehicles.alerts.deleteError.title"),
                t("vehicles.alerts.deleteError.message"),
              );
            }
          },
        },
      ],
    );
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
  };

  return (
    <ScrollView
      testID="business-fleet-screen"
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Statistiques rapides */}
      <View style={styles.quickStats}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.md }]}>
          <Text testID="stat-available-value" style={styles.statNumber}>
            {availableVehicles}
          </Text>
          <Text testID="stat-available-label" style={styles.statLabel}>
            Available
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.md }]}>
          <Text testID="stat-inuse-value" style={styles.statNumber}>
            {inUseVehicles}
          </Text>
          <Text testID="stat-inuse-label" style={styles.statLabel}>
            In Use
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.md }]}>
          <Text testID="stat-maintenance-value" style={styles.statNumber}>
            {maintenanceVehicles}
          </Text>
          <Text testID="stat-maintenance-label" style={styles.statLabel}>
            Maintenance
          </Text>
        </View>
      </View>

      {/* Filtres par status */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeFilterContainer}>
            {vehicleStatuses.map((status) => {
              const displayName =
                status === "all"
                  ? "All"
                  : status === "in-use"
                    ? "In Use"
                    : status === "out-of-service"
                      ? "Out of Service"
                      : status.charAt(0).toUpperCase() + status.slice(1);

              return (
                <TouchableOpacity
                  key={status}
                  testID={`filter-status-${status}`}
                  style={[
                    styles.typeFilter,
                    {
                      backgroundColor:
                        selectedStatus === status
                          ? colors.primary + "20"
                          : "transparent",
                      borderColor:
                        selectedStatus === status
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => handleStatusFilter(status)}
                >
                  <Text
                    style={{
                      color:
                        selectedStatus === status
                          ? colors.primary
                          : colors.textSecondary,
                      fontWeight: selectedStatus === status ? "600" : "400",
                      fontSize: 14,
                    }}
                  >
                    {displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Liste des véhicules */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
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
              <Text testID="empty-state-icon" style={styles.emptyIcon}>
                🚗
              </Text>
              <Text
                testID="empty-state-title"
                style={[styles.emptyTitle, { color: colors.text }]}
              >
                No vehicles found
              </Text>
              <Text
                testID="empty-state-message"
                style={[styles.emptyMessage, { color: colors.textSecondary }]}
              >
                Try adjusting your filters or add a new vehicle to get started
              </Text>
            </View>
          )}
        </VStack>
      </View>

      {/* Modal d'ajout de véhicule */}
      <AddVehicleModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddVehicle={handleSubmitVehicle}
      />

      {/* Écran de détails du véhicule */}
      {selectedVehicle && (
        <View style={StyleSheet.absoluteFill}>
          <VehicleDetailsScreen
            vehicleId={selectedVehicle.id}
            vehicle={selectedVehicle}
            onBack={() => setSelectedVehicle(null)}
            onUpdate={(updatedVehicle) => {
              // Mettre à jour le véhicule si nécessaire
              refetch();
              setSelectedVehicle(null);
            }}
            onDelete={() => {
              deleteVehicleFromContext(selectedVehicle!.id);
              refetch();
              setSelectedVehicle(null);
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

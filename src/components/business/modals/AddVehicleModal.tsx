/**
 * AddVehicleModal - Modal pour ajouter un nouveau véhicule/équipement
 * Spécialisé pour le secteur du déménagement australien
 */
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Components
import { HStack, VStack } from '../../primitives/Stack';

// Hooks & Utils
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';

// Types
interface Vehicle {
  name: string;
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools';
  registration: string;
  make: string;
  model: string;
  year: string;
  nextService: string;
  location: string;
}

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (vehicle: Vehicle) => void;
}

// Données de référence pour le déménagement
const VEHICLE_TYPES = [
  { id: 'moving-truck', label: 'Moving Truck', emoji: '🚛', description: 'Large capacity moving truck' },
  { id: 'van', label: 'Van', emoji: '🚐', description: 'Delivery and small moves' },
  { id: 'trailer', label: 'Trailer', emoji: '🚜', description: 'Furniture and equipment trailer' },
  { id: 'ute', label: 'Ute', emoji: '🛻', description: 'Pickup utility vehicle' },
  { id: 'dolly', label: 'Dolly', emoji: '🛒', description: 'Moving dollies and equipment' },
  { id: 'tools', label: 'Tools', emoji: '🔧', description: 'Moving tools and equipment' },
] as const;

const VEHICLE_MAKES = [
  'Isuzu', 'Ford', 'Toyota', 'Mitsubishi', 'Hino', 'Mercedes-Benz', 'Iveco', 'Custom'
];

const LOCATIONS = [
  'Main Depot - Sydney',
  'North Shore Depot',
  'Western Sydney Depot', 
  'Interstate Hub',
  'Service Center',
  'On Route',
  'Client Site'
];

// Validation registration australienne (format ABC-123 ou ABC123)
const validateRegistration = (registration: string): boolean => {
  const regRegex = /^[A-Z]{2,3}-?\d{2,4}$/i;
  return regRegex.test(registration.replace(/\s/g, ''));
};

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  
  // État du formulaire
  const [formData, setFormData] = useState<Vehicle>({
    name: '',
    type: 'moving-truck',
    registration: '',
    make: VEHICLE_MAKES[0],
    model: '',
    year: new Date().getFullYear().toString(),
    nextService: '',
    location: LOCATIONS[0],
  });

  // États pour les erreurs
  const [errors, setErrors] = useState<Partial<Vehicle>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Styles
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg,
      width: '90%',
      maxHeight: '85%',
      paddingVertical: DESIGN_TOKENS.spacing.xl,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    header: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    formGroup: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    requiredStar: {
      color: colors.error || '#EF4444',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    inputError: {
      borderColor: colors.error || '#EF4444',
    },
    errorText: {
      fontSize: 12,
      color: colors.error || '#EF4444',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    typeCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      alignItems: 'center',
      minWidth: 120,
    },
    selectedTypeCard: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    typeEmoji: {
      fontSize: 24,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    selectedTypeLabel: {
      color: colors.primary,
    },
    typeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    makeButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    selectedMakeButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    makeButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedMakeButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
    locationButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    selectedLocationButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    locationButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedLocationButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.xl,
    },
    button: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.textSecondary + '20',
      borderWidth: 1,
      borderColor: colors.textSecondary + '40',
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    submitButtonText: {
      color: 'white',
    },
    disabledButton: {
      backgroundColor: colors.textSecondary + '40',
    },
    helpText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontStyle: 'italic',
    },
  });

  // Mise à jour des données du formulaire
  const updateFormData = (field: keyof Vehicle, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Génération automatique du nom basé sur le type et le modèle
  const generateVehicleName = (type: string, make: string, model: string) => {
    const typeLabels = {
      'moving-truck': 'Moving Truck',
      'van': 'Delivery Van',
      'trailer': 'Trailer',
      'ute': 'Pickup Ute',
      'dolly': 'Moving Dolly',
      'tools': 'Equipment'
    };
    
    if (make && model) {
      return `${typeLabels[type as keyof typeof typeLabels]} - ${make} ${model}`;
    } else if (make) {
      return `${typeLabels[type as keyof typeof typeLabels]} - ${make}`;
    } else {
      return typeLabels[type as keyof typeof typeLabels] || type;
    }
  };

  // Mise à jour automatique du nom quand type/make/model changent
  const updateVehicleType = (newType: any) => {
    const newName = generateVehicleName(newType, formData.make, formData.model);
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      name: newName
    }));
    
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: undefined }));
    }
  };

  const updateMake = (newMake: string) => {
    const newName = generateVehicleName(formData.type, newMake, formData.model);
    setFormData(prev => ({ 
      ...prev, 
      make: newMake,
      name: newName
    }));
  };

  const updateModel = (newModel: string) => {
    const newName = generateVehicleName(formData.type, formData.make, newModel);
    setFormData(prev => ({ 
      ...prev, 
      model: newModel,
      name: newName
    }));
    
    if (errors.model) {
      setErrors(prev => ({ ...prev, model: undefined }));
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<Vehicle> = {};

    // Champs requis
    if (!formData.registration.trim()) {
      newErrors.registration = 'Registration is required';
    } else if (!validateRegistration(formData.registration)) {
      newErrors.registration = 'Invalid Australian registration format (e.g., ABC-123)';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    const currentYear = new Date().getFullYear();
    const year = parseInt(formData.year);
    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      newErrors.year = `Year must be between 1990 and ${currentYear + 1}`;
    }

    if (!formData.nextService.trim()) {
      newErrors.nextService = 'Next service date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Formatage des données avant soumission
      const vehicleData = {
        ...formData,
        registration: formData.registration.toUpperCase().replace(/\s/g, ''),
        year: formData.year,
      };

      await onSubmit(vehicleData);
      
      // Reset du formulaire
      const initialName = generateVehicleName('moving-truck', VEHICLE_MAKES[0], '');
      setFormData({
        name: initialName,
        type: 'moving-truck',
        registration: '',
        make: VEHICLE_MAKES[0],
        model: '',
        year: new Date().getFullYear().toString(),
        nextService: '',
        location: LOCATIONS[0],
      });
      
      onClose();
      
      Alert.alert('Success', 'Vehicle added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermeture de la modal
  const handleCancel = () => {
    const initialName = generateVehicleName('moving-truck', VEHICLE_MAKES[0], '');
    setFormData({
      name: initialName,
      type: 'moving-truck',
      registration: '',
      make: VEHICLE_MAKES[0],
      model: '',
      year: new Date().getFullYear().toString(),
      nextService: '',
      location: LOCATIONS[0],
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Vehicle</Text>
            <Text style={styles.subtitle}>
              Add vehicle or equipment to your fleet
            </Text>
          </View>

          {/* Formulaire */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type de véhicule */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
              >
                <HStack gap="sm">
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeCard,
                        formData.type === type.id && styles.selectedTypeCard
                      ]}
                      onPress={() => updateVehicleType(type.id)}
                    >
                      <Text style={styles.typeEmoji}>{type.emoji}</Text>
                      <Text style={[
                        styles.typeLabel,
                        formData.type === type.id && styles.selectedTypeLabel
                      ]}>
                        {type.label}
                      </Text>
                      <Text style={styles.typeDescription}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </ScrollView>
            </VStack>

            {/* Nom automatique */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Vehicle Name (Auto-generated)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.textSecondary + '10' }]}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder="Vehicle name..."
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Auto-generated based on type, make and model
              </Text>
            </VStack>

            {/* Registration */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                Registration <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.registration && styles.inputError]}
                value={formData.registration}
                onChangeText={(text) => updateFormData('registration', text)}
                placeholder="ABC-123"
                autoCapitalize="characters"
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Australian registration format (e.g., ABC-123)
              </Text>
              {errors.registration && (
                <Text style={styles.errorText}>{errors.registration}</Text>
              )}
            </VStack>

            {/* Make */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Make</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
              >
                <HStack gap="sm">
                  {VEHICLE_MAKES.map((make) => (
                    <TouchableOpacity
                      key={make}
                      style={[
                        styles.makeButton,
                        formData.make === make && styles.selectedMakeButton
                      ]}
                      onPress={() => updateMake(make)}
                    >
                      <Text style={[
                        styles.makeButtonText,
                        formData.make === make && styles.selectedMakeButtonText
                      ]}>
                        {make}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </ScrollView>
            </VStack>

            {/* Model et Year */}
            <HStack gap="md" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
              <VStack style={{ flex: 2 }}>
                <Text style={styles.label}>
                  Model <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.model && styles.inputError]}
                  value={formData.model}
                  onChangeText={updateModel}
                  placeholder="Transit, HiAce, etc."
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.model && (
                  <Text style={styles.errorText}>{errors.model}</Text>
                )}
              </VStack>

              <VStack style={{ flex: 1 }}>
                <Text style={styles.label}>
                  Year <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.year && styles.inputError]}
                  value={formData.year}
                  onChangeText={(text) => updateFormData('year', text)}
                  placeholder="2024"
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.year && (
                  <Text style={styles.errorText}>{errors.year}</Text>
                )}
              </VStack>
            </HStack>

            {/* Next Service */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                Next Service Date <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.nextService && styles.inputError]}
                value={formData.nextService}
                onChangeText={(text) => updateFormData('nextService', text)}
                placeholder="15 Nov 2024"
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Format: DD MMM YYYY (e.g., 15 Nov 2024)
              </Text>
              {errors.nextService && (
                <Text style={styles.errorText}>{errors.nextService}</Text>
              )}
            </VStack>

            {/* Location */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Current Location</Text>
              <View style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationButton,
                      formData.location === location && styles.selectedLocationButton
                    ]}
                    onPress={() => updateFormData('location', location)}
                  >
                    <Text style={[
                      styles.locationButtonText,
                      formData.location === location && styles.selectedLocationButtonText
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </VStack>
          </ScrollView>

          {/* Boutons */}
          <HStack gap="md" style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isSubmitting ? 'Adding...' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddVehicleModal;
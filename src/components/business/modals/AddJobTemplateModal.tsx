/**
 * AddJobTemplateModal - Modal pour créer des modèles de jobs de déménagement
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
interface JobTemplate {
  name: string;
  category: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  description: string;
  estimatedDuration: string;
  basePrice: string;
  inclusions: string[];
  requirements: {
    staff: string;
    vehicles: string[];
    equipment: string[];
  };
  pricing: {
    type: 'fixed' | 'hourly' | 'volume-based';
    rate: string;
    minimumCharge: string;
  };
}

interface AddJobTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (template: JobTemplate) => void;
}

// Données de référence pour le déménagement
const JOB_CATEGORIES = [
  { 
    id: 'residential', 
    label: 'Residential Move', 
    emoji: '🏠', 
    description: 'House and apartment moves',
    examples: 'Local moves, house relocations'
  },
  { 
    id: 'commercial', 
    label: 'Commercial Move', 
    emoji: '🏢', 
    description: 'Office and business relocations',
    examples: 'Office moves, retail relocations'
  },
  { 
    id: 'interstate', 
    label: 'Interstate Move', 
    emoji: '🛣️', 
    description: 'Long distance interstate moves',
    examples: 'Sydney to Melbourne, cross-state'
  },
  { 
    id: 'storage', 
    label: 'Storage Services', 
    emoji: '📦', 
    description: 'Storage and warehousing',
    examples: 'Self storage, container storage'
  },
  { 
    id: 'packing', 
    label: 'Packing Services', 
    emoji: '📋', 
    description: 'Professional packing',
    examples: 'Full packing, fragile items'
  },
  { 
    id: 'specialty', 
    label: 'Specialty Items', 
    emoji: '🎹', 
    description: 'Special handling required',
    examples: 'Piano, antiques, art'
  },
] as const;

const PRICING_TYPES = [
  { id: 'fixed', label: 'Fixed Price', description: 'One-time fee' },
  { id: 'hourly', label: 'Hourly Rate', description: 'Per hour pricing' },
  { id: 'volume-based', label: 'Volume Based', description: 'Based on m³ or items' },
] as const;

const DEFAULT_INCLUSIONS = [
  'Professional moving team',
  'Moving truck and fuel',
  'Basic moving equipment',
  'Transit insurance',
  'Loading and unloading',
];

const EQUIPMENT_OPTIONS = [
  'Dollies and trolleys',
  'Moving blankets',
  'Straps and tie-downs',
  'Bubble wrap and packing materials',
  'Furniture pads',
  'Piano board',
  'Lifting equipment',
  'Protective floor covers',
];

const VEHICLE_OPTIONS = [
  'Small van (up to 20m³)',
  'Medium truck (20-40m³)',
  'Large truck (40-60m³)',
  'Extra large truck (60m³+)',
  'Trailer attachment',
  'Specialty vehicle',
];

const AddJobTemplateModal: React.FC<AddJobTemplateModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  
  // État du formulaire
  const [formData, setFormData] = useState<JobTemplate>({
    name: '',
    category: 'residential',
    description: '',
    estimatedDuration: '',
    basePrice: '',
    inclusions: [...DEFAULT_INCLUSIONS],
    requirements: {
      staff: '2',
      vehicles: [],
      equipment: [],
    },
    pricing: {
      type: 'hourly',
      rate: '',
      minimumCharge: '',
    },
  });// États pour les erreurs et l'UI
  const [errors, setErrors] = useState<Partial<Record<keyof JobTemplate | 'pricing' | 'requirements', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInclusion, setNewInclusion] = useState('');

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
      width: '95%',
      maxHeight: '90%',
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
    section: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    formGroup: {
      marginBottom: DESIGN_TOKENS.spacing.md,
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
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.error || '#EF4444',
    },
    errorText: {
      fontSize: 12,
      color: colors.error || '#EF4444',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    categoryCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      alignItems: 'flex-start',
      minWidth: 140,
      maxWidth: 160,
    },
    selectedCategoryCard: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    categoryEmoji: {
      fontSize: 24,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    selectedCategoryLabel: {
      color: colors.primary,
    },
    categoryDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    categoryExamples: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    pricingTypeButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      flex: 1,
    },
    selectedPricingTypeButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    pricingTypeText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    selectedPricingTypeText: {
      color: colors.primary,
      fontWeight: '600',
    },
    pricingTypeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    checkbox: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    checkboxBox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      marginRight: DESIGN_TOKENS.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkedBox: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    inclusionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      backgroundColor: colors.primary + '10',
      borderRadius: DESIGN_TOKENS.radius.md,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    inclusionText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    removeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    removeButtonText: {
      fontSize: 18,
      color: colors.error || '#EF4444',
      fontWeight: '600',
    },
    addInclusionRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.sm,
      alignItems: 'flex-end',
    },
    addInclusionInput: {
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
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
  });// Mise à jour des données du formulaire
  const updateFormData = (field: keyof JobTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Mise à jour des sous-objets
  const updatePricing = (field: keyof JobTemplate['pricing'], value: string) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value }
    }));
  };

  const updateRequirements = (field: keyof JobTemplate['requirements'], value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [field]: value }
    }));
  };

  // Génération automatique du nom basé sur la catégorie
  const generateTemplateName = (category: string, description: string) => {
    const categoryLabels = {
      residential: 'Residential Move',
      commercial: 'Commercial Move',
      interstate: 'Interstate Move',
      storage: 'Storage Service',
      packing: 'Packing Service',
      specialty: 'Specialty Move'
    };
    
    const baseLabel = categoryLabels[category as keyof typeof categoryLabels] || 'Move';
    
    if (description.trim()) {
      const shortDescription = description.split(' ').slice(0, 3).join(' ');
      return `${baseLabel} - ${shortDescription}`;
    }
    
    return `${baseLabel} Template`;
  };

  // Mise à jour de la catégorie avec génération automatique du nom
  const updateCategory = (newCategory: any) => {
    const newName = generateTemplateName(newCategory, formData.description);
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      name: newName
    }));
  };

  // Mise à jour de la description avec génération automatique du nom
  const updateDescription = (newDescription: string) => {
    const newName = generateTemplateName(formData.category, newDescription);
    setFormData(prev => ({
      ...prev,
      description: newDescription,
      name: newName
    }));
    
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  // Gestion des inclusions
  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()]
      }));
      setNewInclusion('');
    }
  };

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  // Toggle pour équipement et véhicules
  const toggleEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        equipment: prev.requirements.equipment.includes(equipment)
          ? prev.requirements.equipment.filter(e => e !== equipment)
          : [...prev.requirements.equipment, equipment]
      }
    }));
  };

  const toggleVehicle = (vehicle: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        vehicles: prev.requirements.vehicles.includes(vehicle)
          ? prev.requirements.vehicles.filter(v => v !== vehicle)
          : [...prev.requirements.vehicles, vehicle]
      }
    }));
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof JobTemplate | 'pricing' | 'requirements', string>> = {};

    // Champs requis
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = 'Estimated duration is required';
    }
    
    if (!formData.basePrice.trim()) {
      newErrors.basePrice = 'Base price is required';
    } else {
      const price = parseFloat(formData.basePrice);
      if (isNaN(price) || price <= 0) {
        newErrors.basePrice = 'Must be a valid positive number';
      }
    }
    
    if (!formData.pricing.rate.trim()) {
      newErrors.pricing = 'Pricing rate is required';
    } else {
      const rate = parseFloat(formData.pricing.rate);
      if (isNaN(rate) || rate <= 0) {
        newErrors.pricing = 'Rate must be a valid positive number';
      }
    }
    
    if (!formData.pricing.minimumCharge.trim()) {
      if (!newErrors.pricing) newErrors.pricing = 'Minimum charge is required';
    } else {
      const minCharge = parseFloat(formData.pricing.minimumCharge);
      if (isNaN(minCharge) || minCharge < 0) {
        if (!newErrors.pricing) newErrors.pricing = 'Minimum charge must be a valid number';
      }
    }

    const staff = parseInt(formData.requirements.staff);
    if (isNaN(staff) || staff < 1) {
      newErrors.requirements = 'Staff count must be at least 1';
    }

    if (formData.requirements.vehicles.length === 0) {
      if (!newErrors.requirements) newErrors.requirements = 'At least one vehicle type is required';
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
      const templateData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice).toString(),
        pricing: {
          ...formData.pricing,
          rate: parseFloat(formData.pricing.rate).toString(),
          minimumCharge: parseFloat(formData.pricing.minimumCharge).toString(),
        }
      };

      await onSubmit(templateData);
      
      // Reset du formulaire
      setFormData({
        name: '',
        category: 'residential',
        description: '',
        estimatedDuration: '',
        basePrice: '',
        inclusions: [...DEFAULT_INCLUSIONS],
        requirements: {
          staff: '2',
          vehicles: [],
          equipment: [],
        },
        pricing: {
          type: 'hourly',
          rate: '',
          minimumCharge: '',
        },
      });
      
      onClose();
      
      Alert.alert('Success', 'Job template created successfully!');
    } catch (error) {

      Alert.alert('Error', 'Failed to create job template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermeture de la modal
  const handleCancel = () => {
    setFormData({
      name: '',
      category: 'residential',
      description: '',
      estimatedDuration: '',
      basePrice: '',
      inclusions: [...DEFAULT_INCLUSIONS],
      requirements: {
        staff: '2',
        vehicles: [],
        equipment: [],
      },
      pricing: {
        type: 'hourly',
        rate: '',
        minimumCharge: '',
      },
    });
    setErrors({});
    setNewInclusion('');
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
            <Text style={styles.title}>Create Job Template</Text>
            <Text style={styles.subtitle}>
              Build reusable templates for moving services
            </Text>
          </View>

          {/* Formulaire */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Catégorie */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
              >
                <HStack gap="sm">
                  {JOB_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        formData.category === category.id && styles.selectedCategoryCard
                      ]}
                      onPress={() => updateCategory(category.id)}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[
                        styles.categoryLabel,
                        formData.category === category.id && styles.selectedCategoryLabel
                      ]}>
                        {category.label}
                      </Text>
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                      <Text style={styles.categoryExamples}>
                        {category.examples}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </ScrollView>
            </View>

            {/* Informations de base */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              {/* Nom automatique */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>Template Name (Auto-generated)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.textSecondary + '10' }]}
                  value={formData.name}
                  onChangeText={(text) => updateFormData('name', text)}
                  placeholder="Template name..."
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                <Text style={styles.helpText}>
                  Auto-generated based on category and description
                </Text>
              </VStack>

              {/* Description */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Description <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  value={formData.description}
                  onChangeText={updateDescription}
                  placeholder="Describe the service in detail..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </VStack>

              {/* Durée estimée et prix de base */}
              <HStack gap="md">
                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Duration <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.estimatedDuration && styles.inputError]}
                    value={formData.estimatedDuration}
                    onChangeText={(text) => updateFormData('estimatedDuration', text)}
                    placeholder="4-6 hours"
                    placeholderTextColor={colors.textSecondary + '80'}
                  />
                  {errors.estimatedDuration && (
                    <Text style={styles.errorText}>{errors.estimatedDuration}</Text>
                  )}
                </VStack>

                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Base Price (AUD) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.basePrice && styles.inputError]}
                    value={formData.basePrice}
                    onChangeText={(text) => updateFormData('basePrice', text)}
                    placeholder="299.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary + '80'}
                  />
                  {errors.basePrice && (
                    <Text style={styles.errorText}>{errors.basePrice}</Text>
                  )}
                </VStack>
              </HStack>
            </View>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Structure</Text>
              
              {/* Type de pricing */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>Pricing Type</Text>
                <HStack gap="sm" style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}>
                  {PRICING_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.pricingTypeButton,
                        formData.pricing.type === type.id && styles.selectedPricingTypeButton
                      ]}
                      onPress={() => updatePricing('type', type.id)}
                    >
                      <Text style={[
                        styles.pricingTypeText,
                        formData.pricing.type === type.id && styles.selectedPricingTypeText
                      ]}>
                        {type.label}
                      </Text>
                      <Text style={styles.pricingTypeDescription}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </VStack>

              {/* Rate et minimum charge */}
              <HStack gap="md">
                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Rate (AUD) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.pricing && styles.inputError]}
                    value={formData.pricing.rate}
                    onChangeText={(text) => updatePricing('rate', text)}
                    placeholder={formData.pricing.type === 'hourly' ? '85.00' : '2.50'}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary + '80'}
                  />
                  <Text style={styles.helpText}>
                    {formData.pricing.type === 'hourly' ? 'Per hour' : 
                     formData.pricing.type === 'volume-based' ? 'Per m³' : 'Fixed amount'}
                  </Text>
                </VStack>

                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Min. Charge <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.pricing && styles.inputError]}
                    value={formData.pricing.minimumCharge}
                    onChangeText={(text) => updatePricing('minimumCharge', text)}
                    placeholder="150.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary + '80'}
                  />
                </VStack>
              </HStack>
              
              {errors.pricing && (
                <Text style={styles.errorText}>{errors.pricing}</Text>
              )}
            </View>

            {/* Requirements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              
              {/* Staff */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Staff Required <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.requirements && styles.inputError]}
                  value={formData.requirements.staff}
                  onChangeText={(text) => updateRequirements('staff', text)}
                  placeholder="2"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                <Text style={styles.helpText}>Number of staff members needed</Text>
              </VStack>

              {/* Vehicles */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Vehicle Types <Text style={styles.requiredStar}>*</Text>
                </Text>
                {VEHICLE_OPTIONS.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle}
                    style={styles.checkbox}
                    onPress={() => toggleVehicle(vehicle)}
                  >
                    <View style={[
                      styles.checkboxBox,
                      formData.requirements.vehicles.includes(vehicle) && styles.checkedBox
                    ]}>
                      {formData.requirements.vehicles.includes(vehicle) && (
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxText}>{vehicle}</Text>
                  </TouchableOpacity>
                ))}
              </VStack>

              {/* Equipment */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>Equipment Needed</Text>
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <TouchableOpacity
                    key={equipment}
                    style={styles.checkbox}
                    onPress={() => toggleEquipment(equipment)}
                  >
                    <View style={[
                      styles.checkboxBox,
                      formData.requirements.equipment.includes(equipment) && styles.checkedBox
                    ]}>
                      {formData.requirements.equipment.includes(equipment) && (
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxText}>{equipment}</Text>
                  </TouchableOpacity>
                ))}
              </VStack>
              
              {errors.requirements && (
                <Text style={styles.errorText}>{errors.requirements}</Text>
              )}
            </View>

            {/* Inclusions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              
              {/* Liste des inclusions */}
              <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
                {formData.inclusions.map((inclusion, index) => (
                  <View key={`inclusion-${inclusion}-${index}`} style={styles.inclusionItem}>
                    <Text style={styles.inclusionText}>{inclusion}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeInclusion(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Ajouter une inclusion */}
              <View style={styles.addInclusionRow}>
                <TextInput
                  style={[styles.input, styles.addInclusionInput]}
                  value={newInclusion}
                  onChangeText={setNewInclusion}
                  placeholder="Add what's included..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  onSubmitEditing={addInclusion}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addInclusion}
                  disabled={!newInclusion.trim()}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
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
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddJobTemplateModal;
/**
 * AddVehicleModal - Modal pour ajouter un véhicule
 * Spécialisé pour les entreprises de déménagement australiennes
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'

export interface VehicleCreateData {
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
  make: string
  model: string
  year: number
  registration: string
  capacity: string
  location: string
  nextService: string
}

interface AddVehicleModalProps {
  visible: boolean
  onClose: () => void
  onAddVehicle: (data: VehicleCreateData) => Promise<void>
}

type Step = 'type' | 'details' | 'confirmation'

const VEHICLE_TYPES = [
  { 
    type: 'moving-truck' as const, 
    emoji: '🚛', 
    label: 'Moving Truck',
    description: 'Large capacity truck for residential moves'
  },
  { 
    type: 'van' as const, 
    emoji: '🚐', 
    label: 'Van',
    description: 'Medium size for smaller jobs and deliveries'
  },
  { 
    type: 'trailer' as const, 
    emoji: '🚜', 
    label: 'Trailer',
    description: 'Additional capacity for large moves'
  },
  { 
    type: 'ute' as const, 
    emoji: '🛻', 
    label: 'Ute',
    description: 'Light pickups for quick jobs'
  },
  { 
    type: 'dolly' as const, 
    emoji: '🛒', 
    label: 'Dolly',
    description: 'Equipment for moving heavy items'
  },
  { 
    type: 'tools' as const, 
    emoji: '🔧', 
    label: 'Tools',
    description: 'Professional moving tools and equipment'
  },
]

const VEHICLE_MAKES = [
  'Isuzu', 'Ford', 'Toyota', 'Mitsubishi', 'Mercedes-Benz', 
  'Hino', 'Fuso', 'Volkswagen', 'Hyundai', 'Nissan', 'Other'
]

const LOCATIONS = [
  'Sydney Depot', 'Melbourne Branch', 'Brisbane Office',
  'Perth Warehouse', 'Adelaide Hub', 'Gold Coast Base'
]

export default function AddVehicleModal({
  visible,
  onClose,
  onAddVehicle,
}: AddVehicleModalProps) {
  const { colors } = useTheme()
  const [step, setStep] = useState<Step>('type')
  const [isLoading, setIsLoading] = useState(false)

  const [vehicleData, setVehicleData] = useState<VehicleCreateData>({
    type: 'moving-truck',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registration: '',
    capacity: '',
    location: '',
    nextService: '',
  })

  const resetModal = () => {
    setStep('type')
    setVehicleData({
      type: 'moving-truck',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      registration: '',
      capacity: '',
      location: '',
      nextService: '',
    })
  }

  // Réinitialiser le modal quand il est fermé
  useEffect(() => {
    if (!visible) {
      resetModal()
    }
  }, [visible])

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSelectType = (type: VehicleCreateData['type']) => {
    setVehicleData({ ...vehicleData, type })
    setStep('details')
  }

  const validateRegistration = (reg: string): boolean => {
    // Format australien : ABC-123 ou AB-12-CD
    const pattern1 = /^[A-Z]{3}-\d{3}$/
    const pattern2 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/
    return pattern1.test(reg) || pattern2.test(reg)
  }

  const validateForm = (): boolean => {
    if (!vehicleData.make.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner une marque')
      return false
    }
    if (!vehicleData.model.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le modèle')
      return false
    }
    if (vehicleData.year < 1990 || vehicleData.year > new Date().getFullYear()) {
      Alert.alert('Erreur', `L'année doit être entre 1990 et ${new Date().getFullYear()}`)
      return false
    }
    if (!vehicleData.registration.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner l\'immatriculation')
      return false
    }
    if (!validateRegistration(vehicleData.registration.toUpperCase())) {
      Alert.alert('Erreur', 'Format d\'immatriculation invalide (ex: ABC-123 ou AB-12-CD)')
      return false
    }
    // Capacity est optionnel, donc pas de validation
    if (!vehicleData.location.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un emplacement')
      return false
    }
    if (!vehicleData.nextService.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner la date du prochain service')
      return false
    }
    // Valider que la date de service est dans le futur
    const serviceDate = new Date(vehicleData.nextService)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Ignorer l'heure pour comparer seulement les dates
    if (serviceDate < today) {
      Alert.alert('Erreur', 'La date de service ne peut pas être passée')
      return false
    }
    return true
  }

  const handleAddVehicle = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onAddVehicle(vehicleData)
      Alert.alert(
        'Véhicule ajouté',
        `${vehicleData.make} ${vehicleData.model} a été ajouté avec succès`
      )
      handleClose()
    } catch (error) {

      Alert.alert('Erreur', 'Impossible d\'ajouter le véhicule')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepType = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Type de véhicule
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Sélectionnez le type de véhicule à ajouter
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesContainer}
      >
        {VEHICLE_TYPES.map((vehicleType) => (
          <Pressable
            key={vehicleType.type}
            style={[
              styles.typeCard,
              { backgroundColor: colors.backgroundSecondary },
              vehicleData.type === vehicleType.type && { 
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
                borderWidth: 2,
              }
            ]}
            onPress={() => handleSelectType(vehicleType.type)}
          >
            <View style={[
              styles.typeIconContainer,
              { backgroundColor: colors.primary + '10' }
            ]}>
              <Text style={styles.typeEmoji}>{vehicleType.emoji}</Text>
            </View>
            <Text style={[styles.typeLabel, { color: colors.text }]}>
              {vehicleType.label}
            </Text>
            <Text style={[styles.typeDescription, { color: colors.textSecondary }]}>
              {vehicleType.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )

  const renderStepDetails = () => (
    <View style={styles.stepContainer}>
      <Pressable
        testID="back-button"
        style={styles.backButton}
        onPress={() => setStep('type')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Détails du véhicule
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Renseignez les informations du véhicule
      </Text>

      <View style={styles.form}>
        {/* Marque */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Marque *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.makeScrollView}
          >
            {VEHICLE_MAKES.map((make) => (
              <Pressable
                key={make}
                style={[
                  styles.makeOption,
                  { backgroundColor: colors.backgroundSecondary },
                  vehicleData.make === make && {
                    backgroundColor: colors.primary,
                  }
                ]}
                onPress={() => setVehicleData({ ...vehicleData, make })}
              >
                <Text style={[
                  styles.makeOptionText,
                  { color: colors.text },
                  vehicleData.make === make && { color: colors.background }
                ]}>
                  {make}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Modèle */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Modèle *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={vehicleData.model}
            onChangeText={(text) => setVehicleData({ ...vehicleData, model: text })}
            placeholder="Ex: NPR 200"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Année et Immatriculation */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Année *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={String(vehicleData.year)}
              onChangeText={(text) => setVehicleData({ ...vehicleData, year: parseInt(text) || new Date().getFullYear() })}
              placeholder="2024"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Immatriculation *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={vehicleData.registration}
              onChangeText={(text) => setVehicleData({ ...vehicleData, registration: text.toUpperCase() })}
              placeholder="ABC-123"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Capacité */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Capacité *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={vehicleData.capacity}
            onChangeText={(text) => setVehicleData({ ...vehicleData, capacity: text })}
            placeholder="Ex: 3.5 tonnes ou 8 cubic meters"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Emplacement */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Emplacement *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.makeScrollView}
          >
            {LOCATIONS.map((location) => (
              <Pressable
                key={location}
                style={[
                  styles.makeOption,
                  { backgroundColor: colors.backgroundSecondary },
                  vehicleData.location === location && {
                    backgroundColor: colors.primary,
                  }
                ]}
                onPress={() => setVehicleData({ ...vehicleData, location })}
              >
                <Text style={[
                  styles.makeOptionText,
                  { color: colors.text },
                  vehicleData.location === location && { color: colors.background }
                ]}>
                  {location}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Prochain service */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Prochain service *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={vehicleData.nextService}
            onChangeText={(text) => setVehicleData({ ...vehicleData, nextService: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Format: Année-Mois-Jour (ex: 2025-12-31)
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleAddVehicle}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>Ajouter le véhicule</Text>
          </>
        )}
      </Pressable>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Ajouter un véhicule
          </Text>
          <Pressable testID="close-button" onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {step === 'type' && renderStepType()}
          {step === 'details' && renderStepDetails()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  stepContainer: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  backButton: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  typesContainer: {
    paddingBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.md,
  },
  typeCard: {
    width: 160,
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginRight: DESIGN_TOKENS.spacing.md,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  typeEmoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: DESIGN_TOKENS.spacing.xs,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  form: {
    gap: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
  },
  formGroup: {
    gap: DESIGN_TOKENS.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  makeScrollView: {
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  makeOption: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  makeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

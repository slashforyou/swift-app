/**
 * EditVehicleModal - Modal d'édition de véhicule
 * Réutilise AddVehicleModal en mode édition
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'

// Types
export interface VehicleEditData {
  id: string
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
  make: string
  model: string
  year: number
  registration: string
  capacity: string
  nextService: string
  location: string
}

interface EditVehicleModalProps {
  visible: boolean
  vehicle: VehicleEditData | null
  onClose: () => void
  onUpdateVehicle: (data: VehicleEditData) => Promise<void>
}

const VEHICLE_MAKES = [
  'Isuzu', 'Ford', 'Toyota', 'Mitsubishi', 'Mercedes-Benz',
  'Hino', 'Fuso', 'Nissan', 'Volkswagen', 'Renault', 'Custom'
]

const DEPOT_LOCATIONS = [
  'Sydney Depot',
  'Melbourne Branch',
  'Brisbane Office',
  'Perth Warehouse',
  'Adelaide Center',
  'Gold Coast Hub',
]

export default function EditVehicleModal({
  visible,
  vehicle,
  onClose,
  onUpdateVehicle,
}: EditVehicleModalProps) {
  const { colors } = useTheme()

  // Form state
  const [selectedMake, setSelectedMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [registration, setRegistration] = useState('')
  const [capacity, setCapacity] = useState('')
  const [nextService, setNextService] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with vehicle data
  useEffect(() => {
    if (vehicle) {
      setSelectedMake(vehicle.make)
      setModel(vehicle.model)
      setYear(vehicle.year.toString())
      setRegistration(vehicle.registration)
      setCapacity(vehicle.capacity || '')
      setNextService(vehicle.nextService)
      setSelectedLocation(vehicle.location)
    }
  }, [vehicle])

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setErrors({})
    }
  }, [visible])

  // Validation functions
  const validateRegistration = (reg: string): boolean => {
    const pattern1 = /^[A-Z]{3}-\d{3}$/ // ABC-123
    const pattern2 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/ // AB-12-CD
    return pattern1.test(reg) || pattern2.test(reg)
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!selectedMake) newErrors.make = 'Please select a make'
    if (!model.trim()) newErrors.model = 'Model is required'
    
    const yearNum = parseInt(year)
    if (!year || isNaN(yearNum) || yearNum < 1990 || yearNum > 2025) {
      newErrors.year = 'Year must be between 1990 and 2025'
    }

    if (!registration.trim()) {
      newErrors.registration = 'Registration is required'
    } else if (!validateRegistration(registration.toUpperCase())) {
      newErrors.registration = 'Invalid format. Use ABC-123 or AB-12-CD'
    }

    if (nextService) {
      const serviceDate = new Date(nextService)
      if (serviceDate <= new Date()) {
        newErrors.nextService = 'Service date must be in the future'
      }
    }

    if (!selectedLocation) newErrors.location = 'Please select a location'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !vehicle) return

    setIsLoading(true)
    try {
      const updatedVehicle: VehicleEditData = {
        id: vehicle.id,
        type: vehicle.type,
        make: selectedMake,
        model: model.trim(),
        year: parseInt(year),
        registration: registration.toUpperCase(),
        capacity: capacity.trim(),
        nextService,
        location: selectedLocation,
      }

      await onUpdateVehicle(updatedVehicle)
      onClose()
    } catch (error) {
      Alert.alert('Error', 'Failed to update vehicle')
    } finally {
      setIsLoading(false)
    }
  }

  if (!vehicle) return null

  const getTypeLabel = (type: VehicleEditData['type']): string => {
    const labels = {
      'moving-truck': 'Moving Truck',
      'van': 'Van',
      'trailer': 'Trailer',
      'ute': 'Ute',
      'dolly': 'Dolly',
      'tools': 'Tools/Equipment'
    }
    return labels[type] || 'Vehicle'
  }

  const getTypeEmoji = (type: VehicleEditData['type']): string => {
    const emojis = {
      'moving-truck': '🚛',
      'van': '🚐',
      'trailer': '🚜',
      'ute': '🛻',
      'dolly': '🛒',
      'tools': '🔧'
    }
    return emojis[type] || '🚛'
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>{getTypeEmoji(vehicle.type)}</Text>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Edit Vehicle
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {getTypeLabel(vehicle.type)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            testID="close-button"
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Make Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Vehicle Make <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              <View style={styles.optionsRow}>
                {VEHICLE_MAKES.map((make) => (
                  <Pressable
                    key={make}
                    style={[
                      styles.option,
                      { backgroundColor: colors.backgroundSecondary },
                      selectedMake === make && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setSelectedMake(make)
                      setErrors((prev) => ({ ...prev, make: '' }))
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        selectedMake === make && { color: '#FFFFFF' },
                      ]}
                    >
                      {make}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {errors.make && (
              <Text style={styles.errorText}>{errors.make}</Text>
            )}
          </View>

          {/* Model Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Model <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: errors.model ? '#EF4444' : 'transparent',
                },
              ]}
              placeholder="Enter model"
              placeholderTextColor={colors.textSecondary}
              value={model}
              onChangeText={(text) => {
                setModel(text)
                setErrors((prev) => ({ ...prev, model: '' }))
              }}
            />
            {errors.model && (
              <Text style={styles.errorText}>{errors.model}</Text>
            )}
          </View>

          {/* Year Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Year <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: errors.year ? '#EF4444' : 'transparent',
                },
              ]}
              placeholder="YYYY"
              placeholderTextColor={colors.textSecondary}
              value={year}
              onChangeText={(text) => {
                setYear(text)
                setErrors((prev) => ({ ...prev, year: '' }))
              }}
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.year && (
              <Text style={styles.errorText}>{errors.year}</Text>
            )}
          </View>

          {/* Registration Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Registration <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: errors.registration ? '#EF4444' : 'transparent',
                },
              ]}
              placeholder="Enter registration number"
              placeholderTextColor={colors.textSecondary}
              value={registration}
              onChangeText={(text) => {
                setRegistration(text.toUpperCase())
                setErrors((prev) => ({ ...prev, registration: '' }))
              }}
              autoCapitalize="characters"
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Format: ABC-123 or AB-12-CD
            </Text>
            {errors.registration && (
              <Text style={styles.errorText}>{errors.registration}</Text>
            )}
          </View>

          {/* Capacity Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Capacity (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                },
              ]}
              placeholder="e.g., 3.5 tonnes"
              placeholderTextColor={colors.textSecondary}
              value={capacity}
              onChangeText={setCapacity}
            />
          </View>

          {/* Next Service Date */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Next Service Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: errors.nextService ? '#EF4444' : 'transparent',
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={nextService}
              onChangeText={(text) => {
                setNextService(text)
                setErrors((prev) => ({ ...prev, nextService: '' }))
              }}
            />
            {errors.nextService && (
              <Text style={styles.errorText}>{errors.nextService}</Text>
            )}
          </View>

          {/* Location Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Depot Location <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              <View style={styles.optionsRow}>
                {DEPOT_LOCATIONS.map((location) => (
                  <Pressable
                    key={location}
                    style={[
                      styles.option,
                      { backgroundColor: colors.backgroundSecondary },
                      selectedLocation === location && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setSelectedLocation(location)
                      setErrors((prev) => ({ ...prev, location: '' }))
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        selectedLocation === location && { color: '#FFFFFF' },
                      ]}
                    >
                      {location}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.backgroundSecondary }]}>
          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Update Vehicle</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: DESIGN_TOKENS.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  section: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  required: {
    color: '#EF4444',
  },
  horizontalScroll: {
    marginHorizontal: -DESIGN_TOKENS.spacing.lg,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  option: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 16,
    borderWidth: 2,
  },
  hint: {
    fontSize: 12,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
    padding: DESIGN_TOKENS.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

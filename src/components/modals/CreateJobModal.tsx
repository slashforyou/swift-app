/**
 * CreateJobModal - Modal pour créer un nouveau job
 * Permet de créer un job avec client, adresse, date/heure, et notes
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
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
import { useClients } from '../../hooks/useClients'
import { useTranslation } from '../../localization'
import { ClientAPI, createClient, CreateClientRequest } from '../../services/clients'
import { CreateJobRequest } from '../../services/jobs'

interface CreateJobModalProps {
  visible: boolean
  onClose: () => void
  onCreateJob: (data: CreateJobRequest) => Promise<void>
  selectedDate?: Date
}

type Step = 'client' | 'new-client' | 'address' | 'schedule' | 'details' | 'confirmation'

const PRIORITY_OPTIONS = [
  { key: 'low' as const, label: 'Low', emoji: '🟢', color: '#22c55e' },
  { key: 'medium' as const, label: 'Medium', emoji: '🟡', color: '#eab308' },
  { key: 'high' as const, label: 'High', emoji: '🟠', color: '#f97316' },
  { key: 'urgent' as const, label: 'Urgent', emoji: '🔴', color: '#ef4444' },
]

const ADDRESS_TYPES = [
  { key: 'pickup', label: 'Pickup Address', emoji: '📦' },
  { key: 'delivery', label: 'Delivery Address', emoji: '🏠' },
]

export default function CreateJobModal({
  visible,
  onClose,
  onCreateJob,
  selectedDate,
}: CreateJobModalProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { clients, isLoading: isLoadingClients, refetch: refetchClients } = useClients()
  
  const [step, setStep] = useState<Step>('client')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [selectedClient, setSelectedClient] = useState<ClientAPI | null>(null)
  const [addresses, setAddresses] = useState<CreateJobRequest['addresses']>([
    { type: 'pickup', street: '', city: '', state: '', zip: '' },
    { type: 'delivery', street: '', city: '', state: '', zip: '' },
  ])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [priority, setPriority] = useState<CreateJobRequest['priority']>('medium')
  const [estimatedDuration, setEstimatedDuration] = useState('4')
  const [notes, setNotes] = useState('')

  // New client form state
  const [newClientData, setNewClientData] = useState<CreateClientRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  })
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    // Sécurité : s'assurer que clients est un tableau
    const clientList = Array.isArray(clients) ? clients : [];
    if (!searchQuery) return clientList;
    const query = searchQuery.toLowerCase()
    return clientList.filter(client => 
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    )
  }, [clients, searchQuery])

  const resetModal = () => {
    setStep('client')
    setSelectedClient(null)
    setSearchQuery('')
    setAddresses([
      { type: 'pickup', street: '', city: '', state: '', zip: '' },
      { type: 'delivery', street: '', city: '', state: '', zip: '' },
    ])
    setStartTime('09:00')
    setEndTime('17:00')
    setPriority('medium')
    setEstimatedDuration('4')
    setNotes('')
    setNewClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
    })
    setIsCreatingClient(false)
  }

  useEffect(() => {
    if (!visible) {
      resetModal()
    }
  }, [visible])

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSelectClient = (client: ClientAPI) => {
    setSelectedClient(client)
    // Pre-fill address from client if available
    if (client.address) {
      setAddresses([
        { type: 'pickup', ...client.address },
        { type: 'delivery', street: '', city: '', state: '', zip: '' },
      ])
    }
    setStep('address')
  }

  const updateAddress = (index: number, field: string, value: string) => {
    const newAddresses = [...addresses]
    newAddresses[index] = { ...newAddresses[index], [field]: value }
    setAddresses(newAddresses)
  }

  const validateAddress = (address: CreateJobRequest['addresses'][0]): boolean => {
    return address.street.length > 0 && address.city.length > 0 && address.state.length > 0
  }

  const canProceedFromAddress = (): boolean => {
    return addresses.every(addr => validateAddress(addr))
  }

  const validateTime = (time: string): boolean => {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/
    return pattern.test(time)
  }

  const canProceedFromSchedule = (): boolean => {
    return validateTime(startTime) && validateTime(endTime)
  }

  const handleSubmit = async () => {
    if (!selectedClient) return

    setIsLoading(true)
    try {
      const jobDate = selectedDate || new Date()
      const startDateTime = new Date(jobDate)
      const [startHour, startMinute] = startTime.split(':')
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute))
      
      const endDateTime = new Date(jobDate)
      const [endHour, endMinute] = endTime.split(':')
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute))

      const jobData: CreateJobRequest = {
        client_id: selectedClient.id,
        status: 'pending',
        priority,
        addresses,
        time: {
          startWindowStart: startDateTime.toISOString(),
          startWindowEnd: startDateTime.toISOString(),
          endWindowStart: endDateTime.toISOString(),
          endWindowEnd: endDateTime.toISOString(),
        },
        estimatedDuration: parseInt(estimatedDuration) * 60, // Convert hours to minutes
        notes: notes || undefined,
      }

      await onCreateJob(jobData)
      return true // Return success status
    } catch (error) {
      console.error('Error creating job:', error)
      Alert.alert(
        t('common.error'),
        t('jobs.createError') || 'Failed to create job. Please try again.'
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Handle submit and close
  const handleSubmitAndClose = async () => {
    const success = await handleSubmit()
    if (success) {
      handleClose()
      Alert.alert(
        t('common.success'),
        t('jobs.createSuccess') || 'Job created successfully!'
      )
    }
  }

  // Handle submit and create another
  const handleSubmitAndAddAnother = async () => {
    const success = await handleSubmit()
    if (success) {
      resetModal() // Reset form but keep modal open
      Alert.alert(
        t('common.success'),
        t('jobs.createSuccessAddAnother') || 'Job created! You can now add another.'
      )
    }
  }

  const getStepNumber = (s: Step): number => {
    const steps: Step[] = ['client', 'address', 'schedule', 'details', 'confirmation']
    return steps.indexOf(s) + 1
  }

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {['client', 'address', 'schedule', 'details', 'confirmation'].map((s, index) => (
        <React.Fragment key={s}>
          <View
            style={[
              styles.progressDot,
              {
                backgroundColor: getStepNumber(step) >= index + 1 ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.progressNumber, { color: colors.buttonPrimaryText }]}>
              {index + 1}
            </Text>
          </View>
          {index < 4 && (
            <View
              style={[
                styles.progressLine,
                {
                  backgroundColor: getStepNumber(step) > index + 1 ? colors.primary : colors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  )

  const renderClientStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('jobs.selectClient') || 'Select Client'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('jobs.selectClientDescription') || 'Choose a client for this job'}
      </Text>

      {/* Create new client button */}
      <Pressable
        style={[styles.createClientButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep('new-client')}
      >
        <Ionicons name="add-circle" size={20} color={colors.buttonPrimaryText} />
        <Text style={[styles.createClientButtonText, { color: colors.buttonPrimaryText }]}>
          {t('clients.addClient') || 'Create New Client'}
        </Text>
      </Pressable>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('common.search') || 'Search clients...'}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Client list */}
      <ScrollView style={styles.clientList} showsVerticalScrollIndicator={false}>
        {isLoadingClients ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <Pressable
              key={client.id}
              style={[
                styles.clientCard,
                { 
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: selectedClient?.id === client.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelectClient(client)}
            >
              <View style={[styles.clientAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.clientInitials}>
                  {client.firstName[0]}{client.lastName[0]}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {client.firstName} {client.lastName}
                </Text>
                <Text style={[styles.clientEmail, { color: colors.textSecondary }]}>
                  {client.email}
                </Text>
                <Text style={[styles.clientPhone, { color: colors.textSecondary }]}>
                  📞 {client.phone}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colors.textSecondary} 
              />
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('clients.noClients') || 'No clients found'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )

  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('jobs.enterAddresses') || 'Enter Addresses'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('jobs.enterAddressesDescription') || 'Pickup and delivery locations'}
      </Text>

      <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
        {addresses.map((address, index) => (
          <View key={index} style={styles.addressBlock}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressEmoji}>
                {ADDRESS_TYPES[index]?.emoji || '📍'}
              </Text>
              <Text style={[styles.addressLabel, { color: colors.text }]}>
                {ADDRESS_TYPES[index]?.label || `Address ${index + 1}`}
              </Text>
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.backgroundSecondary }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('address.street') || 'Street address'}
                placeholderTextColor={colors.textSecondary}
                value={address.street}
                onChangeText={(value) => updateAddress(index, 'street', value)}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf, { backgroundColor: colors.backgroundSecondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('address.city') || 'City'}
                  placeholderTextColor={colors.textSecondary}
                  value={address.city}
                  onChangeText={(value) => updateAddress(index, 'city', value)}
                />
              </View>
              <View style={[styles.inputGroup, styles.inputHalf, { backgroundColor: colors.backgroundSecondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('address.state') || 'State'}
                  placeholderTextColor={colors.textSecondary}
                  value={address.state}
                  onChangeText={(value) => updateAddress(index, 'state', value)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.inputZip, { backgroundColor: colors.backgroundSecondary }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('address.zip') || 'Postal code'}
                placeholderTextColor={colors.textSecondary}
                value={address.zip}
                onChangeText={(value) => updateAddress(index, 'zip', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => setStep('client')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t('common.back') || 'Back'}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.buttonPrimary,
            { backgroundColor: canProceedFromAddress() ? colors.primary : colors.border },
          ]}
          onPress={() => setStep('schedule')}
          disabled={!canProceedFromAddress()}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
            {t('common.next') || 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  const renderScheduleStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('jobs.schedule') || 'Schedule'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('jobs.scheduleDescription') || 'Set the time window for this job'}
      </Text>

      <View style={styles.dateDisplay}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={[styles.dateText, { color: colors.text }]}>
          {(selectedDate || new Date()).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.timeSection}>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            {t('jobs.startTime') || 'Start Time'}
          </Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="09:00"
              placeholderTextColor={colors.textSecondary}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            {t('jobs.endTime') || 'End Time'}
          </Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="17:00"
              placeholderTextColor={colors.textSecondary}
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
      </View>

      <View style={styles.durationBlock}>
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
          {t('jobs.estimatedDuration') || 'Estimated Duration (hours)'}
        </Text>
        <View style={[styles.inputGroup, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="hourglass" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="4"
            placeholderTextColor={colors.textSecondary}
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            keyboardType="numeric"
          />
          <Text style={[styles.durationUnit, { color: colors.textSecondary }]}>hours</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => setStep('address')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t('common.back') || 'Back'}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.buttonPrimary,
            { backgroundColor: canProceedFromSchedule() ? colors.primary : colors.border },
          ]}
          onPress={() => setStep('details')}
          disabled={!canProceedFromSchedule()}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
            {t('common.next') || 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('jobs.details') || 'Job Details'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('jobs.detailsDescription') || 'Set priority and add notes'}
      </Text>

      {/* Priority */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        {t('jobs.priority') || 'Priority'}
      </Text>
      <View style={styles.priorityGrid}>
        {PRIORITY_OPTIONS.map(option => (
          <Pressable
            key={option.key}
            style={[
              styles.priorityCard,
              {
                backgroundColor: priority === option.key ? option.color + '20' : colors.backgroundSecondary,
                borderColor: priority === option.key ? option.color : colors.border,
              },
            ]}
            onPress={() => setPriority(option.key)}
          >
            <Text style={styles.priorityEmoji}>{option.emoji}</Text>
            <Text style={[styles.priorityLabel, { color: colors.text }]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notes */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        {t('jobs.notes') || 'Notes (optional)'}
      </Text>
      <View style={[styles.textareaContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TextInput
          style={[styles.textarea, { color: colors.text }]}
          placeholder={t('jobs.notesPlaceholder') || 'Add any special instructions...'}
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => setStep('schedule')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t('common.back') || 'Back'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
          onPress={() => setStep('confirmation')}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
            {t('common.next') || 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('jobs.confirmation') || 'Confirm Job'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('jobs.confirmationDescription') || 'Review job details before creating'}
      </Text>

      <ScrollView style={styles.confirmationList} showsVerticalScrollIndicator={false}>
        {/* Client */}
        <View style={[styles.confirmationCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>
            {t('jobs.client') || 'Client'}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {selectedClient?.firstName} {selectedClient?.lastName}
          </Text>
          <Text style={[styles.confirmationSubvalue, { color: colors.textSecondary }]}>
            {selectedClient?.email} • {selectedClient?.phone}
          </Text>
        </View>

        {/* Addresses */}
        {addresses.map((address, index) => (
          <View key={index} style={[styles.confirmationCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>
              {ADDRESS_TYPES[index]?.emoji} {ADDRESS_TYPES[index]?.label}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {address.street}
            </Text>
            <Text style={[styles.confirmationSubvalue, { color: colors.textSecondary }]}>
              {address.city}, {address.state} {address.zip}
            </Text>
          </View>
        ))}

        {/* Schedule */}
        <View style={[styles.confirmationCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>
            {t('jobs.schedule') || 'Schedule'}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {(selectedDate || new Date()).toLocaleDateString()}
          </Text>
          <Text style={[styles.confirmationSubvalue, { color: colors.textSecondary }]}>
            {startTime} - {endTime} ({estimatedDuration}h estimated)
          </Text>
        </View>

        {/* Priority */}
        <View style={[styles.confirmationCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>
            {t('jobs.priority') || 'Priority'}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {PRIORITY_OPTIONS.find(p => p.key === priority)?.emoji} {PRIORITY_OPTIONS.find(p => p.key === priority)?.label}
          </Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={[styles.confirmationCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>
              {t('jobs.notes') || 'Notes'}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {notes}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={() => setStep('details')}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('common.back') || 'Back'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.success }]}
            onPress={handleSubmitAndClose}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.buttonPrimaryText} />
                <Text style={[styles.buttonText, { color: colors.buttonPrimaryText, marginLeft: 8 }]}>
                  {t('jobs.createJob') || 'Create Job'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
        
        {/* Create and Add Another button */}
        <Pressable
          style={[styles.button, { 
            backgroundColor: colors.primary + '20',
            borderWidth: 1,
            borderColor: colors.primary,
            width: '100%',
          }]}
          onPress={handleSubmitAndAddAnother}
          disabled={isLoading}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.primary, marginLeft: 8 }]}>
            {t('jobs.createAndAddAnother') || 'Create & Add Another'}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  // Handler pour créer un nouveau client
  const handleCreateNewClient = async () => {
    // Validation
    if (!newClientData.firstName.trim() || !newClientData.lastName.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('clients.validation.nameRequired') || 'First and last name are required'
      )
      return
    }
    if (!newClientData.email.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('clients.validation.emailRequired') || 'Email is required'
      )
      return
    }
    if (!newClientData.phone.trim()) {
      Alert.alert(
        t('common.error') || 'Error',
        t('clients.validation.phoneRequired') || 'Phone number is required'
      )
      return
    }

    setIsCreatingClient(true)
    try {
      const newClient = await createClient(newClientData)
      // Refresh la liste des clients
      await refetchClients()
      // Sélectionner automatiquement le nouveau client
      setSelectedClient(newClient)
      // Passer à l'étape suivante (address)
      setStep('address')
      // Réinitialiser le formulaire
      setNewClientData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
      })
      Alert.alert(
        t('clients.success.created') || 'Success',
        t('clients.success.clientCreated') || 'Client created successfully'
      )
    } catch (error) {
      Alert.alert(
        t('common.error') || 'Error',
        t('clients.error.createFailed') || 'Failed to create client'
      )
    } finally {
      setIsCreatingClient(false)
    }
  }

  const renderNewClientStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('clients.addClient') || 'Create New Client'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t('clients.addClientDescription') || 'Fill in the client information'}
      </Text>

      <ScrollView style={styles.clientList} showsVerticalScrollIndicator={false}>
        {/* First Name */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t('clients.firstName') || 'First Name'} *
          </Text>
          <TextInput
            style={[styles.newClientInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            placeholder={t('clients.firstNamePlaceholder') || 'Enter first name'}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.firstName}
            onChangeText={(text) => setNewClientData(prev => ({ ...prev, firstName: text }))}
          />
        </View>

        {/* Last Name */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t('clients.lastName') || 'Last Name'} *
          </Text>
          <TextInput
            style={[styles.newClientInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            placeholder={t('clients.lastNamePlaceholder') || 'Enter last name'}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.lastName}
            onChangeText={(text) => setNewClientData(prev => ({ ...prev, lastName: text }))}
          />
        </View>

        {/* Email */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t('clients.email') || 'Email'} *
          </Text>
          <TextInput
            style={[styles.newClientInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            placeholder={t('clients.emailPlaceholder') || 'Enter email address'}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.email}
            onChangeText={(text) => setNewClientData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t('clients.phone') || 'Phone'} *
          </Text>
          <TextInput
            style={[styles.newClientInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            placeholder={t('clients.phonePlaceholder') || 'Enter phone number'}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.phone}
            onChangeText={(text) => setNewClientData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>

        {/* Company (Optional) */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t('clients.company') || 'Company'} ({t('common.optional') || 'Optional'})
          </Text>
          <TextInput
            style={[styles.newClientInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            placeholder={t('clients.companyPlaceholder') || 'Enter company name'}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.company}
            onChangeText={(text) => setNewClientData(prev => ({ ...prev, company: text }))}
          />
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => setStep('client')}
          disabled={isCreatingClient}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t('common.back') || 'Back'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
          onPress={handleCreateNewClient}
          disabled={isCreatingClient}
        >
          {isCreatingClient ? (
            <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={colors.buttonPrimaryText} />
              <Text style={[styles.buttonText, { color: colors.buttonPrimaryText, marginLeft: 8 }]}>
                {t('clients.createClient') || 'Create Client'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )

  const renderCurrentStep = () => {
    switch (step) {
      case 'client':
        return renderClientStep()
      case 'new-client':
        return renderNewClientStep()
      case 'address':
        return renderAddressStep()
      case 'schedule':
        return renderScheduleStep()
      case 'details':
        return renderDetailsStep()
      case 'confirmation':
        return renderConfirmationStep()
      default:
        return null
    }
  }

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
      borderTopRightRadius: DESIGN_TOKENS.radius.xl,
      maxHeight: '90%',
      minHeight: '70%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    progressDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressNumber: {
      fontSize: 12,
      fontWeight: '600',
    },
    progressLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 4,
    },
    stepContent: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.lg,
    },
    stepTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '700',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    stepDescription: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    createClientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    createClientButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    newClientInputGroup: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    newClientInputLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: '600',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    newClientInput: {
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.sm,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    clientList: {
      flex: 1,
    },
    clientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    clientAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clientInitials: {
      fontSize: 18,
      fontWeight: '700',
      color: 'white',
    },
    clientInfo: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.md,
    },
    clientName: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    clientEmail: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    clientPhone: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xl,
    },
    emptyText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    addressList: {
      flex: 1,
    },
    addressBlock: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    addressEmoji: {
      fontSize: 20,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    addressLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    inputRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    inputHalf: {
      flex: 1,
    },
    inputZip: {
      width: '50%',
    },
    input: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    buttonPrimary: {
      // backgroundColor set dynamically
    },
    buttonSecondary: {
      borderWidth: 1,
    },
    buttonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    dateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: colors.primaryLight || colors.primary + '20',
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    dateText: {
      marginLeft: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    timeSection: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    timeBlock: {
      flex: 1,
    },
    timeLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    durationBlock: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    durationUnit: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    sectionLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
      marginBottom: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    priorityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    priorityCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
    },
    priorityEmoji: {
      fontSize: 20,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    priorityLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '500',
    },
    textareaContainer: {
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
    },
    textarea: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      minHeight: 100,
    },
    confirmationList: {
      flex: 1,
    },
    confirmationCard: {
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    confirmationLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    confirmationValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
    },
    confirmationSubvalue: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
  })

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t('jobs.createNewJob') || 'Create New Job'}
            </Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Progress bar */}
          {renderProgressBar()}

          {/* Current step content */}
          {renderCurrentStep()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

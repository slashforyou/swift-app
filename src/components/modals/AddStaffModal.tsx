/**
 * AddStaffModal - Modal pour ajouter un membre du personnel
 * Permet d'ajouter un employé (TFN) ou un prestataire (ABN)
 */
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
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
import { Contractor, InviteEmployeeData } from '../../types/staff'

interface AddStaffModalProps {
  visible: boolean
  onClose: () => void
  onInviteEmployee: (data: InviteEmployeeData) => Promise<void>
  onSearchContractor: (searchTerm: string) => Promise<Contractor[]>
  onAddContractor: (contractorId: string, contractStatus: Contractor['contractStatus']) => Promise<void>
  onInviteContractor?: (email: string, firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>
}

type StaffType = 'employee' | 'contractor'
type Step = 'type' | 'employee-form' | 'contractor-search' | 'contractor-results' | 'contractor-invite'

export default function AddStaffModal({
  visible,
  onClose,
  onInviteEmployee,
  onSearchContractor,
  onAddContractor,
  onInviteContractor,
}: AddStaffModalProps) {
  const { colors } = useTheme()
  const [step, setStep] = useState<Step>('type')
  const [staffType, setStaffType] = useState<StaffType>('employee')
  const [isLoading, setIsLoading] = useState(false)

  // Formulaire employé
  const [employeeData, setEmployeeData] = useState<InviteEmployeeData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    team: '',
    hourlyRate: 0,
  })

  // Recherche prestataire
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Contractor[]>([])

  // Invitation prestataire
  const [contractorInviteData, setContractorInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })

  const resetModal = () => {
    setStep('type')
    setStaffType('employee')
    setEmployeeData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      team: '',
      hourlyRate: 0,
    })
    setSearchTerm('')
    setSearchResults([])
    setContractorInviteData({ email: '', firstName: '', lastName: '' })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSelectType = (type: StaffType) => {
    setStaffType(type)
    if (type === 'employee') {
      setStep('employee-form')
    } else {
      setStep('contractor-search')
    }
  }

  const handleInviteEmployee = async () => {
    // Validation
    if (!employeeData.firstName || !employeeData.lastName) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom et prénom')
      return
    }
    if (!employeeData.email) {
      Alert.alert('Erreur', 'Veuillez renseigner l\'email')
      return
    }
    if (!employeeData.phone) {
      Alert.alert('Erreur', 'Veuillez renseigner le téléphone')
      return
    }
    if (!employeeData.role) {
      Alert.alert('Erreur', 'Veuillez sélectionner un poste')
      return
    }
    if (!employeeData.team) {
      Alert.alert('Erreur', 'Veuillez sélectionner une équipe')
      return
    }
    if (employeeData.hourlyRate <= 0) {
      Alert.alert('Erreur', 'Veuillez renseigner un taux horaire valide')
      return
    }

    setIsLoading(true)
    try {
      await onInviteEmployee(employeeData)
      Alert.alert(
        'Invitation envoyée',
        `Une invitation a été envoyée à ${employeeData.email}. L'employé devra créer un compte et renseigner son TFN.`
      )
      handleClose()
    } catch (error) {

      Alert.alert('Erreur', 'Impossible d\'envoyer l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchContractor = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom ou un ABN')
      return
    }

    setIsLoading(true)
    try {
      const results = await onSearchContractor(searchTerm)
      setSearchResults(results)
      setStep('contractor-results')
    } catch (error) {

      Alert.alert('Erreur', 'Erreur lors de la recherche')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContractor = async (contractor: Contractor) => {
    Alert.alert(
      'Ajouter un prestataire',
      `Voulez-vous ajouter ${contractor.firstName} ${contractor.lastName} à votre équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: async () => {
            setIsLoading(true)
            try {
              await onAddContractor(contractor.id, 'standard')
              Alert.alert(
                'Prestataire ajouté',
                `${contractor.firstName} ${contractor.lastName} a été ajouté à votre équipe`
              )
              handleClose()
            } catch (error) {

              Alert.alert('Erreur', 'Impossible d\'ajouter le prestataire')
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleInviteContractor = () => {
    // Passer à l'étape d'invitation
    setStep('contractor-invite')
  }

  const handleSendContractorInvite = async () => {
    if (!contractorInviteData.email) {
      Alert.alert('Erreur', 'Veuillez renseigner l\'email')
      return
    }
    if (!contractorInviteData.firstName || !contractorInviteData.lastName) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom et prénom')
      return
    }

    setIsLoading(true)
    try {
      if (onInviteContractor) {
        const result = await onInviteContractor(
          contractorInviteData.email,
          contractorInviteData.firstName,
          contractorInviteData.lastName
        )
        Alert.alert('Invitation envoyée', result.message)
      } else {
        // Fallback si pas de handler
        Alert.alert(
          'Invitation envoyée',
          `Un email d'invitation a été envoyé à ${contractorInviteData.email}`
        )
      }
      handleClose()
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepType = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Type de membre
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Choisissez le type de membre à ajouter
      </Text>

      <View style={styles.typeOptions}>
        <Pressable
          style={[
            styles.typeOption,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => handleSelectType('employee')}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: `${colors.success}20` }]}>
            <Ionicons name="person" size={32} color={colors.success} />
          </View>
          <Text style={[styles.typeOptionTitle, { color: colors.text }]}>
            Employé (TFN)
          </Text>
          <Text style={[styles.typeOptionDescription, { color: colors.textSecondary }]}>
            Invitez un employé à créer un compte et renseigner son Tax File Number
          </Text>
          <View style={styles.typeOptionFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Contrat d'employé
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Taux horaire fixe
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Gestion des congés
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.typeOption,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => handleSelectType('contractor')}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: `${colors.info}20` }]}>
            <Ionicons name="briefcase" size={32} color={colors.info} />
          </View>
          <Text style={[styles.typeOptionTitle, { color: colors.text }]}>
            Prestataire (ABN)
          </Text>
          <Text style={[styles.typeOptionDescription, { color: colors.textSecondary }]}>
            Recherchez un prestataire existant ou invitez-en un à créer un compte avec son ABN
          </Text>
          <View style={styles.typeOptionFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Contrat flexible
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Taux négociable
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Facturation externe
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  )

  const renderEmployeeForm = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep('type')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Inviter un employé
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        L'employé recevra une invitation par email pour créer son compte
      </Text>

      <View style={styles.form}>
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Prénom *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={employeeData.firstName}
              onChangeText={(text) => setEmployeeData({ ...employeeData, firstName: text })}
              placeholder="John"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Nom *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={employeeData.lastName}
              onChangeText={(text) => setEmployeeData({ ...employeeData, lastName: text })}
              placeholder="Smith"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={employeeData.email}
            onChangeText={(text) => setEmployeeData({ ...employeeData, email: text })}
            placeholder="john.smith@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Téléphone *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={employeeData.phone}
            onChangeText={(text) => setEmployeeData({ ...employeeData, phone: text })}
            placeholder="+61 412 345 678"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Poste *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={employeeData.role}
            onChangeText={(text) => setEmployeeData({ ...employeeData, role: text })}
            placeholder="Ex: Moving Supervisor"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Équipe *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={employeeData.team}
            onChangeText={(text) => setEmployeeData({ ...employeeData, team: text })}
            placeholder="Ex: Local Moving Team A"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Taux horaire ($) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={employeeData.hourlyRate > 0 ? String(employeeData.hourlyRate) : ''}
            onChangeText={(text) => setEmployeeData({ ...employeeData, hourlyRate: parseFloat(text) || 0 })}
            placeholder="35"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleInviteEmployee}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Ionicons name="mail" size={20} color={colors.background} />
            <Text style={[styles.submitButtonText, { color: colors.background }]}>Envoyer l&apos;invitation</Text>
          </>
        )}
      </Pressable>
    </View>
  )

  const renderContractorSearch = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep('type')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Rechercher un prestataire
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Recherchez un prestataire par nom ou numéro ABN
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Nom ou ABN du prestataire"
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={handleSearchContractor}
        />
        <Pressable
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={handleSearchContractor}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons name="search" size={24} color={colors.background} />
          )}
        </Pressable>
      </View>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OU</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <Pressable
        style={[styles.inviteButton, { backgroundColor: colors.backgroundSecondary }]}
        onPress={handleInviteContractor}
      >
        <Ionicons name="person-add" size={24} color={colors.primary} />
        <Text style={[styles.inviteButtonText, { color: colors.text }]}>
          Inviter un nouveau prestataire
        </Text>
      </Pressable>
    </View>
  )

  const renderContractorResults = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep('contractor-search')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Résultats de recherche
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {searchResults.length} prestataire{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
      </Text>

      {searchResults.length === 0 ? (
        <View style={styles.emptyResults}>
          <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyResultsText, { color: colors.text }]}>
            Aucun prestataire trouvé
          </Text>
          <Text style={[styles.emptyResultsSubtext, { color: colors.textSecondary }]}>
            Essayez une autre recherche ou invitez un nouveau prestataire
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsList}>
          {searchResults.map((contractor) => (
            <Pressable
              key={contractor.id}
              style={[styles.resultCard, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleAddContractor(contractor)}
            >
              <View style={styles.resultCardHeader}>
                <View style={[styles.contractorIcon, { backgroundColor: `${colors.info}20` }]}>
                  <Ionicons name="briefcase" size={24} color={colors.info} />
                </View>
                <View style={styles.resultCardInfo}>
                  <Text style={[styles.resultCardName, { color: colors.text }]}>
                    {contractor.firstName} {contractor.lastName}
                  </Text>
                  <Text style={[styles.resultCardRole, { color: colors.textSecondary }]}>
                    {contractor.role}
                  </Text>
                </View>
                {contractor.isVerified && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </View>
              <View style={styles.resultCardDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    ABN: {contractor.abn}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    ${contractor.rate}/{contractor.rateType === 'hourly' ? 'h' : 'projet'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )

  const renderContractorInvite = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep('contractor-search')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Inviter un prestataire
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Envoyez une invitation par email pour créer un compte avec son ABN
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.backgroundSecondary,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={contractorInviteData.firstName}
          onChangeText={(text) => setContractorInviteData(prev => ({ ...prev, firstName: text }))}
          placeholder="Prénom du prestataire"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nom *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.backgroundSecondary,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={contractorInviteData.lastName}
          onChangeText={(text) => setContractorInviteData(prev => ({ ...prev, lastName: text }))}
          placeholder="Nom du prestataire"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.backgroundSecondary,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={contractorInviteData.email}
          onChangeText={(text) => setContractorInviteData(prev => ({ ...prev, email: text }))}
          placeholder="email@exemple.com"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
          Le prestataire recevra un email pour créer son compte et renseigner son ABN.
          Une fois inscrit, il apparaîtra dans votre liste de prestataires.
        </Text>
      </View>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleSendContractorInvite}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Ionicons name="mail" size={20} color={colors.background} />
            <Text style={[styles.submitButtonText, { color: colors.background }]}>Envoyer l&apos;invitation</Text>
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
            Ajouter un membre
          </Text>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {step === 'type' && renderStepType()}
          {step === 'employee-form' && renderEmployeeForm()}
          {step === 'contractor-search' && renderContractorSearch()}
          {step === 'contractor-results' && renderContractorResults()}
          {step === 'contractor-invite' && renderContractorInvite()}
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
  typeOptions: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  typeOption: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  typeOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  typeOptionDescription: {
    fontSize: 14,
    marginBottom: DESIGN_TOKENS.spacing.md,
    lineHeight: 20,
  },
  typeOptionFeatures: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  featureText: {
    fontSize: 14,
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
  searchContainer: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  searchInput: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyResults: {
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.xl * 2,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    marginTop: DESIGN_TOKENS.spacing.xs,
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
  },
  resultCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  contractorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCardInfo: {
    flex: 1,
  },
  resultCardName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCardRole: {
    fontSize: 14,
    marginTop: 2,
  },
  resultCardDetails: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  detailText: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginVertical: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
})

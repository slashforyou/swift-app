/**
 * AddStaffModal - Modal pour ajouter un nouveau membre du personnel
 * Spécialisé pour le secteur du déménagement avec validation TFN australien
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
interface Employee {
  firstName: string;
  lastName: string;
  tfn: string;
  role: string;
  team: string;
  phone: string;
  email: string;
  hourlyRate: string;
}

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (employee: Employee) => void;
}

// Données de référence pour le déménagement
const MOVING_ROLES = [
  'Moving Supervisor',
  'Senior Mover', 
  'Packing Specialist',
  'Loading Specialist',
  'Delivery Driver',
  'Customer Service Rep',
  'Interstate Coordinator'
];

const MOVING_TEAMS = [
  'Local Moving Team A',
  'Local Moving Team B', 
  'Interstate Moving Team',
  'Packing Team',
  'Storage Team',
  'Customer Service Team'
];

// Validation TFN australien (format xxx-xxx-xxx)
const validateTFN = (tfn: string): boolean => {
  // Format basique TFN australien : 9 chiffres, peut avoir des tirets
  const tfnRegex = /^\d{3}-?\d{3}-?\d{3}$/;
  return tfnRegex.test(tfn.replace(/\s/g, ''));
};

// Validation email simple
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation téléphone australien
const validatePhone = (phone: string): boolean => {
  // Format australien : +61 suivi de 9 chiffres ou 04xx xxx xxx
  const phoneRegex = /^(\+61\s?[2-9]\d{8}|04\d{2}\s?\d{3}\s?\d{3})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  
  // État du formulaire
  const [formData, setFormData] = useState<Employee>({
    firstName: '',
    lastName: '',
    tfn: '',
    role: MOVING_ROLES[0],
    team: MOVING_TEAMS[0],
    phone: '',
    email: '',
    hourlyRate: '',
  });// États pour les erreurs
  const [errors, setErrors] = useState<Partial<Employee>>({});
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
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: colors.background,
    },
    picker: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      fontSize: 16,
      color: colors.text,
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
    roleButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    selectedRoleButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    roleButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedRoleButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
    teamButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    selectedTeamButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    teamButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedTeamButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });// Mise à jour des données du formulaire
  const updateFormData = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<Employee> = {};

    // Champs requis
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.tfn.trim()) {
      newErrors.tfn = 'TFN is required';
    } else if (!validateTFN(formData.tfn)) {
      newErrors.tfn = 'Invalid TFN format (should be xxx-xxx-xxx)';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid Australian phone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.hourlyRate.trim()) {
      newErrors.hourlyRate = 'Hourly rate is required';
    } else if (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Invalid hourly rate';
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
      const employeeData = {
        ...formData,
        tfn: formData.tfn.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3'),
        hourlyRate: formData.hourlyRate,
      };

      await onSubmit(employeeData);
      
      // Reset du formulaire
      setFormData({
        firstName: '',
        lastName: '',
        tfn: '',
        role: MOVING_ROLES[0],
        team: MOVING_TEAMS[0],
        phone: '',
        email: '',
        hourlyRate: '',
      });
      
      onClose();
      
      Alert.alert('Success', 'Staff member added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add staff member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermeture de la modal
  const handleCancel = () => {
    setFormData({
      firstName: '',
      lastName: '',
      tfn: '',
      role: MOVING_ROLES[0],
      team: MOVING_TEAMS[0],
      phone: '',
      email: '',
      hourlyRate: '',
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
            <Text style={styles.title}>Add New Staff Member</Text>
            <Text style={styles.subtitle}>
              Enter details for the new team member
            </Text>
          </View>

          {/* Formulaire */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nom et Prénom */}
            <HStack gap="md" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
              <VStack style={{ flex: 1 }}>
                <Text style={styles.label}>
                  First Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </VStack>

              <VStack style={{ flex: 1 }}>
                <Text style={styles.label}>
                  Last Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </VStack>
            </HStack>

            {/* TFN */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                TFN (Tax File Number) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.tfn && styles.inputError]}
                value={formData.tfn}
                onChangeText={(text) => updateFormData('tfn', text)}
                placeholder="123-456-789"
                keyboardType="numeric"
                maxLength={11}
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Format: xxx-xxx-xxx (Australian Tax File Number)
              </Text>
              {errors.tfn && (
                <Text style={styles.errorText}>{errors.tfn}</Text>
              )}
            </VStack>

            {/* Role */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Role</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
              >
                <HStack gap="sm">
                  {MOVING_ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.selectedRoleButton
                      ]}
                      onPress={() => updateFormData('role', role)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === role && styles.selectedRoleButtonText
                      ]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </ScrollView>
              <Text style={styles.helpText}>
                Role in the moving company
              </Text>
            </VStack>

            {/* Team */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>Team</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
              >
                <HStack gap="sm">
                  {MOVING_TEAMS.map((team) => (
                    <TouchableOpacity
                      key={team}
                      style={[
                        styles.teamButton,
                        formData.team === team && styles.selectedTeamButton
                      ]}
                      onPress={() => updateFormData('team', team)}
                    >
                      <Text style={[
                        styles.teamButtonText,
                        formData.team === team && styles.selectedTeamButtonText
                      ]}>
                        {team}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </HStack>
              </ScrollView>
            </VStack>

            {/* Contact */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                placeholder="+61 412 345 678"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Australian mobile or landline format
              </Text>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </VStack>

            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                Email Address <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                placeholder="name@swift-removals.com.au"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary + '80'}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </VStack>

            {/* Hourly Rate */}
            <VStack style={styles.formGroup}>
              <Text style={styles.label}>
                Hourly Rate (AUD) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.hourlyRate && styles.inputError]}
                value={formData.hourlyRate}
                onChangeText={(text) => updateFormData('hourlyRate', text)}
                placeholder="28"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary + '80'}
              />
              <Text style={styles.helpText}>
                Hourly rate in Australian dollars
              </Text>
              {errors.hourlyRate && (
                <Text style={styles.errorText}>{errors.hourlyRate}</Text>
              )}
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
                {isSubmitting ? 'Adding...' : 'Add Staff'}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddStaffModal;
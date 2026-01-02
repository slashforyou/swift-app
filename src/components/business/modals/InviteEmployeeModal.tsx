/**
 * Modal pour inviter un employé (TFN)
 * L'employé recevra un email et devra compléter ses informations
 */
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { useLocalization } from '../../../localization/useLocalization';
import { InviteEmployeeData } from '../../../types/staff';
import { HStack, VStack } from '../../primitives/Stack';

interface InviteEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InviteEmployeeData) => Promise<void>;
}

const initialFormData: InviteEmployeeData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  team: '',
  hourlyRate: 0,
};

export default function InviteEmployeeModal({ visible, onClose, onSubmit }: InviteEmployeeModalProps) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InviteEmployeeData>(initialFormData);

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      setFormData(initialFormData);
    }
  }, [visible]);

  const roles = [
    'Moving Supervisor',
    'Senior Mover',
    'Junior Mover',
    'Packing Specialist',
    'Truck Driver',
    'Customer Service',
    'Administration',
  ];

  const teams = [
    'Local Moving Team A',
    'Local Moving Team B',
    'Interstate Moving Team',
    'Packing Team',
    'Storage Team',
    'Customer Service Team',
  ];

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.firstNameRequired'));
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.lastNameRequired'));
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.emailInvalid'));
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.phoneRequired'));
      return false;
    }
    if (!formData.role) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.roleRequired'));
      return false;
    }
    if (!formData.team) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.teamRequired'));
      return false;
    }
    if (formData.hourlyRate <= 0) {
      Alert.alert(t('staffModals.addStaff.validation.error'), t('staffModals.addStaff.validation.hourlyRateInvalid'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSubmit(formData);
      
      Alert.alert(
        t('staffModals.addStaff.success.invitationSent'),
        t('staffModals.addStaff.success.invitationSentMessage', { email: formData.email }),
        [{ text: 'OK', onPress: onClose }]
      );
      
      // Reset form (will also be done by useEffect when modal closes)
      setFormData(initialFormData);
    } catch (_error) {
      Alert.alert(
        t('staffModals.addStaff.validation.error'),
        t('staffModals.addStaff.validation.inviteError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.lg,
      }}>
        <View style={{
          backgroundColor: colors.background,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          width: '100%',
          maxHeight: '90%',
        }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack gap="lg">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <Text testID="modal-title" style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: colors.text,
                }}>
                  Inviter un Employé
                </Text>
                <TouchableOpacity testID="close-button" onPress={onClose}>
                  <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
                </TouchableOpacity>
              </HStack>

              <Text testID="modal-description" style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20,
              }}>
                L'employé recevra un email d'invitation et devra compléter ses informations (TFN, date de naissance) pour accéder à son compte lié à l'entreprise.
              </Text>

              {/* Formulaire */}
              <VStack gap="md">
                <HStack gap="md">
                  <VStack gap="xs" style={{ flex: 1 }}>
                    <Text testID="firstname-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                      Prénom *
                    </Text>
                    <TextInput
                      testID="firstname-input"
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        padding: DESIGN_TOKENS.spacing.md,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={formData.firstName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                      placeholder="John"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </VStack>

                  <VStack gap="xs" style={{ flex: 1 }}>
                    <Text testID="lastname-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                      Nom *
                    </Text>
                    <TextInput
                      testID="lastname-input"
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        padding: DESIGN_TOKENS.spacing.md,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={formData.lastName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                      placeholder="Smith"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </VStack>
                </HStack>

                <VStack gap="xs">
                  <Text testID="email-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Email *
                  </Text>
                  <TextInput
                    testID="email-input"
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      padding: DESIGN_TOKENS.spacing.md,
                      fontSize: 16,
                      color: colors.text,
                    }}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="john.smith@swift-removals.com.au"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </VStack>

                <VStack gap="xs">
                  <Text testID="phone-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Téléphone *
                  </Text>
                  <TextInput
                    testID="phone-input"
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      padding: DESIGN_TOKENS.spacing.md,
                      fontSize: 16,
                      color: colors.text,
                    }}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="+61 412 345 678"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </VStack>

                <VStack gap="xs">
                  <Text testID="role-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Rôle *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack gap="sm">
                      {roles.map((role) => (
                        <TouchableOpacity
                          key={role}
                          testID={`role-option-${role.toLowerCase().replace(/\s+/g, '-')}`}
                          onPress={() => setFormData(prev => ({ ...prev, role }))}
                          style={{
                            backgroundColor: formData.role === role ? colors.primary : colors.backgroundSecondary,
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                          }}
                        >
                          <Text style={{
                            color: formData.role === role ? colors.background : colors.text,
                            fontSize: 14,
                            fontWeight: formData.role === role ? '600' : '400',
                          }}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </HStack>
                  </ScrollView>
                </VStack>

                <VStack gap="xs">
                  <Text testID="team-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Équipe *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack gap="sm">
                      {teams.map((team) => (
                        <TouchableOpacity
                          key={team}
                          testID={`team-option-${team.toLowerCase().replace(/\s+/g, '-')}`}
                          onPress={() => setFormData(prev => ({ ...prev, team }))}
                          style={{
                            backgroundColor: formData.team === team ? colors.primary : colors.backgroundSecondary,
                            paddingHorizontal: DESIGN_TOKENS.spacing.md,
                            paddingVertical: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                          }}
                        >
                          <Text style={{
                            color: formData.team === team ? colors.background : colors.text,
                            fontSize: 14,
                            fontWeight: formData.team === team ? '600' : '400',
                          }}>
                            {team}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </HStack>
                  </ScrollView>
                </VStack>

                <VStack gap="xs">
                  <Text testID="hourlyrate-label" style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Taux horaire (AUD) *
                  </Text>
                  <TextInput
                    testID="hourlyrate-input"
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      padding: DESIGN_TOKENS.spacing.md,
                      fontSize: 16,
                      color: colors.text,
                    }}
                    value={formData.hourlyRate.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(text) || 0 }))}
                    placeholder="35"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </VStack>
              </VStack>

              {/* Actions */}
              <HStack gap="md" style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
                <TouchableOpacity
                  testID="cancel-button"
                  onPress={onClose}
                  style={{
                    flex: 1,
                    backgroundColor: colors.backgroundSecondary,
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    Annuler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="submit-button"
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    alignItems: 'center',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator testID="loading-indicator" size="small" color={colors.background} />
                  ) : (
                    <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                      Envoyer l'invitation
                    </Text>
                  )}
                </TouchableOpacity>
              </HStack>
            </VStack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
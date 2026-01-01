/**
 * EditStaffModal - Modal pour modifier un membre du personnel
 * Permet d'éditer un employé ou un prestataire
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';
import { Contractor, Employee, StaffMember } from '../../types/staff';

interface EditStaffModalProps {
  visible: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSave: (staffId: string, updateData: Partial<StaffMember>) => Promise<void>;
}

export default function EditStaffModal({
  visible,
  member,
  onClose,
  onSave,
}: EditStaffModalProps) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);

  // Champs communs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('active');

  // Champs employé
  const [hourlyRate, setHourlyRate] = useState('');

  // Champs prestataire
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState<'hourly' | 'fixed' | 'project'>('hourly');
  const [contractStatus, setContractStatus] = useState<'non-exclusive' | 'exclusive' | 'preferred' | 'standard'>('standard');

  useEffect(() => {
    if (member) {
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setEmail(member.email);
      setPhone(member.phone);
      setRole(member.role);
      setTeam(member.team || '');
      setStatus(member.status);

      if (member.type === 'employee') {
        const emp = member as Employee;
        setHourlyRate(emp.hourlyRate.toString());
      } else {
        const con = member as Contractor;
        setRate(con.rate.toString());
        setRateType(con.rateType);
        setContractStatus(con.contractStatus);
      }
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;

    if (!firstName || !lastName) {
      Alert.alert(t('staffModals.editStaff.validation.error'), t('staffModals.editStaff.validation.nameRequired'));
      return;
    }
    if (!email) {
      Alert.alert(t('staffModals.editStaff.validation.error'), t('staffModals.editStaff.validation.emailRequired'));
      return;
    }
    if (!role) {
      Alert.alert(t('staffModals.editStaff.validation.error'), t('staffModals.editStaff.validation.positionRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<StaffMember> = {
        firstName,
        lastName,
        email,
        phone,
        role,
        team,
        status,
      };

      if (member.type === 'employee') {
        (updateData as Partial<Employee>).hourlyRate = parseFloat(hourlyRate) || 0;
      } else {
        (updateData as Partial<Contractor>).rate = parseFloat(rate) || 0;
        (updateData as Partial<Contractor>).rateType = rateType;
        (updateData as Partial<Contractor>).contractStatus = contractStatus;
      }

      await onSave(member.id, updateData);
      Alert.alert(t('staffModals.editStaff.success.title'), t('staffModals.editStaff.success.memberUpdated'));
      onClose();
    } catch (error) {
      Alert.alert(t('staffModals.editStaff.error.title'), t('staffModals.editStaff.error.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    'Moving Supervisor',
    'Senior Mover',
    'Mover',
    'Packing Specialist',
    'Truck Driver',
    'Warehouse Manager',
    'Storage Specialist',
    'Admin',
  ];

  const teams = [
    'Local Moving Team A',
    'Local Moving Team B',
    'Interstate Moving Team',
    'External Contractors',
    'Warehouse Team',
    'Office Staff',
  ];

  if (!member) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Modifier {member.type === 'employee' ? 'l\'employé' : 'le prestataire'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Enregistrer</Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Type indicator */}
          <View style={[styles.typeIndicator, { 
            backgroundColor: member.type === 'employee' ? `${colors.success}20` : `${colors.info}20` 
          }]}>
            <Ionicons 
              name={member.type === 'employee' ? 'person' : 'briefcase'} 
              size={24} 
              color={member.type === 'employee' ? colors.success : colors.info} 
            />
            <Text style={[styles.typeText, { 
              color: member.type === 'employee' ? colors.success : colors.info 
            }]}>
              {member.type === 'employee' ? 'Employé (TFN)' : 'Prestataire (ABN)'}
            </Text>
          </View>

          {/* Informations personnelles */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Informations personnelles
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemple.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+61 400 000 000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />

          {/* Rôle et équipe */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Poste et équipe
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Poste</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
          >
            {roles.map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.optionChip,
                  { backgroundColor: colors.backgroundSecondary },
                  role === r && { backgroundColor: colors.primary },
                ]}
                onPress={() => setRole(r)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    { color: colors.text },
                    role === r && { color: colors.background },
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Équipe</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
          >
            {teams.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.optionChip,
                  { backgroundColor: colors.backgroundSecondary },
                  team === t && { backgroundColor: colors.primary },
                ]}
                onPress={() => setTeam(t)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    { color: colors.text },
                    team === t && { color: colors.background },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Statut */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Statut
          </Text>
          <View style={styles.statusOptions}>
            {(['active', 'inactive', 'pending'] as const).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusChip,
                  { backgroundColor: colors.backgroundSecondary },
                  status === s && { 
                    backgroundColor: s === 'active' ? `${colors.success}20` : 
                                     s === 'pending' ? `${colors.warning}20` : `${colors.textSecondary}20`
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <View style={[
                  styles.statusDot,
                  { backgroundColor: s === 'active' ? colors.success : 
                                    s === 'pending' ? colors.warning : colors.textSecondary }
                ]} />
                <Text
                  style={[
                    styles.statusChipText,
                    { color: colors.text },
                  ]}
                >
                  {s === 'active' ? 'Actif' : s === 'pending' ? 'En attente' : 'Inactif'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Rémunération */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Rémunération
          </Text>

          {member.type === 'employee' ? (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Taux horaire ($)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="35"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Type de tarif
              </Text>
              <View style={styles.statusOptions}>
                {(['hourly', 'fixed', 'project'] as const).map((rt) => (
                  <Pressable
                    key={rt}
                    style={[
                      styles.statusChip,
                      { backgroundColor: colors.backgroundSecondary },
                      rateType === rt && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => setRateType(rt)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        { color: colors.text },
                        rateType === rt && { color: colors.primary },
                      ]}
                    >
                      {rt === 'hourly' ? 'Horaire' : rt === 'fixed' ? 'Fixe' : 'Projet'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Tarif ($)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={rate}
                onChangeText={setRate}
                placeholder="40"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Statut du contrat
              </Text>
              <View style={styles.statusOptions}>
                {(['standard', 'non-exclusive', 'exclusive', 'preferred'] as const).map((cs) => (
                  <Pressable
                    key={cs}
                    style={[
                      styles.statusChip,
                      { backgroundColor: colors.backgroundSecondary },
                      contractStatus === cs && { backgroundColor: `${colors.info}20` },
                    ]}
                    onPress={() => setContractStatus(cs)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        { color: colors.text },
                        contractStatus === cs && { color: colors.info },
                      ]}
                    >
                      {cs === 'standard' ? 'Standard' : 
                       cs === 'non-exclusive' ? 'Non-exclusif' : 
                       cs === 'exclusive' ? 'Exclusif' : 'Préféré'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Espace en bas */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: DESIGN_TOKENS.spacing.lg,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: DESIGN_TOKENS.spacing.xs,
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  input: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  optionsScroll: {
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  optionChip: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

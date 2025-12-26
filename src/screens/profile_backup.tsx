import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Design System Components
import {
    Body,
    H2,
    IconButton,
    Input,
    Label,
    PrimaryButton,
    SEMANTIC_SPACING,
    TextArea,
    useTheme
} from '../components/ui';

import { useUserProfile } from '../hooks/useUserProfile';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  placeholder,
  editable = true,
}) => {
  const Component = multiline ? TextArea : Input;
  
  return (
    <View style={{ marginBottom: SEMANTIC_SPACING.lg }}>
      <Label style={{ marginBottom: SEMANTIC_SPACING.xs }}>
        {label}
      </Label>
      <Component
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        keyboardType={keyboardType}
        editable={editable}
        variant={editable ? 'outlined' : 'filled'}
      />
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] === PROFILE COMPONENT RENDERING ===');
  
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, isLoading, error, updateProfile, refreshProfile, isUpdating } = useUserProfile();
  
  // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] Hook state:', {
    // hasProfile: !!profile,
    // profileId: profile?.id,
    // profileName: profile ? `${profile.firstName} ${profile.lastName}` : 'null',
    // isLoading,
    // hasError: !!error,
    // errorMessage: error,
    // isUpdating
  // });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    companyName: '',
    siret: '',
    tva: '',
  });

  // Update form data when profile loads
  React.useEffect(() => {
    // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] useEffect - Profile changed:', {
      // hasProfile: !!profile,
      // profileData: profile ? {
        // id: profile.id,
        // firstName: profile.firstName,
        // lastName: profile.lastName,
        // userType: profile.userType
      // } : null
    // });
    
    if (profile) {
      // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] Setting form data from profile...');
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        country: profile.country || '',
        companyName: profile.companyName || '',
        siret: profile.siret || '',
        tva: profile.tva || '',
      });
    }
  }, [profile]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {

      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        country: profile.country || '',
        companyName: profile.companyName || '',
        siret: profile.siret || '',
        tva: profile.tva || '',
      });
    }
    setIsEditing(false);
  };

  // Helper function to determine if user can see company section
  const canSeeCompanySection = (): boolean => {
    return profile?.userType === 'worker';
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SEMANTIC_SPACING.lg
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Body style={{ marginTop: SEMANTIC_SPACING.md, color: colors.text }}>
          Loading profile...
        </Body>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SEMANTIC_SPACING.lg
      }}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Body style={{ color: colors.error, textAlign: 'center', marginVertical: SEMANTIC_SPACING.md }}>
          {error}
        </Body>
        <PrimaryButton
          title="Retry"
          onPress={refreshProfile}
          style={{ marginTop: SEMANTIC_SPACING.lg }}
        />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SEMANTIC_SPACING.lg
      }}>
        <Body style={{ color: colors.text }}>
          No profile data available
        </Body>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header avec bouton retour - Style uniforme avec l'app */}
      <View style={{
        paddingTop: insets.top + SEMANTIC_SPACING.md,
        paddingHorizontal: SEMANTIC_SPACING.lg,
        paddingBottom: SEMANTIC_SPACING.md,
        backgroundColor: colors.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <IconButton
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="lg"
          />
          
          <H2 style={{ color: colors.text }}>
            Profile
          </H2>
          
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec avatar et informations principales + gamification */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={40} color={colors.primary} />
                <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.levelText, { color: colors.background }]}>
                    {profile.level || 1}
                  </Text>
                </View>
              </View>
              <View style={[styles.experienceBar, { backgroundColor: colors.backgroundTertiary }]}>
                <View style={[
                  styles.experienceProgress, 
                  { 
                    backgroundColor: colors.primary, 
                    width: `${((profile.experience || 0) / (profile.experienceToNextLevel || 1000)) * 100}%`
                  }
                ]} />
              </View>
              <Text style={[styles.experienceText, { color: colors.textMuted }]}>
                {profile.experience || 0} / {profile.experienceToNextLevel || 1000} XP to Level {(profile.level || 1) + 1}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.text }]}>
                {`${profile.firstName} ${profile.lastName}`}
              </Text>
              <View style={styles.titleRow}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[styles.userTitle, { color: colors.warning }]}>
                  {profile.title || 'Driver'} {profile.userType === 'worker' ? '(ABN)' : '(TFN)'}
                </Text>
              </View>
              <Text style={[styles.headerEmail, { color: colors.textSecondary }]}>
                {profile.email}
              </Text>
              {canSeeCompanySection() && profile.companyName && (
                <Text style={[styles.headerCompany, { color: colors.textMuted }]}>
                  {profile.companyName}
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name={isEditing ? "close" : "pencil"}
              size={20}
              color={colors.background}
            />
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>
          </View>

          <ProfileFormField
            label="First Name"
            value={formData.firstName}
            onChangeText={(text: string) => updateField('firstName', text)}
            placeholder="Enter your first name"
            editable={isEditing}
          />

          <ProfileFormField
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text: string) => updateField('lastName', text)}
            placeholder="Enter your last name"
            editable={isEditing}
          />

          <ProfileFormField
            label="Email"
            value={formData.email}
            onChangeText={(text: string) => updateField('email', text)}
            keyboardType="email-address"
            placeholder="Enter your email"
            editable={isEditing}
          />

          <ProfileFormField
            label="Phone"
            value={formData.phone}
            onChangeText={(text: string) => updateField('phone', text)}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
            editable={isEditing}
          />
        </View>

        {/* Address Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Address
            </Text>
          </View>

          <EditableField
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            multiline={true}
            placeholder="Enter your address"
            editable={isEditing}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <EditableField
                label="City"
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                placeholder="City"
                editable={isEditing}
              />
            </View>
            <View style={styles.rowItem}>
              <EditableField
                label="Postal Code"
                value={formData.postalCode}
                onChangeText={(text) => updateField('postalCode', text)}
                keyboardType="phone-pad"
                placeholder="Postal code"
                editable={isEditing}
              />
            </View>
          </View>

          <EditableField
            label="Country"
            value={formData.country}
            onChangeText={(text) => updateField('country', text)}
            placeholder="Enter your country"
            editable={isEditing}
          />
        </View>

        {/* Company Information Section - Only for workers (ABN) */}
        {canSeeCompanySection() && (
          <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Company Information (ABN)
              </Text>
            </View>

            <EditableField
              label="Company Name"
              value={formData.companyName}
              onChangeText={(text) => updateField('companyName', text)}
              placeholder="Enter your company name"
              editable={isEditing}
            />

            <EditableField
              label="SIRET"
              value={formData.siret}
              onChangeText={(text) => updateField('siret', text)}
              placeholder="Enter your SIRET number"
              editable={isEditing}
            />

            <EditableField
              label="VAT Number"
              value={formData.tva}
              onChangeText={(text) => updateField('tva', text)}
              placeholder="Enter your VAT number"
              editable={isEditing}
            />
          </View>
        )}

        {/* Boutons d'action en mode édition */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: colors.background }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Statistiques */}
        <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Statistiques du compte
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                15 mars 2024
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Membre depuis
              </Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                Aujourd'hui
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Dernière connexion
              </Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                47
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Jobs complétés
              </Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                3
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                En cours
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  experienceBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  experienceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  experienceText: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  headerCompany: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
    borderWidth: 1,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  disabledInput: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

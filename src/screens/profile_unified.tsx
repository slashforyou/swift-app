import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Utiliser le système unifié au lieu du design system avancé
import LanguageButton from '../components/calendar/LanguageButton';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useUserProfile } from '../hooks/useUserProfile';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
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
  const { colors } = useTheme();
  
  return (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: DESIGN_TOKENS.spacing.xs
      }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.backgroundSecondary,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          fontSize: 16,
          minHeight: multiline ? 100 : 50,
          textAlignVertical: multiline ? 'top' : 'center',
          opacity: editable ? 1 : 0.6,
        }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
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

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postalCode || '',
    country: profile?.country || '',
    companyName: profile?.companyName || '',
    siret: profile?.siret || '',
    tva: profile?.tva || '',
  });

  // Update form data when profile loads
  React.useEffect(() => {
    // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] useEffect - Profile changed:', {
      // hasProfile: !!profile,
      // profileData: profile ? {
        // id: profile.id,
        // firstName: profile.firstName,
        // lastName: profile.lastName,
        // email: profile.email,
        // phone: profile.phone,
      // } : null
    // });

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
  }, [profile]);

  // Handle form submission
  const handleSave = async () => {
    try {
      const result = await updateProfile(formData);
      if (result) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {

      console.error('Profile update error:', error);
      Alert.alert('Error', 'An error occurred while updating profile');
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
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
  };

  // Helper function to check if user is a worker
  const isWorker = () => {
    return profile?.userType === 'worker';
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_TOKENS.spacing.lg
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: DESIGN_TOKENS.spacing.md, 
          color: colors.text,
          fontSize: 16 
        }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_TOKENS.spacing.lg
      }}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={{ 
          color: colors.error, 
          textAlign: 'center', 
          marginVertical: DESIGN_TOKENS.spacing.md,
          fontSize: 16 
        }}>
          {error}
        </Text>
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            borderRadius: DESIGN_TOKENS.radius.md,
            marginTop: DESIGN_TOKENS.spacing.lg,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
          onPress={refreshProfile}
        >
          <Text style={{ 
            color: colors.background, 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_TOKENS.spacing.lg
      }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>
          No profile data available
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header unifié avec le style qu'on a standardisé */}
      <View style={{
        paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        paddingBottom: DESIGN_TOKENS.spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: colors.shadow,
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
          {/* Bouton retour circulaire uniforme */}
          <Pressable
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>

          {/* Titre centré */}
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            flex: 1,
            marginHorizontal: DESIGN_TOKENS.spacing.md,
          }}>
            Profile
          </Text>

          {/* LanguageButton circulaire uniforme */}
          <View style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <LanguageButton />
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.lg 
        }}
      >
        {/* Card principale avec le style unifié */}
        <View style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}>
          {/* Profile Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
            }}>
              {profile.firstName} {profile.lastName}
            </Text>
            
            {/* Edit/Save/Cancel buttons */}
            <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.sm }}>
              {isEditing ? (
                <>
                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: colors.error,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    onPress={handleCancel}
                    disabled={isUpdating}
                  >
                    <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: colors.success,
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      opacity: isUpdating ? 0.6 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    onPress={handleSave}
                    disabled={isUpdating}
                  >
                    <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* User Type Badge */}
          <View style={{
            backgroundColor: colors.primary + '15',
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.sm,
            alignSelf: 'flex-start',
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            <Text style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {profile.userType || 'User'}
            </Text>
          </View>

          {/* Form Fields */}
          <ProfileFormField
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            editable={isEditing}
          />

          <ProfileFormField
            label="Phone"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
            editable={isEditing}
          />

          <ProfileFormField
            label="Address"
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            multiline
            editable={isEditing}
          />

          <ProfileFormField
            label="City"
            value={formData.city}
            onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label="Postal Code"
            value={formData.postalCode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label="Country"
            value={formData.country}
            onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
            editable={isEditing}
          />

          {/* Company fields for business users */}
          {!isWorker() && (
            <>
              <ProfileFormField
                label="Company Name"
                value={formData.companyName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, companyName: text }))}
                editable={isEditing}
              />

              <ProfileFormField
                label="SIRET"
                value={formData.siret}
                onChangeText={(text) => setFormData(prev => ({ ...prev, siret: text }))}
                editable={isEditing}
              />

              <ProfileFormField
                label="TVA"
                value={formData.tva}
                onChangeText={(text) => setFormData(prev => ({ ...prev, tva: text }))}
                editable={isEditing}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
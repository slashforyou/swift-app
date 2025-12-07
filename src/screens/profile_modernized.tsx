import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Design System Components
import {
    Body,
    Caption,
    Card,
    H2,
    IconButton,
    Input,
    Label,
    PrimaryButton,
    SecondaryButton,
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
  console.log('🔍 [PROFILE SCREEN] === PROFILE COMPONENT RENDERING ===');
  
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { profile, isLoading, error, updateProfile, refreshProfile, isUpdating } = useUserProfile();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    companyName: profile?.companyName || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postalCode || '',
    hasError: !!error,
    errorMessage: error,
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        companyName: profile.companyName || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        hasError: false,
        errorMessage: null,
      });
    }
  }, [profile]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    try {
      console.log('💾 Saving profile changes...', formData);
      await updateProfile(profile.id, formData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        companyName: profile.companyName || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        hasError: false,
        errorMessage: null,
      });
    }
    setIsEditing(false);
  };

  const isWorkerProfile = () => {
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
        paddingHorizontal: SEMANTIC_SPACING.lg
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Body style={{ marginTop: SEMANTIC_SPACING.md, color: colors.text }}>
          Loading profile...
        </Body>
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
        paddingHorizontal: SEMANTIC_SPACING.lg
      }}>
        <Body style={{ color: colors.text }}>
          No profile data available
        </Body>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SEMANTIC_SPACING.lg,
          paddingTop: SEMANTIC_SPACING.xl,
          paddingBottom: SEMANTIC_SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec avatar et informations principales */}
        <Card variant="elevated" style={{ marginBottom: SEMANTIC_SPACING.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SEMANTIC_SPACING.lg,
          }}>
            <View style={{
              alignItems: 'center',
              marginRight: SEMANTIC_SPACING.lg,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SEMANTIC_SPACING.sm,
              }}>
                <Body style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold',
                  color: colors.buttonPrimaryText 
                }}>
                  {(formData.firstName?.[0] || '').toUpperCase()}
                  {(formData.lastName?.[0] || '').toUpperCase()}
                </Body>
              </View>
              <IconButton
                icon="camera"
                size="sm"
                variant="primary"
                onPress={() => Alert.alert('Photo', 'Photo upload coming soon')}
              />
            </View>
            
            <View style={{ flex: 1 }}>
              <H2 style={{ color: colors.text, marginBottom: SEMANTIC_SPACING.xs }}>
                {formData.firstName} {formData.lastName}
              </H2>
              <Body style={{ color: colors.textSecondary }}>
                {formData.email}
              </Body>
              {formData.companyName && (
                <Caption style={{ color: colors.textMuted, marginTop: SEMANTIC_SPACING.xs }}>
                  {formData.companyName}
                </Caption>
              )}
            </View>

            <IconButton
              icon={isEditing ? 'close' : 'create'}
              variant={isEditing ? 'secondary' : 'primary'}
              onPress={() => isEditing ? handleCancel() : setIsEditing(true)}
            />
          </View>
        </Card>

        {/* Personal Information Section */}
        <Card variant="outlined" style={{ marginBottom: SEMANTIC_SPACING.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SEMANTIC_SPACING.lg,
          }}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <H2 style={{ 
              color: colors.text, 
              marginLeft: SEMANTIC_SPACING.sm,
              fontSize: 16,
              fontWeight: '600'
            }}>
              Personal Information
            </H2>
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
            editable={false} // Email is usually not editable
          />

          <ProfileFormField
            label="Phone"
            value={formData.phone}
            onChangeText={(text: string) => updateField('phone', text)}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
            editable={isEditing}
          />
        </Card>

        {/* Address Section */}
        <Card variant="outlined" style={{ marginBottom: SEMANTIC_SPACING.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SEMANTIC_SPACING.lg,
          }}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <H2 style={{ 
              color: colors.text, 
              marginLeft: SEMANTIC_SPACING.sm,
              fontSize: 16,
              fontWeight: '600'
            }}>
              Address
            </H2>
          </View>

          <ProfileFormField
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            multiline={true}
            placeholder="Enter your address"
            editable={isEditing}
          />

          <View style={{
            flexDirection: 'row',
            marginHorizontal: -SEMANTIC_SPACING.sm,
          }}>
            <View style={{
              flex: 1,
              marginHorizontal: SEMANTIC_SPACING.sm,
            }}>
              <ProfileFormField
                label="City"
                value={formData.city}
                onChangeText={(text: string) => updateField('city', text)}
                placeholder="City"
                editable={isEditing}
              />
            </View>
            <View style={{
              flex: 1,
              marginHorizontal: SEMANTIC_SPACING.sm,
            }}>
              <ProfileFormField
                label="Postal Code"
                value={formData.postalCode}
                onChangeText={(text: string) => updateField('postalCode', text)}
                keyboardType="phone-pad"
                placeholder="Postal code"
                editable={isEditing}
              />
            </View>
          </View>
        </Card>

        {/* Company Section - If user is business */}
        {!isWorkerProfile() && (
          <Card variant="outlined" style={{ marginBottom: SEMANTIC_SPACING.xl }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SEMANTIC_SPACING.lg,
            }}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
              <H2 style={{ 
                color: colors.text, 
                marginLeft: SEMANTIC_SPACING.sm,
                fontSize: 16,
                fontWeight: '600'
              }}>
                Company Information
              </H2>
            </View>

            <ProfileFormField
              label="Company Name"
              value={formData.companyName}
              onChangeText={(text: string) => updateField('companyName', text)}
              placeholder="Enter your company name"
              editable={isEditing}
            />
          </Card>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <View style={{
            flexDirection: 'row',
            gap: SEMANTIC_SPACING.md,
            marginTop: SEMANTIC_SPACING.lg,
          }}>
            <SecondaryButton
              title="Cancel"
              onPress={handleCancel}
              style={{ flex: 1 }}
              disabled={isUpdating}
            />
            <PrimaryButton
              title={isUpdating ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              style={{ flex: 1 }}
              disabled={isUpdating}
              loading={isUpdating}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
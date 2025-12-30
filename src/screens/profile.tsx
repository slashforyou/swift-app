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
import { useTranslation } from '../localization/useLocalization';

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
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: DESIGN_TOKENS.spacing.md,
          fontSize: 16,
          color: colors.inputText,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          minHeight: multiline ? 100 : 50,
          opacity: editable ? 1 : 0.7
        }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, isLoading, updateProfile } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);

  // Form data state - uniquement les champs utilisateur
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postalCode || '',
    country: profile?.country || '',
  });

  // Update form data when profile loads
  React.useEffect(() => {
    console.log('🔍 [PROFILE SCREEN] useEffect - Profile changed:', {
      hasProfile: !!profile,
      profileData: profile ? {
        id: profile.id,
        firstName: profile.firstName,
        email: profile.email,
        phone: profile.phone,
      } : null
    });

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
      });
    }
  }, [profile]);

  // Handle form submission
  const handleSave = async () => {
    try {
      const result = await updateProfile(formData);
      if (result) {
        setIsEditing(false);
        Alert.alert(t('common.success'), t('profile.messages.updateSuccess'));
      } else {
        Alert.alert(t('common.error'), t('profile.messages.updateError'));
      }
    } catch (error) {

      console.error('❌ [PROFILE] Error updating profile:', error);
      Alert.alert(t('common.error'), t('profile.messages.updateError'));
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
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
      });
    }
    setIsEditing(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: DESIGN_TOKENS.spacing.md, 
          color: colors.text, 
          fontSize: 16 
        }}>
          {t('profile.loading')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top
    }}>
      {/* Header avec bouton retour circulaire et LanguageButton */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        paddingVertical: DESIGN_TOKENS.spacing.md,
        backgroundColor: colors.backgroundTertiary,
        borderBottomWidth: 1,
        borderBottomColor: colors.inputBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Pressable
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20, // Bouton circulaire
            backgroundColor: colors.backgroundSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }], // Micro-interaction
          })}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={20} 
            color={colors.text} 
          />
        </Pressable>

        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          flex: 1,
          marginHorizontal: DESIGN_TOKENS.spacing.md
        }}>
          {t('profile.title')}
        </Text>

        <LanguageButton />
      </View>

      <ScrollView 
        style={{ 
          flex: 1,
          backgroundColor: colors.background 
        }}
        contentContainerStyle={{ 
          padding: DESIGN_TOKENS.spacing.lg 
        }}
      >
        {/* Card contenant tous les champs */}
        <View style={{
          backgroundColor: colors.backgroundTertiary,
          borderRadius: 16,
          padding: DESIGN_TOKENS.spacing.lg,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: DESIGN_TOKENS.spacing.lg
        }}>
          {/* Section informations personnelles */}
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.lg
          }}>
            {t('profile.personalInfo')}
          </Text>

          <ProfileFormField
            label={t('profile.fields.firstName')}
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.lastName')}
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.email')}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.phone')}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.address')}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.city')}
            value={formData.city}
            onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.postalCode')}
            value={formData.postalCode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
            keyboardType="numeric"
            editable={isEditing}
          />

          <ProfileFormField
            label={t('profile.fields.country')}
            value={formData.country}
            onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
            editable={isEditing}
          />
        </View>

        {/* Boutons d'action */}
        {isEditing ? (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: DESIGN_TOKENS.spacing.lg
          }}>
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                marginRight: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.buttonDisabled,
                borderRadius: 12,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              onPress={handleCancel}
            >
              <Text style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: '600'
              }}>
                {t('profile.actions.cancel')}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                marginLeft: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              onPress={handleSave}
            >
              <Text style={{
                color: colors.buttonPrimaryText,
                fontSize: 16,
                fontWeight: '600'
              }}>
                {t('profile.actions.save')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: DESIGN_TOKENS.spacing.lg,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
            onPress={() => setIsEditing(true)}
          >
            <Text style={{
              color: colors.buttonPrimaryText,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {t('profile.actions.edit')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
// hooks/useUserProfile.ts
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { fetchUserProfile, updateUserProfile, UpdateUserProfile, UserProfile } from '../services/user';
import { getMockProfile } from '../services/userMockData';

// Development mode - set to true to use mock data
const USE_MOCK_DATA = false;

interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: UpdateUserProfile) => Promise<boolean>;
  isUpdating: boolean;
  isSessionExpired: boolean;
}

export const useUserProfile = (): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const navigation = useNavigation();

  // Fonction pour gérer la redirection en cas de session expirée
  const handleSessionExpired = () => {
    setIsSessionExpired(true);
    
    Alert.alert(
      '🔐 Session expirée',
      'Votre session a expiré. Vous allez être redirigé vers la connexion.',
      [
        {
          text: 'OK',
          onPress: () => {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'Connection' }],
            });
          }
        }
      ]
    );
  };

  const loadProfile = async () => {
    try {
      // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] === STARTING PROFILE LOAD ===');
      // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 1: Setting loading state...');
      setIsLoading(true);
      setError(null);
      
      // TEMP_DISABLED: console.log('� [PROFILE LOAD] Step 2: Checking USE_MOCK_DATA flag:', USE_MOCK_DATA);
      
      let userProfile: UserProfile;
      
      if (USE_MOCK_DATA) {const mockType = Math.random() > 0.5 ? 'employee' : 'worker';
        // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 4: Selected mock type:', mockType);
        
        userProfile = getMockProfile(mockType);
        // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 5: Mock profile generated:', {
          // id: userProfile.id,
          // firstName: userProfile.firstName,
          // lastName: userProfile.lastName,
          // userType: userProfile.userType,
          // email: userProfile.email
        // });
        
        // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 6: Simulating API delay (1000ms)...');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 7: API delay completed');
      } else {
        userProfile = await fetchUserProfile();
        // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 5: Real API profile received:', {
          // id: userProfile.id,
          // firstName: userProfile.firstName,
          // lastName: userProfile.lastName,
          // userType: userProfile.userType,
          // email: userProfile.email
        // });
      }
      
      // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] Step 8: Setting profile state...');
      setProfile(userProfile);
      // TEMP_DISABLED: console.log('🔍 [PROFILE LOAD] ✅ SUCCESS: Profile loaded and state updated');
      
    } catch (err) {

      let errorMessage = 'Erreur lors du chargement du profil';
      
      if (err instanceof Error) {
        console.error('❌ Error loading user profile:', err);
        
        // Gestion spéciale pour SESSION_EXPIRED
        if (err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        
        if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = '🔐 Session expirée. Reconnexion nécessaire.';
        } else if (err.message.includes('Network')) {
          errorMessage = '📡 Problème de connexion réseau.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    // Reset session expired state on manual refresh
    setIsSessionExpired(false);
    await loadProfile();
  };

  const updateProfile = async (updates: UpdateUserProfile): Promise<boolean> => {
    try {
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] === STARTING PROFILE UPDATE ===');
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 1: Setting updating state...');
      setIsUpdating(true);
      setError(null);
      
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 2: Update data received:', updates);
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 3: Current profile state:', profile ? {
      //   id: profile.id,
      //   firstName: profile.firstName,
      //   lastName: profile.lastName,
      //   email: profile.email
      // } : 'null');
      
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 4: Checking USE_MOCK_DATA flag:', USE_MOCK_DATA);
      
      let updatedProfile: UserProfile;
      
      if (USE_MOCK_DATA) {if (!profile) {
          // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] ❌ ERROR: No current profile to update');
          return false;
        }
        
        // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 6: Merging updates with current profile...');
        updatedProfile = {
          ...profile,
          ...updates,
          preferences: updates.preferences ? {
            ...profile.preferences,
            ...updates.preferences,
          } : profile.preferences,
        };
        
        // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 7: Mock update merged:', {
          // original: { firstName: profile.firstName, lastName: profile.lastName },
          // updates: updates,
          // result: { firstName: updatedProfile.firstName, lastName: updatedProfile.lastName }
        // });
        
        // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 8: Simulating API delay (500ms)...');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 9: Mock API delay completed');
      } else {
        updatedProfile = await updateUserProfile(updates);
        // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 7: Real API update completed');
      }
      
      // TEMP_DISABLED: console.log('🔍 [PROFILE UPDATE] Step 10: Setting updated profile state...');
      setProfile(updatedProfile);
      // TEMP_DISABLED: console.log('✅ Profile updated successfully');
      
      return true;
      
    } catch (err) {

      let errorMessage = 'Erreur lors de la mise à jour du profil';
      
      if (err instanceof Error) {
        console.error('❌ Error updating user profile:', err);
        
        // Gestion spéciale pour SESSION_EXPIRED
        if (err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return false;
        }
        
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
      
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    isUpdating,
    isSessionExpired,
  };
};
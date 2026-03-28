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
      setIsLoading(true);
      setError(null);
      
      
      let userProfile: UserProfile;
      
      if (USE_MOCK_DATA) {const mockType = Math.random() > 0.5 ? 'employee' : 'worker';
        
        userProfile = getMockProfile(mockType);
          // id: userProfile.id,
          // firstName: userProfile.firstName,
          // lastName: userProfile.lastName,
          // userType: userProfile.userType,
          // email: userProfile.email
        // });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        userProfile = await fetchUserProfile();
          // id: userProfile.id,
          // firstName: userProfile.firstName,
          // lastName: userProfile.lastName,
          // userType: userProfile.userType,
          // email: userProfile.email
        // });
      }
      
      setProfile(userProfile);
      
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
      setIsUpdating(true);
      setError(null);
      
      //   id: profile.id,
      //   firstName: profile.firstName,
      //   lastName: profile.lastName,
      //   email: profile.email
      // } : 'null');
      
      
      let updatedProfile: UserProfile;
      
      if (USE_MOCK_DATA) {if (!profile) {
          return false;
        }
        
        updatedProfile = {
          ...profile,
          ...updates,
          preferences: updates.preferences ? {
            ...profile.preferences,
            ...updates.preferences,
          } : profile.preferences,
        };
        
          // original: { firstName: profile.firstName, lastName: profile.lastName },
          // updates: updates,
          // result: { firstName: updatedProfile.firstName, lastName: updatedProfile.lastName }
        // });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        updatedProfile = await updateUserProfile(updates);
      }
      
      setProfile(updatedProfile);
      
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

// services/user.ts
import { getAuthHeaders, authenticatedFetch } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

const API = ServerData.serverUrl;

export type UserType = 'employee' | 'worker';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  userType: UserType; // employee (TFN) or worker (ABN)
  
  // Address information
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  
  // Company information (only for workers with ABN)
  companyName?: string;
  siret?: string;
  tva?: string;
  
  // General info
  joinDate: string;
  lastLogin?: string;
  profilePicture?: string;
  
  // Gamification
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
  title?: string;
  
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
  };
  permissions?: string[];
  isActive: boolean;
}

export interface UserStats {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  level: number;
  experience: number;
  badges: string[];
  achievements: string[];
}

export interface UpdateUserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  
  // Address
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  
  // Company info (for workers only)
  companyName?: string;
  siret?: string;
  tva?: string;
  
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
  };
}

/**
 * Récupère les informations du profil utilisateur
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  console.log('� [API FETCH] === STARTING API PROFILE FETCH ===');
  console.log('🔍 [API FETCH] Step 1: Preparing API call to:', `${API}v1/user/profile`);
  console.log('🔍 [API FETCH] Step 2: Using authenticatedFetch (with token refresh)...');
  
  // Utilise authenticatedFetch qui gère le refresh automatique
  const res = await authenticatedFetch(`${API}v1/user/profile`, {
    method: 'GET',
  });
  
  console.log('🔍 [API FETCH] Step 3: API response received - Status:', res.status, 'OK:', res.ok);

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for ${API}v1/user/profile`);
    const error = await res.json().catch(() => ({ message: 'Failed to fetch user profile' }));
    console.error('❌ Response body:', error);
    
    // Gestion spécifique des erreurs selon la nouvelle API
    if (res.status === 401) {
      throw new Error('🔐 Token invalide ou expiré. Veuillez vous reconnecter.');
    } else if (res.status === 403) {
      throw new Error('� Accès refusé. Permissions insuffisantes.');
    } else if (res.status === 500) {
      throw new Error('🔧 Erreur serveur. Veuillez réessayer plus tard.');
    }
    
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch user profile`);
  }

  console.log('🔍 [API FETCH] ✅ Step 4: API call SUCCESS - Parsing response...');
  let data;
  try {
    data = await res.json();
    console.log('🔍 [API FETCH] Step 5: Response JSON parsed successfully');
    console.log('✅ User profile fetched:', data);
  } catch (parseError) {
    console.log('🔍 [API FETCH] ❌ Step 5: Failed to parse JSON response:', parseError);
    throw new Error('Failed to parse server response');
  }
  
  // L'API peut retourner soit { success: true, user: {...} } soit { user: {...} }
  console.log('🔍 [API FETCH] Step 6: Validating response format...');
  console.log('🔍 [API FETCH] - success:', data.success);
  console.log('🔍 [API FETCH] - user exists:', !!data.user);
  
  // Accepter les deux formats de réponse
  if (!data.user) {
    console.log('🔍 [API FETCH] ❌ Step 7: No user data in response');
    throw new Error('No user data received from server');
  }
  
  // Si success existe, il doit être true
  if (data.success !== undefined && !data.success) {
    console.log('🔍 [API FETCH] ❌ Step 7: API returned success: false');
    throw new Error('API returned unsuccessful response');
  }
  
  console.log('🔍 [API FETCH] Step 7: Response format valid, normalizing user data...');
  // Normaliser les données reçues
  const normalizedProfile = normalizeUserProfile(data.user);
  console.log('🔍 [API FETCH] ✅ Step 8: Profile normalized successfully:', {
    id: normalizedProfile.id,
    firstName: normalizedProfile.firstName,
    lastName: normalizedProfile.lastName,
    email: normalizedProfile.email
  });
  
  return normalizedProfile;
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(updates: UpdateUserProfile): Promise<UserProfile> {
  console.log('🔄 Updating user profile...', updates);
  
  // Utilise authenticatedFetch qui gère le refresh automatique
  const res = await authenticatedFetch(`${API}v1/user/profile`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for profile update`);
    const error = await res.json().catch(() => ({ message: 'Failed to update user profile' }));
    console.error('❌ Response body:', error);
    
    // Gestion spécifique des erreurs
    if (res.status === 400) {
      throw new Error('📝 Données manquantes ou invalides.');
    } else if (res.status === 409) {
      throw new Error('📧 Email déjà utilisé par un autre compte.');
    } else if (res.status === 401) {
      throw new Error('🔐 Token invalide. Veuillez vous reconnecter.');
    }
    
    throw new Error(error.message || `HTTP ${res.status}: Failed to update user profile`);
  }

  const data = await res.json();
  console.log('✅ User profile updated:', data);
  
  if (!data.success || !data.user) {
    throw new Error('Invalid response format from server');
  }
  
  return normalizeUserProfile(data.user);
}

/**
 * Normalise les données utilisateur reçues de l'API
 */
function normalizeUserProfile(apiData: any): UserProfile {
  return {
    id: apiData.id?.toString() || '',
    firstName: apiData.firstName || apiData.first_name || '',
    lastName: apiData.lastName || apiData.last_name || '',
    email: apiData.email || '',
    phone: apiData.phone || '',
    role: apiData.role || 'user',
    userType: apiData.userType || apiData.user_type || 'employee',
    
    // Address
    address: apiData.address || '',
    city: apiData.city || '',
    postalCode: apiData.postalCode || apiData.postal_code || '',
    country: apiData.country || '',
    
    // Company info (for workers with ABN)
    companyName: apiData.companyName || apiData.company_name || '',
    siret: apiData.siret || '',
    tva: apiData.tva || apiData.vat_number || '',
    
    // General
    joinDate: apiData.joinDate || apiData.join_date || apiData.created_at || '',
    lastLogin: apiData.lastLogin || apiData.last_login || '',
    profilePicture: apiData.profilePicture || apiData.profile_picture || '',
    
    // Gamification
    level: apiData.level || 1,
    experience: apiData.experience || 0,
    experienceToNextLevel: apiData.experienceToNextLevel || apiData.experience_to_next_level || 1000,
    title: apiData.title || 'New Driver',
    
    preferences: {
      theme: apiData.preferences?.theme || 'auto',
      language: apiData.preferences?.language || 'en',
      notifications: apiData.preferences?.notifications !== false,
    },
    permissions: apiData.permissions || [],
    isActive: apiData.isActive !== false,
  };
}

/**
 * Récupère les statistiques détaillées de l'utilisateur
 */
export async function fetchUserStats(): Promise<UserStats> {
  console.log('📊 Fetching user statistics...');
  
  // Utilise authenticatedFetch qui gère le refresh automatique
  const res = await authenticatedFetch(`${API}v1/user/stats`, {
    method: 'GET',
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for ${API}v1/user/stats`);
    const error = await res.json().catch(() => ({ message: 'Failed to fetch user stats' }));
    console.error('❌ Response body:', error);
    
    if (res.status === 401) {
      throw new Error('🔐 Token invalide ou expiré. Veuillez vous reconnecter.');
    } else if (res.status === 403) {
      throw new Error('🚫 Accès refusé. Permissions insuffisantes.');
    }
    
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch user stats`);
  }

  const data = await res.json();
  console.log('✅ User stats fetched:', data);
  
  if (!data.success || !data.stats) {
    throw new Error('Invalid response format from server');
  }
  
  return data.stats;
}
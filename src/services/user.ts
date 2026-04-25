﻿// services/user.ts
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";
import { fetchWithAuth } from "../utils/session";

const API = ServerData.serverUrl;

let profileRequestInFlight: Promise<UserProfile> | null = null;
let profileFailureCooldownUntil = 0;
let lastProfileError: Error | null = null;
const PROFILE_FAILURE_COOLDOWN_MS = 4000;

export type UserType = "employee" | "worker";

// Company roles for the new backend system
export type CompanyRole = "patron" | "cadre" | "employee";

export interface Company {
  id: number;
  name: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  userType: UserType; // employee (TFN) or worker (ABN)

  // New company relationship fields (API v1.1.0)
  company_id?: number;
  company_role?: CompanyRole;
  company?: Company | null;

  // Address information
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;

  // Company information (only for workers with ABN) - DEPRECATED, use company field instead
  companyName?: string;
  siret?: string;
  tva?: string;

  // General info
  joinDate: string;
  lastLogin?: string;
  profilePicture?: string;
  avatarId?: string;

  // Gamification
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
  title?: string;

  preferences?: {
    theme: "light" | "dark" | "auto";
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

  // Avatar
  avatarId?: string;

  preferences?: {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: boolean;
  };
}

/**
 * Récupère les informations du profil utilisateur
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  if (profileRequestInFlight) {
    return profileRequestInFlight;
  }

  if (Date.now() < profileFailureCooldownUntil && lastProfileError) {
    throw lastProfileError;
  }

  profileRequestInFlight = (async () => {

    // Utilise authenticatedFetch qui gère le refresh automatique
    const res = await authenticatedFetch(`${API}v1/user/profile`, {
      method: "GET",
    });


    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} response for ${API}v1/user/profile`);
      const error = await res
        .json()
        .catch(() => ({ message: "Failed to fetch user profile" }));
      console.error("❌ Response body:", error);

      // Fallback de résilience: si /user/profile est cassé côté serveur,
      // tenter /auth/me puis les données de session locales.
      if (res.status >= 500) {
        const fallbackProfile = await fetchUserProfileFallback();
        if (fallbackProfile) {
          return fallbackProfile;
        }
      }

      // Gestion spécifique des erreurs selon la nouvelle API
      if (res.status === 401) {
        throw new Error(
          "🔐 Token invalide ou expiré. Veuillez vous reconnecter.",
        );
      } else if (res.status === 403) {
        throw new Error("🚫 Accès refusé. Permissions insuffisantes.");
      } else if (res.status === 500) {
        throw new Error("🔧 Erreur serveur. Veuillez réessayer plus tard.");
      }

      throw new Error(
        error.message || `HTTP ${res.status}: Failed to fetch user profile`,
      );
    }

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      throw new Error("Failed to parse server response");
    }

    // L'API peut retourner soit { success: true, user: {...} } soit { user: {...} }

    // console.log("🔍 [API FETCH] Raw user data from API:", { ... });

    // Accepter les deux formats de réponse
    if (!data.user) {
      throw new Error("No user data received from server");
    }

    // Si success existe, il doit être true
    if (data.success !== undefined && !data.success) {
      throw new Error("API returned unsuccessful response");
    }

    // Normaliser les données reçues
    const normalizedProfile = normalizeUserProfile(data.user);
    // id: normalizedProfile.id,
    // firstName: normalizedProfile.firstName,
    // lastName: normalizedProfile.lastName,
    // email: normalizedProfile.email
    // });

    profileFailureCooldownUntil = 0;
    lastProfileError = null;

    return normalizedProfile;
  })();

  try {
    return await profileRequestInFlight;
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error("Failed to fetch user profile");
    lastProfileError = normalizedError;
    profileFailureCooldownUntil = Date.now() + PROFILE_FAILURE_COOLDOWN_MS;
    throw normalizedError;
  } finally {
    profileRequestInFlight = null;
  }
}

async function fetchUserProfileFallback(): Promise<UserProfile | null> {
  try {
    const meRes = await authenticatedFetch(`${API}auth/me`, {
      method: "GET",
      headers: {
        "x-client": "mobile",
      },
    });

    if (meRes.ok) {
      const meData = await meRes.json().catch(() => null);
      const meUser = meData?.user || meData?.data || meData;
      if (meUser && typeof meUser === "object") {
        return normalizeUserProfile(meUser);
      }
    }
  } catch {
    // fallback local below
  }

  try {
    const userDataStr =
      (await SecureStore.getItemAsync("user_data")) ||
      (await SecureStore.getItemAsync("userData"));

    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData && typeof userData === "object") {
        return normalizeUserProfile(userData);
      }
    }
  } catch {
    // no-op
  }

  return null;
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(
  updates: UpdateUserProfile,
): Promise<UserProfile> {

  // Utilise authenticatedFetch qui gère le refresh automatique
  const res = await authenticatedFetch(`${API}v1/user/profile`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for profile update`);
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to update user profile" }));
    console.error("❌ Response body:", error);

    // Gestion spécifique des erreurs
    if (res.status === 400) {
      throw new Error("📝 Données manquantes ou invalides.");
    } else if (res.status === 409) {
      throw new Error("📧 Email déjà utilisé par un autre compte.");
    } else if (res.status === 401) {
      throw new Error("🔐 Token invalide. Veuillez vous reconnecter.");
    }

    throw new Error(
      error.message || `HTTP ${res.status}: Failed to update user profile`,
    );
  }

  const data = await res.json();

  // ✅ FIX: Accepter plusieurs formats de réponse API (comme fetchUserProfile)
  // Format 1: { success: true, user: {...} }
  // Format 2: { user: {...} }
  // Format 3: { data: {...} } (nouveau format possible)
  // Format 4: données utilisateur directement dans data

  const userData = data.user || data.data || (data.id ? data : null);

  if (!userData) {
    console.error(
      "❌ [updateUserProfile] Invalid response format:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("Invalid response format from server");
  }

  // Si success existe explicitement à false, c'est une erreur
  if (data.success === false) {
    throw new Error(data.message || "Update failed");
  }

  return normalizeUserProfile(userData);
}

/**
 * Normalise les données utilisateur reçues de l'API
 */
function normalizeUserProfile(apiData: any): UserProfile {
  return {
    id: apiData.id?.toString() || "",
    firstName: apiData.firstName || apiData.first_name || "",
    lastName: apiData.lastName || apiData.last_name || "",
    email: apiData.email || "",
    phone: apiData.phone || "",
    role: apiData.role || "user",
    userType: apiData.userType || apiData.user_type || "employee",

    // New company relationship fields (API v1.1.0)
    company_id: apiData.company_id || apiData.companyId || apiData.company?.id,
    company_role: apiData.company_role,
    company: apiData.company,

    // Address
    address: apiData.address || "",
    city: apiData.city || "",
    postalCode: apiData.postalCode || apiData.postal_code || "",
    country: apiData.country || "",

    // Company info (for workers with ABN) - DEPRECATED, use company field instead
    companyName:
      apiData.companyName ||
      apiData.company_name ||
      apiData.company?.name ||
      "",
    siret: apiData.siret || "",
    tva: apiData.tva || apiData.vat_number || "",

    // General
    joinDate: apiData.joinDate || apiData.join_date || apiData.created_at || "",
    lastLogin: apiData.lastLogin || apiData.last_login || "",
    profilePicture: apiData.profilePicture || apiData.profile_picture || "",
    avatarId:
      apiData.avatarId || apiData.avatar_id || apiData.avatar_url || undefined,

    // Gamification
    level: apiData.level || 1,
    experience: apiData.experience || 0,
    experienceToNextLevel:
      apiData.experienceToNextLevel || apiData.experience_to_next_level || 1000,
    title: apiData.title || "New Driver",

    preferences: {
      theme: apiData.preferences?.theme || "auto",
      language: apiData.preferences?.language || "en",
      notifications: apiData.preferences?.notifications !== false,
    },
    permissions: apiData.permissions || [],
    isActive: apiData.isActive !== false,
  };
}

/**
 * Change le mot de passe de l'utilisateur
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/user/change-password`, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to change password" }));
    if (res.status === 401) {
      throw new Error("Mot de passe actuel incorrect.");
    }
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to change password`,
    );
  }
}

/**
 * Demande un changement d'email (envoie un lien de confirmation)
 */
export async function requestEmailChange(newEmail: string): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/user/change-email`, {
    method: "POST",
    body: JSON.stringify({ newEmail }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to request email change" }));
    if (res.status === 409) {
      throw new Error("Cet email est déjà utilisé par un autre compte.");
    }
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to request email change`,
    );
  }
}

/**
 * Récupère les statistiques détaillées de l'utilisateur
 */
export async function fetchUserStats(): Promise<UserStats> {

  // Utilise authenticatedFetch qui gère le refresh automatique
  const res = await authenticatedFetch(`${API}v1/user/stats`, {
    method: "GET",
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for ${API}v1/user/stats`);
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch user stats" }));
    console.error("❌ Response body:", error);

    if (res.status === 401) {
      throw new Error(
        "🔐 Token invalide ou expiré. Veuillez vous reconnecter.",
      );
    } else if (res.status === 403) {
      throw new Error("🚫 Accès refusé. Permissions insuffisantes.");
    }

    throw new Error(
      error.message || `HTTP ${res.status}: Failed to fetch user stats`,
    );
  }

  const data = await res.json();

  if (!data.success || !data.stats) {
    throw new Error("Invalid response format from server");
  }

  return data.stats;
}

export async function deleteUserAccount(): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/user/account`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to delete account" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to delete account`,
    );
  }
}

/**
 * Upload a custom profile picture (photo from camera or gallery)
 */
export async function uploadUserAvatar(
  imageUri: string,
): Promise<{ success: boolean; profile_picture?: string }> {
  try {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("avatar", {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);

    const response = await fetchWithAuth(`${API}v1/user/avatar`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, profile_picture: data.profile_picture };
  } catch (error) {
    console.error("[UserService] Error uploading avatar:", error);
    return { success: false };
  }
}

/**
 * Delete the user's custom profile picture
 */
export async function deleteUserAvatar(): Promise<boolean> {
  try {
    const response = await fetchWithAuth(`${API}v1/user/avatar`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("[UserService] Error deleting avatar:", error);
    return false;
  }
}

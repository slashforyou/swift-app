/**
 * Business Owner Service
 *
 * Handles business owner profile completion after initial registration
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ServerData } from "../constants/ServerData";

const PENDING_PROFILE_KEY = "@pending_business_owner_profile";

/**
 * Complete business owner profile with data from Steps 2-7
 *
 * @param sessionToken - User's session token from login
 * @returns API response with businessOwnerId and stripe details
 */
export async function completeBusinessOwnerProfile(sessionToken: string) {
  console.log("[BUSINESS_OWNER] Starting profile completion...");

  // Get pending profile data from AsyncStorage
  const pendingDataStr = await AsyncStorage.getItem(PENDING_PROFILE_KEY);

  if (!pendingDataStr) {
    console.log("[BUSINESS_OWNER] No pending profile data found");
    throw new Error("No pending profile data found");
  }

  const profileData = JSON.parse(pendingDataStr);
  console.log("[BUSINESS_OWNER] Loaded profile data from storage");

  // Call API endpoint
  console.log("[BUSINESS_OWNER] Calling /business-owner/complete-profile...");
  const response = await fetch(
    `${ServerData.serverUrl}business-owner/complete-profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    },
  );

  const data = await response.json();
  console.log("[BUSINESS_OWNER] Response:", response.status, data);

  if (response.status === 200 && data.success) {
    // Success: remove pending data
    await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
    console.log("[BUSINESS_OWNER] ✅ Profile completed successfully");
    return data;
  } else {
    // Error: keep data for retry
    const errorMsg = data.message || "Failed to complete profile";
    console.error("[BUSINESS_OWNER] ❌ Error:", errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Check if there is pending business owner profile data
 *
 * @returns true if pending data exists
 */
export async function hasPendingProfile(): Promise<boolean> {
  const pendingData = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
  return pendingData !== null;
}

/**
 * Get pending profile data (for display/review)
 *
 * @returns Pending profile data or null
 */
export async function getPendingProfile() {
  const pendingDataStr = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
  if (!pendingDataStr) return null;
  return JSON.parse(pendingDataStr);
}

/**
 * Clear pending profile data (use with caution)
 */
export async function clearPendingProfile() {
  await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
  console.log("[BUSINESS_OWNER] Pending profile data cleared");
}

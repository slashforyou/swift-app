// services/auth.ts
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { collectDevicePayload } from "./device";

const API = ServerData.serverUrl;

export async function login(mail: string, password: string) {
  console.log("🔐 [AUTH] Starting login for:", mail);
  
  const device = await collectDevicePayload();

  if (!device) throw new Error("device_info_unavailable");
  
  console.log("🔐 [AUTH] Device info collected, making API call...");

  const res = await fetch(`${API}auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client": "mobile" },
    body: JSON.stringify({
      mail,
      password,
      device,
      wantRefreshInBody: true,
    }),
  });

  console.log("🔐 [AUTH] API response:", { status: res.status, ok: res.ok });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    console.log("🔐 [AUTH] Error response body:", e);
    // Log pour debug serveur
    if (e?.details?.error === "Too many connections") {
      console.warn(
        "⚠️ [LOGIN] Server database overloaded - Too many connections",
      );
    }

    let errorMessage = "login_failed";
    if (res.status === 400) {
      // Vérifier si c'est une erreur serveur masquée
      if (e?.details?.status >= 500) {
        errorMessage = "server_error";
      } else {
        errorMessage = e?.error || "invalid_credentials";
      }
    } else if (res.status === 401) {
      errorMessage = "unauthorized";
    } else if (res.status >= 500) {
      errorMessage = "server_error";
    }

    throw new Error(errorMessage);
  }

  const json = await res.json();
  
  console.log("🔐 [AUTH] Login response data:", {
    hasSessionToken: !!json.sessionToken,
    hasRefreshToken: !!json.refreshToken,
    hasSessionExpiry: !!json.sessionExpiry,
    success: json.success,
    hasUser: !!json.user
  });

  const { sessionToken, refreshToken, success, user, sessionExpiry } = json;

  if (!sessionToken || !success) {
    console.error("❌ [AUTH] Invalid login response:", { hasToken: !!sessionToken, success });
    throw new Error("invalid_login_response");
  }
  
  console.log("✅ [AUTH] Login successful, storing tokens...");

  await SecureStore.setItemAsync("session_token", sessionToken);
  
  // Store session expiry if provided (API v1.1.0+)
  if (sessionExpiry) {
    await SecureStore.setItemAsync("session_expiry", sessionExpiry);
    // TEMP_DISABLED: console.log("🔐 Session expiry stored:", sessionExpiry);
  } else {
    // Si pas fourni, calculer 15 minutes à partir de maintenant
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await SecureStore.setItemAsync("session_expiry", expiry);
    // TEMP_DISABLED: console.log("🔐 Session expiry calculated (15min):", expiry);
  }

  if (refreshToken) {
    await SecureStore.setItemAsync("refresh_token", refreshToken);
  }

  // Store user data with company information (API v1.1.0)
  if (user) {
    await SecureStore.setItemAsync(
      "user_data",
      JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        company_id: user.company_id,
        company_role: user.company_role,
        company: user.company,
      }),
    );
  }

  return { sessionToken, success, hasRefresh: !!refreshToken, user };
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  // ✅ Vérifier et rafraîchir le token si nécessaire
  await ensureValidToken();
  
  const st = await SecureStore.getItemAsync("session_token");

  if (st) {
    // TEMP_DISABLED: console.log('🔐 Session token found, length:', st.length);
    // TEMP_DISABLED: console.log('🔐 Token preview:', st.substring(0, 20) + '...');
    return { Authorization: `Bearer ${st}` };
  } else {
    // Silencieux - pas de session est un état normal (non connecté)
    return {};
  }
}

/**
 * Vérifie si le token de session est expiré et le rafraîchit si nécessaire
 */
async function ensureValidToken(): Promise<void> {
  try {
    const sessionToken = await SecureStore.getItemAsync("session_token");
    
    // Si pas de token, pas besoin de vérifier l'expiration
    if (!sessionToken) {
      return;
    }
    
    const expiry = await SecureStore.getItemAsync("session_expiry");
    
    if (!expiry) {
      // Pas d'expiry stocké, on considère le token comme valide
      // (compatibilité avec anciennes sessions)
      return;
    }
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    // Rafraîchir 1 minute avant l'expiration pour éviter les races
    const shouldRefresh = now >= new Date(expiryDate.getTime() - 60000);
    
    if (shouldRefresh) {
      // TEMP_DISABLED: console.log("🔄 Token about to expire, refreshing...");
      const refreshed = await refreshToken();
      
      if (!refreshed) {
        // TEMP_DISABLED: console.warn("⚠️ Token refresh failed, token may be expired");
        // On laisse la requête continuer, elle échouera avec 401 si vraiment expiré
      } else {
        // TEMP_DISABLED: console.log("✅ Token refreshed successfully");
      }
    }
  } catch (error) {
    // En cas d'erreur, on continue sans bloquer
    // TEMP_DISABLED: console.warn("⚠️ Error checking token validity:", error);
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const sessionToken = await SecureStore.getItemAsync("session_token");
  return !!sessionToken;
}

export async function refreshToken(): Promise<boolean> {
  try {
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] === STARTING TOKEN REFRESH ===');

    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 1: Getting refresh token from storage...');
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 2: Refresh token exists:', !!refreshToken);

    if (!refreshToken) {
      return false;
    }

    // TEMP_DISABLED: console.log('� [TOKEN REFRESH] Step 3: Refresh token found, length:', refreshToken.length);
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 4: Making refresh API call to:', `${API}auth/refresh`);

    const res = await fetch(`${API}auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client": "mobile",
      },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    });

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 5: API response received - Status:', res.status, 'OK:', res.ok);

    if (!res.ok) {
      try {
        const errorBody = await res.text();
        // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Error response body:', errorBody);

        try {
          const errorJson = JSON.parse(errorBody);
          // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Error JSON parsed:', errorJson);
        } catch (parseError) {
          // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Could not parse error JSON:', parseError);
        }
      } catch (e) {
        // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Could not read error body:', e);
      }

      // TEMP_DISABLED: console.error('❌ Token refresh failed:', res.status);
      return false;
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ✅ Step 6: API call SUCCESS - Parsing response...');
    const json = await res.json();
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 7: Response parsed:', {
    //   success: json.success,
    //   hasSessionToken: !!json.sessionToken,
    //   hasNewRefreshToken: !!json.refreshToken
    // });
    // TEMP_DISABLED: console.log('✅ Token refresh response:', json);

    const { sessionToken, refreshToken: newRefreshToken, success, sessionExpiry } = json;

    if (!sessionToken || !success) {
      // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ❌ Step 8: Invalid refresh response format');
      // TEMP_DISABLED: console.error('❌ Invalid refresh response');
      return false;
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 8: Valid response - Saving new tokens...');
    // Sauvegarder les nouveaux tokens
    await SecureStore.setItemAsync("session_token", sessionToken);
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 9: New session token saved');
    
    // Store new session expiry (API v1.1.0+)
    if (sessionExpiry) {
      await SecureStore.setItemAsync("session_expiry", sessionExpiry);
    } else {
      // Calculer 15 minutes si pas fourni
      const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await SecureStore.setItemAsync("session_expiry", expiry);
    }

    if (newRefreshToken) {
      await SecureStore.setItemAsync("refresh_token", newRefreshToken);
      // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 10: New refresh token saved');
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ✅ SUCCESS: Token refresh completed successfully');
    return true;
  } catch (error) {
    // TEMP_DISABLED: console.error('❌ Token refresh error:', error);
    return false;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync("session_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

/**
 * Fonction utilitaire pour gérer les requêtes avec refresh automatique du token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] === STARTING AUTHENTICATED FETCH ===');
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 1: Target URL:', url);
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 2: Getting auth headers...');

  // Première tentative avec le token actuel
  let headers = await getAuthHeaders();
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 3: Auth headers retrieved:', Object.keys(headers));

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  };

  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 4: Making first API attempt...');
  let response = await fetch(url, requestOptions);
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 5: First attempt response - Status:', response.status, 'OK:', response.ok);

  // Si 401, essayer de refresh le token
  if (response.status === 401) {
    const refreshSuccess = await refreshToken();
    // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 7: Token refresh result:', refreshSuccess);

    if (refreshSuccess) {
      headers = await getAuthHeaders();
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 9: New auth headers retrieved');
      requestOptions.headers = {
        "Content-Type": "application/json",
        ...headers,
        ...options.headers,
      };

      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 10: Making second API attempt with new token...');
      response = await fetch(url, requestOptions);
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 11: Second attempt response - Status:', response.status, 'OK:', response.ok);

      if (response.status === 401) {
        await clearSession();
        throw new Error("SESSION_EXPIRED");
      }
    } else {
      // Refresh a échoué, clear session
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] ❌ Step 8: Refresh FAILED - SESSION EXPIRED');
      // TEMP_DISABLED: console.log('❌ Token refresh failed, clearing session');
      await clearSession();
      throw new Error("SESSION_EXPIRED");
    }
  }

  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] ✅ SUCCESS: Authenticated request completed with status:', response.status);
  return response;
}

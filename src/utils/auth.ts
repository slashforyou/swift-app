// services/auth.ts
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { collectDevicePayload } from "./device";

const API = ServerData.serverUrl;

export async function login(mail: string, password: string) {
  const device = await collectDevicePayload();

  if (!device) throw new Error("device_info_unavailable");

  const res = await fetch(`${API}auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client": "mobile" },
    body: JSON.stringify({ 
        mail, 
        password, 
        device, 
        wantRefreshInBody: true 
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    console.error('Login API Error:', e);
    
    let errorMessage = "login_failed";
    if (res.status === 400) {
      errorMessage = e?.error || "invalid_credentials";
    } else if (res.status === 401) {
      errorMessage = "unauthorized";
    } else if (res.status >= 500) {
      errorMessage = "server_error";
    }
    
    throw new Error(errorMessage);
  }

  const json = await res.json();
  // TEMP_DISABLED: console.log('Login API Response:', json);
  
  const { sessionToken, refreshToken, success } = json;

  if (!sessionToken || !success) throw new Error("invalid_login_response");

  await SecureStore.setItemAsync("session_token", sessionToken);
  
  if (refreshToken) {
    await SecureStore.setItemAsync("refresh_token", refreshToken);
  }

  return { sessionToken, success, hasRefresh: !!refreshToken };
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const st = await SecureStore.getItemAsync("session_token");
  
  if (st) {
    // TEMP_DISABLED: console.log('🔐 Session token found, length:', st.length);
    // TEMP_DISABLED: console.log('🔐 Token preview:', st.substring(0, 20) + '...');
    return { Authorization: `Bearer ${st}` };
  } else {
    console.warn('⚠️ No session token found in SecureStore');
    return {};
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
    
    if (!refreshToken) {return false;
    }

    // TEMP_DISABLED: console.log('� [TOKEN REFRESH] Step 3: Refresh token found, length:', refreshToken.length);
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 4: Making refresh API call to:', `${API}auth/refresh`);
    
    const res = await fetch(`${API}auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-client": "mobile" 
      },
      body: JSON.stringify({ 
        refreshToken: refreshToken 
      })
    });

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 5: API response received - Status:', res.status, 'OK:', res.ok);

    if (!res.ok) {try {
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
      
      console.error('❌ Token refresh failed:', res.status);
      return false;
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ✅ Step 6: API call SUCCESS - Parsing response...');
    const json = await res.json();
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 7: Response parsed:', {
    //   success: json.success,
    //   hasSessionToken: !!json.sessionToken,
    //   hasNewRefreshToken: !!json.refreshToken
;
    // });
    // TEMP_DISABLED: console.log('✅ Token refresh response:', json);
    
    const { sessionToken, refreshToken: newRefreshToken, success } = json;

    if (!sessionToken || !success) {
      // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ❌ Step 8: Invalid refresh response format');
      console.error('❌ Invalid refresh response');
      return false;
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 8: Valid response - Saving new tokens...');
    // Sauvegarder les nouveaux tokens
    await SecureStore.setItemAsync("session_token", sessionToken);
    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 9: New session token saved');
    
    if (newRefreshToken) {
      await SecureStore.setItemAsync("refresh_token", newRefreshToken);
      // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] Step 10: New refresh token saved');
    }

    // TEMP_DISABLED: console.log('🔍 [TOKEN REFRESH] ✅ SUCCESS: Token refresh completed successfully');
    return true;

  } catch (error) {

    console.error('❌ Token refresh error:', error);
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
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] === STARTING AUTHENTICATED FETCH ===');
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 1: Target URL:', url);
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 2: Getting auth headers...');
  
  // Première tentative avec le token actuel
  let headers = await getAuthHeaders();
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 3: Auth headers retrieved:', Object.keys(headers));
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  };
  
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 4: Making first API attempt...');
  let response = await fetch(url, requestOptions);
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 5: First attempt response - Status:', response.status, 'OK:', response.ok);
  
  // Si 401, essayer de refresh le token
  if (response.status === 401) {const refreshSuccess = await refreshToken();
    // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 7: Token refresh result:', refreshSuccess);
    
    if (refreshSuccess) {headers = await getAuthHeaders();
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 9: New auth headers retrieved');
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      };
      
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 10: Making second API attempt with new token...');
      response = await fetch(url, requestOptions);
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] Step 11: Second attempt response - Status:', response.status, 'OK:', response.ok);
      
      if (response.status === 401) {await clearSession();
        throw new Error('SESSION_EXPIRED');
      }
    } else {
      // Refresh a échoué, clear session
      // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] ❌ Step 8: Refresh FAILED - SESSION EXPIRED');
      // TEMP_DISABLED: console.log('❌ Token refresh failed, clearing session');
      await clearSession();
      throw new Error('SESSION_EXPIRED');
    }
  }
  
  // TEMP_DISABLED: console.log('🔍 [AUTH FETCH] ✅ SUCCESS: Authenticated request completed with status:', response.status);
  return response;
}
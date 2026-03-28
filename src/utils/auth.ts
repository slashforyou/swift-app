// services/auth.ts
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { collectDevicePayload } from "./device";

const API = ServerData.serverUrl;

export async function login(mail: string, password: string) {
  const device = await collectDevicePayload();

  if (!device) throw new Error("device_info_unavailable");

  // Timeout pour éviter un chargement infini
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 20000); // 20 seconds timeout

  let res: Response;
  try {
    res = await fetch(`${API}auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "mobile" },
      body: JSON.stringify({
        mail,
        password,
        device,
        wantRefreshInBody: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("timeout");
    }
    throw new Error("network_error");
  }

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));

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

  const { sessionToken, refreshToken, success, user, sessionExpiry } = json;

  if (!sessionToken || !success) {
    throw new Error("invalid_login_response");
  }

  await SecureStore.setItemAsync("session_token", sessionToken);

  // Store session expiry if provided (API v1.1.0+)
  if (sessionExpiry) {
    await SecureStore.setItemAsync("session_expiry", sessionExpiry);
  } else {
    // Si pas fourni, calculer 15 minutes à partir de maintenant
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await SecureStore.setItemAsync("session_expiry", expiry);
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
  // ✅ Ne pas bloquer sur ensureValidToken si ça prend trop de temps
  // On récupère directement le token et on laisse fetchWithAuth gérer le 401
  const st = await SecureStore.getItemAsync("session_token");

  if (st) {
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
      const refreshed = await refreshToken();

      if (!refreshed) {
        // On laisse la requête continuer, elle échouera avec 401 si vraiment expiré
      } else {
      }
    }
  } catch (error) {
    // En cas d'erreur, on continue sans bloquer
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const sessionToken = await SecureStore.getItemAsync("session_token");
  return !!sessionToken;
}

export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");

    if (!refreshToken) {
      return false;
    }

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

    if (!res.ok) {
      try {
        const errorBody = await res.text();

        try {
          const errorJson = JSON.parse(errorBody);
        } catch (parseError) {
          // Non-critical: error body JSON parse is optional
        }
      } catch (e) {
        // Non-critical: error text read failed
      }

      return false;
    }

    const json = await res.json();
    //   success: json.success,
    //   hasSessionToken: !!json.sessionToken,
    //   hasNewRefreshToken: !!json.refreshToken
    // });

    const {
      sessionToken,
      refreshToken: newRefreshToken,
      success,
      sessionExpiry,
    } = json;

    if (!sessionToken || !success) {
      return false;
    }

    // Sauvegarder les nouveaux tokens
    await SecureStore.setItemAsync("session_token", sessionToken);

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
    }

    return true;
  } catch (error) {
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
  // Première tentative avec le token actuel
  let headers = await getAuthHeaders();

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  };

  let response = await fetch(url, requestOptions);

  // Si 401, essayer de refresh le token
  if (response.status === 401) {
    const refreshSuccess = await refreshToken();

    if (refreshSuccess) {
      headers = await getAuthHeaders();
      requestOptions.headers = {
        "Content-Type": "application/json",
        ...headers,
        ...options.headers,
      };

      response = await fetch(url, requestOptions);

      if (response.status === 401) {
        await clearSession();
        throw new Error("SESSION_EXPIRED");
      }
    } else {
      // Refresh a échoué, clear session
      await clearSession();
      throw new Error("SESSION_EXPIRED");
    }
  }

  return response;
}

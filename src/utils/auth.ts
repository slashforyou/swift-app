// services/auth.ts
import * as SecureStore from "expo-secure-store";
import { collectDevicePayload } from "./device";
import { ServerData } from "../constants/ServerData";

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
    throw new Error(e?.error || "login_failed");
  }

  const json = await res.json();
  // Attendu: { sessionToken, device: { id, ... }, refreshToken? }
  const { sessionToken, deviceId, refreshToken } = json;

  if (!sessionToken || !deviceId) throw new Error("invalid_login_response");

  // Stocke ce qu’il faut pour les prochains appels
  await SecureStore.setItemAsync("session_token", sessionToken);
  if (deviceId) {
    await SecureStore.setItemAsync("device_id", deviceId);
  }
  if (refreshToken) {
    await SecureStore.setItemAsync("refresh_token", refreshToken);
  }

  return { sessionToken, deviceId, hasRefresh: !!refreshToken };
}

export async function getAuthHeaders() {
  const st = await SecureStore.getItemAsync("session_token");

  return st ? { Authorization: `Bearer ${st}` } : {};
}

export async function refresh() {
  const deviceId = await SecureStore.getItemAsync("device_id");
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!deviceId || !refreshToken) throw new Error("no_refresh_material");

  const res = await fetch(`${API}auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client": "mobile" },
    body: JSON.stringify({ deviceId, refreshToken })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Politique serveur : déconnexion auto si refresh invalide
    // On nettoie localement
    await SecureStore.deleteItemAsync("session_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("device_id");
    throw new Error(json?.error || "refresh_failed");
  }

  const { sessionToken, refreshToken: newRt } = json;
  if (sessionToken) await SecureStore.setItemAsync("session_token", sessionToken);
  if (newRt) await SecureStore.setItemAsync("refresh_token", newRt);

  return { sessionToken };
}

export async function logout(authHeader?: Record<string, string>) {
  // Merge headers and filter out undefined values
  const rawHeaders = { "Content-Type": "application/json", ...(authHeader || await getAuthHeaders()) };
  const headers: Record<string, string> = Object.fromEntries(
    Object.entries(rawHeaders).filter(([_, v]) => typeof v === "string" && v !== undefined)
  );
  const res = await fetch(`${API}auth/logout`, { method: "POST", headers });
  // Nettoyage local quoi qu’il arrive
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("device_id");
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error || "logout_failed");
  }
  return true;
}

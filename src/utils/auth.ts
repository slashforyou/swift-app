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
  console.log('Login API Response:', json);
  
  const { sessionToken, refreshToken, success } = json;

  if (!sessionToken || !success) throw new Error("invalid_login_response");

  await SecureStore.setItemAsync("session_token", sessionToken);
  
  if (refreshToken) {
    await SecureStore.setItemAsync("refresh_token", refreshToken);
  }

  return { sessionToken, success, hasRefresh: !!refreshToken };
}

export async function getAuthHeaders() {
  const st = await SecureStore.getItemAsync("session_token");
  return st ? { Authorization: `Bearer ${st}` } : {};
}

export async function isLoggedIn(): Promise<boolean> {
  const sessionToken = await SecureStore.getItemAsync("session_token");
  return !!sessionToken;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync("session_token");
  await SecureStore.deleteItemAsync("refresh_token");
}
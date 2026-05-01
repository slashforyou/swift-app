/**
 * authHeaders — Utilitaire minimal pour construire les headers d'autorisation.
 * Fichier volontairement séparé d'auth.ts pour briser le cycle circulaire :
 *   auth.ts → analytics.ts → auth.ts
 * analytics.ts importe depuis ici, auth.ts aussi.
 */
import * as SecureStore from "expo-secure-store";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const st = await SecureStore.getItemAsync("session_token");
  if (st) {
    return { Authorization: `Bearer ${st}` };
  }
  return {};
}

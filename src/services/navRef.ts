/**
 * navRef - Référence globale au NavigationContainer
 * Permet de naviguer depuis l'extérieur des composants React
 * (push notifications, services, etc.)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNavigationContainerRef } from "@react-navigation/native";

// ─── Pending deep-link (cold-start sans auth) ──────────────────────────────
const PENDING_DEEP_LINK_KEY = "cobbr_pending_deep_link";
const COLD_START_NOTIF_KEY = "cobbr_cold_start_notif_consumed";

export interface PendingDeepLink {
  screen: string;
  params?: Record<string, any>;
}

/** Sauvegarde un deep-link à exécuter après connexion. */
export async function savePendingDeepLink(link: PendingDeepLink): Promise<void> {
  await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(link));
}

/**
 * Consomme le pending deep-link (une seule fois).
 * À appeler après un login réussi.
 * Retourne true si une navigation a été déclenchée.
 */
export async function consumePendingDeepLink(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
    if (!raw) return false;
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    const link: PendingDeepLink = JSON.parse(raw);
    if (navigationContainerRef.isReady()) {
      navigationContainerRef.navigate(link.screen as any, link.params as any);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Marque la notif cold-start comme consommée pour ce lancement d'app.
 * Utilise un flag en mémoire + AsyncStorage pour éviter les re-navigations.
 */
let coldStartConsumed = false;

export async function markColdStartConsumed(): Promise<void> {
  coldStartConsumed = true;
  await AsyncStorage.setItem(COLD_START_NOTIF_KEY, "1");
}

export function isColdStartConsumed(): boolean {
  return coldStartConsumed;
}

export const navigationContainerRef = createNavigationContainerRef<any>();

/**
 * Navigue vers un écran depuis n'importe où dans l'app.
 */
export function navigateGlobal(name: string, params?: Record<string, any>) {
  if (navigationContainerRef.isReady()) {
    navigationContainerRef.navigate(name as any, params as any);
  }
}

/**
 * Gère la navigation suite au tap sur une notification push.
 * data.screen + data.date (ISO string) + data.job_id optionnel
 */
export function handleNotificationNavigation(data: Record<string, any>) {
  if (!data?.screen) return;

  const parseDate = (iso: string) => {
    const d = new Date(iso);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  };

  switch (data.screen) {
    case "Calendar":
    case "Day": {
      const params = data.date ? parseDate(data.date) : undefined;
      navigateGlobal("Calendar", { screen: "Day", params });
      break;
    }
    default:
      navigateGlobal(data.screen, data.params);
      break;
  }
}

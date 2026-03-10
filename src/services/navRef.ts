/**
 * navRef - Référence globale au NavigationContainer
 * Permet de naviguer depuis l'extérieur des composants React
 * (push notifications, services, etc.)
 */
import { createNavigationContainerRef } from "@react-navigation/native";

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

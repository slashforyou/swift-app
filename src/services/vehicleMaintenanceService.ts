import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface MaintenanceAlert {
  id: number;
  vehicle_id: number;
  vehicle_name?: string;
  alert_type: string; // "oil_change" | "tyre" | "rego" | "service" | "other"
  title: string;
  due_date?: string;
  due_km?: number;
  status: string; // "pending" | "overdue" | "done"
  notes?: string;
  created_at: string;
}

export const getAllMaintenanceAlerts = async (): Promise<MaintenanceAlert[]> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/maintenance-alerts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.alerts ?? data ?? [];
};

export const getVehicleMaintenanceAlerts = async (vehicleId: number): Promise<MaintenanceAlert[]> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/${vehicleId}/maintenance-alerts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.alerts ?? data ?? [];
};

export const createMaintenanceAlert = async (
  vehicleId: number,
  payload: Omit<MaintenanceAlert, "id" | "vehicle_id" | "vehicle_name" | "created_at">,
): Promise<MaintenanceAlert> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/${vehicleId}/maintenance-alerts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.alert ?? data;
};

export const updateMaintenanceAlert = async (
  alertId: number,
  payload: Partial<Pick<MaintenanceAlert, "status" | "due_date" | "due_km" | "notes" | "title">>,
): Promise<MaintenanceAlert> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/maintenance-alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.alert ?? data;
};

export const deleteMaintenanceAlert = async (alertId: number): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/maintenance-alerts/${alertId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

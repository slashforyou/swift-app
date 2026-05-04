import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface MileageEntry {
  id: number;
  vehicle_id: number;
  odometer_before?: number;
  odometer_after: number;
  job_id?: number;
  note?: string;
  recorded_by?: number;
  created_at: string;
}

export interface VehicleServiceInfo {
  current_odometer?: number;
  service_interval_km?: number;
  last_service_km?: number;
  next_service_km?: number;
  next_service_date?: string;
}

export const getVehicleMileage = async (vehicleId: number): Promise<{ entries: MileageEntry[]; service_info: VehicleServiceInfo }> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/${vehicleId}/mileage`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const vehicle = json.data?.vehicle ?? {};
  return {
    entries: json.data?.logs ?? [],
    service_info: {
      current_odometer: vehicle.current_odometer_km,
      service_interval_km: vehicle.service_interval_km,
      last_service_km: vehicle.last_service_km,
      next_service_km: vehicle.next_service_km,
      next_service_date: vehicle.next_service_date,
    },
  };
};

export const addMileageEntry = async (
  vehicleId: number,
  payload: { odometer_after: number; job_id?: number; note?: string },
): Promise<MileageEntry> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/${vehicleId}/mileage`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.entry ?? data;
};

export const updateVehicleServiceInfo = async (
  vehicleId: number,
  payload: Partial<VehicleServiceInfo>,
): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/vehicles/${vehicleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

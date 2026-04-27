import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface AvailabilitySlot {
  day_of_week: number; // 0=Sun, 1=Mon, ...6=Sat
  is_available: boolean;
  start_time?: string; // "08:00"
  end_time?: string;   // "17:00"
}

export interface AvailabilityException {
  id?: number;
  date: string; // "YYYY-MM-DD"
  is_available: boolean;
  reason?: string;
}

export interface EmployeeAvailability {
  availabilities: AvailabilitySlot[];
  exceptions: AvailabilityException[];
}

export const getEmployeeAvailability = async (userId: number): Promise<EmployeeAvailability> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/availability`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const updateEmployeeAvailability = async (
  userId: number,
  availabilities: AvailabilitySlot[],
): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/availability`, {
    method: "PUT",
    body: JSON.stringify({ availabilities }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const addAvailabilityException = async (
  userId: number,
  exception: Omit<AvailabilityException, "id">,
): Promise<AvailabilityException> => {
  const res = await authenticatedFetch(`${API}v1/employees/${userId}/availability/exceptions`, {
    method: "POST",
    body: JSON.stringify(exception),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.exception ?? data;
};

export const deleteAvailabilityException = async (userId: number, exceptionId: number): Promise<void> => {
  const res = await authenticatedFetch(
    `${API}v1/employees/${userId}/availability/exceptions/${exceptionId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

/**
 * Storage Service — API client for storage module
 * All CRUD operations for units, lots, items, photos, billing
 */
import { ServerData } from "../constants/ServerData";
import type {
    BillingType,
    ItemCondition,
    LotStatus,
    PhotoType,
    StorageBillingRecord,
    StorageBillingSummary,
    StorageItem,
    StorageLot,
    StorageLotDetail,
    StoragePhoto,
    StorageStats,
    StorageUnit,
    UnitStatus,
    UnitType,
} from "../types/storage";
import { authenticatedFetch } from "../utils/auth";

const API = `${ServerData.serverUrl}v1/storage`;

// ── Helpers ──
async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(url, options);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ════════════════════════════════════════════════════════════
// UNITS
// ════════════════════════════════════════════════════════════

export async function listUnits(): Promise<StorageUnit[]> {
  const data = await jsonRequest<{ success: true; units: StorageUnit[] }>(`${API}/units`);
  return data.units;
}

export async function createUnit(params: {
  name: string;
  unit_type?: UnitType;
  capacity_cbm?: number;
  location_description?: string;
  notes?: string;
}): Promise<StorageUnit> {
  const data = await jsonRequest<{ success: true; unit: StorageUnit }>(`${API}/units`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.unit;
}

export async function updateUnit(
  id: number,
  params: Partial<{
    name: string;
    unit_type: UnitType;
    capacity_cbm: number;
    location_description: string;
    status: UnitStatus;
    notes: string;
  }>,
): Promise<StorageUnit> {
  const data = await jsonRequest<{ success: true; unit: StorageUnit }>(`${API}/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
  return data.unit;
}

export async function deleteUnit(id: number): Promise<void> {
  await jsonRequest(`${API}/units/${id}`, { method: "DELETE" });
}

// ════════════════════════════════════════════════════════════
// CLIENT SEARCH
// ════════════════════════════════════════════════════════════

export interface ClientSuggestion {
  name: string;
  email: string | null;
  phone: string | null;
  source: "storage" | "job";
}

export async function searchClients(query: string): Promise<ClientSuggestion[]> {
  if (query.trim().length < 2) return [];
  const data = await jsonRequest<{ success: true; clients: ClientSuggestion[] }>(
    `${API}/clients/search?q=${encodeURIComponent(query.trim())}`,
  );
  return data.clients;
}

// ════════════════════════════════════════════════════════════
// LOTS
// ════════════════════════════════════════════════════════════

export async function listLots(status?: LotStatus): Promise<StorageLot[]> {
  const qs = status ? `?status=${status}` : "";
  const data = await jsonRequest<{ success: true; lots: StorageLot[] }>(`${API}/lots${qs}`);
  return data.lots;
}

export async function getLot(id: number): Promise<StorageLotDetail> {
  const data = await jsonRequest<{ success: true; lot: StorageLotDetail }>(`${API}/lots/${id}`);
  return data.lot;
}

export async function createLot(params: {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  job_id?: number;
  billing_type?: BillingType;
  billing_amount?: number;
  billing_start_date?: string;
  notes?: string;
}): Promise<StorageLot> {
  const data = await jsonRequest<{ success: true; lot: StorageLot }>(`${API}/lots`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.lot;
}

export async function updateLot(
  id: number,
  params: Partial<{
    client_name: string;
    client_email: string;
    client_phone: string;
    billing_type: BillingType;
    billing_amount: number;
    status: LotStatus;
    notes: string;
  }>,
): Promise<StorageLot> {
  const data = await jsonRequest<{ success: true; lot: StorageLot }>(`${API}/lots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
  return data.lot;
}

export async function deleteLot(id: number): Promise<void> {
  await jsonRequest(`${API}/lots/${id}`, { method: "DELETE" });
}

// ── Lot-Unit assignments ──

export async function assignUnitToLot(lotId: number, unitId: number): Promise<void> {
  await jsonRequest(`${API}/lots/${lotId}/units`, {
    method: "POST",
    body: JSON.stringify({ unit_id: unitId }),
  });
}

export async function removeUnitFromLot(lotId: number, unitId: number): Promise<void> {
  await jsonRequest(`${API}/lots/${lotId}/units/${unitId}`, { method: "DELETE" });
}

export async function reorderLotUnits(lotId: number, unitIds: number[]): Promise<void> {
  await jsonRequest(`${API}/lots/${lotId}/units/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ unit_ids: unitIds }),
  });
}

// ════════════════════════════════════════════════════════════
// ITEMS
// ════════════════════════════════════════════════════════════

export async function addItem(
  lotId: number,
  params: {
    name: string;
    description?: string;
    quantity?: number;
    unit_id?: number;
    condition_in?: ItemCondition;
  },
): Promise<StorageItem> {
  const data = await jsonRequest<{ success: true; item: StorageItem }>(`${API}/lots/${lotId}/items`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.item;
}

export async function updateItem(
  itemId: number,
  params: Partial<{
    name: string;
    description: string;
    quantity: number;
    unit_id: number;
    condition_in: ItemCondition;
  }>,
): Promise<StorageItem> {
  const data = await jsonRequest<{ success: true; item: StorageItem }>(`${API}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
  return data.item;
}

export async function deleteItem(itemId: number): Promise<void> {
  await jsonRequest(`${API}/items/${itemId}`, { method: "DELETE" });
}

export async function checkoutItem(
  itemId: number,
  conditionOut?: ItemCondition,
): Promise<StorageItem> {
  const data = await jsonRequest<{ success: true; item: StorageItem }>(`${API}/items/${itemId}/checkout`, {
    method: "POST",
    body: JSON.stringify({ condition_out: conditionOut }),
  });
  return data.item;
}

// ════════════════════════════════════════════════════════════
// PHOTOS
// ════════════════════════════════════════════════════════════

export async function listLotPhotos(lotId: number): Promise<StoragePhoto[]> {
  const data = await jsonRequest<{ success: true; photos: StoragePhoto[] }>(`${API}/lots/${lotId}/photos`);
  return data.photos;
}

export async function uploadStoragePhoto(
  lotId: number,
  photoUri: string,
  options?: {
    item_id?: number;
    unit_id?: number;
    description?: string;
    photo_type?: PhotoType;
  },
): Promise<StoragePhoto> {
  const headers = await import("../utils/auth").then((m) => m.getAuthHeaders());
  const formData = new FormData();

  const filename = photoUri.split("/").pop() || `storage_${Date.now()}.jpg`;
  formData.append("image", {
    uri: photoUri,
    type: "image/jpeg",
    name: filename,
  } as any);

  if (options?.item_id) formData.append("item_id", String(options.item_id));
  if (options?.unit_id) formData.append("unit_id", String(options.unit_id));
  if (options?.description) formData.append("description", options.description);
  if (options?.photo_type) formData.append("photo_type", options.photo_type);

  const res = await fetch(`${API}/lots/${lotId}/photos`, {
    method: "POST",
    headers: {
      ...(await headers),
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
  return data.photo;
}

export async function deleteStoragePhoto(photoId: number): Promise<void> {
  await jsonRequest(`${API}/photos/${photoId}`, { method: "DELETE" });
}

// ════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════

export async function getLotBilling(lotId: number): Promise<StorageBillingRecord[]> {
  const data = await jsonRequest<{ success: true; billing: StorageBillingRecord[] }>(
    `${API}/lots/${lotId}/billing`,
  );
  return data.billing;
}

export async function recordBillingPayment(
  lotId: number,
  params: {
    amount: number;
    period_start: string;
    period_end: string;
    status?: string;
    notes?: string;
  },
): Promise<StorageBillingRecord> {
  const data = await jsonRequest<{ success: true; record: StorageBillingRecord }>(
    `${API}/lots/${lotId}/billing`,
    {
      method: "POST",
      body: JSON.stringify(params),
    },
  );
  return data.record;
}

export async function updateBillingRecord(
  recordId: number,
  params: { status?: string; notes?: string },
): Promise<StorageBillingRecord> {
  const data = await jsonRequest<{ success: true; record: StorageBillingRecord }>(
    `${API}/billing/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify(params),
    },
  );
  return data.record;
}

export async function generateBilling(): Promise<{
  generated: number;
  records: Array<{ lot_id: number; billing_id: number; amount: number; period_start: string; period_end: string }>;
  overdue_updated: number;
}> {
  const data = await jsonRequest<{
    success: true;
    generated: number;
    records: Array<{ lot_id: number; billing_id: number; amount: number; period_start: string; period_end: string }>;
    overdue_updated: number;
  }>(`${API}/billing/generate`, { method: "POST" });
  return data;
}

export async function getBillingSummary(): Promise<StorageBillingSummary> {
  const data = await jsonRequest<{ success: true; summary: StorageBillingSummary }>(
    `${API}/billing/summary`,
  );
  return data.summary;
}

// ════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════

export async function getStorageStats(): Promise<StorageStats> {
  const data = await jsonRequest<{ success: true; stats: StorageStats }>(`${API}/stats`);
  return data.stats;
}

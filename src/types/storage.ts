/**
 * Storage module types
 * Units (containers/boxes), lots (client storage groups), items, photos, billing
 */

// ── Storage Unit ──
export type UnitType = 'container' | 'box' | 'room' | 'shelf';
export type UnitStatus = 'available' | 'in_use' | 'full' | 'maintenance';

export interface StorageUnit {
  id: number;
  company_id: number;
  name: string;
  unit_type: UnitType;
  capacity_cbm: number | null;
  location_description: string | null;
  status: UnitStatus;
  notes: string | null;
  active_lots?: number;
  created_at: string;
  updated_at: string;
}

// ── Storage Lot ──
export type BillingType = 'fixed' | 'weekly' | 'monthly';
export type LotStatus = 'active' | 'completed' | 'overdue' | 'pending_pickup';

export interface StorageLot {
  id: number;
  company_id: number;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  job_id: number | null;
  billing_type: BillingType;
  billing_amount: number;
  billing_start_date: string | null;
  billing_next_due: string | null;
  status: LotStatus;
  identifier_tag: string | null;
  notes: string | null;
  unit_count?: number;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StorageLotDetail extends StorageLot {
  units: (StorageUnit & { position: number; assignment_id: number })[];
  items: StorageItem[];
  photos: StoragePhoto[];
  billing: StorageBillingRecord[];
}

// ── Storage Lot-Unit Assignment ──
export interface StorageLotUnit {
  id: number;
  lot_id: number;
  unit_id: number;
  position: number;
  assigned_at: string;
  removed_at: string | null;
}

// ── Storage Item ──
export type ItemCondition = 'excellent' | 'good' | 'fair' | 'damaged';

export interface StorageItem {
  id: number;
  lot_id: number;
  unit_id: number | null;
  unit_name?: string;
  name: string;
  description: string | null;
  quantity: number;
  condition_in: ItemCondition;
  condition_out: ItemCondition | null;
  checked_in_at: string;
  checked_out_at: string | null;
}

// ── Storage Photo ──
export type PhotoType = 'checkin' | 'checkout' | 'damage' | 'inventory' | 'other';

export interface StoragePhoto {
  id: number;
  company_id: number;
  lot_id: number | null;
  unit_id: number | null;
  item_id: number | null;
  user_id: number | null;
  filename: string;
  file_path: string;
  original_name: string | null;
  mime_type: string;
  file_size: number | null;
  description: string | null;
  photo_type: PhotoType;
  url?: string | null;
  created_at: string;
}

// ── Storage Billing ──
export type BillingStatus = 'pending' | 'paid' | 'overdue' | 'waived';

export interface StorageBillingRecord {
  id: number;
  lot_id: number;
  company_id: number;
  amount: number;
  period_start: string;
  period_end: string;
  status: BillingStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

// ── Stats ──
export interface StorageStats {
  units: {
    total: number;
    available: number;
    in_use: number;
    full_units: number;
  };
  lots: {
    total: number;
    active: number;
    overdue: number;
  };
  items_in_storage: number;
}

export interface StorageBillingSummary {
  total_lots: number;
  active_lots: number;
  monthly_revenue: number;
  overdue_lots: number;
  pending_amount: number;
  overdue_amount: number;
}

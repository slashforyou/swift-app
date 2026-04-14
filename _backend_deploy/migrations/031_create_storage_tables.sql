-- Migration 031: Storage module tables
-- Storage units (containers), lots (client storage groups), items, photos, billing

-- ─── storage_units: physical containers/boxes at depot ───
CREATE TABLE IF NOT EXISTS storage_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,            -- "Container A", "Box 12"
  unit_type ENUM('container', 'box', 'room', 'shelf') NOT NULL DEFAULT 'container',
  capacity_cbm DECIMAL(8,2) DEFAULT NULL, -- cubic meters capacity
  location_description VARCHAR(255) DEFAULT NULL, -- "Depot 1, Row 3"
  status ENUM('available', 'in_use', 'full', 'maintenance') NOT NULL DEFAULT 'available',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_company (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── storage_lots: a client's storage "contract" / group ───
CREATE TABLE IF NOT EXISTS storage_lots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(200) DEFAULT NULL,
  client_phone VARCHAR(50) DEFAULT NULL,
  job_id INT DEFAULT NULL,               -- optional link to origin job
  billing_type ENUM('fixed', 'weekly', 'monthly') NOT NULL DEFAULT 'monthly',
  billing_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  billing_start_date DATE DEFAULT NULL,
  billing_next_due DATE DEFAULT NULL,
  status ENUM('active', 'completed', 'overdue') NOT NULL DEFAULT 'active',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_company (company_id),
  INDEX idx_status (status),
  INDEX idx_job (job_id),
  INDEX idx_billing_next (billing_next_due)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── storage_lot_units: which units belong to which lot (M:N + position) ───
CREATE TABLE IF NOT EXISTS storage_lot_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lot_id INT NOT NULL,
  unit_id INT NOT NULL,
  position INT NOT NULL DEFAULT 0,       -- ordering for drag & drop
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_lot (lot_id),
  INDEX idx_unit (unit_id),
  UNIQUE KEY uq_lot_unit_active (lot_id, unit_id, removed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── storage_items: individual items inside a lot ───
CREATE TABLE IF NOT EXISTS storage_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lot_id INT NOT NULL,
  unit_id INT DEFAULT NULL,              -- optional: which specific unit
  name VARCHAR(200) NOT NULL,            -- "4-seater sofa", "King bed frame"
  description TEXT DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  condition_in ENUM('excellent', 'good', 'fair', 'damaged') DEFAULT 'good',
  condition_out ENUM('excellent', 'good', 'fair', 'damaged') DEFAULT NULL,
  checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_out_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_lot (lot_id),
  INDEX idx_unit (unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── storage_photos: photos of items/units/lots ───
CREATE TABLE IF NOT EXISTS storage_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  lot_id INT DEFAULT NULL,
  unit_id INT DEFAULT NULL,
  item_id INT DEFAULT NULL,
  user_id INT DEFAULT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT 'image/jpeg',
  file_size INT DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  photo_type ENUM('checkin', 'checkout', 'damage', 'inventory', 'other') DEFAULT 'inventory',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_company (company_id),
  INDEX idx_lot (lot_id),
  INDEX idx_unit (unit_id),
  INDEX idx_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── storage_billing_history: payment records ───
CREATE TABLE IF NOT EXISTS storage_billing_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lot_id INT NOT NULL,
  company_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue', 'waived') NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  notes VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lot (lot_id),
  INDEX idx_company (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration 015: Table pour signaler un problème de paiement
-- Permet au staff terrain de signaler un problème visible par le patron

CREATE TABLE IF NOT EXISTS job_payment_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  reported_by INT NOT NULL,
  issue_type ENUM('wrong_amount', 'wrong_billing_mode', 'missing_hours', 'double_charge', 'client_dispute', 'other') NOT NULL,
  description TEXT,
  status ENUM('open', 'investigating', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_job (job_id),
  INDEX idx_reporter (reported_by),
  INDEX idx_status (status),
  INDEX idx_company_status (job_id, status),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

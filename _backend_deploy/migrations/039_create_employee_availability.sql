-- Migration 039: Employee availability (disponibilités récurrentes + exceptions ponctuelles)
-- Date: 2026-04-28
-- Deux tables :
--   employee_availability          → disponibilités hebdomadaires récurrentes
--   employee_availability_exceptions → overrides ponctuels (congés, indispos)
-- La logique de résolution (exception > récurrence) est gérée côté backend.

-- ─── Disponibilités hebdomadaires récurrentes ───────────────────────────────
CREATE TABLE IF NOT EXISTS employee_availability (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  company_id    INT UNSIGNED NOT NULL,
  day_of_week   TINYINT UNSIGNED NOT NULL
                COMMENT '0=Dimanche … 6=Samedi (convention JS/ISO)',
  start_time    TIME         NOT NULL,
  end_time      TIME         NOT NULL,
  is_available  TINYINT(1)   NOT NULL DEFAULT 1,
  note          VARCHAR(255) DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_ea_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  -- Requête principale : disponibilités d'un user pour un jour
  INDEX idx_ea_user_day  (user_id, day_of_week),
  -- Requête planning company : tous les dispos sur une période
  INDEX idx_ea_company   (company_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Exceptions ponctuelles (vacances, RTT, indispo imprévue) ────────────────
CREATE TABLE IF NOT EXISTS employee_availability_exceptions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  company_id      INT UNSIGNED NOT NULL,
  exception_date  DATE         NOT NULL,
  is_available    TINYINT(1)   NOT NULL DEFAULT 0
                  COMMENT '0 = indisponible ce jour, 1 = disponible (override positif)',
  reason          VARCHAR(255) DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un seul override par user par date
  UNIQUE KEY uq_eae_user_date (user_id, exception_date),

  CONSTRAINT fk_eae_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eae_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  -- Requête planning : exceptions d'une company sur une période
  INDEX idx_eae_company_date (company_id, exception_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration 037: Job attachments (pièces jointes sur les jobs)
-- Date: 2026-04-28
-- Permet d'attacher des fichiers (PDF, images, documents) à un job.
-- company_id dupliqué pour isolation multi-company sans JOIN.
-- uploaded_by sans ON DELETE CASCADE : on conserve le fichier même si l'user est supprimé.

CREATE TABLE IF NOT EXISTS job_attachments (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id        INT UNSIGNED NOT NULL,
  company_id    INT UNSIGNED NOT NULL,
  uploaded_by   INT UNSIGNED NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_url      TEXT         NOT NULL,
  file_type     ENUM('pdf','image','document','other') NOT NULL DEFAULT 'other',
  file_size_kb  INT UNSIGNED NOT NULL DEFAULT 0,
  label         VARCHAR(100) DEFAULT NULL
                COMMENT 'Étiquette libre (ex: "Contrat signé", "Photo avant")',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_ja_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_ja_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_ja_uploader
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,

  INDEX idx_ja_job     (job_id),
  INDEX idx_ja_company (company_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

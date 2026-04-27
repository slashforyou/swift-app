-- Migration 038: Linked jobs (relier 2 jobs entre eux)
-- Date: 2026-04-28
-- Relation N-N auto-référentielle sur jobs pour gérer :
--   - jobs interstate (aller + retour ou relais)
--   - follow-up (déménagement + stockage)
--   - jobs simplement liés (même client, même adresse)
-- IMPORTANT: la relation est orientée (job_id -> linked_job_id).
-- Le backend doit créer les deux sens pour une relation symétrique
-- si la symétrie est souhaitée (ex: interstate).
-- created_by sans CASCADE : log d'audit conservé même si l'user est supprimé.

CREATE TABLE IF NOT EXISTS job_links (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id         INT UNSIGNED NOT NULL,
  linked_job_id  INT UNSIGNED NOT NULL,
  link_type      ENUM('interstate','follow_up','related') NOT NULL DEFAULT 'related',
  created_by     INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Empêche le doublon (job_id, linked_job_id) pour un même type
  UNIQUE KEY uq_job_link (job_id, linked_job_id),

  CONSTRAINT fk_jl_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_jl_linked
    FOREIGN KEY (linked_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_jl_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

  INDEX idx_jl_linked_job (linked_job_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

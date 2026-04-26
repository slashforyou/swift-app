-- =============================================================================
-- Phase 4 — Scorecard & Reviews
-- =============================================================================

-- Catalogue des critères de qualité (statique, rempli en seed)
CREATE TABLE IF NOT EXISTS job_checkpoints (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    code         VARCHAR(64) NOT NULL UNIQUE,   -- ex: 'photo_before', 'signature_collected'
    label_fr     VARCHAR(128) NOT NULL,
    label_en     VARCHAR(128) NOT NULL,
    category     ENUM('photos','documents','steps','notes') NOT NULL,
    weight       TINYINT UNSIGNED NOT NULL DEFAULT 1,   -- poids dans le score
    is_active    TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insérer les critères par défaut (idempotent)
INSERT IGNORE INTO job_checkpoints (code, label_fr, label_en, category, weight) VALUES
('photo_before',       'Photos avant',                  'Before photos',            'photos',    2),
('photo_after',        'Photos après',                  'After photos',             'photos',    2),
('signature_client',   'Signature client collectée',    'Client signature collected','documents',2),
('note_added',         'Note ajoutée au job',           'Note added to job',        'notes',     1),
('steps_completed',    'Toutes les étapes terminées',   'All steps completed',      'steps',     3),
('crew_assigned',      'Équipe assignée',               'Crew assigned',            'steps',     1),
('truck_assigned',     'Camion assigné',                'Truck assigned',           'steps',     1);

-- Scorecards générées automatiquement après complétion du job
CREATE TABLE IF NOT EXISTS job_scorecards (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    job_id            INT NOT NULL UNIQUE,
    total_score       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    max_score         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    percentage        TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0-100
    generated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Résultats détaillés par checkpoint par job
CREATE TABLE IF NOT EXISTS job_checkpoint_results (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    job_id         INT NOT NULL,
    checkpoint_id  INT NOT NULL,
    passed         TINYINT(1) NOT NULL DEFAULT 0,
    value_text     VARCHAR(255) NULL,   -- détail optionnel (ex: "3 photos")
    checked_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_job_cp (job_id, checkpoint_id),
    INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demandes de review client (email signé HMAC)
CREATE TABLE IF NOT EXISTS client_review_requests (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    job_id        INT NOT NULL UNIQUE,
    sent_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_by       INT NOT NULL,   -- user_id qui a déclenché l'envoi
    recipient_email VARCHAR(255) NOT NULL,
    INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Avis clients soumis via le lien public
CREATE TABLE IF NOT EXISTS client_reviews (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    job_id           INT NOT NULL UNIQUE,
    token            VARCHAR(64) NOT NULL UNIQUE,
    rating_overall   TINYINT UNSIGNED NULL,   -- 1-5
    rating_service   TINYINT UNSIGNED NULL,
    rating_team      TINYINT UNSIGNED NULL,
    comment          TEXT NULL,
    submitted_at     DATETIME NULL,
    ip_address       VARCHAR(45) NULL,
    xp_distributed   TINYINT(1) NOT NULL DEFAULT 0,
    staff_ratings    JSON NULL,    -- [{"user_id":1,"rating":5}]
    INDEX idx_job (job_id),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration 049 : Table analytics_events
-- Stockage local de toutes les actions utilisateur (pas de tiers type PostHog)
-- Alimente le hook useAnalytics côté app

CREATE TABLE IF NOT EXISTS analytics_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NULL,
  company_id   INT UNSIGNED NULL,
  session_id   VARCHAR(64)  NULL,
  event_type   VARCHAR(100) NOT NULL,
  event_category ENUM('user_action', 'business', 'technical', 'error') NOT NULL DEFAULT 'user_action',
  event_data   JSON         NULL,
  screen_name  VARCHAR(100) NULL,
  app_version  VARCHAR(20)  NULL,
  platform     ENUM('ios', 'android', 'web') NULL,
  ip_address   VARCHAR(45)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_user_id      (user_id),
  INDEX idx_company_id   (company_id),
  INDEX idx_session_id   (session_id),
  INDEX idx_event_type   (event_type),
  INDEX idx_event_category (event_category),
  INDEX idx_screen_name  (screen_name),
  INDEX idx_created_at   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

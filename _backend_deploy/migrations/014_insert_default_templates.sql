-- Migration 014: Insert default modular templates
-- Les 8 templates par défaut (5 convertis + 3 nouveaux)

-- 1. Déménagement simple (location_to_location)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, is_default)
VALUES ('Déménagement simple', 'Déménagement direct d''une adresse à une autre', 'residential', 'location_to_location', 120.00, 2.0, 15, 1);
SET @tpl1 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl1, 1, 'travel', 'Trajet vers Lieu N°1', NULL, 0),
(@tpl1, 2, 'location', 'Lieu N°1', 'house', 1),
(@tpl1, 3, 'travel', 'Trajet vers Lieu N°2', NULL, 1),
(@tpl1, 4, 'location', 'Lieu N°2', 'apartment', 1),
(@tpl1, 5, 'travel', 'Trajet retour', NULL, 0);

-- 2. Plusieurs adresses (location_to_location)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, is_default)
VALUES ('Plusieurs adresses', 'Déménagement avec plusieurs points de chargement/déchargement', 'residential', 'location_to_location', 120.00, 2.0, 15, 1);
SET @tpl2 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl2, 1, 'travel', 'Trajet vers Lieu N°1', NULL, 0),
(@tpl2, 2, 'location', 'Lieu N°1', 'house', 1),
(@tpl2, 3, 'travel', 'Trajet vers Lieu N°2', NULL, 1),
(@tpl2, 4, 'location', 'Lieu N°2', 'apartment', 1),
(@tpl2, 5, 'travel', 'Trajet vers Lieu N°3', NULL, 1),
(@tpl2, 6, 'location', 'Lieu N°3', 'house', 1),
(@tpl2, 7, 'travel', 'Trajet retour', NULL, 0);

-- 3. Avec storage (location_to_location)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, is_default)
VALUES ('Avec storage', 'Déménagement avec mise en box au dépôt', 'storage', 'location_to_location', 120.00, 2.0, 15, 1);
SET @tpl3 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl3, 1, 'travel', 'Trajet vers Lieu N°1', NULL, 0),
(@tpl3, 2, 'location', 'Lieu N°1', 'house', 1),
(@tpl3, 3, 'travel', 'Trajet vers Lieu N°2', NULL, 1),
(@tpl3, 4, 'location', 'Lieu N°2', 'apartment', 1),
(@tpl3, 5, 'travel', 'Retour au dépôt', NULL, 0),
(@tpl3, 6, 'storage', 'Mise en storage', 'depot', 1);

-- 4. Déménagement container (depot_to_depot)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, return_trip_default_minutes, is_default)
VALUES ('Déménagement container', 'Chargement container au dépôt puis livraison', 'commercial', 'depot_to_depot', 120.00, 2.0, 15, 30, 1);
SET @tpl4 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl4, 1, 'loading', 'Chargement au dépôt', 'depot', 1),
(@tpl4, 2, 'travel', 'Trajet vers le lieu', NULL, 1),
(@tpl4, 3, 'location', 'Adresse de livraison', 'house', 1),
(@tpl4, 4, 'travel', 'Retour au dépôt', NULL, 1);

-- 5. Livraison simple (depot_to_depot)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, return_trip_default_minutes, is_default)
VALUES ('Livraison simple', 'Livraison depuis le dépôt', 'commercial', 'depot_to_depot', 120.00, 2.0, 15, 30, 1);
SET @tpl5 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl5, 1, 'loading', 'Chargement au dépôt', 'depot', 1),
(@tpl5, 2, 'travel', 'Trajet vers le lieu', NULL, 1),
(@tpl5, 3, 'location', 'Adresse de livraison', 'house', 1),
(@tpl5, 4, 'travel', 'Retour au dépôt', NULL, 1);

-- 6. Packing only (packing_only)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, is_default)
VALUES ('Packing only', 'Service d''emballage sur site uniquement', 'packing', 'packing_only', 80.00, 2.0, 15, 1);
SET @tpl6 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl6, 1, 'travel', 'Trajet vers le lieu', NULL, 0),
(@tpl6, 2, 'location', 'Lieu (packing)', 'house', 1),
(@tpl6, 3, 'travel', 'Trajet retour', NULL, 0);

-- 7. Unpacking only (unpacking_only)
INSERT INTO job_templates_modular (name, description, category, billing_mode, default_hourly_rate, minimum_hours, time_rounding_minutes, is_default)
VALUES ('Unpacking only', 'Service de déballage sur site uniquement', 'packing', 'unpacking_only', 80.00, 2.0, 15, 1);
SET @tpl7 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl7, 1, 'travel', 'Trajet vers le lieu', NULL, 0),
(@tpl7, 2, 'location', 'Lieu (unpacking)', 'apartment', 1),
(@tpl7, 3, 'travel', 'Trajet retour', NULL, 0);

-- 8. Forfait standard (flat_rate)
INSERT INTO job_templates_modular (name, description, category, billing_mode, flat_rate_amount, flat_rate_max_hours, flat_rate_overage_rate, is_default)
VALUES ('Forfait standard', 'Déménagement complet au forfait (prix fixe)', 'residential', 'flat_rate', 2500.00, 8.0, 150.00, 1);
SET @tpl8 = LAST_INSERT_ID();
INSERT INTO job_template_segments (template_id, segment_order, type, label, location_type, is_billable) VALUES
(@tpl8, 1, 'travel', 'Trajet vers Lieu N°1', NULL, 0),
(@tpl8, 2, 'location', 'Lieu N°1', 'house', 0),
(@tpl8, 3, 'travel', 'Trajet vers Lieu N°2', NULL, 0),
(@tpl8, 4, 'location', 'Lieu N°2', 'apartment', 0),
(@tpl8, 5, 'travel', 'Trajet retour', NULL, 0);
INSERT INTO job_template_flat_rate_options (template_id, label, price, display_order) VALUES
(@tpl8, 'Piano', 200.00, 1),
(@tpl8, 'Démontage lit', 80.00, 2),
(@tpl8, 'Emballage fragile', 120.00, 3);

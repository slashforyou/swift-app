-- Supprimer template "Déménagement container" (ID 7) — doublon de Livraison simple
DELETE FROM job_template_segments WHERE template_id = 7;
DELETE FROM job_template_flat_rate_options WHERE template_id = 7;
DELETE FROM job_templates_modular WHERE id = 7;

-- Supprimer template "Unpacking only" (ID 10) — fusionné dans Packing/Unpacking
DELETE FROM job_template_segments WHERE template_id = 10;
DELETE FROM job_template_flat_rate_options WHERE template_id = 10;
DELETE FROM job_templates_modular WHERE id = 10;

-- Renommer "Packing only" en "Packing/Unpacking"
UPDATE job_templates_modular SET name = 'Packing/Unpacking', description = 'Service d''emballage et/ou déballage sur site' WHERE id = 9;

INSERT IGNORE INTO gamification_xp_rewards (action_code, action_name, xp_amount, active) VALUES
  ('review_submitted',         'Review client soumise',                        20,  1),
  ('review_4star_overall',     'Note globale 4 etoiles',                       20,  1),
  ('review_5star_overall',     'Note globale 5 etoiles',                       40,  1),
  ('review_5star_service',     'Service note 5 etoiles',                       15,  1),
  ('review_5star_team',        'Equipe notee 5 etoiles',                       15,  1),
  ('staff_5star_rating',       'Staff note 5 etoiles individuellement',        25,  1),
  ('staff_positive_adjectives','Adjectifs positifs recus',                     10,  1),
  ('photo_milestone_5',        '5 photos sur un job',                          10,  1),
  ('photo_milestone_10',       '10 photos sur un job',                         20,  1),
  ('photo_milestone_20',       '20 photos sur un job',                         40,  1),
  ('photo_total_50',           '50 photos cumulees (lifetime)',                100,  1),
  ('photo_total_100',          '100 photos cumulees (lifetime)',               200,  1),
  ('photo_total_500',          '500 photos cumulees (lifetime)',               500,  1);


CREATE TABLE IF NOT EXISTS quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '?',
  type ENUM('daily','weekly','monthly','general','onboarding') NOT NULL,
  entity_scope ENUM('user','company') NOT NULL DEFAULT 'user',
  xp_reward INT NOT NULL DEFAULT 0,
  trophy_reward INT NOT NULL DEFAULT 0,
  target_count INT NOT NULL DEFAULT 1,
  event_trigger VARCHAR(50) NOT NULL,
  repeatable TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_active (active),
  INDEX idx_event (event_trigger)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO quests (code, title, description, icon, type, entity_scope, xp_reward, trophy_reward, target_count, event_trigger, repeatable, sort_order) VALUES
('DAILY_COMPLETE_1',    'Daily Mover',          'Complete 1 job today',                  '?', 'daily',   'user', 25,  5,  1,  'job_completed',       1, 10),
('DAILY_PHOTO_5',       'Snap Happy',           'Take 5 photos today',                   '?', 'daily',   'user', 15,  3,  5,  'photo_added',         1, 20),
('DAILY_NOTE_1',        'Note Taker',           'Add a note to any job today',           '?', 'daily',   'user', 10,  2,  1,  'note_added',          1, 30),
('DAILY_SIGNATURE_1',   'Signed & Sealed',      'Collect a client signature today',      '?', 'daily',   'user', 15,  3,  1,  'signature_collected', 1, 40),
('WEEKLY_COMPLETE_3',   'Weekly Starter',       'Complete 3 jobs this week',             '?', 'weekly',  'user', 60,  12, 3,  'job_completed',       1, 10),
('WEEKLY_COMPLETE_5',   'Weekly Warrior',       'Complete 5 jobs this week',             '?', 'weekly',  'user', 100, 20, 5,  'job_completed',       1, 20),
('WEEKLY_PHOTO_20',     'Photo Journalist',     'Take 20 photos this week',              '?', 'weekly',  'user', 50,  10, 20, 'photo_added',         1, 30),
('WEEKLY_SIGNATURE_3',  'Signature Collector',  'Collect 3 client signatures this week', '?', 'weekly',  'user', 40,  8,  3,  'signature_collected', 1, 40),
('WEEKLY_REVIEW_1',     'Star Collector',       'Receive 1 client review this week',     '?', 'weekly',  'user', 75,  15, 1,  'review_submitted',    1, 50),
('MONTHLY_COMPLETE_10', 'Monthly Mover',        'Complete 10 jobs this month',           '?', 'monthly', 'user', 150, 30, 10, 'job_completed',       1, 10),
('MONTHLY_COMPLETE_20', 'Monthly Marathon',     'Complete 20 jobs this month',           '?', 'monthly', 'user', 300, 50, 20, 'job_completed',       1, 20),
('MONTHLY_PHOTO_50',    'Chronicler',           'Take 50 photos this month',             '?', 'monthly', 'user', 100, 20, 50, 'photo_added',         1, 30),
('MONTHLY_REVIEW_3',    'Well Reviewed',        'Receive 3 client reviews this month',   '?', 'monthly', 'user', 120, 25, 3,  'review_submitted',    1, 40),
('GENERAL_FIRST_JOB',   'First Move',           'Complete your very first job',          '?', 'general', 'user', 50,  0,  1,  'job_completed',       0, 10),
('GENERAL_FIRST_PHOTO', 'First Shot',           'Upload your first photo',               '?', 'general', 'user', 25,  0,  1,  'photo_added',         0, 20),
('GENERAL_FIRST_SIG',   'First Signature',      'Collect your first client signature',   '?', 'general', 'user', 25,  0,  1,  'signature_collected', 0, 30),
('GENERAL_10_JOBS',     'Getting Serious',      'Complete 10 jobs in total',             '?', 'general', 'user', 100, 0,  10, 'job_completed',       0, 40),
('GENERAL_50_JOBS',     'Veteran Mover',        'Complete 50 jobs in total',             '?', 'general', 'user', 300, 0,  50, 'job_completed',       0, 50);

ALTER TABLE gamification_quest_progress
  ADD COLUMN IF NOT EXISTS quest_id INT DEFAULT NULL AFTER id,
  ADD INDEX IF NOT EXISTS idx_quest_id (quest_id);

UPDATE gamification_quest_progress gqp
  JOIN quests q ON q.code = gqp.quest_code
  SET gqp.quest_id = q.id
  WHERE gqp.quest_id IS NULL;

SELECT 'quests migration done' AS status;
SELECT COUNT(*) AS total_quests FROM quests;

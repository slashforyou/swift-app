-- Migration: Create support conversations and messages tables
-- Safe: CREATE IF NOT EXISTS only

CREATE TABLE IF NOT EXISTS support_conversations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  category    ENUM('help','feedback','feature','bug') NOT NULL DEFAULT 'help',
  subject     VARCHAR(255) NOT NULL,
  status      ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_conv_user (user_id),
  INDEX idx_conv_status (status)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id   INT NOT NULL,
  sender_type       ENUM('user','admin') NOT NULL DEFAULT 'user',
  sender_id         INT DEFAULT NULL,
  message           TEXT NOT NULL,
  is_read           TINYINT(1) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msg_conv (conversation_id),
  FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
);

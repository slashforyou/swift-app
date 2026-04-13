/**
 * Setup support messaging tables
 * Creates support_conversations and support_messages tables if they don't exist
 */
const { connect } = require("./swiftDb");

async function setup() {
  let connection;
  try {
    connection = await connect();
    console.log("Connected to database");

    // Check existing tables
    const [tables] = await connection.execute("SHOW TABLES LIKE 'support%'");
    console.log("Existing support tables:", tables.map(t => Object.values(t)[0]));

    // Create support_conversations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category ENUM('help', 'feedback', 'feature', 'bug') NOT NULL DEFAULT 'help',
        subject VARCHAR(255) NOT NULL,
        status ENUM('open', 'answered', 'closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ support_conversations table created/verified");

    // Create support_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_type ENUM('user', 'admin') NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_sender_type (sender_type),
        INDEX idx_is_read (is_read),
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ support_messages table created/verified");

    // Verify tables
    const [tablesAfter] = await connection.execute("SHOW TABLES LIKE 'support%'");
    console.log("Support tables now:", tablesAfter.map(t => Object.values(t)[0]));

    // Show table structures
    const [convCols] = await connection.execute("DESCRIBE support_conversations");
    console.log("\nsupport_conversations columns:");
    convCols.forEach(c => console.log(`  ${c.Field} - ${c.Type} ${c.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${c.Key || ''}`));

    const [msgCols] = await connection.execute("DESCRIBE support_messages");
    console.log("\nsupport_messages columns:");
    msgCols.forEach(c => console.log(`  ${c.Field} - ${c.Type} ${c.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${c.Key || ''}`));

    console.log("\n✅ Setup complete!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err.stack);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

setup();

/**
 * GET  /v1/support/conversations       — List user's conversations
 * POST /v1/support/conversations       — Create a new conversation (with first message)
 *
 * Requires authentication (req.user.id)
 */

const { connect } = require("../../../swiftDb");

const VALID_CATEGORIES = ["help", "feedback", "feature", "bug"];

// GET /v1/support/conversations
const listConversations = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    connection = await connect();

    const [conversations] = await connection.execute(
      `SELECT c.id, c.category, c.subject, c.status, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM support_messages m 
               WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_type = 'admin') as unread_count,
              (SELECT m2.message FROM support_messages m2 
               WHERE m2.conversation_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as last_message,
              (SELECT m3.sender_type FROM support_messages m3 
               WHERE m3.conversation_id = c.id ORDER BY m3.created_at DESC LIMIT 1) as last_sender
       FROM support_conversations c
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId],
    );

    return res.json({ success: true, conversations });
  } catch (err) {
    console.error("[ Support ] List conversations error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// POST /v1/support/conversations
const createConversation = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const { category, subject, message } = req.body || {};

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid category" });
    }
    if (
      !subject ||
      typeof subject !== "string" ||
      subject.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Subject is required" });
    }
    if (subject.length > 255) {
      return res
        .status(400)
        .json({ success: false, error: "Subject too long (max 255)" });
    }
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Message is required" });
    }
    if (message.length > 5000) {
      return res
        .status(400)
        .json({ success: false, error: "Message too long (max 5000)" });
    }

    connection = await connect();

    // Create conversation
    const [convResult] = await connection.execute(
      "INSERT INTO support_conversations (user_id, category, subject) VALUES (?, ?, ?)",
      [userId, category, subject.trim()],
    );

    const conversationId = convResult.insertId;

    // Insert first message
    await connection.execute(
      "INSERT INTO support_messages (conversation_id, sender_type, sender_id, message) VALUES (?, 'user', ?, ?)",
      [conversationId, userId, message.trim()],
    );

    return res.status(201).json({
      success: true,
      conversation: {
        id: conversationId,
        category,
        subject: subject.trim(),
        status: "open",
      },
    });
  } catch (err) {
    console.error("[ Support ] Create conversation error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { listConversations, createConversation };

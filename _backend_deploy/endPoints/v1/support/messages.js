/**
 * GET  /v1/support/conversations/:id/messages  — List messages in a conversation
 * POST /v1/support/conversations/:id/messages  — Send a message in a conversation
 *
 * Requires authentication (req.user.id)
 */

const { connect } = require("../../../swiftDb");

// GET /v1/support/conversations/:id/messages
const listMessages = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const conversationId = parseInt(req.params.id, 10);
    if (!conversationId)
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation ID" });

    connection = await connect();

    // Verify conversation belongs to user
    const [conv] = await connection.execute(
      "SELECT id FROM support_conversations WHERE id = ? AND user_id = ?",
      [conversationId, userId],
    );
    if (!conv.length) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found" });
    }

    // Get messages
    const [messages] = await connection.execute(
      `SELECT id, sender_type, message, is_read, created_at
       FROM support_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [conversationId],
    );

    // Mark admin messages as read
    await connection.execute(
      "UPDATE support_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'admin' AND is_read = 0",
      [conversationId],
    );

    return res.json({ success: true, messages });
  } catch (err) {
    console.error("[ Support ] List messages error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// POST /v1/support/conversations/:id/messages
const sendMessage = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const conversationId = parseInt(req.params.id, 10);
    if (!conversationId)
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation ID" });

    const { message } = req.body || {};
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

    // Verify conversation belongs to user and is not closed
    const [conv] = await connection.execute(
      "SELECT id, status FROM support_conversations WHERE id = ? AND user_id = ?",
      [conversationId, userId],
    );
    if (!conv.length) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found" });
    }
    if (conv[0].status === "closed") {
      return res
        .status(400)
        .json({ success: false, error: "Conversation is closed" });
    }

    // Insert message
    const [result] = await connection.execute(
      "INSERT INTO support_messages (conversation_id, sender_type, sender_id, message) VALUES (?, 'user', ?, ?)",
      [conversationId, userId, message.trim()],
    );

    // Update conversation status back to open (in case it was answered)
    await connection.execute(
      "UPDATE support_conversations SET status = 'open' WHERE id = ?",
      [conversationId],
    );

    return res.status(201).json({
      success: true,
      message: {
        id: result.insertId,
        sender_type: "user",
        message: message.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[ Support ] Send message error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { listMessages, sendMessage };

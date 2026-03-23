/**
 * POST /v1/feedback
 *
 * Stores a user feedback / contact message in the database.
 * Expects JSON body: { type: 'help'|'feedback'|'feature'|'bug', message: string }
 */

const { connect } = require("../../../swiftDb");

const VALID_TYPES = ["help", "feedback", "feature", "bug"];

const feedbackEndpoint = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { type, message } = req.body || {};

    if (!type || !VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid feedback type" });
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
        .json({ success: false, error: "Message too long (max 5000 chars)" });
    }

    connection = await connect();

    await connection.execute(
      "INSERT INTO user_feedback (user_id, type, message) VALUES (?, ?, ?)",
      [userId, type, message.trim()],
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[ Feedback ] Error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { feedbackEndpoint };

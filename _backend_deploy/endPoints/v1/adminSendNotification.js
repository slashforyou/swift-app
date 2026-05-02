/**
 * POST /v1/admin/send-notification
 * Send a push notification to any user by email.
 * Protected by JWT + company_role = "patron".
 *
 * Body: {
 *   email:  string   — target user's email
 *   title:  string   — notification title
 *   body:   string   — notification body
 *   data?:  object   — optional extra payload (screen, job_id, etc.)
 * }
 */

const { connect } = require("../../swiftDb");
const { sendPushToUser, insertNotification } = require("../../utils/pushHelper");

const MAX_TITLE_LEN = 100;
const MAX_BODY_LEN  = 500;

const adminSendNotificationEndpoint = async (req, res) => {
  let connection;
  try {
    // ── Auth: JWT required, role must be patron ──────────────────────────────
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (caller.company_role !== "patron") {
      return res.status(403).json({ success: false, error: "Patron role required" });
    }

    // ── Validate body ────────────────────────────────────────────────────────
    const { email, title, body, data } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "email is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, error: "title is required" });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ success: false, error: "body is required" });
    }

    const safeTitle = title.trim().slice(0, MAX_TITLE_LEN);
    const safeBody  = body.trim().slice(0, MAX_BODY_LEN);
    const safeData  = data && typeof data === "object" && !Array.isArray(data) ? data : {};

    // ── Find target user by email ────────────────────────────────────────────
    connection = await connect();
    const [userRows] = await connection.execute(
      `SELECT id, first_name, email FROM users WHERE email = ? AND is_active = 1 LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (!userRows.length) {
      return res.status(404).json({
        success: false,
        error: `No active user found with email: ${email}`,
      });
    }

    const targetUser = userRows[0];

    // ── Check target has active push tokens ─────────────────────────────────
    const [tokenRows] = await connection.execute(
      `SELECT COUNT(*) AS cnt FROM user_push_tokens
       WHERE user_id = ? AND is_active = 1 AND push_token IS NOT NULL`,
      [targetUser.id]
    );
    const tokenCount = tokenRows[0]?.cnt ?? 0;

    if (tokenCount === 0) {
      return res.status(404).json({
        success: false,
        error: `User ${email} has no active push tokens. They must open the app first.`,
      });
    }

    // ── Send push ────────────────────────────────────────────────────────────
    const result = await sendPushToUser(
      connection,
      targetUser.id,
      safeTitle,
      safeBody,
      { ...safeData, type: "admin_test", screen: safeData.screen || "Calendar" }
    );

    // ── Log in notifications table ───────────────────────────────────────────
    await insertNotification(
      connection,
      targetUser.id,
      "system",
      safeTitle,
      safeBody,
      null
    ).catch(() => {}); // non-blocking

    return res.status(200).json({
      success: true,
      message: `Notification sent to ${targetUser.first_name} (${email})`,
      tokens_reached: result.sent,
    });

  } catch (error) {
    console.error("[adminSendNotification] Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) {
      try { await connection.end(); } catch {}
    }
  }
};

module.exports = { adminSendNotificationEndpoint };

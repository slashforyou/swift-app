/**
 * pushHelper.js — Centralised push notification helpers
 *
 * Replaces inline sendPushToCompany / sendPushToUser duplicated in 6+ endpoints.
 * Works with an existing DB connection (no extra connect/close).
 *
 * Usage:
 *   const { sendPushToCompany, sendPushToUser, insertNotification } = require('../../utils/pushHelper');
 *   // inside an endpoint that already has `connection`:
 *   await sendPushToCompany(connection, companyId, title, body, data);
 *   await insertNotification(connection, userId, 'job_update', title, content, jobId);
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notification to ALL active tokens of a company.
 * Non-blocking: catches errors silently.
 *
 * @param {import('mysql2/promise').Connection} connection
 * @param {number} companyId
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}] — Extra payload (screen, job_id, type, etc.)
 */
async function sendPushToCompany(connection, companyId, title, body, data = {}) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT ut.push_token
       FROM user_push_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE u.company_id = ? AND ut.push_token IS NOT NULL AND ut.is_active = 1`,
      [companyId]
    );
    if (!tokenRows.length) return { sent: 0 };

    const messages = tokenRows.map((r) => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: data.screen || "Calendar" },
      sound: "default",
    }));

    const resp = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    const result = await resp.json();

    // Deactivate invalid tokens
    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        if (result.data[i]?.details?.error === "DeviceNotRegistered") {
          await connection
            .execute(
              "UPDATE user_push_tokens SET is_active = FALSE WHERE push_token = ?",
              [tokenRows[i].push_token]
            )
            .catch(() => {});
        }
      }
    }

    return { sent: messages.length, result };
  } catch (err) {
    console.warn("[pushHelper.sendPushToCompany] Non-blocking error:", err.message);
    return { sent: 0, error: err.message };
  }
}

/**
 * Send push notification to a SINGLE user (all their active tokens).
 * Non-blocking: catches errors silently.
 *
 * @param {import('mysql2/promise').Connection} connection
 * @param {number} userId
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}]
 */
async function sendPushToUser(connection, userId, title, body, data = {}) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT push_token FROM user_push_tokens
       WHERE user_id = ? AND is_active = 1 AND push_token IS NOT NULL`,
      [userId]
    );
    if (!tokenRows.length) return { sent: 0 };

    const messages = tokenRows.map((r) => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: data.screen || "Calendar" },
      sound: "default",
    }));

    const resp = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    const result = await resp.json();

    // Deactivate invalid tokens
    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        if (result.data[i]?.details?.error === "DeviceNotRegistered") {
          await connection
            .execute(
              "UPDATE user_push_tokens SET is_active = FALSE WHERE push_token = ?",
              [tokenRows[i].push_token]
            )
            .catch(() => {});
        }
      }
    }

    return { sent: messages.length, result };
  } catch (err) {
    console.warn("[pushHelper.sendPushToUser] Non-blocking error:", err.message);
    return { sent: 0, error: err.message };
  }
}

/**
 * Send push to ALL users of a company AND insert a DB notification for each.
 * Convenience combo — use when you want both push + in-app notification.
 *
 * @param {import('mysql2/promise').Connection} connection
 * @param {number} companyId
 * @param {string} notifType — DB enum: info|warning|error|success|job_update|truck_assignment|payment|system
 * @param {string} title
 * @param {string} body
 * @param {object} [opts={}]
 * @param {number} [opts.jobId]
 * @param {string} [opts.priority] — low|normal|high|urgent
 * @param {object} [opts.pushData] — Extra data for push payload
 * @param {object} [opts.metadata] — Extra metadata stored in DB
 */
async function notifyCompany(connection, companyId, notifType, title, body, opts = {}) {
  const { jobId, priority = "normal", pushData = {}, metadata = null } = opts;

  // 1) Push notification
  const pushResult = await sendPushToCompany(connection, companyId, title, body, pushData);

  // 2) Insert DB notification for each user in the company
  try {
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE company_id = ?",
      [companyId]
    );
    for (const user of users) {
      await insertNotification(connection, user.id, notifType, title, body, jobId, priority, metadata);
    }
  } catch (err) {
    console.warn("[pushHelper.notifyCompany] DB insert error:", err.message);
  }

  return pushResult;
}

/**
 * Send push to a user AND insert a DB notification.
 *
 * @param {import('mysql2/promise').Connection} connection
 * @param {number} userId
 * @param {string} notifType
 * @param {string} title
 * @param {string} body
 * @param {object} [opts={}]
 */
async function notifyUser(connection, userId, notifType, title, body, opts = {}) {
  const { jobId, priority = "normal", pushData = {}, metadata = null } = opts;

  const pushResult = await sendPushToUser(connection, userId, title, body, pushData);
  await insertNotification(connection, userId, notifType, title, body, jobId, priority, metadata);

  return pushResult;
}

/**
 * Insert a notification row into the `notifications` table.
 * Non-blocking: catches errors silently.
 *
 * @param {import('mysql2/promise').Connection} connection
 * @param {number} userId
 * @param {string} type — info|warning|error|success|job_update|truck_assignment|payment|system
 * @param {string} title
 * @param {string} content
 * @param {number|null} [jobId=null]
 * @param {string} [priority='normal'] — low|normal|high|urgent
 * @param {object|null} [metadata=null]
 */
async function insertNotification(connection, userId, type, title, content, jobId = null, priority = "normal", metadata = null) {
  try {
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, content, status, priority, job_id, metadata, created_at)
       VALUES (?, ?, ?, ?, 'unread', ?, ?, ?, NOW())`,
      [
        userId,
        type,
        title,
        content,
        priority,
        jobId,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.warn("[pushHelper.insertNotification] Non-blocking error:", err.message);
  }
}

module.exports = {
  sendPushToCompany,
  sendPushToUser,
  notifyCompany,
  notifyUser,
  insertNotification,
  EXPO_PUSH_URL,
};

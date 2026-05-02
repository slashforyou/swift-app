/**
 * POST /v1/analytics/events
 * Reçoit un batch d'événements analytics depuis l'app mobile.
 * Stockage 100% local — pas de tiers (pas de PostHog, Mixpanel, etc.)
 *
 * Body: { events: AnalyticsEvent[] }
 * Rate limit : appliqué au niveau du router (voir express-rate-limit)
 *
 * Auth : JWT obligatoire (sauf si user_id est null → visiteur non connecté)
 */

const { connect } = require("../../swiftDb");
const { authenticateToken } = require("../../middlewares/auth");
const { analyticsRateLimit } = require("../../utils/rateLimiter");

// ─── Validation ────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["user_action", "business", "technical", "error"];
const MAX_EVENTS_PER_BATCH = 50;
const MAX_EVENT_TYPE_LEN = 100;
const MAX_SESSION_ID_LEN = 64;

function validateEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.event_type !== "string" || event.event_type.length === 0) return false;
  if (event.event_type.length > MAX_EVENT_TYPE_LEN) return false;
  if (!VALID_CATEGORIES.includes(event.event_category)) return false;
  if (event.session_id && typeof event.session_id === "string" && event.session_id.length > MAX_SESSION_ID_LEN) return false;
  if (event.event_data && typeof event.event_data !== "object") return false;
  return true;
}

// ─── Handler ───────────────────────────────────────────────────────────────────
const postAnalyticsEvents = [
  analyticsRateLimit,
  authenticateToken,
  async (req, res) => {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "events must be a non-empty array." });
    }

    if (events.length > MAX_EVENTS_PER_BATCH) {
      return res.status(400).json({
        success: false,
        message: `Batch too large. Maximum ${MAX_EVENTS_PER_BATCH} events per request.`,
      });
    }

    // Valider chaque événement
    for (const event of events) {
      if (!validateEvent(event)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event in batch. Check event_type and event_category.",
        });
      }
    }

    const userId    = req.user?.id    ?? null;
    const companyId = req.user?.company_id ?? null;
    const platform  = req.headers["x-platform"] ?? null;
    const appVersion = req.headers["x-app-version"] ?? null;
    // IP : derrière un proxy, utiliser x-forwarded-for si disponible
    const ipAddress = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim() || null;

    let connection;
    try {
      connection = await connect();

      const insertQuery = `
        INSERT INTO analytics_events
          (user_id, company_id, session_id, event_type, event_category,
           event_data, screen_name, app_version, platform, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertions = events.map((event) => {
        const screenName = event.event_data?.screen_name ?? null;
        const sessionId  = event.session_id ?? null;
        const createdAt  = event.timestamp ?? new Date().toISOString().replace("T", " ").split(".")[0];
        const eventData  = event.event_data ? JSON.stringify(event.event_data) : null;

        return connection.execute(insertQuery, [
          userId,
          companyId,
          sessionId,
          event.event_type,
          event.event_category,
          eventData,
          screenName,
          appVersion,
          platform,
          ipAddress,
          createdAt,
        ]);
      });

      await Promise.all(insertions);

      return res.json({ success: true, inserted: events.length });
    } catch (error) {
      console.error("[ANALYTICS] Error inserting events:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
      if (connection) connection.release?.();
    }
  },
];

module.exports = { postAnalyticsEvents };

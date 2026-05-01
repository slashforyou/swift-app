/**
 * rateLimiter.js — Middleware de rate limiting centralisé pour Cobbr
 *
 * Utilisation :
 *   const { authRateLimit, apiRateLimit, publicRateLimit } = require('../middlewares/rateLimiter');
 *   router.post('/login', authRateLimit, handler);
 *
 * Stratégie :
 *   - auth       : 5 req / 15 min   par IP  → protect login, refresh, forgot-password
 *   - public     : 3 req / heure    par IP  → endpoints sans auth (review, quote public)
 *   - api        : 100 req / min    par user → endpoints authentifiés standard
 *   - admin      : 30 req / min     par user → endpoints admin/owner
 *   - creation   : 20 req / min     par user → créer job, client, entreprise, etc.
 *   - analytics  : 100 req / 15 min par IP  → batch events analytics app
 */

const rateLimit = require("express-rate-limit");

// ─── Helper : identifiant user ou fallback IP ──────────────────────────────────
const keyByUserOrIp = (req) => {
  if (req.user?.id) return `user_${req.user.id}`;
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.socket?.remoteAddress ?? "unknown";
};

// ─── Auth endpoints (login, refresh, forgot-password, reset-password) ─────────
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.socket?.remoteAddress ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});

// ─── Endpoints publics sans auth (review client, lien public) ─────────────────
const publicRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 heure
  max: 3,
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.socket?.remoteAddress ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// ─── API authentifiée standard ─────────────────────────────────────────────────
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 100,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Slow down." },
});

// ─── Endpoints de création (job, client, entreprise, devis) ───────────────────
const creationRateLimit = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 20,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many creation requests. Please slow down." },
});

// ─── Endpoints admin/owner ─────────────────────────────────────────────────────
const adminRateLimit = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 30,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin requests." },
});

// ─── Analytics events batch ────────────────────────────────────────────────────
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analytics requests." },
});

module.exports = {
  authRateLimit,
  publicRateLimit,
  apiRateLimit,
  creationRateLimit,
  adminRateLimit,
  analyticsRateLimit,
};

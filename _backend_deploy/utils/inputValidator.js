/**
 * inputValidator.js — Validation centralisée des inputs entrants
 *
 * Utilisation :
 *   const { validateBody, rules } = require('../middlewares/inputValidator');
 *   router.post('/jobs', validateBody(rules.createJob), handler);
 *
 * Chaque règle retourne { valid: boolean, error?: string }
 * validateBody() renvoie 400 avec le premier message d'erreur trouvé.
 */

// ─── Types primitifs ──────────────────────────────────────────────────────────

const isString = (v, min = 0, max = Infinity) =>
  typeof v === "string" && v.length >= min && v.length <= max;

const isInt = (v, min = -Infinity, max = Infinity) =>
  Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max;

const isFloat = (v, min = -Infinity, max = Infinity) =>
  !isNaN(parseFloat(v)) && parseFloat(v) >= min && parseFloat(v) <= max;

const isEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

const isEnum = (v, allowed) =>
  allowed.includes(v);

const isOptional = (v, checkFn) =>
  v === undefined || v === null || checkFn(v);

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * @param {Array<{ field: string, check: (value, body) => boolean, message: string, optional?: boolean }>} rules
 */
function validateBody(rules) {
  return (req, res, next) => {
    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.optional && (value === undefined || value === null)) continue;

      if (!rule.check(value, req.body)) {
        return res.status(400).json({
          success: false,
          message: rule.message,
          field: rule.field,
        });
      }
    }
    next();
  };
}

// ─── Règles prédéfinies par domaine ──────────────────────────────────────────

const rules = {
  // Auth
  login: [
    { field: "email",    check: isEmail,                      message: "Invalid email format." },
    { field: "password", check: (v) => isString(v, 8, 128),   message: "Password must be 8–128 characters." },
  ],

  resetPassword: [
    { field: "email",       check: isEmail,                   message: "Invalid email format." },
    { field: "code",        check: (v) => isString(v, 4, 10), message: "Invalid code." },
    { field: "newPassword", check: (v) => isString(v, 8, 128),message: "Password must be 8–128 characters." },
  ],

  // Review public (sans auth)
  submitReview: [
    { field: "ratingOverall", check: (v) => isInt(v, 1, 5),    message: "Overall rating must be between 1 and 5." },
    { field: "ratingService", check: (v) => isOptional(v, (x) => isInt(x, 1, 5)), message: "Service rating must be between 1 and 5.", optional: true },
    { field: "ratingTeam",    check: (v) => isOptional(v, (x) => isInt(x, 1, 5)), message: "Team rating must be between 1 and 5.", optional: true },
    { field: "comment",       check: (v) => isOptional(v, (x) => isString(x, 0, 1000)), message: "Comment must not exceed 1000 characters.", optional: true },
  ],

  // Jobs
  createJob: [
    { field: "title",          check: (v) => isString(v, 1, 200),  message: "Job title is required (max 200 chars)." },
    { field: "pickup_address", check: (v) => isString(v, 1, 500),  message: "Pickup address is required." },
    { field: "delivery_address", check: (v) => isString(v, 1, 500),message: "Delivery address is required." },
  ],

  // Plans
  assignPlan: [
    { field: "company_id", check: (v) => isInt(v, 1),             message: "Invalid company_id." },
    { field: "plan_id",    check: (v) => isInt(v, 1),             message: "Invalid plan_id." },
  ],
};

// ─── Sanitizers ───────────────────────────────────────────────────────────────

/**
 * Trim tous les strings d'un objet body (shallow).
 * À utiliser en middleware avant validateBody.
 */
function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}

module.exports = {
  validateBody,
  sanitizeBody,
  rules,
  // Primitives utiles pour des règles custom
  isString,
  isInt,
  isFloat,
  isEmail,
  isEnum,
  isOptional,
};

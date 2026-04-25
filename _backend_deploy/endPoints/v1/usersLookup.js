const pool = require('../../swiftDb');

/**
 * Normalize a phone number to a digits-only suffix that's robust to:
 * - international prefixes (+61, 0061, etc.)
 * - leading zeros (Australian mobiles)
 * - spaces, dashes, parentheses
 *
 * We compare by the LAST 9 DIGITS, which is enough to disambiguate
 * within a single country while ignoring formatting differences.
 */
function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/\D+/g, '');
  if (!digits) return null;
  return digits.slice(-9);
}

/**
 * POST /v1/users/lookup-by-phones
 * Body: { phones: string[] }   (max 500 phones per call)
 *
 * Returns the subset of phones that match an existing Cobbr user account.
 * Privacy:
 *  - Only matched results are returned (no enumeration of unknown numbers)
 *  - Only public-safe fields (id, first_name, last_name, avatar_url) are exposed
 *  - The original input phone is echoed back so the client can map results to its contacts
 *
 * Requires authenticateToken middleware (req.user populated).
 */
const lookupUsersByPhones = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { phones } = req.body || {};
    if (!Array.isArray(phones)) {
      return res.status(400).json({ success: false, error: 'phones must be an array' });
    }
    if (phones.length === 0) {
      return res.json({ success: true, matches: [] });
    }
    if (phones.length > 500) {
      return res.status(400).json({ success: false, error: 'Too many phones (max 500)' });
    }

    // Build a map: normalized -> [original, ...]
    const normalizedToOriginals = new Map();
    for (const raw of phones) {
      const norm = normalizePhone(raw);
      if (!norm || norm.length < 6) continue;
      if (!normalizedToOriginals.has(norm)) normalizedToOriginals.set(norm, []);
      normalizedToOriginals.get(norm).push(raw);
    }
    const normalizedList = Array.from(normalizedToOriginals.keys());
    if (normalizedList.length === 0) {
      return res.json({ success: true, matches: [] });
    }

    // Match by the same trailing-9-digits convention.
    // We do this in SQL with REGEXP_REPLACE to strip non-digits, then RIGHT(...,9).
    // Fallback: if MySQL < 8 (no REGEXP_REPLACE), see migration adding `phone_digits` index.
    // We use the indexed `phone_digits` column for performance (added by migration 0XX).
    const placeholders = normalizedList.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, phone, phone_digits, avatar_url
         FROM users
        WHERE phone_digits IN (${placeholders})
          AND deleted_at IS NULL`,
      normalizedList
    );

    const matches = [];
    for (const row of rows) {
      const originals = normalizedToOriginals.get(row.phone_digits) || [];
      for (const original of originals) {
        matches.push({
          phone: original,
          user: {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            avatarUrl: row.avatar_url || null,
          },
        });
      }
    }

    return res.json({ success: true, matches });
  } catch (err) {
    console.error('[usersLookup] lookupUsersByPhones error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { lookupUsersByPhones, normalizePhone };

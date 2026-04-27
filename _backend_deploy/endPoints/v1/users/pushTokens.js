/**
 * Push Token Endpoints
 *
 * POST   /swift-app/v1/users/push-token   — Enregistre ou met à jour un token Expo
 * DELETE /swift-app/v1/users/push-token   — Désactive un token (is_active = 0)
 *
 * Sécurité :
 *   - user_id toujours issu de req.user.id (JWT), jamais du body
 *   - Validation format ExponentPushToken[...]
 *   - DELETE scopé strictement sur user_id = req.user.id
 */

const { connect } = require('../../../swiftDb');

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Vérifie que le token est bien au format Expo standard.
 * Expo génère des tokens de la forme : ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */
function isValidExpoPushToken(token) {
  if (typeof token !== 'string') return false;
  return /^ExponentPushToken\[.{10,}\]$/.test(token);
}

const ALLOWED_PLATFORMS = ['ios', 'android', 'web'];

// ─── POST /users/push-token ───────────────────────────────────────────────────

const registerPushToken = async (req, res) => {
  console.log('[ POST /users/push-token ]', {
    userId: req.user?.id,
    platform: req.body?.platform,
    device_id: req.body?.device_id,
  });

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { push_token, platform, device_id, device_name, app_version } = req.body || {};

  // ── Validation des inputs ──
  if (!push_token) {
    return res.status(400).json({ success: false, message: 'push_token is required' });
  }
  if (!isValidExpoPushToken(push_token)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid push token format. Expected: ExponentPushToken[...]',
    });
  }
  if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
    return res.status(400).json({
      success: false,
      message: `platform is required and must be one of: ${ALLOWED_PLATFORMS.join(', ')}`,
    });
  }

  // Sanitize les optionnels (évite undefined dans la requête SQL)
  const safeDeviceId   = typeof device_id   === 'string' ? device_id.substring(0, 255)   : null;
  const safeDeviceName = typeof device_name === 'string' ? device_name.substring(0, 255) : null;
  const safeAppVersion = typeof app_version === 'string' ? app_version.substring(0, 50)  : null;

  let connection;
  try {
    connection = await connect();

    // INSERT or UPDATE :
    //   - Si le push_token existe déjà pour cet user → on met à jour (is_active=1, métadonnées)
    //   - Si le push_token appartient à un AUTRE user → ON DUPLICATE KEY met à jour user_id
    //     (l'utilisateur a réinstallé l'app sur le même device)
    //   - Champ UNIQUE : push_token
    await connection.execute(
      `INSERT INTO user_push_tokens
         (user_id, push_token, platform, device_id, device_name, app_version, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         user_id      = VALUES(user_id),
         platform     = VALUES(platform),
         device_id    = VALUES(device_id),
         device_name  = VALUES(device_name),
         app_version  = VALUES(app_version),
         is_active    = 1,
         updated_at   = NOW()`,
      [userId, push_token, platform, safeDeviceId, safeDeviceName, safeAppVersion],
    );

    return res.status(200).json({
      success: true,
      message: 'Push token registered',
    });
  } catch (err) {
    console.error('[registerPushToken] DB error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
  }
};

// ─── DELETE /users/push-token ─────────────────────────────────────────────────

const unregisterPushToken = async (req, res) => {
  console.log('[ DELETE /users/push-token ]', {
    userId: req.user?.id,
    device_id: req.body?.device_id,
    has_token: !!req.body?.push_token,
  });

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { push_token, device_id } = req.body || {};

  if (!push_token && !device_id) {
    return res.status(400).json({
      success: false,
      message: 'push_token or device_id is required',
    });
  }

  // Validation du token si fourni
  if (push_token && !isValidExpoPushToken(push_token)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid push token format. Expected: ExponentPushToken[...]',
    });
  }

  let connection;
  try {
    connection = await connect();

    if (device_id) {
      // Désactive TOUS les tokens du device pour cet user uniquement
      const safeDeviceId = typeof device_id === 'string' ? device_id.substring(0, 255) : null;
      if (!safeDeviceId) {
        return res.status(400).json({ success: false, message: 'Invalid device_id' });
      }

      await connection.execute(
        `UPDATE user_push_tokens
            SET is_active = 0, updated_at = NOW()
          WHERE user_id = ? AND device_id = ?`,
        [userId, safeDeviceId],
      );
    } else {
      // Désactive le token spécifique — uniquement si appartient à cet user
      const [rows] = await connection.execute(
        `SELECT id FROM user_push_tokens
          WHERE push_token = ? AND user_id = ?`,
        [push_token, userId],
      );

      if (!rows.length) {
        // Token introuvable OU appartient à un autre user → 404 sans révéler lequel
        return res.status(404).json({
          success: false,
          message: 'Push token not found',
        });
      }

      await connection.execute(
        `UPDATE user_push_tokens
            SET is_active = 0, updated_at = NOW()
          WHERE push_token = ? AND user_id = ?`,
        [push_token, userId],
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Push token unregistered',
    });
  } catch (err) {
    console.error('[unregisterPushToken] DB error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { registerPushToken, unregisterPushToken };

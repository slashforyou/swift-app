/**
 * =====================================================
 * 🔔 DEV TEST PUSH ENDPOINT
 * =====================================================
 *
 * Endpoint de test pour les push notifications.
 * Permet d'envoyer une notification de test à un utilisateur via son email.
 *
 * Endpoint:
 *   POST /v1/dev/test-push   → Envoie une notification test à tous les tokens actifs de l'email
 *
 * @module endPoints/dev_test_push
 */

const { connect, close } = require('../../swiftDb');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * POST /swift-app/v1/dev/test-push
 *
 * Cherche les push tokens actifs d'un utilisateur par email
 * et envoie une notification de test via l'API Expo Push.
 *
 * Body: { email: string }
 * Requires: authenticateToken
 */
async function testPush(req, res) {
  const { email } = req.body;

  // Validation de l'input
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ success: false, error: 'email is required' });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  const connection = await connect();
  try {
    // Récupérer les tokens actifs de l'utilisateur
    const [rows] = await connection.execute(
      `SELECT upt.push_token
       FROM user_push_tokens upt
       JOIN users u ON u.id = upt.user_id
       WHERE u.email = ?
         AND upt.is_active = 1
         AND upt.push_token IS NOT NULL`,
      [sanitizedEmail]
    );

    if (!rows.length) {
      return res.json({ success: false, error: 'No push token found for this email' });
    }

    // Construire les messages Expo Push
    const messages = rows.map((row) => ({
      to: row.push_token,
      title: '🔔 Test notification Cobbr',
      body: 'Cette notification a été envoyée depuis le DevMenu.',
      data: { type: 'dev_test', screen: 'Home' },
      sound: 'default',
    }));

    // Envoyer via l'API Expo Push
    const resp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await resp.json();

    return res.json({ success: true, sent: messages.length, result });
  } catch (error) {
    console.error('❌ POST /v1/dev/test-push error:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

/**
 * Enregistre la route sur le router Express fourni.
 * authenticateToken est injecté depuis index.js (pattern standard Cobbr).
 *
 * @param {import('express').Router} router
 * @param {Function} authenticateToken
 */
function registerRoutes(router, authenticateToken) {
  router.post('/dev/test-push', authenticateToken, testPush);
}

module.exports = { registerRoutes, testPush };

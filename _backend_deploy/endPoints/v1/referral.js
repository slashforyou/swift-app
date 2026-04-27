/**
 * referral.js — Système de parrainage inter-company
 *
 * Routes:
 *   GET  /v1/company/referral-code           → retourne le code de la company (génère si absent)
 *   GET  /v1/company/referrals               → liste les companies parrainées
 *   POST /v1/referral/use                    → PUBLIC — enregistre l'utilisation d'un code parrain
 *
 * Tables: companies.referral_code, companies.referred_by_code, referral_rewards (migration 044)
 *
 * Sécurité:
 *   - GET routes: scopées par company_id JWT
 *   - POST /v1/referral/use: peut être appelé sans auth (ex: lors de l'inscription)
 *     → new_company_id validé pour éviter des abus
 */

const crypto = require('crypto');
const { connect } = require('../../swiftDb');

/* ─── Générateur de code parrain: 8 chars A-Z0-9 ─────────────────────────── */
const generateCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

/* ─── GET /v1/company/referral-code ──────────────────────────────────────── */
const getReferralCode = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const connection = await connect();
  try {
    const [rows] = await connection.execute(
      'SELECT referral_code FROM companies WHERE id = ?',
      [companyId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Company not found' });

    let code = rows[0].referral_code;

    // Générer un code unique si absent
    if (!code) {
      let attempts = 0;
      while (!code && attempts < 5) {
        const candidate = generateCode();
        const [conflict] = await connection.execute(
          'SELECT id FROM companies WHERE referral_code = ?',
          [candidate]
        );
        if (!conflict.length) {
          await connection.execute(
            'UPDATE companies SET referral_code = ? WHERE id = ?',
            [candidate, companyId]
          );
          code = candidate;
        }
        attempts++;
      }
      if (!code) {
        return res.status(500).json({ success: false, message: 'Could not generate a unique referral code' });
      }
    }

    return res.status(200).json({ success: true, data: { referral_code: code } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── GET /v1/company/referrals ───────────────────────────────────────────── */
const listReferrals = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const connection = await connect();
  try {
    // Récupérer notre code d'abord
    const [codeRows] = await connection.execute(
      'SELECT referral_code FROM companies WHERE id = ?',
      [companyId]
    );
    const myCode = codeRows[0]?.referral_code;

    if (!myCode) {
      return res.status(200).json({ success: true, data: { referral_code: null, referrals: [], rewards: [] } });
    }

    // Companies parrainées (celles dont referred_by_code = notre code)
    const [referred] = await connection.execute(
      `SELECT c.id, c.name, c.created_at
       FROM companies c
       WHERE c.referred_by_code = ?
       ORDER BY c.created_at DESC`,
      [myCode]
    );

    // Récompenses associées
    const [rewards] = await connection.execute(
      `SELECT rr.id, rr.referred_company_id, rr.reward_type, rr.reward_value,
              rr.granted, rr.granted_at, rr.created_at,
              c.name AS referred_company_name
       FROM referral_rewards rr
       JOIN companies c ON c.id = rr.referred_company_id
       WHERE rr.referrer_company_id = ?
       ORDER BY rr.created_at DESC`,
      [companyId]
    );

    return res.status(200).json({
      success: true,
      data: {
        referral_code: myCode,
        referrals: referred,
        rewards
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/referral/use (PUBLIC — pas d'auth requise) ────────────────── */
const useReferral = async (req, res) => {
  const { referral_code, new_company_id } = req.body;

  if (!referral_code || typeof referral_code !== 'string' || !referral_code.trim()) {
    return res.status(400).json({ success: false, message: 'referral_code is required' });
  }
  const newCompanyId = parseInt(new_company_id, 10);
  if (isNaN(newCompanyId)) {
    return res.status(400).json({ success: false, message: 'new_company_id must be a valid integer' });
  }

  const sanitizedCode = referral_code.trim().toUpperCase();

  const connection = await connect();
  try {
    // Trouver la company parrain
    const [referrerRows] = await connection.execute(
      'SELECT id FROM companies WHERE referral_code = ?',
      [sanitizedCode]
    );
    if (!referrerRows.length) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    const referrerCompanyId = referrerRows[0].id;

    // Vérifier que la nouvelle company existe et n'a pas déjà un code parrain
    const [newCompanyRows] = await connection.execute(
      'SELECT id, referred_by_code FROM companies WHERE id = ?',
      [newCompanyId]
    );
    if (!newCompanyRows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    if (newCompanyRows[0].referred_by_code) {
      return res.status(409).json({ success: false, message: 'This company already used a referral code' });
    }

    // Une company ne peut pas se parrainer elle-même
    if (referrerCompanyId === newCompanyId) {
      return res.status(400).json({ success: false, message: 'A company cannot refer itself' });
    }

    // Enregistrer le code parrain sur la nouvelle company
    await connection.execute(
      'UPDATE companies SET referred_by_code = ? WHERE id = ?',
      [sanitizedCode, newCompanyId]
    );

    // Créer le reward (badge par défaut) — INSERT IGNORE pour éviter les doublons
    await connection.execute(
      `INSERT IGNORE INTO referral_rewards
         (referrer_company_id, referred_company_id, reward_type, reward_value)
       VALUES (?, ?, 'badge', 0.00)`,
      [referrerCompanyId, newCompanyId]
    );

    return res.status(200).json({ success: true, message: 'Referral code applied successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { getReferralCode, listReferrals, useReferral };

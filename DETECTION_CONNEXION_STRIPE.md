/**
 * Critères de détection de connexion Stripe
 * 
 * Un utilisateur est considéré comme "connecté à Stripe" si :
 * 
 * 1. ✅ COMPTE STRIPE EXISTE
 *    - stripe_account_id existe et n'est pas null/vide
 *    - Format: acct_xxxxxxxxxxxxxxx
 * 
 * 2. ✅ ONBOARDING TERMINÉ
 *    - details_submitted: true
 *    - charges_enabled: true
 *    - payouts_enabled: true
 * 
 * 3. ✅ AUCUN BLOCAGE
 *    - requirements.disabled_reason: null
 *    - requirements.currently_due: [] (vide)
 *    - requirements.past_due: [] (vide)
 * 
 * 4. ✅ COMPTE ACTIF
 *    - Pas de restrictions majeures
 *    - Peut recevoir des paiements
 * 
 * ENDPOINTS À VÉRIFIER:
 * - GET /v1/stripe/account-status?company_id={user_id}
 * - GET /v1/stripe/account?company_id={user_id}
 * - GET /v1/stripe/connect/status?company_id={user_id}
 * 
 * STATUTS POSSIBLES:
 * - "not_connected": Aucun compte Stripe associé
 * - "incomplete": Compte créé mais onboarding non terminé
 * - "active": Pleinement connecté et fonctionnel
 * - "restricted": Connecté mais avec limitations
 * - "pending": En cours de vérification
 */
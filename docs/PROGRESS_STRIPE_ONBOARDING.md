# Progression Onboarding Stripe (prod-ready)

## État vérifié dans le code

- StripeHub affiche le dashboard dès que `details_submitted` ou `onboarding_completed` est vrai, même si `charges_enabled/payouts_enabled` sont encore en attente.
- Stack d’onboarding complet (Welcome → PersonalInfo → Address → BankAccount → Documents → Review → Completion) avec écran Completion fonctionnel et retour vers StripeHub.
- ReviewScreen navigue vers Completion et fournit un fallback `accountStatus` si l’API est silencieuse.
- Services Stripe: 5 étapes d’onboarding, upload doc, delete account, completeOnboarding renvoie `account_status` snake_case; DOB envoyée en `YYYY-MM-DD`.
- Pré-remplissage **DEV** actif sur PersonalInfo/Address/Bank pour accélérer les tests.

## À faire pour une première version stable

1. 🚀 Retester le flux complet end-to-end avec un compte neuf (doit retirer le bouton « Compléter mon profil » après completion).
2. 🧪 Ajouter un test e2e automatisé (Detox/Playwright) pour le happy path et l’affichage du hub post-completion.
3. 🔥 Mieux gérer les échecs réseau sur chaque étape (retry ou message clair) et sur StripeHub (retry auto optionnel).
4. 📡 Rafraîchissement post-Completion: pull-to-refresh ou timer pour récupérer `charges_enabled/payouts_enabled` sans relancer l’app.
5. 🛡️ Logging/garde-fous: centraliser les logs Stripe, ajouter des guards si `account_status` est absent ailleurs que Review (fallback déjà présent).
6. 📲 UX release: désactiver pré-remplissage **DEV** en build prod, vérifier textes/locale/accessibilité (labels/roles sur boutons critiques).
7. 🧭 Navigation: valider que `mainNavigation` ramène bien au tableau de bord depuis Completion sur device réel.
8. 🔧 Backend (dépend équipe serveur): endpoint `/v1/stripe/onboarding/complete` retourne `account_status` snake*case sans `accounts.update` + colonnes BDD `details_submitted/onboarding_completed/tos*\*` existantes; nettoyer comptes résiduels.

## Prochaines actions immédiates

- Backend a purgé company_id=2 (hard delete) et renvoie 404 quand aucun compte → on peut relancer un onboarding propre.
- Hooks payments/payouts en auto-load désactivé côté StripeHub tant qu’aucun accountId n’existe; refresh conditionnel uniquement si accountId présent.
- Payment links: autoload désactivé, et la création est bloquée s’il n’y a pas d’accountId (modal protégée + hook exige accountId).
- Lancer le test end-to-end complet (compte neuf) et capturer logs frontend/backend.
- Noter les écarts éventuels ici après le test.

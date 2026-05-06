# Plan de Tests Manuels — Cobbr App

> **Dernière mise à jour :** 5 mai 2026
> **Couvre :** Onboarding v2, Stripe Subscriptions, Contrats Modulaires, Job Templates, Stripe Detection Fix
> **Deadline tests pre-launch : 18 mai 2026**

> ⚠️ **Note (5 mai 2026) :** Les tests B-01 à B-13 (wizard 8 étapes) sont **obsolètes** — le wizard a été remplacé par une inscription 1 écran unique (`subscribe.tsx`). Les tests 1.3 ne s'appliquent plus.
> Tests prioritaires avant le 18 mai : **B4, B5, B6, B7, B8, B9, B10 + B11 à B16** (voir `docs/TODO.md`).

---

## Comment utiliser ce document

- ✅ = Test passé
- ❌ = Test échoué (noter le bug)
- ⏭️ = Non testé (dépendance manquante)
- Chaque test a un **ID unique** pour le suivi

---

## 1. INSCRIPTION & ONBOARDING

### 1.1 Inscription Employee (Parcours A)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| A-01 | Inscription basique | 1. Register → Employee<br>2. Remplir : prénom, nom, email, company name, password, confirm<br>3. Soumettre | Message succès, redirect vers vérification email | |
| A-02 | Validation champs vides | 1. Laisser un champ vide<br>2. Soumettre | Message d'erreur sur le champ manquant | |
| A-03 | Validation email invalide | 1. Entrer "abc" dans email<br>2. Soumettre | Erreur format email | |
| A-04 | Validation password faible | 1. Entrer "12345" comme password<br>2. Soumettre | Erreur: 8+ chars, maj, min, chiffre, spécial | |
| A-05 | Passwords ne matchent pas | 1. Password: "Test@1234"<br>2. Confirm: "Test@5678" | Erreur: passwords don't match | |
| A-06 | Company name trop court | 1. Entrer "A" comme company name<br>2. Soumettre | Erreur: min 2 caractères | |
| A-07 | Email déjà utilisé | 1. S'inscrire avec un email déjà en DB<br>2. Soumettre | Erreur appropriée (email already exists) | |

### 1.2 Vérification Email + Auto-Login

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| V-01 | Code valide + auto-login | 1. Recevoir le code 6 chiffres par email<br>2. Entrer le code<br>3. Valider | Auto-login → redirect Home (PAS vers Login) | |
| V-02 | Code test (dev) | 1. Utiliser email @mailinator.com ou .test<br>2. Entrer "123456" | Auto-login → Home | |
| V-03 | Code invalide | 1. Entrer "000000" | Message d'erreur, pas de redirect | |
| V-04 | Tokens stockés | 1. Après V-01<br>2. Fermer et rouvrir l'app | Session maintenue, pas de re-login nécessaire | |
| V-05 | Code expiré | 1. Attendre expiration<br>2. Entrer le code | Erreur code expiré, bouton "Renvoyer" | |

### 1.3 Inscription Business Owner (Parcours B — ~~8 étapes~~ — OBSOLÈTE)

> ❌ **CE PARCOURS N'EXISTE PLUS** — Remplacé par l'inscription 1 écran unique dans `subscribe.tsx`. Les tests ci-dessous ne s'appliquent plus.

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| B-01 | Navigation entre steps | 1. Register → Business Owner<br>2. Naviguer Next/Back entre les 8 étapes | Stepper mis à jour, données conservées | |
| B-02 | Step 1 - Personal Info | Remplir : prénom, nom, email, phone, DOB, password | Validation OK, next autorisé | |
| B-03 | Step 1 - Âge < 18 | Entrer une DOB de quelqu'un < 18 ans | Erreur: minimum 18 ans | |
| B-04 | Step 2 - Business Details | Remplir : company name, ABN (11 chiffres valide), business type | Validation ABN checksum OK | |
| B-05 | Step 2 - ABN invalide | Entrer un ABN avec checksum incorrect | Erreur: ABN invalide | |
| B-06 | Step 3 - Address | Remplir : street, suburb, state (picker), postcode | Validation code postal par état | |
| B-07 | Step 4 - Banking | Remplir : BSB (6 chiffres), account number, account name | BSB auto-formaté XXX-XXX | |
| B-08 | Step 5 - Insurance toggle | 1. Toggle ON<br>2. Remplir provider, policy, expiry<br>3. Toggle OFF et retour ON | Sous-champs conditionnels affichés/masqués | |
| B-09 | Step 6 - Plan selection | 1. Voir les 3 plans<br>2. Toggle mensuel/annuel<br>3. Sélectionner un plan | Prix mis à jour, plan sélectionné visible | |
| B-10 | Step 7 - Legal | 1. Cocher les 3 checkboxes<br>2. Décocher une | Next bloqué si les 3 ne sont pas cochées | |
| B-11 | Step 8 - Review & Submit | 1. Review récapitulatif<br>2. Cliquer "Modifier" sur une section<br>3. Soumettre | Retour à l'étape + revenir, soumission OK | |
| B-12 | Draft persistence | 1. Remplir étapes 1-4<br>2. Fermer l'app<br>3. Rouvrir → Business Owner | Données pré-remplies depuis le brouillon | |
| B-13 | Soumission → verify email | 1. Remplir les 8 étapes<br>2. Soumettre | Redirect vers vérification email | |

---

## 2. HOME — ACTIVATION HUB

### 2.1 Checklist Onboarding

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| H-01 | Checklist visible (nouveau user) | 1. Se connecter avec un nouveau compte | Checklist visible avec 5 items non cochés, progress 0% | |
| H-02 | Item "Complete profile" | 1. Cliquer sur "Complete business profile" | Navigation vers CompleteProfileScreen | |
| H-03 | Item "Create first job" | 1. Cliquer sur "Create your first job" | Ouvre le wizard de création de job | |
| H-04 | Item "Invite team" | 1. Cliquer sur "Invite your team" | Navigation vers AddEmployee | |
| H-05 | Item "Setup payments" | 1. Cliquer sur "Setup payments" | Navigation vers StripeHub | |
| H-06 | Progression dynamique | 1. Créer un job<br>2. Retourner à la Home | L'item "first job" est coché ✅, progress augmentée | |
| H-07 | Checklist masquée (100%) | 1. Compléter les 5 items | Checklist disparaît (animation collapse) | |
| H-08 | Refresh checklist | 1. Pull-to-refresh sur la Home | Checklist mise à jour depuis l'API | |

### 2.2 Stripe Soft Gate (Banner)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| SG-01 | Banner visible (Stripe non configuré) | 1. Login avec un compte sans Stripe | Banner ambre ⚠️ "Payments not set up" visible | |
| SG-02 | Banner masquée (Stripe actif) | 1. Login avec un compte Stripe actif | Pas de banner ambre | |
| SG-03 | CTA "Setup payments" | 1. Cliquer sur le bouton de la banner | Navigation vers StripeHub | |
| SG-04 | Banner non bloquante | 1. Avec la banner visible<br>2. Naviguer dans l'app (jobs, calendrier) | Navigation libre, pas de blocage | |

### 2.3 Stripe Hard Gate

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| HG-01 | Block "Send Invoice" | 1. Sans Stripe actif<br>2. Ouvrir un job<br>3. Tenter "Send Invoice" | Alert: "You're 1 step away from getting paid" + CTA | |
| HG-02 | Block "Charge client" | 1. Sans Stripe actif<br>2. Ouvrir un job→ Payment<br>3. Tenter de charger | Alert bloquante avec CTA "Setup payments" | |
| HG-03 | CTA navigue vers Stripe | 1. Depuis l'alert HG-01 ou HG-02<br>2. Cliquer "Setup payments" | Navigation vers StripeHub | |
| HG-04 | Actions autorisées (Stripe actif) | 1. Avec Stripe actif<br>2. Send Invoice / Charge client | Pas d'alert, action exécutée normalement | |

---

## 3. COMPLETE PROFILE

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| CP-01 | Ouverture écran | 1. Home → checklist → "Complete profile" | CompleteProfileScreen affiché avec 5 accordions | |
| CP-02 | Section Business Details | 1. Ouvrir accordion Business Details<br>2. Remplir company name, ABN, phone<br>3. Sauvegarder | PATCH OK, données persistées | |
| CP-03 | Section Contact | 1. Remplir business email + phone | Sauvegarde OK | |
| CP-04 | Section Address | 1. Remplir street, suburb, state (chips), postcode<br>2. Sauvegarder | State chips fonctionnels (NSW, VIC, etc.) | |
| CP-05 | Section Banking | 1. Remplir BSB, account number, account name | BSB formaté, sauvegarde OK | |
| CP-06 | Section Insurance (ON) | 1. Toggle ON<br>2. Remplir provider, policy, expiry | Champs conditionnels affichés + sauvegarde | |
| CP-07 | Section Insurance (OFF) | 1. Toggle OFF | Sous-champs masqués, insurance vide sauvée | |
| CP-08 | Sauvegarde complète | 1. Remplir les 5 sections<br>2. Sauvegarder | profile_completed = 1 en DB, checklist item ✅ | |
| CP-09 | Préremplissage | 1. Sauvegarder<br>2. Quitter<br>3. Rouvrir l'écran | Données pré-remplies depuis la DB | |

---

## 4. WIZARD CRÉATION DE JOB

### 4.1 Organisation (Step 2 — Templates & Segments)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| J-01 | Sélection template | 1. New Job → Step Organisation<br>2. Choisir un template (ex: "Classic Move") | Segments pré-remplis selon le template | |
| J-02 | Segments lego blocks | 1. Après sélection template<br>2. Voir les blocs de segments | Blocs colorés avec icônes (📍🚚📦🏗️) | |
| J-03 | Ajouter un segment | 1. Cliquer "+" pour ajouter un segment | Nouveau segment ajouté à la liste | |
| J-04 | Supprimer un segment | 1. Supprimer un segment de la liste | Segment retiré, ordre recalculé | |
| J-05 | Toggle billable | 1. Cliquer le toggle billable sur un segment | Toggle ON/OFF, segment marqué facturable ou non | |
| J-06 | State picker fonctionne | 1. Dans les champs d'adresse<br>2. Ouvrir le picker d'état | Picker s'ouvre (pas intercepté par backdrop) | |
| J-07 | Input single click | 1. Cliquer une fois sur un champ texte | Focus immédiat (pas besoin de double-clic) | |
| J-08 | Scroll reset entre steps | 1. Scroller en bas d'un step<br>2. Passer au step suivant | Scroll remis en haut automatiquement | |
| J-09 | Step 4 simplifié | 1. Arriver au step 4 (Details) | Seuls Priority + Notes sont visibles (pas staff/vehicle/extras/payment) | |

### 4.2 Plan Suggestion (après 1er job)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| PS-01 | Alert après 1er job | 1. Créer son tout premier job<br>2. Sauvegarder | Alert "Upgrade your plan" s'affiche | |
| PS-02 | Alert une seule fois | 1. Créer un 2ème job | Pas d'alert (flag AsyncStorage) | |
| PS-03 | CTA de l'alert | 1. Depuis l'alert PS-01<br>2. Cliquer "See plans" | Navigation vers SubscriptionScreen | |

---

## 5. STRIPE SUBSCRIPTIONS (PaymentSheet)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| SUB-01 | Voir les plans | 1. Naviguer vers SubscriptionScreen<br>2. Voir la liste des plans | 4 plans affichés : Invited Worker $0/mo, ABN Contractor $29/mo, Pro $99/mo, Company $179/mo | |
| SUB-02 | Souscrire à un plan | 1. Sélectionner un plan payant<br>2. Cliquer "Subscribe"<br>3. Remplir PaymentSheet | PaymentSheet s'ouvre, paiement traité, statut "Active" | |
| SUB-03 | Voir statut abonnement | 1. Après SUB-02<br>2. Vérifier la section "Current Subscription" | Plan actuel, statut, prochaine facture affichés | |
| SUB-04 | Annuler abonnement | 1. Cliquer "Cancel subscription"<br>2. Confirmer | Statut passe à "Canceling", valid until date affichée | |
| SUB-05 | Réactiver abonnement | 1. Depuis statut "Canceling"<br>2. Cliquer "Resume" | Statut repasse à "Active" | |
| SUB-06 | Changer de plan (upgrade) | 1. Depuis un plan ABN Contractor ($29)<br>2. Sélectionner Pro ($99)<br>3. Confirmer upgrade | Plan mis à jour, nouveau prix affiché | |
| SUB-07 | Changer de plan (downgrade) | 1. Depuis Pro ($99)<br>2. Sélectionner ABN Contractor ($29) | Downgrade effectif à la fin du billing period | |

> ⚠️ **Prérequis :** Products & Prices doivent être créés dans le Stripe Dashboard et `stripe_price_id` renseigné dans la table `plans`.

---

## 6. STRIPE DETECTION (Bug P0 Fix)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| SD-01 | Compte Stripe actif → pas de banner | 1. Login avec un compte Stripe actif<br>2. Aller sur Home | Pas de banner Stripe, pas de flickering | |
| SD-02 | Anti-flickering | 1. Login (Stripe actif)<br>2. Observer la Home pendant le chargement | Pas de flash "Setup Stripe" puis disparition | |
| SD-03 | Stripe non configuré → banner | 1. Login avec un compte sans Stripe | Banner ambre persistante visible | |
| SD-04 | Erreur API transitoire | 1. Simuler une erreur réseau temporaire<br>2. Observer la Home | Pas de faux positif "Setup Stripe" | |

---

## 7. CONTRATS MODULAIRES

### 7.1 Gestion des Clauses (Business Tab)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| CT-01 | Voir la liste des clauses | 1. Business → Contracts | Liste des clauses avec badges conditions | |
| CT-02 | Créer une clause (always) | 1. Cliquer "+"<br>2. Remplir titre + corps<br>3. Condition: "Always"<br>4. Sauvegarder | Clause créée, visible dans la liste avec badge "Always" | |
| CT-03 | Créer clause (segment_type) | 1. Nouvelle clause<br>2. Condition: "segment_type" = "storage"<br>3. Sauvegarder | Clause avec badge "storage" visible | |
| CT-04 | Créer clause (postcode) | 1. Condition: "postcode" = "2000" | Clause avec badge "postcode: 2000" | |
| CT-05 | Créer clause (city) | 1. Condition: "city" = "Sydney" | Clause avec badge "city: Sydney" | |
| CT-06 | Créer clause (state) | 1. Condition: "state" = "NSW" | Clause avec badge "state: NSW" | |
| CT-07 | Modifier une clause | 1. Cliquer sur une clause<br>2. Modifier titre/corps/condition<br>3. Sauvegarder | Modifications persistées | |
| CT-08 | Toggle active/inactive | 1. Toggle le switch d'une clause | Clause grisée si inactive | |
| CT-09 | Supprimer une clause | 1. Supprimer une clause<br>2. Confirmer | Supprimée de la liste | |
| CT-10 | Priorité / réordonnement | 1. Créer 3+ clauses<br>2. Réordonner via drag ou boutons | Nouvel ordre sauvegardé | |

### 7.2 Contrat sur un Job (Client Tab)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| JC-01 | Générer un contrat | 1. Ouvrir un job (Client tab)<br>2. Section "Contract"<br>3. Cliquer "Generate contract" | Contrat généré avec clauses matchées automatiquement | |
| JC-02 | Matching par segment | 1. Job avec un segment "storage"<br>2. Générer contrat | Clause "storage" incluse, clause "always" aussi | |
| JC-03 | Matching par localisation | 1. Job avec postcode "2000"<br>2. Clause conditionnée au postcode "2000"<br>3. Générer contrat | Clause postcode incluse | |
| JC-04 | Voir les clauses du contrat | 1. Après JC-01<br>2. Voir la section contrat | Toutes les clauses matchées affichées avec titre + corps | |
| JC-05 | Signer le contrat | 1. Cliquer "Sign contract"<br>2. Confirmer | Timestamp de signature affiché, bouton disparaît | |
| JC-06 | Contrat déjà signé | 1. Revenir sur un contrat signé | Statut "Signed" + date/heure, pas de bouton signer | |
| JC-07 | Pas de clauses matching | 1. Job dans une ville sans clause conditionnée<br>2. Générer contrat | Seules les clauses "always" sont incluses | |

---

## 8. TEMPLATES DE JOB & SEGMENTS

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| T-01 | Templates par défaut | 1. Ouvrir le wizard de job<br>2. Step Organisation | 8 templates affichés (Classic Move, Storage, etc.) | |
| T-02 | Segments pré-remplis | 1. Sélectionner "Classic Move" | Segments: Location 1 → Travel → Location 2 | |
| T-03 | Segment employee assignment | 1. Ouvrir un segment<br>2. Assigner un employé | Employé lié au segment, visible dans le récap | |
| T-04 | Timer par segment | 1. Démarrer un job<br>2. Start timer sur le segment actif | Timer tourne, durée incrémentée | |
| T-05 | Timer stop segment | 1. Arrêter le timer du segment | Durée finale enregistrée | |
| T-06 | Récapitulatif post-job | 1. Terminer un job avec segments<br>2. Ouvrir le récap | Vue détaillée: chaque segment, durée, employés, coût | |
| T-07 | Temps de retour configurable | 1. Job dépôt-à-dépôt terminé<br>2. Modifier le temps de retour | Nouveau temps pris en compte dans le calcul | |

---

## 9. STRIPE CONNECT (Préremplissage B5)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| SC-01 | Préremplissage données | 1. Compléter le profil (ABN, adresse, phone)<br>2. Lancer Stripe Connect onboarding | Champs préremplis : nom, phone, ABN, adresse | |
| SC-02 | Pas de double saisie | 1. Vérifier les écrans Stripe | Les données déjà saisies dans le profil ne sont pas re-demandées | |

---

## 10. INTERNATIONALISATION (i18n)

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| i18n-01 | Français | 1. Changer la langue en FR<br>2. Naviguer sur Home, Checklist, Contracts | Textes en français | |
| i18n-02 | Anglais | 1. Changer en EN | Textes en anglais (base) | |
| i18n-03 | Autre langue (ES, IT...) | 1. Changer en espagnol ou italien | Fallback EN pour les clés non traduites (pas de clé brute visible) | |
| i18n-04 | Clés manquantes | 1. Vérifier qu'aucune clé brute (ex: `contracts.title`) n'apparaît à l'écran | Toutes les clés traduites ou fallback EN | |

---

## 11. EDGE CASES & ROBUSTESSE

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| E-01 | Perte réseau pendant inscription | 1. Couper le réseau<br>2. Soumettre inscription | Message d'erreur réseau, pas de crash | |
| E-02 | Perte réseau pendant verify email | 1. Couper le réseau<br>2. Entrer le code | Message d'erreur, possibilité de retry | |
| E-03 | Double-tap bouton soumission | 1. Taper 2x rapidement sur "Submit" | Une seule requête envoyée (loading state bloque) | |
| E-04 | Back button Android | 1. Sur chaque écran: appuyer Back hardware | Navigation cohérente, pas de crash | |
| E-05 | Rotation écran | 1. Tourner le device en landscape<br>2. Revenir portrait | Layout adapté, pas de perte de données | |
| E-06 | App en background puis foreground | 1. Mettre l'app en background (5+ min)<br>2. Revenir | Session maintenue, pas de re-login | |
| E-07 | Clavier couvre input | 1. Focus sur un champ en bas de l'écran | KeyboardAvoidingView adapte la vue | |
| E-08 | Très long texte | 1. Entrer un texte très long dans company name ou clause body | Texte accepté, pas de crash, truncation si nécessaire | |

---

## 12. SÉCURITÉ

| ID | Test | Étapes | Résultat attendu | Statut |
|----|------|--------|-------------------|--------|
| S-01 | Tokens en SecureStore | 1. Vérifier que session_token n'est PAS dans AsyncStorage | Tokens uniquement dans SecureStore (chiffré) | |
| S-02 | Expiration session | 1. Attendre expiration du session_token<br>2. Faire une action | Refresh auto via refreshToken, ou re-login si expiré | |
| S-03 | Accès non autorisé | 1. Essayer d'accéder à un job d'une autre company | Erreur 403 ou données vides | |
| S-04 | XSS dans les champs | 1. Entrer `<script>alert(1)</script>` dans un champ texte | Texte affiché comme texte brut, pas exécuté | |
| S-05 | PATCH company d'un autre user | 1. Tenter PATCH /v1/company/:id avec un id qui n'est pas le sien | Erreur 403 | |

---

## Résumé par Feature

| Feature | Tests | IDs |
|---------|-------|-----|
| Inscription Employee | 7 | A-01 → A-07 |
| Vérification Email | 5 | V-01 → V-05 |
| Inscription Business Owner | 13 | B-01 → B-13 |
| Home Checklist | 8 | H-01 → H-08 |
| Stripe Soft Gate | 4 | SG-01 → SG-04 |
| Stripe Hard Gate | 4 | HG-01 → HG-04 |
| Complete Profile | 9 | CP-01 → CP-09 |
| Job Creation Wizard | 9 | J-01 → J-09 |
| Plan Suggestion | 3 | PS-01 → PS-03 |
| Stripe Subscriptions | 7 | SUB-01 → SUB-07 |
| Stripe Detection Fix | 4 | SD-01 → SD-04 |
| Contrats (clauses) | 10 | CT-01 → CT-10 |
| Contrats (job) | 7 | JC-01 → JC-07 |
| Templates & Segments | 7 | T-01 → T-07 |
| Stripe Connect Prefill | 2 | SC-01 → SC-02 |
| i18n | 4 | i18n-01 → i18n-04 |
| Edge Cases | 8 | E-01 → E-08 |
| Sécurité | 5 | S-01 → S-05 |

**Total : 116 tests manuels**

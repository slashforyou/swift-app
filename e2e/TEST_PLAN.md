# Plan de Tests E2E — Swift App (Maestro)

> Généré le 11 mars 2026 — basé sur l'état réel de la BDD (`swiftapp` MySQL sur sushinari)

---

## Utilisateurs & Compagnies existants (données réelles)

### Compagnie 1 — Nerd-Test (pas de Stripe)

| Email                           | Nom             | Rôle     |
| ------------------------------- | --------------- | -------- |
| `admin.test@nerd-test.com`      | Admin Test      | admin    |
| `manager.test@nerd-test.com`    | Manager Test    | manager  |
| `supervisor.test@nerd-test.com` | Supervisor Test | manager  |
| `employee.test@nerd-test.com`   | Employee Test   | employee |
| `new.employee@nerd-test.com`    | New Employee    | employee |
| `driver.test@nerd-test.com`     | Driver Test     | driver   |
| `jim.hargreaves@nerd-test.com`  | Jim Hargreaves  | driver   |
| `tony.ferraro@nerd-test.com`    | Tony Ferraro    | driver   |
| `sean.calloway@nerd-test.com`   | Sean Calloway   | employee |
| `george.papas@nerd-test.com`    | George Papas    | employee |
| `anna.vickers@nerd-test.com`    | Anna Vickers    | employee |

### Compagnie 2 — Test Frontend (pas de Stripe)

| Email                      | Nom             | Rôle  |
| -------------------------- | --------------- | ----- |
| `romaingiovanni@gmail.com` | Romain Giovanni | admin |

### Compagnie 3 — TestOnboarding (pas de Stripe)

| Email                      | Nom             | Rôle  |
| -------------------------- | --------------- | ----- |
| `user.onboarding@test.com` | Test Onboarding | admin |

### Compagnie 4 — Carmichael Services (pas de Stripe)

| Email                         | Nom               | Rôle     |
| ----------------------------- | ----------------- | -------- |
| `joseph.carmichael@gmail.com` | Joseph Carmichael | employee |

### Mot de passe commun test

Tous les comptes `@nerd-test.com` partagent le même mot de passe. À stocker dans `e2e/config/credentials.yaml` (gitignored).

---

## Architecture des flows

```
e2e/
├── flows/
│   ├── 001-launch-login-calendar.yaml          ✅ DONE — vérifié
│   ├── 002-login-flow.yaml                     ✅ DONE — (appelé par _go-to-home)
│   ├── 010-registration-subscribe.yaml         🔄 EN COURS
│   ├── 011-unsubscribe.yaml                    🔄 EN COURS
│   ├── 030-create-vehicle.yaml                 ✅ DONE — vérifié
│   ├── 040-invite-employee.yaml                ✅ DONE — vérifié
│   ├── 050-job-workflow-single-company.yaml    🔄 EN COURS (A+B+C OK, D en test)
│   ├── 051-job-workflow-two-companies.yaml     🔄 EN COURS
│   ├── 052-job-workflow-full-crew.yaml         🔄 EN COURS
│   ├── 060-navigation-smoke.yaml               ✅ DONE — vérifié
│   ├── 080-profile-edit.yaml                   ✅ DONE — vérifié
│   └── sub-flows/
│       ├── _go-to-home.yaml                    ✅ DONE
│       ├── _logout.yaml                        ✅ DONE
│       ├── _login-as-admin.yaml                ✅ DONE
│       ├── _switch-to-admin.yaml               ✅ DONE
│       ├── _switch-to-employee.yaml            ✅ DONE
│       ├── _switch-to-driver.yaml              ✅ DONE
│       └── _switch-to-romain.yaml              ✅ DONE
├── config/
│   ├── credentials.yaml.example
│   └── credentials.yaml                        (gitignored)
└── TEST_PLAN.md                                ← ce fichier
```

> **Données requises en backend :**
>
> - Flows 050/051/052 nécessitent le client `E2E Client` (email: `e2e.client@test-swift.com`, `id=30`) dans Nerd-Test
> - Flow 010 nécessite que `TEST_REGISTER_EMAIL` n'existe pas encore (supprimer manuellement si besoin)

---

## Variables d'environnement requises (`credentials.yaml`)

```yaml
# Compagnie 1 — Nerd-Test
ADMIN_EMAIL: "admin.test@nerd-test.com"
ADMIN_PASSWORD: "MotDePasseAdmin"
MANAGER_EMAIL: "manager.test@nerd-test.com"
MANAGER_PASSWORD: "MotDePasseManager"
EMPLOYEE_EMAIL: "employee.test@nerd-test.com"
EMPLOYEE_PASSWORD: "MotDePasseEmployee"
DRIVER_EMAIL: "driver.test@nerd-test.com"
DRIVER_PASSWORD: "MotDePasseDriver"

# Compagnie 2 — Test Frontend
ROMAIN_EMAIL: "romaingiovanni@gmail.com"
ROMAIN_PASSWORD: "IllBeThere4_U"

# Nouveau compte de test (créé dans le test 010 puis supprimé dans 011)
TEST_REGISTER_EMAIL: "e2e.test.newuser@mailinator.com"
TEST_REGISTER_PASSWORD: "TestNewUser2026!"
TEST_REGISTER_FIRST_NAME: "E2E"
TEST_REGISTER_LAST_NAME: "TestUser"
TEST_REGISTER_COMPANY: "E2E Test Company"
```

---

## Tests détaillés

---

### TEST 010 — Inscription d'un nouveau compte

**Fichier :** `e2e/flows/010-registration-subscribe.yaml`
**Compte utilisé :** nouveau compte (<e2e.test.newuser@mailinator.com>)
**Pré-condition :** compte inexistant en BDD

**Steps :**

1. Ouvrir l'app sur l'écran de connexion (`connection-screen`)
2. Taper sur "S'inscrire" (`connection-register-btn`)
3. **Sélection du type de compte** (`register-type-selection-screen`)
   - Taper sur "Business Owner" (`register-type-business-btn`)
4. **Étape 1 — Informations personnelles** (`step-personal-info-screen`)
   - Renseigner prénom : `${TEST_REGISTER_FIRST_NAME}`
   - Renseigner nom : `${TEST_REGISTER_LAST_NAME}`
   - Renseigner email : `${TEST_REGISTER_EMAIL}`
   - Renseigner mot de passe : `${TEST_REGISTER_PASSWORD}`
   - Taper "Suivant" (`step-personal-info-next-btn`)
5. **Étape 2 — Informations entreprise** (`step-business-details-screen`)
   - Renseigner nom de l'entreprise : `${TEST_REGISTER_COMPANY}`
   - Renseigner ABN (si requis) : `12345678901`
   - Taper "Suivant" (`step-business-details-next-btn`)
6. **Étape 3 — Adresse** (`step-business-address-screen`)
   - Renseigner adresse, ville, état, code postal
   - Taper "Suivant"
7. **Étape 4 — Assurance** (`step-insurance-screen`) — Optionnel, taper "Passer"
8. **Étape 5 — Plan** (`step-subscription-plan-screen`) — Choisir plan "Free"
9. **Étape 6 — Informations bancaires** (`step-banking-info-screen`) — Optionnel, taper "Passer"
10. **Étape 7 — Accords légaux** (`step-legal-agreements-screen`)
    - Accepter CGU et politique de confidentialité
    - Taper "Terminer"
11. **Vérification** : arriver sur `home-screen`
12. **Assert** : toast de bienvenue ou label avec nom de la compagnie visible

---

### TEST 011 — Désinscription / Suppression de compte

**Fichier :** `e2e/flows/011-unsubscribe.yaml`
**Compte utilisé :** `${TEST_REGISTER_EMAIL}` (créé dans TEST 010)
**Pré-condition :** TEST 010 réussi

**Steps :**

1. Login avec le compte créé dans 010
2. Naviguer vers Paramètres (`home-parameters-btn`)
3. Aller dans "Mon Profil" ou "Compte" (`parameters-account-btn`)
4. Trouver "Supprimer mon compte" (`profile-delete-account-btn`)
5. Confirmer la suppression (dialog de confirmation)
6. **Assert** : redirection vers `connection-screen`
7. **Assert** : une tentative de login avec ces credentials échoue

---

### TEST 020 — Connexion Stripe (onboarding)

**Fichier :** `e2e/flows/020-stripe-connect.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}` (Nerd-Test admin)
**Pré-condition :** compte sans Stripe (stripe_onboarding_completed = 0)

**Steps :**

1. Login en tant qu'admin Nerd-Test
2. Naviguer vers Business (`home-business-btn`)
3. Aller dans "Paiements" ou "Stripe" (`business-stripe-btn` ou menu)
4. Taper "Connecter Stripe" (`stripe-hub-connect-btn`)
5. **Vérification** : redirection vers la WebView d'onboarding Stripe (`stripe-onboarding-webview`)
6. **Remplissage du formulaire Stripe** (WebView) :
   - Email de l'entreprise
   - Numéro de téléphone
   - Date de naissance du représentant
   - Adresse de l'entreprise
   - Informations bancaires (BSB + compte de test Stripe)
7. **Assert** : retour sur l'app après onboarding (`stripe-settings-screen`)
8. **Assert** : statut Stripe = "active" visible
9. **Assert** : `stripe_onboarding_completed = 1` en BDD

> **Note :** Utiliser les données de test Stripe (numéros de carte de test, BSB de test `000-000`, compte `000123456`).

---

### TEST 021 — Déconnexion Stripe

**Fichier :** `e2e/flows/021-stripe-disconnect.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}`
**Pré-condition :** TEST 020 réussi (Stripe connecté)

**Steps :**

1. Login en tant qu'admin
2. Naviguer vers Business → Stripe (`stripe-settings-screen`)
3. Taper "Déconnecter Stripe" (`stripe-settings-disconnect-btn`)
4. Confirmer dans le dialog de confirmation
5. **Assert** : statut Stripe = "inactive"
6. **Assert** : bouton "Connecter Stripe" réapparaît

---

### TEST 030 — Création d'un véhicule

**Fichier :** `e2e/flows/030-create-vehicle.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}` (admin Nerd-Test)

**Steps :**

1. Login en tant qu'admin
2. Naviguer vers Business (`home-business-btn`)
3. Taper sur "Véhicules" / "Flotte" (`business-vehicles-btn`)
4. Taper "Ajouter un véhicule" (`vehicle-fleet-add-btn`)
5. **Remplir le formulaire** (`add-vehicle-modal`) :
   - Nom/immatriculation : `E2E-TEST-001`
   - Type : Camion
   - Capacité : 5 tonnes
6. Confirmer (`add-vehicle-save-btn`)
7. **Assert** : le véhicule `E2E-TEST-001` apparaît dans la liste
8. **Nettoyage** : supprimer le véhicule créé (swipe ou bouton delete)

---

### TEST 040 — Invitation d'un employé

**Fichier :** `e2e/flows/040-invite-employee.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}` (admin Nerd-Test)

**Steps :**

1. Login en tant qu'admin
2. Naviguer vers Business → Équipe / Staff (`business-staff-btn`)
3. Taper "Inviter un employé" (`staff-crew-add-btn`)
4. **Remplir le formulaire** (`invite-employee-modal`) :
   - Prénom : `E2E`
   - Nom : `Invited`
   - Email : `e2e.invited@mailinator.com`
   - Téléphone : `0400000001`
   - Rôle : `employee`
5. Envoyer l'invitation (`invite-employee-submit-btn`)
6. **Assert** : toast de confirmation visible
7. **Assert** : le nouvel employé apparaît dans la liste avec statut "invité"/"pending"
8. **Nettoyage** : retirer l'employé de la liste

---

### TEST 050 — Workflow job complet (compagnie unique)

**Fichier :** `e2e/flows/050-job-workflow-single-company.yaml`
**Comptes utilisés :** Admin + Employee de Nerd-Test
**Scénario :** L'admin crée un job, l'employee le réalise, l'admin finalise le paiement

#### Phase A — Création du job (Admin)

1. Login : `${ADMIN_EMAIL}`
2. Naviguer vers Calendrier (`home-calendar-btn`)
3. Taper sur la date du jour (`calendar-month-day-11`)
4. Taper "Créer un job" (`day-screen-create-job-btn`)
5. **Remplir le formulaire** (`create-job-modal`) :
   - Titre : `E2E Test Job Solo`
   - Client : sélectionner ou créer `E2E Client`
   - Date et heure de début
   - Durée estimée
   - Adresse : `123 Test Street, Sydney NSW 2000`
6. Sauvegarder (`create-job-save-btn`)
7. **Assert** : job visible sur l'écran du jour

#### Phase B — Assignation d'un employé (Admin)

1. Ouvrir le job créé
2. Naviguer vers l'onglet "Staffing" (`job-staffing-manage-btn`)
3. Assigner : `${EMPLOYEE_EMAIL}` (Employee Test) en tant qu'offsider
4. **Assert** : employé visible dans la section staffing

#### Phase C — Réalisation du job (Employee)

1. **Changer de compte** : logout admin, login `${EMPLOYEE_EMAIL}`
2. Naviguer vers le job depuis le calendrier ou "Mes missions"
3. Taper "Démarrer le chrono" (`job-timer-start-btn`)
4. **Assert** : timer en cours visible
5. Attendre 3 secondes (simulation de travail)
6. Taper "Étape suivante" ou "Terminer" (`job-timer-next-step-btn`)
7. Confirmer la fin du job
8. **Assert** : statut job = "Terminé" ou "En attente de paiement"

#### Phase D — Paiement (Admin)

1. **Changer de compte** : logout employee, login `${ADMIN_EMAIL}`
2. Rouvrir le job
3. Naviguer vers l'onglet "Paiement"
4. **Assert** : état du paiement visible (`job-payment-scroll`)
5. Valider/envoyer la facture si applicable
6. **Assert** : statut final du job = "Payé" ou "Facturé"

---

### TEST 051 — Workflow job entre deux compagnies (transfert)

**Fichier :** `e2e/flows/051-job-workflow-two-companies.yaml`
**Comptes utilisés :**

- **Contractee** (créateur) : `${ADMIN_EMAIL}` (Nerd-Test, company_id=1)
- **Contractor** (prestataire) : `${ROMAIN_EMAIL}` (Test Frontend, company_id=2)

**Scénario :** Nerd-Test crée un job et le transfère à Test Frontend

#### Phase A — Établir une relation inter-compagnies

1. Login : `${ADMIN_EMAIL}` (Nerd-Test)
2. Naviguer vers Business → Relations (`business-relations-btn`)
3. Ajouter la relation avec Test Frontend via son code compagnie
4. **Assert** : Test Frontend apparaît dans les relations

#### Phase B — Création et transfert du job (Nerd-Test admin)

1. Créer un nouveau job `E2E Transfer Job`
2. Dans le job, taper "Transférer à un contractor"
3. Sélectionner Test Frontend comme contractor
4. Envoyer la proposition
5. **Assert** : statut job = "En attente d'acceptation"

#### Phase C — Acceptation par le contractor (Test Frontend)

1. **Changer de compte** : logout, login `${ROMAIN_EMAIL}`
2. Voir la notification de proposition reçue
3. Ouvrir le job dans le calendrier ou notifications
4. Taper "Accepter" (`job-assignment-accept-btn`)
5. **Assert** : statut = "Accepté"
6. **Assert** : notification envoyée à Nerd-Test

#### Phase D — Réalisation et finalisation

1. Démarrer le job côté contractor (`job-timer-start-btn`)
2. Terminer le job
3. **Changer de compte** : login `${ADMIN_EMAIL}`
4. **Assert** : le job affiche le statut "Terminé" côté contractee
5. Valider la facturation / paiement inter-compagnies

---

### TEST 052 — Workflow job complet multi-acteurs

**Fichier :** `e2e/flows/052-job-workflow-full-crew.yaml`
**Comptes utilisés :**

- **Contractee admin** : `${ADMIN_EMAIL}` (Nerd-Test)
- **Contractor admin** : `${ROMAIN_EMAIL}` (Test Frontend)
- **Driver** : `${DRIVER_EMAIL}` (<driver.test@nerd-test.com>)
- **Employee offsider** : `${EMPLOYEE_EMAIL}` (<employee.test@nerd-test.com>)

**Scénario :** Job complet avec équipe complète (chauffeur + offsiders + employés)

#### Phase A — Création du job avec ressources (Admin Nerd-Test)

1. Login : `${ADMIN_EMAIL}`
2. Créer job `E2E Full Crew Job`
3. Transférer à Test Frontend (comme dans TEST 051)

#### Phase B — Configuration de l'équipe (Contractor — Test Frontend)

1. Login : `${ROMAIN_EMAIL}`
2. Accepter le job
3. Dans les détails du job, section Staffing :
   - Assigner un **chauffeur** : sélectionner `driver.test@nerd-test.com`
   - Assigner un **offsider** : sélectionner `employee.test@nerd-test.com`
4. Dans les détails, section Ressources :
   - Assigner un **camion** (véhicule de la flotte)
5. **Assert** : tous les membres visibles dans le staffing

#### Phase C — Exécution par le chauffeur

1. Login : `${DRIVER_EMAIL}`
2. Voir le job dans le calendrier
3. Démarrer le chrono (`job-timer-start-btn`)
4. Prendre une photo du chantier (`job-photos-add-btn`)
5. Passer à l'étape suivante (`job-timer-next-step-btn`)

#### Phase D — Exécution par l'offsider

1. Login : `${EMPLOYEE_EMAIL}`
2. Confirmer la participation au job
3. Effectuer les actions disponibles depuis son rôle

#### Phase E — Signature et finalisation

1. Login : `${ROMAIN_EMAIL}` (contractor admin)
2. **Assert** : tous les membres ont marqué leur participation
3. Taper "Demander signature" ou "Terminer" (`job-timer-signature-btn`)
4. Signer (simulation de signature sur écran)

#### Phase F — Paiement final

1. Login : `${ADMIN_EMAIL}` (contractee)
2. **Assert** : job affiché comme terminé avec résumé des heures
3. Procéder au paiement (`job-timer-payment-btn`)
4. **Assert** : facture générée, statut = "Payé"

---

### TEST 060 — Smoke test navigation (sanity check)

**Fichier :** `e2e/flows/060-navigation-smoke.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}`
**But :** Vérifier que tous les écrans principaux sont accessibles sans crash

**Steps :**

1. Login
2. **Assert** `home-screen` visible
3. Naviguer → Calendrier → **Assert** `calendar-month-screen`
4. Retour → Naviguer → Business → **Assert** écran business
5. Business → Stripe Hub → **Assert** `stripe-settings-screen`
6. Retour → Business → Véhicules → **Assert** liste véhicules
7. Retour → Business → Staff → **Assert** liste staff
8. Retour → Business → Rapports → **Assert** écran rapports
9. Naviguer → Paramètres → **Assert** écran paramètres
10. Paramètres → Profil → **Assert** écran profil
11. **Assert total** : 0 crash, tous les écrans chargés

---

### TEST 070 — Notifications

**Fichier :** `e2e/flows/070-notifications.yaml`
**Comptes utilisés :** Admin + Employee

**Steps :**

1. Login : `${ADMIN_EMAIL}`
2. Créer un job et assigner `${EMPLOYEE_EMAIL}`
3. **Changer de compte** : login `${EMPLOYEE_EMAIL}`
4. **Assert** : badge de notification visible sur home
5. Ouvrir le panneau de notifications (`notifications-panel`)
6. **Assert** : notification d'assignation visible
7. Taper sur la notification
8. **Assert** : redirection vers les détails du job

---

### TEST 080 — Édition du profil

**Fichier :** `e2e/flows/080-profile-edit.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}`

**Steps :**

1. Login
2. Naviguer vers Paramètres → Profil (`parameters-profile-btn`)
3. **Assert** `profile-screen` visible
4. Taper "Modifier" ou sur un champ
5. Changer le numéro de téléphone : `0412000000`
6. Sauvegarder (`profile-save-btn`)
7. **Assert** : toast de confirmation visible
8. **Assert** : le numéro modifié est affiché
9. Remettre la valeur d'origine (cleanup)

---

### TEST 090 — Contre-proposition sur transfert de job

**Fichier :** `e2e/flows/090-counter-proposal.yaml`
**Comptes utilisés :** Admin Nerd-Test + Admin Test Frontend

**Scénario :** Le contractor refuse le prix et propose un contre-prix

**Steps :**

1. Login : `${ADMIN_EMAIL}` — Créer job + proposer prix à Test Frontend
2. Login : `${ROMAIN_EMAIL}` — Voir la proposition
3. Taper "Contre-proposer" (`counter-proposal-btn`)
4. Saisir un prix différent
5. Envoyer la contre-proposition
6. **Assert** : statut = "Contre-proposition en attente"
7. Login : `${ADMIN_EMAIL}` — Voir la contre-proposition
8. **Cas A** : Accepter → Assert statut = "Accepté"
9. **Cas B** : Refuser → Assert statut = "Refusé"

---

### TEST 100 — Gamification (XP et badges)

**Fichier :** `e2e/flows/100-gamification.yaml`
**Compte utilisé :** `${ADMIN_EMAIL}`

**Steps :**

1. Login
2. Naviguer vers Profil → XP History (`profile-xp-history-btn`)
3. **Assert** `xp-history-screen` visible
4. **Assert** : liste des événements XP chargée
5. Naviguer vers Profil → Badges (`profile-badges-btn`)
6. **Assert** `badges-screen` visible
7. **Assert** : badges gagnés affichés avec icônes
8. Naviguer vers Leaderboard (`profile-leaderboard-btn`)
9. **Assert** `leaderboard-screen` visible
10. **Assert** : la propre compagnie visible dans le classement

---

## Ordre d'exécution recommandé

```
# Séquence complète (ordre important pour les dépendances)
001 → 060 → 080 → 040 → 030 → 010 → 011 → 050 → 051 → 052 → 070 → 090 → 100 → 020 → 021
```

**Pourquoi cet ordre :**

- `001` : vérification de base que l'app tourne
- `060` : smoke test avant tout → détecte les crashes rapides
- `080` : profil éditable avant de créer des données
- `040` + `030` : préparer les ressources (employé + véhicule) utilisées dans les workflows
- `010` → `011` : inscription puis suppression (idempotent)
- `050` → `051` → `052` : workflows de complexité croissante
- `020` → `021` : Stripe en dernier car impact sur d'autres tests

---

## Commande de lancement

```powershell
# Test unique
& "$env:USERPROFILE\scoop\shims\maestro.cmd" test e2e/flows/001-launch-login-calendar.yaml --env-file e2e/config/credentials.yaml

# Tous les tests en séquence
& "$env:USERPROFILE\scoop\shims\maestro.cmd" test e2e/flows/ --env-file e2e/config/credentials.yaml

# Avec rapport HTML
& "$env:USERPROFILE\scoop\shims\maestro.cmd" test e2e/flows/001-launch-login-calendar.yaml --env EMAIL="..." --env PASSWORD="..." --format junit --output e2e/results/
```

---

## Priorités d'implémentation

| Priorité       | Test                                 | Effort     | Valeur      |
| -------------- | ------------------------------------ | ---------- | ----------- |
| 🔴 Immédiat    | 060 — Smoke navigation               | Faible     | Élevée      |
| 🔴 Immédiat    | 050 — Job workflow solo              | Moyen      | Très élevée |
| 🟠 Court terme | 010/011 — Inscription/Désinscription | Moyen      | Élevée      |
| 🟠 Court terme | 040 — Invitation employé             | Faible     | Élevée      |
| 🟠 Court terme | 051 — Job two companies              | Élevé      | Très élevée |
| 🟡 Moyen terme | 052 — Full crew                      | Très élevé | Très élevée |
| 🟡 Moyen terme | 020/021 — Stripe                     | Élevé      | Élevée      |
| 🟡 Moyen terme | 090 — Contre-proposition             | Moyen      | Élevée      |
| 🟢 Long terme  | 030 — Véhicule                       | Faible     | Moyenne     |
| 🟢 Long terme  | 070 — Notifications                  | Moyen      | Moyenne     |
| 🟢 Long terme  | 080 — Édition profil                 | Faible     | Faible      |
| 🟢 Long terme  | 100 — Gamification                   | Faible     | Faible      |

---

## Points d'attention techniques

### Multi-utilisateurs

Les tests 051, 052, 070, 090 nécessitent de **changer de compte** en cours de flow. La séquence est toujours :

```yaml
- tapOn:
    id: "home-logout-btn"
- extendedWaitUntil:
    visible:
      id: "connection-screen"
    timeout: 10000
- runFlow:
    file: 002-login-flow.yaml
```

### Nettoyage des données

Chaque test doit nettoyer ses données pour rester idempotent. Si un test crée un job `E2E Test Job Solo`, il doit le supprimer à la fin (ou utiliser un préfixe `E2E-` et nettoyer en BDD avant chaque run).

### TestIDs manquants

Certains éléments n'ont pas encore de `testID`. Avant d'implémenter un flow, vérifier que les éléments cibles ont bien un `testID` et l'ajouter si nécessaire.

### Stripe (TEST 020)

La WebView Stripe est une page externe — Maestro peut interagir avec les WebViews mais de façon limitée. Il faudra utiliser `tapOn` avec le texte visible plutôt que des `testID`.

---

## État des tests — Mise à jour 18 mars 2026

> Audit réalisé sur la base du code source réel (`src/`, `components/`) et des fichiers YAML existants.

---

### Flows E2E Maestro

| Flow | Fichier                                | État réel   | Bloquants identifiés                                                                                                                                                                                      |
| ---- | -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001  | `001-launch-login-calendar.yaml`       | ✅ Complet  | —                                                                                                                                                                                                         |
| 002  | `002-login-flow.yaml`                  | ✅ Complet  | —                                                                                                                                                                                                         |
| 010  | `010-registration-subscribe.yaml`      | ⚠️ En cours | Code email hardcodé `"123456"` (hypothèse Mailinator + backend E2E) ; dialog "Complete Your Profile" sans testID (fragile si locale change)                                                               |
| 011  | `011-unsubscribe.yaml`                 | ❌ Bloqué   | `connection-email-input` et `connection-password-input` **n'existent pas** dans l'app — passer par `connection-login-btn` → `login-screen` → `login-email-input` ; suppression de compte absente de l'app |
| 030  | `030-create-vehicle.yaml`              | ✅ Complet  | —                                                                                                                                                                                                         |
| 040  | `040-invite-employee.yaml`             | ✅ Complet  | —                                                                                                                                                                                                         |
| 050  | `050-job-workflow-single-company.yaml` | ⚠️ En cours | Phase D (paiement) à stabiliser ; assignation via `text: "Employee Test"` sans testID (fragile) ; sélection du job via `text: "E2E Client"` fragile si plusieurs jobs ce jour                             |
| 051  | `051-job-workflow-two-companies.yaml`  | ⚠️ En cours | `text: "${ROMAIN_COMPANY_NAME}"` dans modal de transfert sans testID ; `text: "B2B ClientTest"` hardcodé ; timer non complété en phase D                                                                  |
| 052  | `052-job-workflow-full-crew.yaml`      | ⚠️ En cours | Véhicule assigné via `text: "${TRUCK_NAME}"` sans testID ; offsider non assigné (flow nommé "full crew" mais incomplet) ; timer non complété                                                              |
| 060  | `060-navigation-smoke.yaml`            | ✅ Complet  | —                                                                                                                                                                                                         |
| 080  | `080-profile-edit.yaml`                | ✅ Complet  | —                                                                                                                                                                                                         |

**Sub-flows :** tous les 7 complets ✅

**Flows non créés (fichiers YAML absents) :**

| Flow | Fichier à créer              | Ce qui est disponible dans l'app                                                                       |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| 020  | `020-stripe-connect.yaml`    | StripeHub.tsx présent mais **aucun testID** sur les boutons                                            |
| 021  | `021-stripe-disconnect.yaml` | Idem                                                                                                   |
| 070  | `070-notifications.yaml`     | NotificationsPanel.tsx présent avec `testID="notifications-panel"` et `home-notifications-btn` ✅      |
| 090  | `090-counter-proposal.yaml`  | Contre-proposition intégrée dans `ContractorJobWizardModal.tsx` mais **aucun testID** sur les éléments |
| 100  | `100-gamification.yaml`      | `badges.tsx` et `leaderboard.tsx` avec testIDs complets ✅ — prêt à implémenter                        |

---

### Tests Jest

**34 fichiers actifs** couvrant : services (jobs, staff, vehicles, clients, photos, notes, signatures, gamification), hooks (useStaff, useJobsBilling), sécurité (JWT, RBAC), Stripe (invoice, refund, webhooks), types TypeScript, i18n, accessibilité, performance.

**24 fichiers exclus via `testPathIgnorePatterns`** (dette technique) :

| Catégorie                                  | Nb  | Raison déclarée                                |
| ------------------------------------------ | --- | ---------------------------------------------- |
| `__tests__/screens/`                       | 2   | "broken mocks" — StaffCrewScreen, TrucksScreen |
| `__tests__/e2e/`                           | 6   | "require device"                               |
| `__tests__/integration/`                   | 5   | "require mocks"                                |
| `__tests__/load/`                          | 3   | "timeout issues in CI"                         |
| `__tests__/validation/`                    | 1   | "outdated"                                     |
| Services : analytics, alertService, logger | 3   | pas de raison documentée                       |
| Hooks : useJobTimer, useJobPhotos          | 2   | pas de raison documentée                       |
| Autres : JobsBillingScreen, jobValidation  | 2   | pas de raison documentée                       |

**Anomalie `jest.config.js` :** exclusion référencée sur `useStaff-diagnostic.test.ts` — ce fichier n'existe pas, entrée morte à supprimer.

**Angles morts sans aucun test actif :**

- Tous les écrans (aucun test de Screen actif)
- `useJobTimer` — hook central du workflow job
- Navigation

---

### `credentials.yaml.example` — Variables manquantes

Le fichier `.example` n'expose que 2 variables sur 20. Tout nouveau développeur ne peut lancer aucun flow depuis zéro.

Variables absentes du `.example` (présentes dans le `.yaml` réel) :

```
ADMIN_EMAIL / ADMIN_PASSWORD
MANAGER_EMAIL / MANAGER_PASSWORD
EMPLOYEE_EMAIL / EMPLOYEE_PASSWORD
DRIVER_EMAIL / DRIVER_PASSWORD
ROMAIN_EMAIL / ROMAIN_PASSWORD
ROMAIN_COMPANY_NAME
TRUCK_NAME
TEST_REGISTER_EMAIL / TEST_REGISTER_PASSWORD
TEST_REGISTER_FIRST_NAME / TEST_REGISTER_LAST_NAME / TEST_REGISTER_COMPANY
EXPO_URL                    ← utilisé dans _go-to-home.yaml (ex: exp://192.168.0.51:8081)
```

---

## Mises à jour nécessaires sur l'app

> Ce qui doit être ajouté ou modifié dans le **code source de l'app** pour que les tests E2E puissent fonctionner. Classé par priorité.

---

### P0 — Bloquants immédiats (tests cassés sans ces correctifs)

#### 1. Flow 011 : `connection-screen` n'a pas de champs email/password

**Problème :** Le flow `011-unsubscribe.yaml` tente d'accéder à `connection-email-input` et `connection-password-input` sur l'écran `connection-screen`. Ces IDs n't existent pas — les champs de login sont sur `login-screen` (navigué depuis `connection-screen` via `connection-login-btn`).

**Fix à apporter dans le YAML `011` (pas dans l'app) :** remplacer la séquence de login par :

```yaml
- tapOn:
    id: "connection-login-btn"
- waitForAnimationToEnd
- tapOn:
    id: "login-email-input"
```

---

#### 2. `credentials.yaml.example` incomplet

**Problème :** Un développeur qui clone le repo et suit le README ne peut lancer aucun flow car `.example` ne documente que `EMAIL` et `PASSWORD`.

**Fix :** Mettre à jour `e2e/config/credentials.yaml.example` avec les 20 variables (valeurs factices).

---

### P1 — Bloquants pour les flows non encore créés

#### 3. `StripeHub.tsx` — Aucun testID sur les boutons d'action

**Fichier :** `src/screens/business/StripeHub.tsx`

**Boutons à équiper d'un `testID` :**

| Bouton                                     | testID à ajouter                  |
| ------------------------------------------ | --------------------------------- |
| "Connect Stripe" / "Connecter Stripe"      | `stripe-hub-connect-btn`          |
| "Disconnect" / "Déconnecter"               | `stripe-hub-disconnect-btn`       |
| "Complete Profile" / "Compléter le profil" | `stripe-hub-complete-profile-btn` |
| "Refresh Status" / "Actualiser"            | `stripe-hub-refresh-btn`          |
| Écran principal StripeHub                  | `stripe-hub-screen`               |
| Statut affiché (actif/inactif)             | `stripe-hub-status-text`          |

---

#### 4. `ContractorJobWizardModal.tsx` — Aucun testID sur les éléments de contre-proposition

**Fichier :** `src/components/modals/ContractorJobWizardModal.tsx` (step `counter_proposal`)

**Éléments à équiper :**

| Élément                                                 | testID à ajouter               |
| ------------------------------------------------------- | ------------------------------ |
| Bouton "Contre-proposer" / "Counter Propose"            | `counter-proposal-btn`         |
| Input du prix contre-proposé                            | `counter-proposal-price-input` |
| Bouton d'envoi de la contre-proposition                 | `counter-proposal-submit-btn`  |
| Bouton "Accepter la contre-proposition" côté contractee | `counter-proposal-accept-btn`  |
| Bouton "Refuser la contre-proposition" côté contractee  | `counter-proposal-decline-btn` |
| Label de statut                                         | `counter-proposal-status-text` |

---

### P2 — Fragilités à corriger pour les flows en cours

#### 5. `StaffingSection.tsx` — Assignation par texte sans testID

**Fichier :** `src/components/jobDetails/sections/StaffingSection.tsx`

**Problème :** Les flows 050/051/052 utilisent `tapOn: text: "Employee Test"`, `text: "Offsider"`, `text: "Driver"` pour assigner des membres d'équipe. Si un nom change ou si la locale change, le test casse silencieusement.

**Éléments à équiper :**

| Élément                                     | testID à ajouter                         |
| ------------------------------------------- | ---------------------------------------- |
| Item d'un membre dans la liste de sélection | `staff-assign-item-{userId}` (dynamique) |
| Sélecteur de rôle "Offsider"                | `role-select-offsider`                   |
| Sélecteur de rôle "Driver"                  | `role-select-driver`                     |
| Sélecteur de rôle "Operator"                | `role-select-operator`                   |
| Bouton de confirmation d'assignation        | `staff-assign-confirm-btn`               |

---

#### 6. `TransferJobModal` — Sélection de l'entreprise contractor par texte

**Fichier :** `src/components/modals/TransferJobModal/index.tsx`

**Problème :** Le flow 051 utilise `tapOn: text: "${ROMAIN_COMPANY_NAME}"` pour sélectionner l'entreprise contractor dans la modal de transfert. Fragile si le nom change ou si plusieurs entreprises ont un nom similaire.

**Éléments à équiper :**

| Élément                                  | testID à ajouter                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Item entreprise contractor dans la liste | `transfer-contractor-item-{companyId}` (dynamique)                                     |
| Bouton "Envoyer la proposition"          | `transfer-send-btn` (vérifier si `transfer-job-send-btn` est déjà présent et cohérent) |

---

#### 7. `FleetSection` / `AssignVehicleModal` — Sélection du camion par texte

**Fichier :** Section véhicules dans les détails du job (probablement `src/components/jobDetails/sections/`)

**Problème :** Le flow 052 utilise `tapOn: text: "${TRUCK_NAME}"` pour assigner un camion.

**Éléments à équiper :**

| Élément                                  | testID à ajouter                              |
| ---------------------------------------- | --------------------------------------------- |
| Item véhicule dans la liste de sélection | `vehicle-assign-item-{vehicleId}` (dynamique) |
| Bouton de confirmation                   | `vehicle-assign-confirm-btn`                  |

---

### P3 — Fonctionnalité manquante dans l'app (flow 011)

#### 8. Suppression de compte utilisateur

**Problème :** Il n'existe pas de bouton "Supprimer mon compte" accessible à l'utilisateur dans l'app. La clé de traduction `deleteAccount` dans les langues fait référence à la déconnexion Stripe, pas à la suppression du compte applicatif.

**Ce qu'il faut ajouter dans l'app :**

- Un bouton "Supprimer mon compte" dans `src/screens/parameters.tsx` ou dans l'écran profil
- Ce bouton doit déclencher une dialog de confirmation (2 étapes minimum pour éviter les suppressions accidentelles)
- Appel à l'endpoint backend de suppression de compte
- Redirection vers `connection-screen` après suppression

**testIDs requis :**

| Élément                             | testID                         |
| ----------------------------------- | ------------------------------ |
| Bouton de suppression de compte     | `profile-delete-account-btn`   |
| Dialog de confirmation (1ère étape) | `delete-account-confirm-modal` |
| Bouton de confirmation finale       | `delete-account-confirm-btn`   |
| Bouton d'annulation                 | `delete-account-cancel-btn`    |

---

### Récapitulatif des testIDs à ajouter

| Fichier source                                           | testID à ajouter                                                                                                                                                                     | Priorité         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `src/screens/business/StripeHub.tsx`                     | `stripe-hub-screen`, `stripe-hub-connect-btn`, `stripe-hub-disconnect-btn`, `stripe-hub-complete-profile-btn`, `stripe-hub-refresh-btn`, `stripe-hub-status-text`                    | P1               |
| `src/components/modals/ContractorJobWizardModal.tsx`     | `counter-proposal-btn`, `counter-proposal-price-input`, `counter-proposal-submit-btn`, `counter-proposal-accept-btn`, `counter-proposal-decline-btn`, `counter-proposal-status-text` | P1               |
| `src/components/jobDetails/sections/StaffingSection.tsx` | `staff-assign-item-{userId}`, `role-select-offsider`, `role-select-driver`, `role-select-operator`, `staff-assign-confirm-btn`                                                       | P2               |
| `src/components/modals/TransferJobModal/index.tsx`       | `transfer-contractor-item-{companyId}`                                                                                                                                               | P2               |
| Section véhicules dans job details                       | `vehicle-assign-item-{vehicleId}`, `vehicle-assign-confirm-btn`                                                                                                                      | P2               |
| `src/screens/parameters.tsx` ou profil                   | `profile-delete-account-btn`, `delete-account-confirm-modal`, `delete-account-confirm-btn`, `delete-account-cancel-btn`                                                              | P3 (new feature) |

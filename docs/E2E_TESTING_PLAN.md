# Plan de Tests E2E — Swift App (Maestro)

## Vue d'ensemble

Tests end-to-end avec **Maestro** pour valider les flux critiques de l'app avant chaque build EAS.  
Deux environnements : **local (Samsung + Expo Go)** et **CI (GitHub Actions + émulateur Android)**.

---

## 1. Installation & Configuration

### 1.1 Installer Maestro

```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows (PowerShell)
iwr -useb https://get.maestro.mobile.dev/install.ps1 | iex
```

Vérifier l'installation :


```bash
maestro --version
```

### 1.2 Structure du projet

```
swift-app/
├── e2e/
│   ├── flows/
│   │   ├── 001-launch-login-calendar.yaml     ← Premier test de base
│   │   ├── 002-calendar-navigation.yaml
│   │   ├── 003-job-details.yaml
│   │   ├── 004-home-menu-navigation.yaml
│   │   ├── 005-business-hub.yaml
│   │   ├── 006-profile-view.yaml
│   │   ├── 007-logout.yaml
│   │   └── ... (à venir)
│   ├── config/
│   │   └── credentials.yaml                   ← Credentials de test (gitignored)
│   └── maestro.config.yaml                    ← Config globale
```

---

## 2. Exécution Locale (Samsung via cable USB ou Expo Go)


### 2.1 Prérequis

- Expo Go installé sur le Samsung
- `adb devices` liste l'appareil (cable USB + debug activé)
- App démarrée avec `npx expo start`

### 2.2 Lancer Maestro localement

```bash
# Lancer un test spécifique
maestro test e2e/flows/001-launch-login-calendar.yaml

# Lancer tous les tests
maestro test e2e/flows/

# Mode studio (visualisation en temps réel)
maestro studio
```

### 2.3 Récupérer l'App ID pour Expo Go

```bash
# Sur Android via Expo Go, l'app ID est généralement :
# host.exp.exponent (Expo Go)
# Ou le bundle ID de ton app : com.slashforyou.swiftapp
```

---

## 3. CI/CD — GitHub Actions

### 3.1 Flow prévu

```
Push / PR → Tests E2E (émulateur) → Si OK → Build EAS
```

### 3.2 Fichier `.github/workflows/e2e.yml` (à créer)

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Setup Android Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          arch: x86_64
          disable-animations: true

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install deps
        run: npm ci

      - name: Build app (development)
        run: npx expo export --platform android

      - name: Run E2E tests
        run: |
          ~/.maestro/bin/maestro test e2e/flows/ \
            --env EMAIL=${{ secrets.TEST_EMAIL }} \
            --env PASSWORD=${{ secrets.TEST_PASSWORD }}
```

### 3.3 Secrets GitHub à configurer


Dans `Settings > Secrets and variables > Actions` :

- `TEST_EMAIL` — email du compte de test
- `TEST_PASSWORD` — mot de passe du compte de test

---

## 4. Convention de nommage des testID

### 4.1 Règle

```
[screen]-[section?]-[element]-[type]
```

Tout en **kebab-case**, clair et lisible.

### 4.2 Types d'éléments courants

| Suffixe    | Usage                        |
| ---------- | ---------------------------- |
| `-screen`  | Conteneur racine d'un écran  |
| `-btn`     | Bouton / Pressable           |
| `-input`   | TextInput                    |
| `-text`    | Text important               |
| `-scroll`  | ScrollView                   |
| `-list`    | FlatList / liste             |
| `-modal`   | Conteneur de modal           |
| `-header`  | En-tête de section           |
| `-item`    | Élément de liste             |
| `-icon`    | Icone cliquable              |
| `-label`   | Label de champ               |
| `-link`    | Lien / navigation secondaire |
| `-toggle`  | Switch / checkbox            |
| `-avatar`  | Image de profil              |
| `-loader`  | Indicateur de chargement     |
| `-banner`  | Bandeau d'info / statut      |
| `-card`    | Carte / bloc info            |
| `-tab`     | Onglet de navigation         |
| `-section` | Section de contenu           |

### 4.3 Exemples de nommage

```
connection-screen
connection-login-btn
connection-register-btn

login-screen
login-email-input
login-password-input
login-submit-btn
login-create-account-btn
login-back-btn

home-screen
home-calendar-btn
home-business-btn
home-parameters-btn
home-logout-btn
home-today-section
home-profile-header

calendar-month-screen
calendar-month-day-{n}       ← ex: calendar-month-day-15
calendar-month-prev-btn
calendar-month-next-btn
calendar-month-header-text

job-details-screen
job-details-title-text
job-details-status-banner
job-details-quick-actions-section
```

---

## 5. Liste complète des scénarios de test

### Phase 1 — Socle (Sprint actuel)

| #   | Fichier                          | Description                                             | Priorité    |
| --- | -------------------------------- | ------------------------------------------------------- | ----------- |
| 001 | `001-launch-login-calendar.yaml` | Lancer l'app → login si nécessaire → ouvrir le calendar | 🔴 Critique |

### Phase 2 — Navigation

| #   | Fichier                         | Description                                | Priorité    |
| --- | ------------------------------- | ------------------------------------------ | ----------- |
| 002 | `002-calendar-navigation.yaml`  | Naviguer mois → jour → retour              | 🔴 Critique |
| 003 | `003-home-menu-navigation.yaml` | Menu home : calendar, business, paramètres | 🟠 Haute    |
| 004 | `004-logout.yaml`               | Déconnexion depuis home                    | 🟠 Haute    |

### Phase 3 — Jobs

| #   | Fichier                      | Description                                         | Priorité   |
| --- | ---------------------------- | --------------------------------------------------- | ---------- |
| 005 | `005-job-details.yaml`       | Ouvrir un job depuis le calendar → voir les détails | 🟠 Haute   |
| 006 | `006-job-quick-actions.yaml` | Appel, GPS, note, photo depuis job                  | 🟡 Moyenne |
| 007 | `007-job-step-advance.yaml`  | Avancer une étape d'un job                          | 🟡 Moyenne |

### Phase 4 — Business

| #   | Fichier                    | Description                     | Priorité   |
| --- | -------------------------- | ------------------------------- | ---------- |
| 008 | `008-business-hub.yaml`    | Accéder au Business Hub         | 🟡 Moyenne |
| 009 | `009-business-staff.yaml`  | Voir liste du staff             | 🟡 Moyenne |
| 010 | `010-business-trucks.yaml` | Voir liste des camions          | 🟡 Moyenne |
| 011 | `011-create-job.yaml`      | Créer un job depuis le business | 🟡 Moyenne |

### Phase 5 — Profil & Paramètres

| #   | Fichier                 | Description                           | Priorité |
| --- | ----------------------- | ------------------------------------- | -------- |
| 012 | `012-profile-view.yaml` | Consulter son profil                  | 🟢 Basse |
| 013 | `013-parameters.yaml`   | Accéder aux paramètres, changer thème | 🟢 Basse |

### Phase 6 — Inscription & Onboarding

| #   | Fichier                      | Description                | Priorité |
| --- | ---------------------------- | -------------------------- | -------- |
| 014 | `014-register-flow.yaml`     | Flux complet d'inscription | 🟢 Basse |
| 015 | `015-stripe-onboarding.yaml` | Onboarding Stripe          | 🟢 Basse |

---


## 6. Credentials & Données de test

Fichier `e2e/config/credentials.yaml` (gitignored) :

```yaml
TEST_EMAIL: "test@swift-app.com"

TEST_PASSWORD: "TestPassword123!"
```

Utiliser dans les flows Maestro :

```yaml
- tapOn:

    id: "login-email-input"
- inputText: ${EMAIL}
```

Lancer avec :

```bash
maestro test e2e/flows/001-launch-login-calendar.yaml \
  --env EMAIL=test@swift-app.com \
  --env PASSWORD=TestPassword123!
```

---

## 7. Debug & Troubleshooting

```bash
# Voir les IDs disponibles sur l'écran actuel
maestro hierarchy

# Prendre un screenshot
maestro screenshot

# Lancer en mode verbose
maestro test --debug e2e/flows/001-launch-login-calendar.yaml

# Voir les logs de l'app pendant le test
maestro test --format junit e2e/flows/ > results.xml
```

---

## 8. Évolution vers EAS Build

Une fois les tests stabilisés, la pipeline GitHub Actions évoluera :

```
Push → E2E Tests → [Si OK] → eas build --profile preview → [Build EAS distribué]
```

Cela éliminera la majorité des builds échoués et garantira la qualité avant distribution.

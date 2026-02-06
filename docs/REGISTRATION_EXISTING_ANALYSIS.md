# 🔍 État des Lieux - Système d'Inscription Existant

**Date de l'analyse:** 28 janvier 2026  
**Document de référence:** [REGISTRATION_DATA_REQUIREMENTS.md](./REGISTRATION_DATA_REQUIREMENTS.md)

---

## 📱 Système d'Inscription/Connexion Actuel

### Écrans Existants

#### 1. Écran de Connexion (`src/screens/connection.tsx`)

- **Description:** Landing page principale pour l'authentification
- **Fonctionnalités:**
  - 2 boutons principaux:
    - "Se connecter" → `LoginScreen`
    - "S'inscrire" → `SubscribeScreen`
  - Liste de features affichées
  - Animations de fond (`AnimatedBackground`)
- **État:** ✅ Implémenté et fonctionnel

---

#### 2. Écran d'Inscription (`src/screens/connectionScreens/subscribe.tsx`)

**Champs actuels:**

- ✅ `firstName` (prénom)
- ✅ `lastName` (nom)
- ✅ `email` (email)
- ✅ `password` (mot de passe, min 6 caractères)
- ✅ `confirmPassword` (confirmation)

**Validations implémentées:**

```typescript
- Email valide (regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
- Mot de passe min 6 caractères (NOTE: documentation recommande 8)
- Mots de passe identiques
- Champs requis (firstName, lastName, email, password)
```

**Processus d'inscription:**

1. Utilisateur remplit le formulaire
2. Envoi `POST /subscribe` avec `{ mail, password, firstName, lastName }`
3. Backend crée compte + génère code de vérification (6 chiffres)
4. Backend envoie email avec code
5. Redirection vers `SubscribeMailVerification` avec params: `{ id, mail, firstName, lastName }`

**État:** ✅ Implémenté et fonctionnel (mais incomplet pour Business Owner)

---

#### 3. Écran de Vérification Email (`src/screens/connectionScreens/subscribeMailVerification.tsx`)

- **Fonctionnalités:**
  - Input pour code à 6 chiffres
  - Bouton "Verify"
  - Bouton "Resend code" (si expiré)
- **Processus:**
  1. Utilisateur entre le code
  2. Envoi `POST /verifyMail` avec `{ mail, code }`
  3. Si valide: suppression du code en BDD + compte activé
  4. Redirection vers `Login`

- **Validations:**
  - Code doit être 6 chiffres exactement
  - Email fourni dans params
  - Email valide

- **État:** ✅ Implémenté et fonctionnel

---

#### 4. Écran de Login (`src/screens/connectionScreens/login.tsx`)

**Champs:**

- Email
- Password

**Processus:**

1. Validation des champs (non vides)
2. Collecte device info (`collectDevicePayload()`)
3. Envoi `POST /auth/login` avec:
   ```typescript
   {
     mail: string,
     password: string,
     device: {
       name: string,
       platform: 'ios' | 'android'
     },
     wantRefreshInBody: true
   }
   ```
4. Réception:
   ```typescript
   {
     status: 200,
     success: true,
     sessionToken: string,
     refreshToken: string,
     sessionExpiry: ISO date string,
     user: {
       id, email, first_name, last_name, role,
       company_id, company_role, company
     }
   }
   ```

**Stockage sécurisé (SecureStore):**

- `session_token`
- `refresh_token`
- `session_expiry` (15 minutes)
- `user_data` (JSON complet)

**État:** ✅ Implémenté et fonctionnel

---

## 🎯 Types d'Utilisateurs Actuels

### Système existant (frontend)

#### Types principaux (`src/services/user.ts`)

```typescript
export type UserType = "employee" | "worker";

export type CompanyRole = "patron" | "cadre" | "employee";

export interface Company {
  id: number;
  name: string;
}

export interface UserProfile {
  // Identité
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  userType: UserType; // 'employee' (TFN) ou 'worker' (ABN)

  // Relation entreprise (API v1.1.0)
  company_id?: number;
  company_role?: CompanyRole; // 'patron', 'cadre', 'employee'
  company?: Company | null;

  // Adresse
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;

  // Info entreprise (pour workers ABN uniquement)
  companyName?: string;
  siret?: string; // ABN en Australie
  tva?: string; // GST en Australie

  // Gamification
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
  title?: string;

  // Préférences
  preferences?: {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: boolean;
  };

  permissions?: string[];
  isActive: boolean;

  // Dates
  joinDate: string;
  lastLogin?: string;
  profilePicture?: string;
}
```

#### Système Staff (gestion d'équipe - `src/types/staff.ts`)

```typescript
// Employé TFN (employé de l'entreprise)
export interface Employee extends BaseStaffMember {
  type: "employee";
  tfn?: string; // Tax File Number (optionnel)
  hourlyRate: number;
  invitationStatus: "sent" | "accepted" | "completed" | "pending" | "expired";
  accountLinked: boolean;
}

// Prestataire ABN (contractor externe)
export interface Contractor extends BaseStaffMember {
  type: "contractor";
  abn: string; // Australian Business Number
  contractStatus: "exclusive" | "non-exclusive" | "preferred" | "standard";
  rateType: "hourly" | "fixed" | "project";
  rate: number;
  isVerified: boolean;
}

export type StaffMember = Employee | Contractor;
```

**Note:** Ces types sont utilisés pour la **gestion du staff** par le Business Owner, pas pour l'inscription initiale.

---

## 🔐 Authentification & Sécurité Actuels

### Tokens stockés (via `expo-secure-store`)

| Clé              | Type   | Description                | Durée de vie |
| ---------------- | ------ | -------------------------- | ------------ |
| `session_token`  | string | Token de session JWT       | 15 minutes   |
| `refresh_token`  | string | Token de rafraîchissement  | 30 jours     |
| `session_expiry` | string | Date d'expiration ISO      | -            |
| `user_data`      | JSON   | Profil utilisateur complet | -            |

### Headers d'authentification

```typescript
// utils/auth.ts - getAuthHeaders()
{
  'Authorization': `Bearer ${session_token}`,
  'Content-Type': 'application/json',
  'x-client': 'mobile'
}
```

### Fonction de login existante

**Fichier:** `src/utils/auth.ts`

```typescript
export async function login(mail: string, password: string) {
  // 1. Collecte device info (nom, plateforme)
  const device = await collectDevicePayload();

  // 2. POST /auth/login avec { mail, password, device, wantRefreshInBody }
  const res = await fetch(`${API}auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client": "mobile" },
    body: JSON.stringify({ mail, password, device, wantRefreshInBody: true }),
    signal: controller.signal, // 60s timeout
  });

  // 3. Stockage tokens + user data
  await SecureStore.setItemAsync("session_token", sessionToken);
  await SecureStore.setItemAsync("session_expiry", sessionExpiry);
  await SecureStore.setItemAsync("refresh_token", refreshToken);
  await SecureStore.setItemAsync("user_data", JSON.stringify(user));

  // 4. Retour
  return { sessionToken, success, hasRefresh: !!refreshToken, user };
}
```

---

## 🚫 Ce qui MANQUE pour notre Documentation

### ❌ Non implémenté actuellement

#### Pour Business Owner:

- ❌ Informations d'entreprise (ABN, ACN, businessType, industryType)
- ❌ Adresse professionnelle complète (5 champs)
- ❌ Informations bancaires (BSB, account number, account name)
- ❌ Stripe Connect onboarding
- ❌ Documents requis:
  - Preuve d'ABN
  - Certificat d'assurance
  - Licence de déménageur
  - Photo d'identité (KYC)
- ❌ Choix de plan d'abonnement (starter/professional/enterprise)
- ❌ Billing frequency (monthly/yearly)

#### Pour Employee:

- ✅ **Déjà simple** (nom, prénom, email, password) - conforme à documentation simplifiée
- ❌ Système d'invitation par token (types définis mais pas d'UI/flux)
- ❌ Linkage automatique à une entreprise lors de l'inscription
- ❌ Page de validation de token d'invitation

#### Pour Contractor:

- ❌ **Aucun flux d'inscription contractor**
- ❌ ABN validation/lookup
- ❌ Specialization multi-select (Heavy Lifting, Piano Moving, etc.)
- ❌ Service area selection
- ❌ Insurance information (liability insurance obligatoire)
- ❌ Certifications (White Card, RSA, etc.)
- ❌ Stripe Connect setup
- ❌ Admin verification workflow

#### Pour Job Provider:

- ❌ **Aucun flux d'inscription job provider**
- ❌ Company info (représentant + entreprise)
- ❌ Service type selection
- ❌ Billing model (commission/markup/flat_fee/subscription)
- ❌ Partnership agreements
- ❌ API access configuration (webhooks)

#### Authentification:

- ❌ OAuth (Google, Facebook, Apple)
- ❌ Mot de passe oublié / Reset password
- ❌ 2FA / Multi-factor authentication
- ❌ Account linking (si email déjà existe avec OAuth)

---

## 🔄 Relations Entreprise/Utilisateur Existantes

### Permissions implémentées (`src/utils/permissions.ts`)

```typescript
// Basé sur CompanyRole

canCreateJob(role: CompanyRole)
// patron ✅, cadre ✅, employee ❌

canSeeAllCompanyJobs(role: CompanyRole)
// patron ✅, cadre ✅
// employee ❌ (voit seulement jobs assignés)

isManager(role: CompanyRole)
// patron ✅, cadre ✅, employee ❌

isOwner(role: CompanyRole)
// patron ✅, autres ❌

getCalendarLabel(role: CompanyRole)
// patron/cadre: "Company Calendar"
// employee: "My Calendar"
```

### Hook de permissions (`src/hooks/useCompanyPermissions.ts`)

```typescript
useCompanyPermissions();
// Retourne toutes les permissions + company info

getUserCompanyData();
// Récupère company_id, company_role, company depuis SecureStore
```

### Affichage dans Profile (`src/screens/profile.tsx`)

**Section "Company Information" (API v1.1.0):**

- Badge de rôle avec emoji:
  - 👑 **Owner (Patron)** - Badge doré
  - 👔 **Manager (Cadre)** - Badge primaire
  - 👷 **Employee** - Badge gris
- Nom de l'entreprise (read-only)
- Note explicative du rôle

---

## 📊 État de la Base de Données (supposé d'après le code)

### Tables supposées existantes:

```sql
-- users (table principale)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hash SHA256
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50),
  user_type ENUM('employee', 'worker'), -- TFN ou ABN
  company_id INT,
  company_role ENUM('patron', 'cadre', 'employee'),
  verification_code VARCHAR(6), -- Code email (supprimé après vérif)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- companies (pour relation company)
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  abn VARCHAR(20) UNIQUE, -- Australian Business Number
  acn VARCHAR(20), -- Australian Company Number
  business_type ENUM('sole_trader', 'partnership', 'company', 'trust'),
  industry_type ENUM('removals', 'logistics', 'storage', 'other'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- devices (pour multi-device login)
CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(50), -- 'ios', 'android'
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- sessions (pour tokens)
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_id INT,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

---

## 🎨 UI/UX Existant

### Design System utilisé

**Composants:**

- `useCommonThemedStyles()` - Hook pour styles thématiques (colors, fonts, spacing)
- `AnimatedBackground` - Animations de fond avec gradients
- `AlertMessage` - Composant d'alertes réutilisable (success/error/warning/info)
- `KeyboardAvoidingView` - Gestion du clavier sur mobile
- `SafeAreaView` - Zones sûres iOS/Android

**Thèmes:**

- Light mode ☀️
- Dark mode 🌙
- Auto (système)

### Traductions (i18n)

**Langues supportées:** 7+

- 🇬🇧 English (EN)
- 🇫🇷 Français (FR)
- 🇪🇸 Español (ES)
- 🇮🇹 Italiano (IT)
- 🇵🇹 Português (PT)
- 🇨🇳 中文 (ZH)
- 🇮🇳 हिन्दी (HI)

**Namespaces existants:**

```typescript
auth.login.*
auth.register.*
auth.validation.*
auth.emailVerification.*
auth.errors.*
auth.success.*
```

### Validations UI

**Messages d'erreur traduits:**

- `emailRequired` - "Veuillez saisir votre adresse email."
- `emailInvalid` - "Veuillez saisir une adresse email valide."
- `passwordRequired` - "Veuillez saisir votre mot de passe."
- `passwordTooShort` - "Le mot de passe doit contenir au moins 8 caractères."
- `passwordMismatch` - "Les mots de passe ne correspondent pas."
- `firstNameRequired` - "Veuillez saisir votre prénom."
- `lastNameRequired` - "Veuillez saisir votre nom."

---

## 📝 APIs Backend Existantes

**Source:** `docs/api/API-Doc.md`

### POST `/swift-app/subscribe`

**Description:** Inscription d'un nouvel utilisateur

**Body requis:**

```json
{
  "mail": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "motdepasse123"
}
```

**Validations:**

- Email valide (regex)
- Mot de passe ≥ 8 caractères (alphanumériques + spéciaux français acceptés)
- Pas de caractères `'` dans les champs

**Process:**

1. Vérification email unique
2. Hash du mot de passe (SHA256)
3. Insertion en BDD
4. Génération code de vérification (6 chiffres)
5. Envoi email de vérification

**Réponse succès:**

```json
{
  "success": true,
  "user": {
    "id": 123,
    "mail": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Erreurs possibles:**

- `400`: Paramètres manquants/invalides
- `400`: Email déjà utilisé
- `500`: Erreur envoi email ou BDD

---

### POST `/swift-app/verifyMail`

**Description:** Vérification du code email après inscription

**Body requis:**

```json
{
  "mail": "user@example.com",
  "code": "123456"
}
```

**Validations:**

- Email valide (regex)
- Code à 6 chiffres exactement
- Pas de caractères `'`

**Process:**

1. Recherche user avec email + code
2. Suppression du code de vérification (mise à NULL)

**Réponse succès:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Erreurs possibles:**

- `400`: Paramètres manquants/invalides
- `401`: Email ou code incorrect
- `500`: Erreur BDD

---

### POST `/swift-app/auth/login`

**Description:** Connexion utilisateur avec gestion des devices

**Body requis:**

```json
{
  "mail": "user@example.com",
  "password": "motdepasse123",
  "device": {
    "name": "iPhone de John",
    "platform": "ios"
  },
  "wantRefreshInBody": true
}
```

**Process:**

1. Vérification email/mot de passe (hash SHA256)
2. Génération tokens (session + refresh)
3. Gestion device (création ou mise à jour)
4. Création session avec expiration

**Réponse succès:**

```json
{
  "status": 200,
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionExpiry": "2026-01-28T11:30:00.000Z",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "company_id": 456,
    "company_role": "patron",
    "company": {
      "id": 456,
      "name": "Swift Moving Co"
    }
  }
}
```

---

### GET `/swift-app/v1/user/profile`

**Description:** Récupération du profil complet de l'utilisateur

**Headers requis:**

```http
Authorization: Bearer {session_token}
```

**Réponse succès:**

```json
{
  "success": true,
  "profile": {
    "id": "123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+61 400 000 000",
    "role": "owner",
    "userType": "worker",
    "company_id": 456,
    "company_role": "patron",
    "company": {
      "id": 456,
      "name": "Swift Moving Co"
    },
    "address": "123 Main St",
    "city": "Sydney",
    "postalCode": "2000",
    "country": "Australia",
    "companyName": "Swift Moving Co",
    "siret": "12 345 678 901",
    "tva": "GST123456789",
    "level": 5,
    "experience": 1250,
    "experienceToNextLevel": 1500,
    "permissions": ["view_jobs", "create_jobs", "manage_staff"],
    "isActive": true
  }
}
```

---

### PUT `/swift-app/v1/user/profile`

**Description:** Mise à jour du profil utilisateur

**Body requis:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+61 400 000 000",
  "address": "123 Main St",
  "city": "Sydney",
  "postalCode": "2000"
}
```

**Réponse succès:**

```json
{
  "success": true,
  "profile": { ...updated profile }
}
```

---

## ✅ Points Positifs Existants

### Architecture

1. **Séparation des responsabilités**: Services / Hooks / Screens bien organisés
2. **Types TypeScript**: Interfaces complètes et bien définies
3. **Modularité**: Composants réutilisables (AlertMessage, AnimatedBackground)

### Sécurité

4. **Tokens sécurisés**: SecureStore pour stockage des tokens
5. **Refresh token**: Gestion automatique de la session (15 min)
6. **Device tracking**: Multi-device login géré
7. **Password hashing**: SHA256 côté backend

### UX

8. **i18n complet**: 7 langues supportées
9. **Thèmes**: Light/Dark/Auto
10. **Validations**: Messages d'erreur clairs et traduits
11. **Loading states**: Indicateurs de chargement
12. **Alert system**: AlertMessage réutilisable

### Fonctionnalités

13. **Relations entreprise**: Déjà implémentées (company_id, company_role)
14. **Permissions RBAC**: Système de permissions fonctionnel (patron/cadre/employee)
15. **Profile display**: Affichage du rôle avec badges
16. **Email verification**: Flux complet avec code à 6 chiffres

---

## 🚀 Prochaines Étapes - Roadmap d'Implémentation

### Phase 1: Onboarding Initial (Priorité HAUTE)

**Objectif:** Permettre aux utilisateurs de choisir leur type de compte

**Tâches:**

1. Créer écran `AccountTypeSelection.tsx`
   - 4 cartes: Business Owner, Employee, Contractor, Job Provider
   - Descriptions courtes
   - Redirection vers le bon flux
2. Modifier navigation:
   - Connection → AccountTypeSelection → Flux spécifique
3. Créer routes:
   - `/register/business-owner`
   - `/register/employee-invitation`
   - `/register/contractor`
   - `/register/job-provider`

**Estimation:** 3 jours

---

### Phase 2: Flux Business Owner Complet (Priorité HAUTE)

**Objectif:** Wizard multi-étapes pour inscription complète Business Owner

**Tâches:**

1. **Étape 1 - Personal Info** (déjà fait, améliorer validation):
   - Augmenter password min à 8 caractères
   - Ajouter dateOfBirth (obligatoire pour Stripe KYC)
   - Ajouter phone
2. **Étape 2 - Company Info**:
   - companyName
   - tradingName (optionnel)
   - ABN input avec validation format (XX XXX XXX XXX)
   - ACN (optionnel)
   - businessType dropdown
   - industryType dropdown
   - companyEmail (optionnel)
   - companyPhone
3. **Étape 3 - Address**:
   - streetAddress
   - suburb (autocomplete Google Places API)
   - state dropdown (NSW, VIC, QLD, etc.)
   - postcode (4 digits validation)
   - country (default Australia)
4. **Étape 4 - Subscription Plan**:
   - Cartes de plans (Starter, Professional, Enterprise)
   - Billing frequency (Monthly/Yearly avec discount)
   - estimatedJobsPerMonth slider
5. **Étape 5 - Banking (Stripe Connect)**:
   - Redirection vers Stripe Connect onboarding
   - Collecte BSB + Account Number + Account Name
   - ou "Skip for now" (mais requis avant de créer des jobs)
6. **Étape 6 - Documents** (optionnel mais recommandé):
   - Upload ABN proof
   - Upload insurance certificate
   - Upload moving licence (si applicable)
   - Upload ID photo (pour KYC)
7. **Étape 7 - Confirmation**:
   - Résumé de toutes les infos
   - Checkbox CGV
   - Checkbox Privacy Policy
   - Checkbox Stripe Connect Terms
   - Bouton "Create Account"
8. **Backend API:**
   - `POST /swift-app/register/business-owner`
   - Validation ABN (lookup Australian Business Register)
   - Création company + user
   - company_role = 'patron'
   - Envoi email de vérification
   - Redirection vers SubscribeMailVerification

**Estimation:** 10 jours

---

### Phase 3: Flux Employee Invitation (Priorité MOYENNE)

**Objectif:** Système d'invitation sécurisé par token

**Tâches:**

1. **Backend:**
   - `POST /swift-app/invite/employee`
     - Body: `{ firstName, lastName, email, phone, role, team, hourlyRate }`
     - Génération token unique (UUID)
     - Expiration 7 jours
     - Envoi email avec lien: `swiftapp://invite/{token}`
   - `GET /swift-app/validate-invitation-token/:token`
     - Retourne invitation data (firstName, lastName, email, company info)
     - Vérifie expiration

2. **Frontend:**
   - Page `EmployeeInvitation.tsx`
   - Validation du token au mount
   - Si valide: afficher formulaire simplifié (password only)
   - Si expiré: message + bouton "Request new invitation"
   - Auto-remplissage: firstName, lastName, email, company_id
   - accountLinked = false (devient true après email verification)
3. **Flow:**
   - Business Owner invite → Email envoyé
   - Employee clique lien → Validation token
   - Employee crée password → Compte créé
   - Email verification → accountLinked = true
   - Employee peut être assigné aux jobs

**Estimation:** 5 jours

---

### Phase 4: Flux Contractor (Priorité MOYENNE)

**Objectif:** Inscription complète contractor avec ABN

**Tâches:**

1. **Wizard Contractor (10 étapes):**
   - Personal Info (6 champs)
   - Business/ABN (6 champs avec ABN lookup)
   - Services (specialization multi-select, serviceArea)
   - Pricing (rateType, hourlyRate, minimumJobFee, callOutFee)
   - Address (5 champs)
   - Insurance (liability insurance obligatoire + certifications)
   - Documents upload
   - Banking (Stripe Connect)
   - Availability status
   - Confirmation
2. **Backend:**
   - `POST /swift-app/register/contractor`
   - Validation ABN (lookup ABR)
   - isVerified = false (admin doit vérifier)
   - Envoi email de vérification
3. **Admin Verification:**
   - Dashboard admin pour vérifier contractors
   - Check documents
   - Check insurance
   - Bouton "Verify Contractor" → isVerified = true

**Estimation:** 8 jours

---

### Phase 5: Flux Job Provider (Priorité BASSE)

**Objectif:** Inscription job provider avec partenariats

**Tâches:**

1. **Wizard Job Provider (11 étapes):**
   - Representative Info
   - Company Info
   - Address
   - Service Type
   - Expected Job Volume
   - Billing Model (commission/markup/flat_fee/subscription)
   - Banking
   - Permissions
   - API Access (optionnel)
   - Documents
   - Confirmation
2. **Backend:**
   - `POST /swift-app/register/job-provider`
   - businessVerified = false
   - Envoi email de vérification
3. **Partnership System:**
   - `POST /swift-app/partnerships/request`
   - Job Provider demande partenariat avec Business Owner
   - Business Owner accepte/refuse
   - Status: pending/active/inactive

**Estimation:** 10 jours

---

### Phase 6: OAuth Authentication (Priorité HAUTE)

**Objectif:** Google, Facebook, Apple Sign In

**Tâches:**

1. **Setup:**
   - Google OAuth credentials (console.cloud.google.com)
   - Facebook App (developers.facebook.com)
   - Apple Services ID (developer.apple.com)
2. **React Native packages:**
   - `@react-native-google-signin/google-signin`
   - `react-native-fbsdk-next`
   - `@invertase/react-native-apple-authentication`
3. **Backend APIs:**
   - `POST /swift-app/oauth/google`
   - `POST /swift-app/oauth/facebook`
   - `POST /swift-app/oauth/apple`
   - Vérification token avec provider API
   - Check si email existe → login
   - Sinon → créer compte + redirect vers completion form
4. **Database:**
   - Table `oauth_accounts` (user_id, provider, provider_user_id, tokens)
5. **UI:**
   - Boutons OAuth sur Login et Register screens
   - Mapping OAuth data → UserProfile
   - Handling email conflicts

**Estimation:** 7 jours

---

### Phase 7: Mot de Passe Oublié (Priorité MOYENNE)

**Tâches:**

1. **Backend:**
   - `POST /swift-app/password/forgot`
     - Génération token reset (6 digits)
     - Expiration 30 minutes
     - Envoi email
   - `POST /swift-app/password/reset`
     - Validation token + nouveau password
     - Hash nouveau password
     - Suppression token

2. **Frontend:**
   - Page `ForgotPassword.tsx`
   - Page `ResetPassword.tsx`
   - Validation password strength

**Estimation:** 3 jours

---

## 📊 Résumé des Estimations

| Phase                        | Priorité | Estimation | Cumul |
| ---------------------------- | -------- | ---------- | ----- |
| Phase 1: Onboarding Initial  | HAUTE    | 3 jours    | 3j    |
| Phase 2: Business Owner      | HAUTE    | 10 jours   | 13j   |
| Phase 6: OAuth               | HAUTE    | 7 jours    | 20j   |
| Phase 3: Employee Invitation | MOYENNE  | 5 jours    | 25j   |
| Phase 4: Contractor          | MOYENNE  | 8 jours    | 33j   |
| Phase 7: Mot de passe oublié | MOYENNE  | 3 jours    | 36j   |
| Phase 5: Job Provider        | BASSE    | 10 jours   | 46j   |

**Total estimé:** ~9-10 semaines (2 développeurs)

---

## 📌 Recommandations Immédiates

### Corrections à apporter au code existant:

1. **Mot de passe minimum:**
   - Passer de 6 à 8 caractères dans `subscribe.tsx`
   - Ajouter validation force (1 majuscule, 1 chiffre, 1 spécial)
2. **ABN/TFN dans UserProfile:**
   - Renommer `siret` → `abn`
   - Renommer `tva` → `gst`
3. **Phone validation:**
   - Ajouter regex australien: `^(\+61\s?[2-9]\d{8}|04\d{2}\s?\d{3}\s?\d{3})$`
4. **Types:**
   - Aligner `UserType` avec documentation:
     - 'employee' → 'employee' ✅
     - 'worker' → 'contractor' ❌ (changer)
5. **Backend:**
   - Ajouter `user_type` dans réponse `/auth/login`
   - Ajouter `abn` dans table `companies`

---

**Document créé par:** GitHub Copilot  
**Date:** 28 janvier 2026  
**Version:** 1.0.0

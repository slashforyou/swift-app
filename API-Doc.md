# Swift App - Documentation API

## 📊 Vue d'ensemble

Cette documentation présente l'ensemble des endpoints API du serveur Swift App et leur utilisation dans l'application mobile.

- **URL de base** : `https://altivo.fr/swift-app/`
- **Port de développement** : `3021`
- **Format de réponse** : JSON
- **Authentification** : JWT tokens + Session management
- **API Version** : v1
- **Total Endpoints** : 61 endpoints
- **Test Coverage** : 100% ✅ (488 passing tests)

---

# 📋 SwiftApp API Endpoints Reference

## 🛡️ Authentication Endpoints
```http
POST /swift-app/login                  # User login
POST /swift-app/verify-mail            # Email verification
GET  /swift-app/user-info              # Get user information
GET  /swift-app/token                  # Token validation
POST /swift-app/subscribe              # Subscribe to notifications
```

## 👥 Client Management
```http
POST   /swift-app/v1/client              # Create new client
GET    /swift-app/v1/clients             # List all clients
GET    /swift-app/v1/client/:id          # Get client by ID
PATCH  /swift-app/v1/client/:id          # Update client
DELETE /swift-app/v1/client/:id          # Delete client
POST   /swift-app/v1/client/:id/archive  # Archive client
POST   /swift-app/v1/client/:id/unarchive # Unarchive client
```

## 💼 Quote Management
```http
POST   /swift-app/v1/quote               # Create new quote
GET    /swift-app/v1/quotes              # List all quotes
GET    /swift-app/v1/quote/:id           # Get quote by ID
PUT    /swift-app/v1/quote/:id           # Update quote
DELETE /swift-app/v1/quote/:id           # Delete quote
POST   /swift-app/v1/quote/:id/send      # Send quote to client
POST   /swift-app/v1/quote/:id/decision  # Client decision on quote
```

## 🚛 Job Management
```http
POST   /swift-app/v1/job                 # Create new job
GET    /swift-app/v1/jobs                # List all jobs
GET    /swift-app/v1/job/:id             # Get job by ID
PATCH  /swift-app/v1/job/:id             # Update job
DELETE /swift-app/v1/job/:id             # Delete job
POST   /swift-app/v1/job/:id/archive     # Archive job
POST   /swift-app/v1/job/:id/unarchive   # Unarchive job
POST   /swift-app/v1/job/:id/start       # Start job
POST   /swift-app/v1/job/:id/pause       # Pause job
POST   /swift-app/v1/job/:id/resume      # Resume job
POST   /swift-app/v1/job/:id/complete    # Complete job
GET    /swift-app/v1/job/:id/timeline    # Get job timeline
```

## 👷 Job Crew Management
```http
POST   /swift-app/v1/job/:id/crew        # Assign crew to job
GET    /swift-app/v1/job/:id/crew        # Get job crew
DELETE /swift-app/v1/job/:id/crew/:crewId # Remove crew from job
PATCH  /swift-app/v1/job/:id/crew/:crewId # Update crew assignment
PUT    /swift-app/v1/job/:id/crew        # Update entire crew
```

## 🚚 Job Truck Management
```http
POST   /swift-app/v1/job/:id/trucks      # Assign trucks to job
GET    /swift-app/v1/job/:id/trucks      # Get job trucks
DELETE /swift-app/v1/job/:id/trucks/:truckId # Remove truck from job
PATCH  /swift-app/v1/job/:id/trucks/:truckId # Update truck assignment
PUT    /swift-app/v1/job/:id/truck/:truckId # Update specific truck
DELETE /swift-app/v1/job/:id/truck/:truckId # Remove specific truck
```

## 📦 Job Items Management
```http
POST   /swift-app/v1/job/:jobId/item     # Add item to job
GET    /swift-app/v1/job/:jobId/items    # Get job items
GET    /swift-app/v1/job/:jobId/item/:itemId # Get specific item
PATCH  /swift-app/v1/job/:jobId/item/:itemId # Update item
DELETE /swift-app/v1/job/:jobId/item/:itemId # Delete item
POST   /swift-app/v1/job/:jobId/items    # Add multiple items to job
POST   /swift-app/v1/job/:jobId/items/import # Import items from file
POST   /swift-app/v1/job/:jobId/items/estimate-volume # Estimate volume
```

## 📦 Items Management
```http
POST   /swift-app/v1/item               # Create standalone item
GET    /swift-app/v1/items              # List all items
GET    /swift-app/v1/item/:id           # Get item by ID
PATCH  /swift-app/v1/item/:id           # Update item
DELETE /swift-app/v1/item/:id           # Delete item
```

## � Job Notes Management
```http
POST   /swift-app/v1/job/:jobId/notes    # Add note to job
GET    /swift-app/v1/job/:jobId/notes    # Get job notes
GET    /swift-app/v1/job/:jobId/notes/:noteId # Get specific note
PATCH  /swift-app/v1/job/:jobId/notes/:noteId # Update note
DELETE /swift-app/v1/job/:jobId/notes/:noteId # Delete note
POST   /swift-app/v1/note               # Create standalone note
```

## 📸 Job Photos Management
```http
POST   /swift-app/v1/job/:jobId/photos  # Upload photo to job
GET    /swift-app/v1/job/:jobId/photos  # Get job photos
DELETE /swift-app/v1/job/:jobId/photos/:photoId # Delete photo
```

## ✍️ Job Signatures Management
```http
POST   /swift-app/v1/job/:jobId/signature # Upload signature to job
GET    /swift-app/v1/job/:jobId/signatures # Get job signatures
DELETE /swift-app/v1/job/:jobId/signature/:signatureId # Delete signature
```

## 💬 Job Messages Management
```http
POST   /swift-app/v1/job/:jobId/message  # Send message for job
GET    /swift-app/v1/job/:jobId/messages # Get job messages
GET    /swift-app/v1/job/:jobId/message/:messageId # Get specific message
```

## 🏢 Company Management
```http
POST   /swift-app/v1/company            # Create new company
GET    /swift-app/v1/companies          # List all companies
GET    /swift-app/v1/company/:id        # Get company by ID
PATCH  /swift-app/v1/company/:id        # Update company
DELETE /swift-app/v1/company/:id        # Delete company
```

## 🚛 Company Trucks Management
```http
POST   /swift-app/v1/company/:companyId/trucks # Add multiple trucks
POST   /swift-app/v1/company/:companyId/truck  # Add single truck
GET    /swift-app/v1/company/:companyId/trucks # Get company trucks
GET    /swift-app/v1/company/:companyId/trucks/:truckId # Get specific truck
PATCH  /swift-app/v1/company/:companyId/trucks/:truckId # Update truck
DELETE /swift-app/v1/company/:companyId/trucks/:truckId # Delete truck
```

## 📅 Calendar Management
```http
GET    /swift-app/v1/calendar           # Get calendar overview
```

## 🔍 Testing & Health
```http
GET    /swift-app/v1/tests              # Test GET endpoint
POST   /swift-app/v1/tests              # Test POST endpoint
PUT    /swift-app/v1/tests              # Test PUT endpoint
DELETE /swift-app/v1/tests              # Test DELETE endpoint
PATCH  /swift-app/v1/tests              # Test PATCH endpoint
GET    /swift-app/health                # Health check
GET    /swift-app/monitoring            # Monitoring endpoint
```

---

## 🔐 Authentication Required
All `/swift-app/v1/*` endpoints require valid JWT authentication token in the Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

---

## 🔗 Endpoints détaillés (actuellement implémentés)

### 🧪 **Endpoints de test**

#### GET `/swift-app/get-test`
- **Description** : Test de connectivité GET
- **Paramètres** : Aucun
- **Réponse** : `{ "message": "GET request successful" }`

#### POST `/swift-app/post-test`
- **Description** : Test de connectivité POST
- **Body** : Données quelconques
- **Réponse** : `{ "message": "POST request successful", "data": req.body }`

#### PUT `/swift-app/put-test`
- **Description** : Test de connectivité PUT
- **Body** : Données quelconques
- **Réponse** : `{ "message": "PUT request successful", "data": req.body }`

#### DELETE `/swift-app/delete-test`
- **Description** : Test de connectivité DELETE
- **Paramètres** : Aucun
- **Réponse** : `{ "message": "DELETE request successful" }`

---

### 🔐 **Authentification & Inscription**

#### POST `/swift-app/subscribe`
- **Description** : Inscription d'un nouvel utilisateur
- **Fichier** : `endPoints/subscribe.js`
- **Body requis** :
  ```json
  {
    "mail": "user@example.com",
    "firstName": "John",
    "lastName": "Doe", 
    "password": "motdepasse123"
  }
  ```
- **Validations** :
  - Email valide (regex)
  - Mot de passe ≥ 8 caractères (alphanumériques + caractères spéciaux français)
  - Pas de caractères ' dans les champs
- **Process** :
  1. Vérification email unique
  2. Hash du mot de passe (SHA256)
  3. Insertion en BDD
  4. Génération code de vérification (6 chiffres)
  5. Envoi email de vérification
- **Réponse succès** :
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
- **Erreurs possibles** :
  - `400`: Paramètres manquants/invalides
  - `400`: Email déjà utilisé
  - `500`: Erreur envoi email ou BDD

#### POST `/swift-app/verifyMail`
- **Description** : Vérification du code email après inscription
- **Fichier** : `endPoints/verifyMail.js`
- **Body requis** :
  ```json
  {
    "mail": "user@example.com",
    "code": "123456"
  }
  ```
- **Validations** :
  - Email valide (regex)
  - Code à 6 chiffres exactement
  - Pas de caractères '
- **Process** :
  1. Recherche user avec email + code
  2. Suppression du code de vérification (mise à NULL)
- **Réponse succès** :
  ```json
  {
    "success": true,
    "message": "Email verified successfully"
  }
  ```
- **Erreurs possibles** :
  - `400`: Paramètres manquants/invalides
  - `401`: Email ou code incorrect
  - `500`: Erreur BDD

#### POST `/swift-app/auth/login`
- **Description** : Connexion utilisateur avec gestion des devices
- **Fichier** : `endPoints/auth/login.js`
- **Body requis** :
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
- **Process** :
  1. Vérification email/mot de passe (hash SHA256)
  2. Génération tokens (session + refresh)
  3. Gestion device (création ou mise à jour)
  4. Création session avec expiration
- **Réponse succès** :
  ```json
  {
    "status": 200,
    "success": true,
    "message": "Login successful",
    "deviceId": "device-uuid",
    "sessionToken": "session-token-hex",
    "sessionExpiry": "2025-01-01T15:30:00.000Z",
    "refreshToken": "refresh-token-hex",
    "refreshExpiry": "2025-01-08T00:30:00.000Z"
  }
  ```
- **Durées** :
  - Session : 15 minutes
  - Refresh : 7 jours
- **Erreurs possibles** :
  - `400`: Paramètres manquants
  - `401`: Email ou mot de passe incorrect

#### GET `/swift-app/auth/me`
- **Description** : Récupération des informations utilisateur connecté
- **Fichier** : `endPoints/auth/me.js`
- **Headers requis** :
  ```
  Authorization: Bearer {refresh_token}
  ```
- **Process** :
  1. Vérification du refresh token
  2. Recherche user + device associé
- **Réponse succès** :
  ```json
  {
    "status": 200,
    "user": {
      "id": 123,
      "email": "user@example.com",
      "created_at": "2025-01-01T00:00:00.000Z",
      "device": {
        "id": "device-uuid",
        "name": "iPhone de John",
        "platform": "ios"
      }
    }
  }
  ```
- **Erreurs possibles** :
  - `401`: Token manquant ou invalide

---

### 👤 **Gestion utilisateurs**

#### GET `/swift-app/userInfo`
- **Description** : Récupération d'informations utilisateur par ID
- **Fichier** : `endPoints/userInfo.js`
- **Paramètres** : `token`, `user_id`
- **Status** : ⚠️ **En développement** - fonction incomplète
- **Notes** : Logic de vérification token/user à finaliser

#### POST `/swift-app/token`
- **Description** : Génération de token (ancienne méthode)
- **Fichier** : `endPoints/token.js`
- **Status** : ⚠️ **Obsolète** - remplacé par `/auth/login`
- **Notes** : Utilise JWT au lieu du système session actuel

---

## 🔧 **Fonctions utilitaires**

### 📧 Mail Sender (`endPoints/functions/mailSender.js`)
- **Description** : Gestion de l'envoi d'emails
- **Méthodes** :
  - `verificationMail(email, code)` : Email avec code de vérification

### 🎫 Token Manager (`endPoints/functions/tokenManager.js`)
- **Description** : Gestion des tokens et sessions
- **Notes** : Utilitaires pour la gestion des tokens de session

---

## 📱 **Connexions App ↔ API**

### ✅ **Actuellement connectées dans l'App**

| Écran/Fonctionnalité | Endpoint | Fichier App | Status |
|----------------------|----------|-------------|---------|
| **Subscribe** | `POST /subscribe` | `src/screens/connectionScreens/subscribe.tsx` | ✅ **Actif** |
| **Mail Verification** | `POST /verifyMail` | `src/screens/connectionScreens/subscribeMailVerification.tsx` | ✅ **Actif** |
| **Session Check** | `GET /auth/me` | `src/utils/session.ts` | ✅ **Actif** |

### ⚠️ **Partiellement implémentées (côté App prêt)**

| Écran/Fonctionnalité | Endpoint API disponible | Fichier App | Action requise |
|----------------------|-------------------------|-------------|----------------|
| **Login** | `POST /login` | `src/utils/auth.ts` + `login.tsx` | 🔌 **Connecter** |
| **User Info** | `GET /user-info` | `src/utils/session.ts` | 🔌 **Connecter** |
| **Token Validation** | `GET /token` | `src/utils/auth.ts` | 🔌 **Connecter** |

### 🚀 **Endpoints API disponibles - À intégrer**

#### 👥 **Gestion des clients** (7 endpoints)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Créer client | `POST /v1/client` | `src/screens/JobDetailsScreens/client.tsx` | 🔥 **Haute** |
| Liste clients | `GET /v1/clients` | - | 🔥 **Haute** |
| Détails client | `GET /v1/client/:id` | `client.tsx` | 🔥 **Haute** |
| Modifier client | `PATCH /v1/client/:id` | `client.tsx` | 📍 **Moyenne** |
| Supprimer client | `DELETE /v1/client/:id` | - | 📍 **Moyenne** |
| Archiver client | `POST /v1/client/:id/archive` | - | 📍 **Basse** |
| Désarchiver client | `POST /v1/client/:id/unarchive` | - | 📍 **Basse** |

#### 🚛 **Gestion des jobs** (12 endpoints)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Créer job | `POST /v1/job` | `src/screens/jobDetails.tsx` | 🔥 **Haute** |
| Liste jobs | `GET /v1/jobs` | `src/hooks/useJobsForDay.ts` | 🔥 **Haute** |
| Détails job | `GET /v1/job/:id` | `jobDetails.tsx` | 🔥 **Haute** |
| Modifier job | `PATCH /v1/job/:id` | `jobDetails.tsx` | 🔥 **Haute** |
| Timeline job | `GET /v1/job/:id/timeline` | `src/components/ui/jobPage/jobTimeLine.tsx` | 🔥 **Haute** |
| Démarrer job | `POST /v1/job/:id/start` | - | 📍 **Moyenne** |
| Pauser job | `POST /v1/job/:id/pause` | - | 📍 **Moyenne** |
| Reprendre job | `POST /v1/job/:id/resume` | - | 📍 **Moyenne** |
| Terminer job | `POST /v1/job/:id/complete` | - | 📍 **Moyenne** |
| Archiver job | `POST /v1/job/:id/archive` | - | 📍 **Basse** |
| Désarchiver job | `POST /v1/job/:id/unarchive` | - | 📍 **Basse** |
| Supprimer job | `DELETE /v1/job/:id` | - | 📍 **Basse** |

#### 📝 **Gestion des notes** (6 endpoints)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Ajouter note | `POST /v1/job/:jobId/notes` | `src/screens/JobDetailsScreens/note.tsx` | 🔥 **Haute** |
| Liste notes job | `GET /v1/job/:jobId/notes` | `note.tsx` | 🔥 **Haute** |
| Détail note | `GET /v1/job/:jobId/notes/:noteId` | `note.tsx` | 📍 **Moyenne** |
| Modifier note | `PATCH /v1/job/:jobId/notes/:noteId` | `note.tsx` | 📍 **Moyenne** |
| Supprimer note | `DELETE /v1/job/:jobId/notes/:noteId` | `note.tsx` | 📍 **Moyenne** |
| Note autonome | `POST /v1/note` | - | 📍 **Basse** |

#### 📅 **Calendrier** (1 endpoint)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Vue calendrier | `GET /v1/calendar` | `src/screens/calendar/` (tous) | 🔥 **Haute** |

#### 💼 **Devis** (7 endpoints disponibles)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Tous les endpoints quotes | `/v1/quote/*` | - | 📍 **Future** |

#### 📦 **Items & Stock** (13 endpoints disponibles)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Tous les endpoints items | `/v1/item/*` et `/v1/job/:id/item/*` | - | 📍 **Future** |

#### 🏢 **Entreprises & Camions** (11 endpoints disponibles)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Tous les endpoints company/trucks | `/v1/company/*` | - | 📍 **Future** |

#### 👷 **Équipes & Camions Job** (11 endpoints disponibles)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Gestion équipes job | `/v1/job/:id/crew/*` | - | 📍 **Future** |
| Gestion camions job | `/v1/job/:id/truck*` | - | 📍 **Future** |

#### 📸📝 **Médias & Messages** (8 endpoints disponibles)
| Fonctionnalité | Endpoint API | Écran App correspondant | Priorité |
|----------------|-------------|------------------------|----------|
| Photos job | `/v1/job/:id/photos/*` | - | 📍 **Future** |
| Signatures job | `/v1/job/:id/signature*` | - | 📍 **Future** |
| Messages job | `/v1/job/:id/message*` | - | 📍 **Future** |

---

## 🏗️ **Architecture de connexion**

### Configuration serveur
- **Fichier** : `src/constants/ServerData.ts`
- **URL de base** : `https://altivo.fr/swift-app/`
- **API Key** : `your-api-key-here` (à configurer)

### Gestion des sessions
- **Fichier** : `src/utils/session.ts`
- **Fonctions** :
  - `fetchWithAuth()` : Fetch avec authentification automatique
  - `fetchMe()` : Vérification du token de session
  - `refreshSession()` : Renouvellement de session

### Authentification
- **Fichier** : `src/utils/auth.ts`
- **Fonctions** :
  - `login()` : Connexion utilisateur
  - `refreshToken()` : Renouvellement de token
  - `logout()` : Déconnexion

### Stockage local
- **Device info** : Nom et plateforme du device
- **Session tokens** : Stockage sécurisé des tokens
- **User data** : Informations utilisateur en cache

---

## 🚀 **Plan de développement recommandé**

### 🎯 **Phase 1 : Finaliser l'authentification** (Priorité immédiate)
1. **Connecter le Login** 
   - Modifier `src/utils/auth.ts` pour utiliser `POST /login`
   - Adapter `src/screens/connectionScreens/login.tsx`
   - Tester le flow : Login → Session → Me

2. **Finaliser les utilitaires auth**
   - Connecter `GET /user-info` et `GET /token`
   - Implémenter refresh token si disponible
   - Gestion d'erreurs unifiée

### 🎯 **Phase 2 : Fonctionnalités core business** (Priorité haute)
1. **Gestion des Jobs** (12 endpoints disponibles)
   - Connecter `GET /v1/jobs` dans `useJobsForDay.ts`
   - Implémenter création/modification dans `jobDetails.tsx`
   - Connecter timeline dans `jobTimeLine.tsx`

2. **Gestion des Clients** (7 endpoints disponibles)
   - Intégrer dans `client.tsx`
   - Liste, création, modification de clients

3. **Gestion des Notes** (6 endpoints disponibles)
   - Connecter `note.tsx` avec les endpoints notes
   - CRUD complet des notes de job

4. **Calendrier** (1 endpoint disponible)
   - Connecter `GET /v1/calendar` dans les screens calendar

### 🎯 **Phase 3 : Fonctionnalités avancées** (Priorité moyenne)
1. **États des Jobs**
   - Démarrer, pauser, reprendre, terminer
   - Gestion des statuts en temps réel

2. **Médias & Signatures**
   - Upload photos, signatures
   - Gestion des fichiers

### 🎯 **Phase 4 : Fonctionnalités étendues** (Priorité future)
1. **Système de devis** (7 endpoints)
2. **Gestion des items/stock** (13 endpoints)
3. **Entreprises et camions** (11 endpoints)
4. **Équipes et logistique** (11 endpoints)

### 🔧 **Améliorations techniques transversales**
- **JWT Authentication** : Implémenter `Authorization: Bearer <token>` sur tous les calls v1
- **Gestion d'erreurs** : Messages français/anglais, retry logic, offline mode
- **Performance** : Cache, optimisation des requêtes, pagination
- **Sécurité** : Validation côté client, chiffrement local, API key management

---

## 💡 **Recommandation immédiate**

**Commencer par la Phase 1** : Finaliser l'authentification permettra de débloquer l'accès à tous les endpoints `/v1/*` qui nécessitent le JWT Bearer token.

Une fois l'auth complète, les **jobs et clients** (Phase 2) apporteront la valeur business immédiate à l'application.

---

*Dernière mise à jour : 9 octobre 2025 - Documentation complète avec 61 endpoints*
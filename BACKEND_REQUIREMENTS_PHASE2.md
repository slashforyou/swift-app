# 🔧 Backend Requirements - Phase 2 Features

**Document généré le :** 3 Janvier 2026  
**Dernière mise à jour :** 8 Janvier 2026  
**Application :** Swift App (React Native / Expo)  
**API Base URL :** `https://altivo.fr/swift-app/`  
**Version API actuelle :** v1

---

## 📋 Résumé Exécutif

Ce document liste les **fonctionnalités frontend prêtes** qui attendent des **endpoints backend** pour être opérationnelles.

| Priorité | Fonctionnalité | Complexité Backend | Status Frontend | API Existe ? |
|----------|----------------|-------------------|-----------------|--------------|
| ✅ | Assignation Staff à Job | Faible | ✅ Prêt | ✅ `/job/:id/crew` |
| ✅ | Push Notifications | Moyenne | ✅ **INTÉGRÉ** | ✅ Terminé |
| ✅ | Upload Photo Véhicule | Faible | ✅ **INTÉGRÉ** | ✅ Terminé |
| 🔴 Haute | Gestion des Équipes | Haute | En attente | ❌ Non |
| 🟠 Moyenne | Rôles & Permissions | Haute | En attente | ❌ Non |

---

## 1. 📸 Upload Photo Véhicule (VEH-03) - ✅ TERMINÉ

### Description
Permettre aux utilisateurs de prendre ou sélectionner une photo pour un véhicule.

### Frontend Status : ✅ INTÉGRÉ
- `VehiclePhotoModal.tsx` créé
- Bouton "Photo" ajouté dans VehicleDetailsScreen
- Utilise `expo-image-picker` pour caméra/galerie
- Upload via `FormData` multipart
- **Service mis à jour :** `src/services/business/vehiclesService.ts`

### Endpoints Backend (Implémentés 8 Jan 2026)

#### Upload une image
```
POST /v1/company/{companyId}/trucks/{truckId}/image
```

#### Lister les images
```
GET /v1/company/{companyId}/trucks/{truckId}/images
```

#### Supprimer une image
```
DELETE /v1/company/{companyId}/trucks/{truckId}/images/{imageId}
```

### Frontend Service Functions
```typescript
// src/services/business/vehiclesService.ts
uploadVehiclePhoto(companyId, vehicleId, photoUri, options?)
fetchVehicleImages(companyId, vehicleId, options?)
deleteVehicleImage(companyId, vehicleId, imageId, permanent?)
```

---

## 2. 👥 Assignation Staff à Job (STAFF-01)

### Description
Assigner un employé ou prestataire à un job spécifique.

### Frontend Status : ✅ PRÊT
- `AssignStaffModal.tsx` créé avec sélection du staff
- Champ `assigned_staff_id` ajouté dans `UpdateJobRequest`
- Interface de sélection avec filtres (employés/prestataires)

### ⚠️ Vérification Requise
L'endpoint `PATCH /v1/jobs/{job_id}` est **déjà utilisé** pour d'autres champs.

**À vérifier côté backend :**
1. Est-ce que le champ `assigned_staff_id` est accepté dans le body ?
2. Est-ce que `GET /v1/jobs/{job_id}` retourne `assigned_staff_id` et `assigned_staff` ?

### Endpoint Existant à Enrichir

```
PATCH /v1/jobs/{job_id}
```

**Body actuel (fonctionne déjà) :**
```json
{
  "status": "in_progress",
  "priority": "high",
  "notes": "Updated notes"
}
```

**Body enrichi (à supporter) :**
```json
{
  "assigned_staff_id": "staff_123"
}
```

### Response Job Enrichie
S'assurer que `GET /v1/jobs/{job_id}` retourne :
```json
{
  "job": {
    "id": "job_456",
    "assigned_staff_id": "staff_123",
    "assigned_staff": {
      "id": "staff_123",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+61412345678"
    }
  }
}
```

### Complexité Backend : FAIBLE
- Ajouter colonne `assigned_staff_id` à la table jobs (si pas déjà fait)
- Accepter ce champ dans l'endpoint PATCH existant
- Joindre les données staff dans le GET

---

## 3. 🔔 Push Notifications (SETTINGS-02) - ✅ TERMINÉ

### Description
Notifications push pour alerter les utilisateurs sur :
- Nouveaux jobs assignés
- Rappels de jobs
- Messages clients
- Mises à jour de paiement

### Frontend Status : ✅ INTÉGRÉ
- Service complet créé : `src/services/pushNotifications.ts`
- Hook React : `src/hooks/usePushNotifications.ts`
- Initialisation automatique dans `App.tsx`
- Gestion des préférences utilisateur

### Endpoints Backend (Implémentés 8 Jan 2026)

#### Enregistrer Device Token
```
POST /v1/users/push-token
```

#### Supprimer Device Token (logout)
```
DELETE /v1/users/push-token
```

#### Récupérer les préférences
```
GET /v1/users/notification-preferences
```

#### Modifier les préférences
```
PATCH /v1/users/notification-preferences
```

#### Envoyer une notification (Admin)
```
POST /v1/notifications/push/send
```

### Frontend Service Functions
```typescript
// src/services/pushNotifications.ts
initializePushNotifications()
registerPushToken(token)
unregisterPushToken(token)
getNotificationPreferences()
updateNotificationPreferences(prefs)
addNotificationReceivedListener(callback)
addNotificationResponseListener(callback)
```

### Types de Notifications Supportées
| Type | Trigger | Titre | Priorité |
|------|---------|-------|----------|
| `new_job` | Job assigné au user | "Nouveau job assigné" | Haute |
| `job_reminder` | 1h avant job | "Rappel : Job dans 1h" | Haute |
| `job_updated` | Modification job | "Job mis à jour" | Moyenne |
| `payment_received` | Paiement reçu | "Paiement reçu" | Moyenne |
| `invoice_due` | Facture bientôt due | "Facture à payer" | Haute |

---

## 4. 👥 Gestion des Équipes (STAFF-02)

### Description
CRUD complet pour créer et gérer des équipes de personnel.

### Frontend Status : 🟡 EN ATTENTE
- Écran `TeamsScreen.tsx` à créer une fois API disponible

### Endpoints Requis

#### 4.1 Liste des Équipes
```
GET /v1/company/{company_id}/teams
```

**Response :**
```json
{
  "success": true,
  "teams": [
    {
      "id": "team_001",
      "name": "Équipe Sydney Nord",
      "description": "Déménagements zone nord Sydney",
      "leader_id": "staff_001",
      "leader": {
        "id": "staff_001",
        "firstName": "John",
        "lastName": "Smith"
      },
      "members": [
        {
          "id": "staff_002",
          "firstName": "Sarah",
          "lastName": "Johnson",
          "role": "mover"
        }
      ],
      "member_count": 5,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### 4.2 Créer une Équipe
```
POST /v1/company/{company_id}/teams
```

**Body :**
```json
{
  "name": "Équipe Melbourne",
  "description": "Équipe pour zone Melbourne",
  "leader_id": "staff_001",
  "member_ids": ["staff_002", "staff_003", "staff_004"]
}
```

#### 4.3 Modifier une Équipe
```
PUT /v1/company/{company_id}/teams/{team_id}
```

**Body :**
```json
{
  "name": "Équipe Melbourne CBD",
  "description": "Description mise à jour",
  "leader_id": "staff_002",
  "member_ids": ["staff_001", "staff_003", "staff_005"]
}
```

#### 4.4 Supprimer une Équipe
```
DELETE /v1/company/{company_id}/teams/{team_id}
```

#### 4.5 Assigner Équipe à un Job
```
PATCH /v1/jobs/{job_id}
```

**Body :**
```json
{
  "assigned_team_id": "team_001"
}
```

### Schéma Base de Données Suggéré

```sql
CREATE TABLE teams (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  leader_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (leader_id) REFERENCES staff(id)
);

CREATE TABLE team_members (
  team_id VARCHAR(36) NOT NULL,
  staff_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, staff_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);
```

---

## 5. 🔐 Rôles et Permissions (STAFF-03)

### Description
Système de contrôle d'accès basé sur les rôles (RBAC).

### Frontend Status : 🟡 EN ATTENTE
- UI de gestion des rôles à créer

### Rôles Suggérés

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `owner` | Propriétaire entreprise | Toutes |
| `admin` | Administrateur | Tout sauf suppression entreprise |
| `manager` | Manager | CRUD jobs, staff, véhicules |
| `supervisor` | Superviseur | Voir/modifier jobs assignés |
| `mover` | Déménageur | Voir jobs assignés, mettre à jour statut |
| `viewer` | Lecture seule | Voir uniquement |

### Endpoints Requis

#### 5.1 Liste des Rôles
```
GET /v1/company/{company_id}/roles
```

**Response :**
```json
{
  "success": true,
  "roles": [
    {
      "id": "role_admin",
      "name": "admin",
      "display_name": "Administrator",
      "permissions": ["jobs.read", "jobs.write", "jobs.delete", "staff.read", "staff.write"]
    }
  ]
}
```

#### 5.2 Assigner Rôle à un Staff
```
PATCH /v1/staff/{staff_id}/role
```

**Body :**
```json
{
  "role_id": "role_manager"
}
```

#### 5.3 Vérifier Permissions (Middleware)
Chaque endpoint devrait vérifier les permissions :
```
GET /v1/users/me/permissions
```

**Response :**
```json
{
  "success": true,
  "permissions": [
    "jobs.read",
    "jobs.write",
    "staff.read",
    "vehicles.read",
    "vehicles.write"
  ]
}
```

### Matrice de Permissions

| Permission | Owner | Admin | Manager | Supervisor | Mover |
|------------|-------|-------|---------|------------|-------|
| jobs.read | ✅ | ✅ | ✅ | ✅ (assignés) | ✅ (assignés) |
| jobs.write | ✅ | ✅ | ✅ | ✅ (assignés) | ❌ |
| jobs.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff.read | ✅ | ✅ | ✅ | ✅ | ❌ |
| staff.write | ✅ | ✅ | ❌ | ❌ | ❌ |
| vehicles.read | ✅ | ✅ | ✅ | ✅ | ❌ |
| vehicles.write | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.write | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| settings.write | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 6. 📊 Endpoints Existants - Statut de Vérification

> **🔍 Vérifié via API Discovery le 3 Janvier 2026**
> Endpoint: `GET /swift-app/v1/api/discover/summary`

### ✅ Endpoints FONCTIONNELS (confirmés par API Discovery)

| Endpoint | Méthode | Status | Catégorie |
|----------|---------|--------|-----------|
| `/v1/job/:jobId/image` | POST | ✅ Existe | Upload photo job |
| `/v1/jobs` | GET | ✅ Existe | Jobs Management |
| `/v1/job/:id` | GET/PATCH/DELETE | ✅ Existe | CRUD job |
| `/v1/job/:id/crew` | GET/POST | ✅ **EXISTE !** | Staff sur job |
| `/v1/job/:id/crew/:crewId` | PATCH/DELETE | ✅ Existe | Gérer crew |
| `/v1/job/:id/trucks` | GET/POST | ✅ Existe | Véhicules sur job |
| `/v1/staff` | GET | ✅ Existe | Liste staff |
| `/v1/staff/:id` | GET | ✅ Existe | Détails staff |
| `/v1/staff/invite` | POST | ✅ Existe | Inviter staff |
| `/v1/staff/contractors` | POST | ✅ Existe | Ajouter contractor |
| `/v1/vehicles` | GET/POST | ✅ Existe | CRUD véhicules |
| `/v1/vehicles/:id` | GET/PUT/DELETE | ✅ Existe | CRUD véhicule |
| `/v1/company/:companyId/trucks` | GET/POST | ✅ Existe | Trucks company |
| `/v1/notifications` | GET/POST | ✅ Existe | Notifications |
| `/v1/notifications/:id` | PATCH/DELETE | ✅ Existe | CRUD notification |

### 🎉 BONNE NOUVELLE - Crew Management EXISTE !

L'API Discovery révèle que **l'assignation staff existe déjà** via `/job/:id/crew` :
- `POST /v1/job/:id/crew` → Assigner staff à un job
- `GET /v1/job/:id/crew` → Liste staff assignés
- `DELETE /v1/job/:id/crew/:crewId` → Retirer staff
- `PATCH /v1/job/:id/crew/:crewId` → Modifier assignation

**→ STAFF-01 peut utiliser ces endpoints au lieu de `assigned_staff_id` !**

### ⚠️ Endpoints à VÉRIFIER (format réponse)

| Endpoint | Question |
|----------|----------|
| `POST /v1/job/:id/crew` | Quel format body ? `{ staff_id: "..." }` ? |
| `GET /v1/job/:id/crew` | Format réponse ? Liste de staff objects ? |
| `/v1/notifications` | Contient push tokens ou juste in-app ? |

### 🔴 Endpoints MANQUANTS (à CRÉER)

| Endpoint | Description | Priorité | Notes |
|----------|-------------|----------|-------|
| `POST /v1/company/:id/trucks/:id/photo` | Upload photo véhicule | 🟠 Moyenne | Pattern = /job/:id/image |
| `POST /v1/users/push-token` | Enregistrer device token | 🔴 Haute | Pour Expo Push |
| `PATCH /v1/users/notification-preferences` | Préférences push | 🔴 Haute | Avec push-token |
| `GET/POST/PUT/DELETE /v1/company/:id/teams` | CRUD équipes | 🟡 Basse | Feature Phase 2 |
| `GET /v1/company/:id/roles` | Liste rôles | 🟡 Basse | RBAC Phase 2 |
| `PATCH /v1/staff/:id/role` | Assigner rôle | 🟡 Basse | RBAC Phase 2 |

### Référence des Services Frontend

```
src/services/jobPhotos.ts      → Upload photos jobs
src/services/jobs.ts           → CRUD jobs
src/services/staff/staffService.ts → Gestion staff
src/services/business/vehiclesService.ts → Gestion véhicules
src/services/StripeService.ts  → Intégration Stripe
```

---

## 7. 🗓️ Priorités Recommandées

### 🟢 Sprint Immédiat (Quelques heures)
**Vérifications simples :**
1. ✅ **Vérifier `assigned_staff_id`** dans PATCH /jobs - Peut-être déjà supporté
2. ✅ **Créer endpoint image véhicule** - Copier pattern de /job/{id}/image

### 🟡 Sprint Court (1-2 semaines)
3. 🔔 **Push Notifications** - Impact utilisateur élevé, service Expo Push simple

### 🟠 Sprint Moyen (2-4 semaines)  
4. 👥 **Gestion Équipes** - CRUD complet, tables DB à créer

### 🔴 Long Terme (1-2 mois)
5. 🔐 **Rôles & Permissions** - RBAC complet, middleware à implémenter

---

## 8. 📞 Contact & Questions

Pour toute question sur l'intégration frontend :
- Les fichiers frontend sont dans `src/services/` et `src/hooks/`
- Les types TypeScript sont dans `src/types/`
- Tester avec l'app Expo sur device réel recommandé

**Points d'attention :**
- Toujours retourner `{ success: true/false }` dans les réponses
- Inclure des messages d'erreur explicites
- Supporter la pagination pour les listes (page, per_page)
- Retourner les objets imbriqués (ex: staff assigné dans job)

---

*Document généré automatiquement - Swift App Frontend Team*

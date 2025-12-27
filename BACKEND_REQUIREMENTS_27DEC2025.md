# 📋 Backend Requirements - Swift App

> **Date :** 27 Décembre 2025  
> **De :** Équipe Frontend  
> **Pour :** Équipe Backend  
> **Statut :** En attente d'implémentation

---

## 🎯 Résumé

L'application mobile Swift-App a besoin des endpoints suivants pour fonctionner complètement. Actuellement, le frontend gère ces cas avec des fallbacks locaux, mais pour une application en production, ces endpoints sont nécessaires.

**Base URL :** `https://altivo.fr/swift-app/v1`

---

## 🔴 Endpoints Priorité HAUTE

### 1. Logs Frontend

| Propriété | Valeur |
|-----------|--------|
| **Méthode** | `POST` |
| **Endpoint** | `/swift-app/v1/logs` |
| **Description** | Réception des logs du frontend pour monitoring et debugging |
| **Statut actuel** | ❌ Non implémenté (404) |

**Body attendu :**
```json
{
  "level": "ERROR" | "WARN" | "INFO" | "DEBUG",
  "message": "Description du log",
  "timestamp": "2025-12-27T10:30:00.000Z",
  "context": {
    "screen": "HomeScreen",
    "user_id": "123",
    "company_id": "456"
  },
  "error": {
    "name": "NetworkError",
    "message": "Failed to fetch",
    "stack": "..."
  }
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "log_id": "log_abc123"
}
```

---

### 2. Analytics Events

| Propriété | Valeur |
|-----------|--------|
| **Méthode** | `POST` |
| **Endpoint** | `/swift-app/v1/analytics/events` |
| **Description** | Collecte des événements analytics utilisateurs |
| **Statut actuel** | ❌ Non implémenté (404) |

**Body attendu :**
```json
{
  "events": [
    {
      "event_type": "job_started",
      "event_category": "business",
      "event_data": {
        "job_id": "JOB-DEC-001",
        "step": 1
      },
      "user_id": "123",
      "company_id": "456",
      "timestamp": "2025-12-27T10:30:00.000Z"
    }
  ]
}
```

**Types d'événements courants :**
- `job_started`, `job_completed`, `job_step_advanced`
- `payment_initiated`, `payment_completed`, `payment_failed`
- `screen_view`, `button_click`
- `error_occurred`, `api_call`

**Réponse attendue :**
```json
{
  "success": true,
  "events_received": 5,
  "batch_id": "batch_xyz789"
}
```

---

## 🟡 Endpoints Priorité MOYENNE

### 3. Job Step Management

Ces endpoints existent partiellement. Vérification nécessaire :

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `POST` | `/job/{id}/advance-step` | Avancer à l'étape suivante | ⚠️ À vérifier |
| `GET` | `/job/{id}/step` | Récupérer l'étape actuelle | ⚠️ À vérifier |
| `GET` | `/jobs/{id}/steps` | Liste des étapes du job | ⚠️ À vérifier |
| `POST` | `/job/{id}/complete` | Marquer le job terminé | ⚠️ À vérifier |

**Body pour `/job/{id}/advance-step` :**
```json
{
  "current_step": 2,
  "notes": "Étape 2 terminée - chargement effectué"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "job_id": 123,
    "current_step": 2,
    "updated_at": "2025-12-27T10:30:00.000Z"
  }
}
```

---

### 4. Vehicles API (CRUD)

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `GET` | `/vehicles` | Liste des véhicules | ⚠️ À vérifier |
| `POST` | `/vehicles` | Créer un véhicule | ⚠️ À vérifier |
| `PUT` | `/vehicles/{id}` | Modifier un véhicule | ⚠️ À vérifier |
| `DELETE` | `/vehicles/{id}` | Supprimer un véhicule | ⚠️ À vérifier |

**Body pour `POST /vehicles` :**
```json
{
  "registration": "ABC-123",
  "make": "Toyota",
  "model": "HiAce",
  "year": 2022,
  "type": "van",
  "status": "available",
  "capacity": "1.5t",
  "next_service_date": "2026-06-15",
  "depot_location": "Sydney"
}
```

---

## 🟢 Endpoints Priorité BASSE

### 5. Staff Management

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `GET` | `/staff` | Liste du personnel | ⚠️ À vérifier |
| `POST` | `/staff/invite` | Inviter un employé | ⚠️ À vérifier |
| `POST` | `/staff/contractors` | Ajouter un sous-traitant | ⚠️ À vérifier |

---

## 📝 Notes Techniques

### Authentification
Tous les endpoints doivent supporter l'authentification via header :
```
Authorization: Bearer {jwt_token}
```

### Format des réponses
Format standardisé pour toutes les réponses :

**Succès :**
```json
{
  "success": true,
  "data": { ... }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Description de l'erreur",
  "error_code": "INVALID_REQUEST"
}
```

### Codes HTTP attendus
- `200` : Succès
- `201` : Ressource créée
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

---

## 🔧 Impact Frontend

### Avec les endpoints implémentés :
- ✅ Monitoring des erreurs en production
- ✅ Analytics pour mesurer l'utilisation
- ✅ Synchronisation temps réel des jobs
- ✅ Gestion complète du parc véhicules

### Sans les endpoints (état actuel) :
- ⚠️ Logs perdus après fermeture de l'app
- ⚠️ Pas d'analytics utilisateur
- ⚠️ Données locales uniquement pour véhicules
- ⚠️ Fallbacks silencieux (pas de crash)

---

## 📞 Contact

Pour toute question sur les spécifications, contacter l'équipe frontend.

---

*Document généré le 27 Décembre 2025*

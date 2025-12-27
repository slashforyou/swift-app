# 📋 Backend Requirements - Swift App

> **Date :** 27 Décembre 2025  
> **De :** Équipe Frontend  
> **Pour :** Équipe Backend  
> **Statut :** ✅ TOUS LES ENDPOINTS IMPLÉMENTÉS

---

## 🎯 Résumé

| Catégorie | État |
|-----------|------|
| **Logs Frontend** | ✅ Implémenté & Testé |
| **Analytics Events** | ✅ Implémenté & Testé |
| **Job Steps** | ✅ Implémenté & Testé |
| **Vehicles** | ✅ Implémenté & Testé |
| **Staff Management** | ✅ Implémenté & Testé |

**Base URL :** `https://altivo.fr/swift-app/v1`

---

## ✅ Endpoints Disponibles

### 1. Logs Frontend ✅

| Propriété | Valeur |
|-----------|--------|
| **Méthode** | `POST` |
| **Endpoint** | `/swift-app/v1/logs` |
| **Description** | Réception des logs du frontend pour monitoring et debugging |
| **Statut** | ✅ **Implémenté & Testé** |

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

### 2. Analytics Events ✅

| Propriété | Valeur |
|-----------|--------|
| **Méthode** | `POST` |
| **Endpoint** | `/swift-app/v1/analytics/events` |
| **Description** | Collecte des événements analytics utilisateurs |
| **Statut** | ✅ **Implémenté & Testé** |

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

## ✅ Endpoints Priorité MOYENNE (Implémentés)

### 3. Job Step Management ✅

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `POST` | `/job/{id}/advance-step` | Avancer à l'étape suivante | ✅ OK |
| `GET` | `/job/{id}/step` | Récupérer l'étape actuelle | ✅ OK |
| `GET` | `/jobs/{id}/steps` | Liste des étapes du job | ✅ OK |
| `POST` | `/job/{id}/complete` | Marquer le job terminé | ✅ OK |
| `GET` | `/job-steps/definitions` | Définitions statiques | ✅ OK |

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

### 4. Vehicles API (CRUD) ✅

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `GET` | `/vehicles` | Liste des véhicules | ✅ OK |
| `POST` | `/vehicles` | Créer un véhicule | ✅ OK |
| `GET` | `/vehicles/{id}` | Récupérer un véhicule | ✅ OK |
| `PUT` | `/vehicles/{id}` | Modifier un véhicule | ✅ OK |
| `DELETE` | `/vehicles/{id}` | Supprimer un véhicule | ✅ OK |

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

**Champs optionnels suggérés (non-bloquants) :**
```json
{
  "mileage": 45000,
  "purchase_date": "2022-03-15",
  "last_service": "2025-06-15"
}
```
> Ces champs sont utilisés dans le frontend mais pas encore implémentés côté API.
> Le frontend utilise des valeurs par défaut en attendant.

---

## ✅ Endpoints Priorité BASSE (Implémentés)

### 5. Staff Management ✅

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|--------|
| `GET` | `/staff` | Liste du personnel | ✅ OK |
| `GET` | `/staff/{id}` | Détails d'un membre | ✅ OK |
| `POST` | `/staff/invite` | Inviter un employé | ✅ OK |
| `POST` | `/staff/contractors` | Ajouter un sous-traitant | ✅ OK |
| `DELETE` | `/staff/contractors/{id}` | Supprimer un sous-traitant | ✅ OK |

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

### ✅ Tous les endpoints implémentés :
- ✅ Monitoring des erreurs en production
- ✅ Analytics pour mesurer l'utilisation
- ✅ Synchronisation temps réel des jobs
- ✅ Gestion complète du parc véhicules
- ✅ Gestion du personnel et sous-traitants

### 🔄 Prochaine étape Frontend :
- Vérifier l'intégration des services avec les nouveaux endpoints
- Supprimer les fallbacks locaux si nécessaire
- Tester en conditions réelles

---

## 📞 Contact

Pour toute question sur les spécifications, contacter l'équipe frontend.

---

*Document généré le 27 Décembre 2025*

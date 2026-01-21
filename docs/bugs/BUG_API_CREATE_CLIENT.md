# 🐛 Rapport de Bug API - Création de Client

**Date :** 18 Janvier 2026  
**Priorité :** 🔴 Haute (bloque le flow de création de job)  
**Environnement :** Development  
**Testeur :** Test automatisé ADB

---

## 📋 Résumé du Problème

L'endpoint `POST /swift-app/v1/client` retourne une erreur lors de la création d'un nouveau client depuis l'application mobile. L'erreur "Failed to create client" est affichée à l'utilisateur.

---

## 🔍 Détails Techniques

### Endpoint concerné

```
POST https://altivo.fr/swift-app/v1/client
```

### Headers envoyés

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload envoyé (Body)

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@test.com",
  "phone": "0612345678",
  "company": ""
}
```

### Réponse attendue (Success - 200/201)

```json
{
  "client": {
    "id": "client-xxx",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@test.com",
    "phone": "0612345678",
    "company": "",
    "createdAt": "2026-01-18T10:00:00Z",
    "updatedAt": "2026-01-18T10:00:00Z"
  }
}
```

### Réponse reçue (Error)

```json
{
  "message": "Failed to create client"
}
// ou erreur HTTP sans body détaillé
```

---

## 📱 Code Frontend (pour référence)

### Service Client (`src/services/clients.ts`)

```typescript
export async function createClient(
  clientData: CreateClientRequest,
): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(clientData),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to create client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to create client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}
```

### Interface TypeScript

```typescript
interface CreateClientRequest {
  firstName: string; // Requis
  lastName: string; // Requis
  email: string; // Requis
  phone: string; // Requis
  address?: {
    // Optionnel
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  company?: string; // Optionnel
  notes?: string; // Optionnel
}
```

---

## 🔎 Points à Vérifier Côté Backend

### 1. L'endpoint existe-t-il ?

```bash
curl -X POST https://altivo.fr/swift-app/v1/client \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","phone":"0600000000"}'
```

### 2. Authentification

- [ ] Le token JWT est-il valide ?
- [ ] L'utilisateur a-t-il les droits de créer un client ?
- [ ] Le token contient-il les claims nécessaires (user_id, business_id) ?

### 3. Validation des données

- [ ] Le format de l'email est-il validé correctement ?
- [ ] Le format du téléphone est-il attendu en international (+61...) ou local ?
- [ ] Le champ `company` vide ("") pose-t-il problème ? (devrait être null ou omis ?)

### 4. Base de données

- [ ] La table `clients` existe-t-elle ?
- [ ] Y a-t-il des contraintes d'unicité sur l'email ?
- [ ] L'utilisateur authentifié est-il lié à un business valide ?

### 5. Logs serveur

Vérifier les logs pour cette requête :

```
[2026-01-18 XX:XX:XX] POST /swift-app/v1/client - Status: ???
```

---

## 🧪 Étapes de Reproduction

1. Lancer l'app Swift sur mobile
2. Aller sur l'écran Home
3. Taper sur "Today" pour aller sur Jobs
4. Taper sur le bouton "+" (FAB) pour créer un job
5. Taper sur "Add Client"
6. Remplir le formulaire :
   - First Name: Jean
   - Last Name: Dupont
   - Email: jean.dupont@test.com
   - Phone: 0612345678
7. Taper sur "Create Client"
8. **Résultat :** Modal d'erreur "Failed to create client"

---

## 📊 Statut des Autres Endpoints Clients

| Endpoint         | Méthode | URL                        | Statut        |
| ---------------- | ------- | -------------------------- | ------------- |
| Liste clients    | GET     | `/v1/clients`              | ❓ À tester   |
| Détails client   | GET     | `/v1/client/:id`           | ❓ À tester   |
| Créer client     | POST    | `/v1/client`               | ❌ **ÉCHOUE** |
| Modifier client  | PATCH   | `/v1/client/:id`           | ❓ À tester   |
| Supprimer client | DELETE  | `/v1/client/:id`           | ❓ À tester   |
| Archiver         | POST    | `/v1/client/:id/archive`   | ❓ À tester   |
| Désarchiver      | POST    | `/v1/client/:id/unarchive` | ❓ À tester   |

---

## ✅ Actions Requises

1. **Vérifier que l'endpoint POST /v1/client est bien implémenté**
2. **Retourner un message d'erreur détaillé** (pas juste "Failed to create client")
   ```json
   {
     "error": true,
     "code": "VALIDATION_ERROR",
     "message": "Invalid phone format",
     "details": {
       "field": "phone",
       "expected": "+61XXXXXXXXX"
     }
   }
   ```
3. **Confirmer le format attendu pour le téléphone** (local ou international ?)
4. **Vérifier l'authentification** - le token est-il valide et contient-il les claims nécessaires ?

---

## 📞 Contact

Pour plus d'informations, contacter l'équipe frontend.

**Script de test utilisé :** `scripts/job-test.ps1`  
**Logs de test :** Voir le terminal VS Code

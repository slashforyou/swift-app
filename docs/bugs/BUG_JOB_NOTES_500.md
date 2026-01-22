# ✅ RÉSOLU: Impossible de créer une note sur un job (500 Internal Server Error)

## ✅ Résolu le 22 janvier 2026

### Cause du problème

La colonne `note_type` était définie comme `TINYINT(4)` (entier) alors que le frontend envoyait une string `"important"`.

### Corrections backend appliquées

| Fichier | Correction |
|---------|------------|
| Base de données | `ALTER TABLE job_notes MODIFY COLUMN note_type ENUM('general', 'important', 'client', 'internal') DEFAULT 'general'` |
| `listNotes.js` | Accepte maintenant ID numérique (25) ou code job (JOB-PIERRE-...) |
| `getNoteById.js` | Corrigé pour utiliser `req.params.noteId` + connexion DB |
| `updateNoteById.js` | Corrigé pour utiliser `req.params.noteId` + connexion DB + update dynamique |

### Corrections frontend appliquées

| Fichier | Correction |
|---------|------------|
| `jobNotes.ts` | Routes mises à jour: `/notes/:id` → `/job/:jobId/notes/:noteId` |
| `useJobNotes.ts` | `updateNote` prend maintenant `jobId` en paramètre |
| Tests | Mis à jour pour refléter la nouvelle signature |

### Endpoints disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/swift-app/v1/job/:jobId/notes` | Créer une note |
| GET | `/swift-app/v1/job/:jobId/notes` | Lister les notes d'un job |
| GET | `/swift-app/v1/job/:jobId/notes/:noteId` | Récupérer une note |
| PATCH | `/swift-app/v1/job/:jobId/notes/:noteId` | Modifier une note |
| DELETE | `/swift-app/v1/job/:jobId/notes/:noteId` | Supprimer une note |

### Payload accepté (POST/PATCH)

```json
{
  "title": "string (requis pour POST)",
  "content": "string (optionnel)",
  "note_type": "general|important|client|internal (défaut: general)",
  "created_by": "number|string (optionnel, déduit du token si absent)"
}
```

---

## Historique du bug (pour référence)

## Symptôme

Lors de la création d'une note depuis l'application mobile, le serveur retourne une erreur 500.

---

## Requête envoyée par le frontend

```http
POST /swift-app/v1/job/25/notes
Content-Type: application/json
Authorization: Bearer <token>
```

```json
{
  "title": "Titre",
  "content": "La note",
  "note_type": "important",
  "created_by": "15"
}
```

---

## Réponse du serveur

```http
HTTP/1.1 500 Internal Server Error
```

```json
{
  "success": false,
  "error": "Erreur interne du serveur lors de la création de la note"
}
```

---

## Logs frontend

```
📤 [jobNotes] Sending note to API: {"jobId": 25, "payload": {"content": "La note", "created_by": "15", "note_type": "important", "title": "Titre"}}
❌ [jobNotes] API error: 500 {"error": "Erreur interne du serveur lors de la création de la note", "success": false}
```

---

## Questions pour le backend

### 1. L'endpoint existe-t-il ?

- Route attendue: `POST /swift-app/v1/job/:jobId/notes`
- Si non, quel est l'endpoint correct pour créer une note ?

### 2. Quel est le format attendu du payload ?

Voici ce que nous envoyons actuellement :

| Champ        | Type   | Valeur exemple | Requis ? |
|--------------|--------|----------------|----------|
| `title`      | string | `"Titre"`      | ?        |
| `content`    | string | `"La note"`    | ?        |
| `note_type`  | string | `"important"`  | ?        |
| `created_by` | string | `"15"`         | ?        |

**Questions spécifiques :**

- `created_by` doit-il être un **integer** au lieu d'une string ?
- `created_by` doit-il être **omis** (déduit du token JWT) ?
- `note_type` accepte quelles valeurs ? (`general`, `important`, `client`, `internal` ?)
- Y a-t-il d'autres champs requis ?

### 3. La table `job_notes` existe-t-elle ?

Si l'erreur 500 vient d'une contrainte de base de données :

- La table `job_notes` existe-t-elle ?
- Quelle est sa structure (colonnes, types, contraintes) ?
- Y a-t-il des clés étrangères vers `jobs` et `users` ?

### 4. Le job 25 existe-t-il ?

- Le job avec `id=25` existe-t-il dans la base ?
- Appartient-il à la même company que l'utilisateur authentifié ?

### 5. L'utilisateur 15 existe-t-il ?

- L'utilisateur avec `id=15` existe-t-il ?
- A-t-il les permissions pour créer des notes ?

---

## Demande

Si l'endpoint n'existe pas ou si la table `job_notes` n'existe pas, merci de :

1. **Créer la table** `job_notes` avec la structure suivante (suggestion) :

```sql
CREATE TABLE job_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  note_type ENUM('general', 'important', 'client', 'internal') DEFAULT 'general',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

2. **Créer l'endpoint** `POST /swift-app/v1/job/:jobId/notes` qui :
   - Accepte `{ title, content, note_type, created_by? }`
   - Déduit `created_by` du token si non fourni
   - Retourne la note créée avec son `id`

3. **Créer les endpoints associés** :
   - `GET /swift-app/v1/job/:jobId/notes` - Liste les notes d'un job
   - `GET /swift-app/v1/notes/:id` - Récupère une note par son ID
   - `PATCH /swift-app/v1/notes/:id` - Met à jour une note
   - `DELETE /swift-app/v1/job/:jobId/notes/:noteId` - Supprime une note

---

## Exemple de réponse attendue

### POST /job/:jobId/notes (création)

```json
{
  "success": true,
  "note": {
    "id": 1,
    "job_id": 25,
    "title": "Titre",
    "content": "La note",
    "note_type": "important",
    "created_by": 15,
    "created_at": "2026-01-22T10:00:00.000Z",
    "updated_at": "2026-01-22T10:00:00.000Z"
  }
}
```

### GET /job/:jobId/notes (liste)

```json
{
  "success": true,
  "notes": [
    {
      "id": 1,
      "job_id": 25,
      "title": "Titre",
      "content": "La note",
      "note_type": "important",
      "created_by": 15,
      "created_at": "2026-01-22T10:00:00.000Z",
      "updated_at": "2026-01-22T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## Code frontend actuel

Fichier: `src/services/jobNotes.ts`

```typescript
export async function addJobNote(jobId: string, noteData: CreateJobNoteRequest): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();
  
  const payload: Record<string, any> = {
    title: noteData.title,
    content: noteData.content,
    note_type: noteData.note_type || 'general',
  };
  
  // Ajouter created_by seulement s'il est fourni et valide
  if (noteData.created_by && noteData.created_by !== 'current-user') {
    payload.created_by = noteData.created_by;
  }
  
  const res = await fetch(`${API}v1/job/${jobId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  // ...
}
```

---

## Priorité

🔴 **Haute** - Cette fonctionnalité est utilisée pour documenter les jobs en cours.

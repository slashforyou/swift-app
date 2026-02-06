# Backend - Système de statut de lecture pour les notes

## 📋 Contexte

L'application mobile Swift nécessite un système de notifications pour les notes des jobs. L'objectif est d'afficher un badge numérique sur l'onglet "Notes" dans le menu de navigation pour indiquer le nombre de notes non lues.

**Version API cible** : v1.1.0+  
**Date** : 25 janvier 2026

---

## 🎯 Objectif

Permettre au frontend de :


1. Savoir quelles notes ont été lues par l'utilisateur connecté
2. Calculer le nombre de notes non lues par job
3. Marquer des notes comme lues (individuellement ou en masse)
4. Synchroniser l'état de lecture entre appareils

---

## 🗄️ Modifications de la base de données

### Table : `job_notes_read_status` (nouvelle)

Créer une table de liaison pour tracker quelles notes ont été lues par quels utilisateurs.

```sql
CREATE TABLE job_notes_read_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (note_id) REFERENCES job_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_note_user (note_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_note_id (note_id),
    INDEX idx_read_at (read_at)
);
```


**Pourquoi une table séparée ?**

- ✅ Une note peut être lue par plusieurs utilisateurs (multi-user support)
- ✅ Historique de lecture (timestamp `read_at`)
- ✅ Pas de modification de la structure existante `job_notes`
- ✅ Performances optimisées avec indexes

---

## 🔌 Endpoints API

### 1. GET `/swift-app/v1/job/:jobId/notes` (Modifier)

**Modification** : Ajouter le champ `is_read` dans chaque note retournée.


#### Requête

```http
GET /swift-app/v1/job/12345/notes?limit=50&offset=0
Authorization: Bearer <session_token>

```

#### Réponse (modifiée)

```json
{
  "success": true,
  "notes": [
    {
      "id": 789,
      "job_id": 12345,
      "title": "Problème client",
      "content": "Le client demande un changement...",
      "note_type": "important",
      "created_by": 42,
      "created_by_first_name": "John",
      "created_by_last_name": "Doe",
      "created_by_email": "john@example.com",
      "created_at": "2026-01-25T10:30:00Z",
      "updated_at": "2026-01-25T10:30:00Z",
      "is_read": false // ← NOUVEAU CHAMP
    },
    {
      "id": 788,
      "job_id": 12345,
      "title": "Note ancienne",
      "content": "Déjà consultée",
      "note_type": "general",
      "created_by": 42,
      "created_by_first_name": "John",
      "created_by_last_name": "Doe",
      "created_by_email": "john@example.com",
      "created_at": "2026-01-20T14:20:00Z",
      "updated_at": "2026-01-20T14:20:00Z",
      "is_read": true // ← NOUVEAU CHAMP
    }
  ],
  "total": 2,
  "unread_count": 1 // ← NOUVEAU CHAMP (optionnel mais utile)

}
```

#### Logique backend

```sql
SELECT
    jn.*,
    u.first_name AS created_by_first_name,
    u.last_name AS created_by_last_name,
    u.email AS created_by_email,
    CASE WHEN jnrs.id IS NOT NULL THEN 1 ELSE 0 END AS is_read
FROM job_notes jn
LEFT JOIN users u ON jn.created_by = u.id
LEFT JOIN job_notes_read_status jnrs
    ON jn.id = jnrs.note_id
    AND jnrs.user_id = :current_user_id
WHERE jn.job_id = :job_id
ORDER BY jn.created_at DESC
LIMIT :limit OFFSET :offset;
```

---


### 2. POST `/swift-app/v1/job/:jobId/notes/:noteId/read` (Nouveau)

**Action** : Marquer une note spécifique comme lue.

#### Requête

```http

POST /swift-app/v1/job/12345/notes/789/read
Authorization: Bearer <session_token>
Content-Type: application/json
```


Body (optionnel, peut être vide) :

```json
{}
```

#### Réponse

```json
{

  "success": true,
  "message": "Note marked as read",
  "note_id": 789,
  "read_at": "2026-01-25T15:45:30Z"
}
```

#### Logique backend

```sql
INSERT INTO job_notes_read_status (note_id, user_id, read_at)
VALUES (:note_id, :current_user_id, NOW())
ON DUPLICATE KEY UPDATE read_at = NOW();
```


**Sécurité** : Vérifier que l'utilisateur a accès au job avant de marquer comme lu.

---

### 3. POST `/swift-app/v1/job/:jobId/notes/read-all` (Nouveau)

**Action** : Marquer toutes les notes d'un job comme lues (bulk operation).


#### Requête

```http
POST /swift-app/v1/job/12345/notes/read-all
Authorization: Bearer <session_token>
Content-Type: application/json
```


Body (optionnel) :

```json
{
  "note_ids": [789, 788, 787] // Optionnel : liste spécifique d'IDs
}
```

Si `note_ids` absent : marquer **toutes** les notes du job comme lues.


#### Réponse

```json
{
  "success": true,
  "message": "All notes marked as read",
  "marked_count": 15,
  "job_id": 12345
}
```

#### Logique backend

```sql
-- Si note_ids fourni :
INSERT INTO job_notes_read_status (note_id, user_id, read_at)
SELECT id, :current_user_id, NOW()
FROM job_notes
WHERE job_id = :job_id AND id IN (:note_ids)
ON DUPLICATE KEY UPDATE read_at = NOW();

-- Si pas de note_ids (toutes les notes) :
INSERT INTO job_notes_read_status (note_id, user_id, read_at)

SELECT id, :current_user_id, NOW()
FROM job_notes
WHERE job_id = :job_id
ON DUPLICATE KEY UPDATE read_at = NOW();
```


---

### 4. GET `/swift-app/v1/job/:jobId/notes/unread-count` (Nouveau - optionnel)

**Action** : Récupérer uniquement le compteur de notes non lues (endpoint léger pour le badge).

#### Requête

```http

GET /swift-app/v1/job/12345/notes/unread-count
Authorization: Bearer <session_token>
```

#### Réponse

```json
{
  "success": true,
  "job_id": 12345,
  "unread_count": 5
}
```

#### Logique backend

```sql
SELECT COUNT(*) AS unread_count
FROM job_notes jn
LEFT JOIN job_notes_read_status jnrs
    ON jn.id = jnrs.note_id
    AND jnrs.user_id = :current_user_id
WHERE jn.job_id = :job_id
    AND jnrs.id IS NULL;  -- Pas de ligne = non lu
```

---

## 🔒 Sécurité et permissions

### Vérifications obligatoires

Pour **tous** les endpoints :

1. **Authentication** : Session token valide
2. **Authorization** : L'utilisateur a accès au job (membre de la compagnie, permissions)

3. **Ownership** : Vérifier que le job existe et appartient à la compagnie de l'utilisateur

```php
// Pseudo-code de vérification
function canAccessJob($userId, $jobId) {
    $job = Job::find($jobId);
    if (!$job) return false;

    $user = User::find($userId);
    return $user->company_id === $job->company_id;
}
```

### Logs d'audit (optionnel)

Envisager de logger les actions de lecture pour analytics :

- Quand une note est marquée comme lue
- Combien de temps entre création et première lecture
- Taux de lecture par type de note

---

## 📊 Performances

### Indexes recommandés

```sql
-- Sur job_notes_read_status
CREATE INDEX idx_user_note ON job_notes_read_status(user_id, note_id);
CREATE INDEX idx_note_user ON job_notes_read_status(note_id, user_id);
CREATE INDEX idx_read_at ON job_notes_read_status(read_at);

-- Sur job_notes (si pas déjà présents)

CREATE INDEX idx_job_id ON job_notes(job_id);
CREATE INDEX idx_created_at ON job_notes(created_at);
```

### Cache

- Envisager de cacher `unread_count` par utilisateur + job (Redis)

- Invalider le cache lors de :
  - Création d'une nouvelle note
  - Marquage d'une note comme lue
  - Suppression d'une note


---

## 🧪 Tests à effectuer

### Tests unitaires

- [ ] Marquer une note comme lue (une fois)
- [ ] Marquer une note déjà lue (idempotence)
- [ ] Marquer toutes les notes d'un job
- [ ] Calcul correct du `unread_count`
- [ ] Permissions : utilisateur sans accès au job

### Tests d'intégration

- [ ] GET notes avec `is_read` correct pour 2 utilisateurs différents
- [ ] Création d'une note → apparaît comme non lue pour tous
- [ ] Suppression d'une note → suppression en cascade du read_status

### Tests de charge

- [ ] GET notes avec 1000+ notes (pagination)
- [ ] Bulk mark as read avec 500 notes
- [ ] Performance des JOINs sur grandes tables

---

## 🚀 Migration

### Script de migration (SQL)

```sql
-- Migration UP : Création de la table
CREATE TABLE IF NOT EXISTS job_notes_read_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (note_id) REFERENCES job_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_note_user (note_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_note_id (note_id),
    INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Migration DOWN : Rollback
DROP TABLE IF EXISTS job_notes_read_status;
```

### Stratégie de déploiement

1. **Phase 1** : Créer la table `job_notes_read_status` (compatible avec ancien code)
2. **Phase 2** : Modifier l'endpoint GET `/notes` pour ajouter `is_read`

3. **Phase 3** : Ajouter les nouveaux endpoints POST `/read` et `/read-all`
4. **Phase 4** : Frontend update pour utiliser les nouveaux champs

✅ Déploiement sans downtime (backward compatible)

---



## 📱 Utilisation côté frontend

### Séquence typique

1. **Chargement de la page JobDetails**

   ```
   GET /job/12345/notes
   → Récupère notes avec is_read
   → Calcule unread_count localement
   → Affiche badge sur l'icône Notes
   ```

2. **Utilisateur clique sur l'onglet Notes**

   ```
   POST /job/12345/notes/read-all
   → Marque toutes les notes comme lues
   → Badge disparaît

   ```

3. **Alternative : Lecture individuelle**
   ```
   Utilisateur ouvre une note spécifique
   → POST /job/12345/notes/789/read
   → Décrémenter unread_count localement
   ```

---

## 🔄 Compatibilité

### Rétrocompatibilité

- ✅ Si le frontend ne gère pas `is_read`, il fonctionne toujours (ignore le champ)
- ✅ Les anciens clients continuent de fonctionner sans le badge
- ✅ Pas de breaking change sur les endpoints existants

### Versioning API

Si nécessaire, documenter dans les headers :

```
X-API-Version: 1.1.0
X-Feature-Flags: notes_read_status
```


---

## 📝 Notes de développement
<romaingiovanni@gmail.com>
### Points d'attention<romaingiovanni@gmail.com>

1. **Bulk operations** : Optimiser pour éviter N+1 queries
2. **Transactions** : Utiliser des transactions pour les opérations critiques
3. **Timestamps** : Toujours UTC en base de données
4. **Soft deletes** : Si les notes sont soft-deleted, adapter les queries

### Améliorations futures


- [ ] Push notifications quand une nouvelle note est créée
- [ ] Différencier "lu" vs "vu" (tracking plus granulaire)
- [ ] Statistiques de lecture par note (combien d'utilisateurs ont lu)
- [ ] Filtrage par notes non lues : `GET /notes?unread=true`

---

## 🆘 Support


Pour toute question technique, contacter l'équipe mobile avec :

- Ce document
- Les logs d'erreur éventuels
- Version de l'API backend actuelle

**Développeur mobile** : Romain Giovanni (romaingiovanni@gmail.com)  
**Date de création** : 25 janvier 2026  
**Dernière mise à jour** : 25 janvier 2026

---


## ✅ Statut d'intégration

### Backend ✅ **IMPLÉMENTÉ**

- ✅ Table `job_notes_read_status` créée
- ✅ Endpoint GET `/notes` modifié (retourne `is_read` et `unread_count`)
- ✅ Endpoint POST `/notes/read-all` implémenté
- ✅ Endpoint POST `/notes/:noteId/read` implémenté

- ✅ Tests validés par l'équipe backend

**Status** : Backend fonctionnel et prêt pour la production.

### Frontend (Mobile) ✅ **PRÊT**

- ✅ Interface `JobNoteAPI` mise à jour (`is_read?: boolean`)
- ✅ Service `fetchJobNotes()` retourne `{ notes, total, unread_count }`

- ✅ Fonctions `markNoteAsRead()` et `markAllNotesAsRead()` ajoutées
- ✅ Hook `useJobNotes` expose `unreadCount` et `markAllAsRead()`
- ✅ Badge numérique affiché sur l'icône Notes dans JobMenu (0-9, puis "9+")

- ✅ Indicateurs visuels : badge "NON LU" + point bleu sur notes non lues
- ✅ Appel automatique de `markAllAsRead()` quand l'utilisateur ouvre l'onglet Notes
- ✅ Gestion gracieuse du 404 : marquage local en attendant l'API backend
- ✅ Aucune erreur TypeScript

### Fichiers modifiés (Frontend)

1. [src/services/jobNotes.ts](../src/services/jobNotes.ts) - Ajout `is_read`, `markNoteAsRead()`, `markAllNotesAsRead()` avec logs
2. [src/hooks/useJobNotes.ts](../src/hooks/useJobNotes.ts) - Gestion `unreadCount` et fonctions mark-as-read avec fallback 404
3. [src/components/jobMenu.tsx](../src/components/jobMenu.tsx) - Badge numérique sur l'onglet Notes
4. [src/screens/jobDetails.tsx](../src/screens/jobDetails.tsx) - Intégration avec appel automatique au clic sur l'onglet
5. [src/screens/JobDetailsScreens/note.tsx](../src/screens/JobDetailsScreens/note.tsx) - Auto-marquage au chargement + indicateurs visuels
6. [src/localization/translations/fr.ts](../src/localization/translations/fr.ts) - Traduction "NON LU"
7. [src/localization/translations/en.ts](../src/localization/translations/en.ts) - Traduction "UNREAD"

### 🔍 Tests effectués (25 janvier 2026 - 17h50)

- ✅ Badge s'affiche correctement avec le nombre de notes non lues
- ✅ Badge disparaît quand l'utilisateur ouvre l'onglet Notes
- ✅ Indicateurs visuels fonctionnent (badge "NON LU" + point bleu)
- ✅ Endpoint `POST /swift-app/v1/job/:jobId/notes/read-all` implémenté et fonctionnel
- ✅ Synchronisation serveur opérationnelle
- ✅ Les notes restent marquées comme lues après rechargement de l'application

### 🎉 Système complet et opérationnel

**Statut** : Le système de notifications pour les notes est **100% fonctionnel** côté frontend ET backend.

**Fonctionnalités validées** :

- ✅ Affichage du badge avec compteur de notes non lues (0-9, puis "9+")
- ✅ Marquage automatique comme lu lors de l'ouverture de l'onglet Notes
- ✅ Synchronisation serveur : les notes restent lues entre les sessions
- ✅ Multi-utilisateur : chaque utilisateur a son propre statut de lecture
- ✅ Indicateurs visuels : badge "NON LU" + point bleu sur les notes non lues
- ✅ Performance optimisée avec indexes

**Prêt pour la production** 🚀✨

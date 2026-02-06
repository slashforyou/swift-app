# Test Manuel DELETE Note

## Token à utiliser

```
Bearer ed08bfcc5e368...
```

(Récupérez le token complet depuis SecureStore ou les logs)

## Test avec curl

### 1. Créer une note (fonctionne)

```bash
curl -X POST "https://altivo.fr/swift-app/v1/job/29/notes" \
  -H "Authorization: Bearer ed08bfcc5e368..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","note_type":"general"}'
```

### 2. Supprimer la note (échoue avec 401)

```bash
curl -X DELETE "https://altivo.fr/swift-app/v1/job/29/notes/32" \
  -H "Authorization: Bearer ed08bfcc5e368..." \
  -H "Content-Type: application/json" \
  -v
```

### 3. Comparer les headers envoyés

Avec `-v`, curl affichera les headers. Vérifiez si :

- Le header `Authorization` est bien envoyé
- Le format est identique entre POST et DELETE
- Il n'y a pas de redirection (301/302)

## Vérifications backend

### Dans `server/routes/notes.js` (ou équivalent)

```javascript
// Route POST (fonctionne)
router.post("/job/:jobId/notes", authenticateToken, createNote);

// Route DELETE (échoue) - Vérifier si authenticateToken est présent
router.delete("/job/:jobId/notes/:noteId", authenticateToken, deleteNote);
```

### Dans le middleware `authenticateToken`

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("🔐 Auth middleware:", {
    method: req.method,
    url: req.originalUrl,
    hasAuthHeader: !!authHeader,
    tokenPreview: token?.substring(0, 20),
  });

  // ... validation du token
}
```

## Résultats attendus

Si curl fonctionne mais pas l'app :

- Problème dans l'app (headers, fetch, etc.)

Si curl échoue aussi :

- Problème backend sur la route DELETE spécifiquement
- Le middleware d'auth n'est pas appliqué
- Ou il y a un bug dans sa logique

# 🐛 TOKEN REFRESH ERROR 400 - 7 NOVEMBRE 2025

## 🔴 **PROBLÈME**

Le refresh du token échoue avec une erreur **400 Bad Request**.

### Logs d'erreur
```
LOG  🔍 [TOKEN REFRESH] Step 2: Refresh token exists: true
LOG  🔍 [TOKEN REFRESH] Step 3: Refresh token found, length: 128
LOG  🔍 [TOKEN REFRESH] Step 4: Making refresh API call to: https://altivo.fr/swift-app/auth/refresh
LOG  🔍 [TOKEN REFRESH] Step 5: API response received - Status: 400 OK: false
LOG  🔍 [TOKEN REFRESH] ❌ Step 6: Token refresh FAILED - Status: 400
ERROR ❌ Token refresh failed: 400
LOG  🔍 [AUTH FETCH] Step 7: Token refresh result: false
LOG  🔍 [AUTH FETCH] ❌ Step 8: Refresh FAILED - SESSION EXPIRED
LOG  ❌ Token refresh failed, clearing session
ERROR ❌ Error loading user profile: [Error: SESSION_EXPIRED]
LOG  ConnectionScreen mounted, checking session...
```

---

## 🔍 **ANALYSE**

### Endpoint appelé
```
POST https://altivo.fr/swift-app/auth/refresh
```

### Body envoyé
```json
{
  "refreshToken": "c5ef8925f93269246b9a..." // 128 caractères
}
```

### Headers envoyés
```json
{
  "Content-Type": "application/json",
  "x-client": "mobile"
}
```

### Réponse
- **Status** : 400 Bad Request
- **Body** : ??? (À logger)

---

## ❓ **QUESTIONS À VÉRIFIER**

### 1. **Modifications récentes**
- ✅ **NON** : Aucune modification sur `auth.ts` pour la signature
- ✅ **NON** : Les modifications récentes concernent uniquement la signature (`signature_blob`)
- ❓ **À VÉRIFIER** : Est-ce que le backend a changé l'API `/auth/refresh` ?

### 2. **Format de la requête**
Le code actuel envoie :
```typescript
body: JSON.stringify({ 
  refreshToken: refreshToken 
})
```

**Questions** :
- ❓ Le backend attend-il `refreshToken` ou `refresh_token` ?
- ❓ Le backend attend-il d'autres champs (ex: `device`, `x-client`) ?
- ❓ Le refresh token est-il expiré côté backend ?

### 3. **Réponse de l'API**
**URGENT** : Ajouter un log pour voir le body de l'erreur 400 :
```typescript
if (!res.ok) {
  const errorBody = await res.text();
  console.log('🔍 [TOKEN REFRESH] Error response body:', errorBody);
  // ...
}
```

---

## 🔧 **CORRECTIONS APPLIQUÉES**

### 1. **Ajout de logs détaillés pour l'erreur 400**

**Fichier** : `src/utils/auth.ts` (ligne ~103)

```typescript
if (!res.ok) {
  console.log('🔍 [TOKEN REFRESH] ❌ Step 6: Token refresh FAILED - Status:', res.status);
  
  // ✅ Lire le body de l'erreur pour debug
  try {
    const errorBody = await res.text();
    console.log('🔍 [TOKEN REFRESH] Error response body:', errorBody);
    
    try {
      const errorJson = JSON.parse(errorBody);
      console.log('🔍 [TOKEN REFRESH] Error JSON parsed:', errorJson);
    } catch {
      console.log('🔍 [TOKEN REFRESH] Error body is not JSON');
    }
  } catch (e) {
    console.log('🔍 [TOKEN REFRESH] Could not read error body:', e);
  }
  
  console.error('❌ Token refresh failed:', res.status);
  return false;
}
```

---

## 🎯 **PROCHAINES ÉTAPES**

### Étape 1 : Lancer l'app et reproduire l'erreur
1. Ouvrir l'app
2. Attendre que le token expire (ou forcer l'expiration)
3. **Regarder les nouveaux logs** pour voir le body de l'erreur

### Étape 2 : Analyser la réponse de l'API
Chercher dans les logs :
```
🔍 [TOKEN REFRESH] Error response body: ...
🔍 [TOKEN REFRESH] Error JSON parsed: ...
```

### Étape 3 : Identifier la cause

#### **Cas 1 : Token expiré**
```json
{
  "error": "refresh_token_expired",
  "message": "Refresh token has expired"
}
```
➡️ **Solution** : Forcer une reconnexion (logout)

#### **Cas 2 : Format invalide**
```json
{
  "error": "invalid_request",
  "message": "Missing or invalid refresh token"
}
```
➡️ **Solution** : Vérifier le format du body ou le nom du champ

#### **Cas 3 : Token révoqué**
```json
{
  "error": "token_revoked",
  "message": "Refresh token has been revoked"
}
```
➡️ **Solution** : Forcer une reconnexion

#### **Cas 4 : Champ manquant**
```json
{
  "error": "missing_field",
  "message": "Field 'device' is required"
}
```
➡️ **Solution** : Ajouter le champ manquant dans le body

---

## 🔄 **COMPARAISON LOGIN vs REFRESH**

### Login (fonctionne ✅)
```typescript
// POST /auth/login
body: JSON.stringify({ 
    mail, 
    password, 
    device,                    // ⬅️ Contient device
    wantRefreshInBody: true    // ⬅️ Demande refresh token
})
```

### Refresh (échoue ❌)
```typescript
// POST /auth/refresh
body: JSON.stringify({ 
    refreshToken: refreshToken  // ⬅️ Seulement refreshToken
})
```

**Question** : Le backend attend-il aussi `device` dans `/auth/refresh` ?

---

## 🧪 **TEST MANUEL API**

Pour tester directement l'API :

```bash
# 1. Récupérer le refresh token depuis l'app
# Ajouter un log temporaire :
console.log('REFRESH TOKEN:', refreshToken);

# 2. Tester avec cURL
curl -X POST https://altivo.fr/swift-app/auth/refresh \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -d '{
    "refreshToken": "LE_REFRESH_TOKEN_ICI"
  }' \
  -v
```

Regarder :
- ✅ Status code (200 OK ou 400 Bad Request)
- ✅ Body de la réponse
- ✅ Headers de la réponse

---

## 📝 **CHECKLIST DEBUGGING**

- [x] ✅ Logs ajoutés pour voir le body de l'erreur 400
- [ ] 🔄 Relancer l'app et reproduire l'erreur
- [ ] 🔄 Lire les nouveaux logs avec le body de l'erreur
- [ ] 🔄 Identifier la cause exacte (token expiré, format invalide, etc.)
- [ ] 🔄 Appliquer la correction selon la cause
- [ ] 🔄 Tester à nouveau

---

## 💡 **SOLUTIONS POSSIBLES**

### Solution 1 : Ajouter `device` dans le refresh
```typescript
const device = await collectDevicePayload();
const res = await fetch(`${API}auth/refresh`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "x-client": "mobile" 
  },
  body: JSON.stringify({ 
    refreshToken: refreshToken,
    device: device  // ⬅️ AJOUT
  })
});
```

### Solution 2 : Changer le nom du champ
```typescript
body: JSON.stringify({ 
  refresh_token: refreshToken  // ⬅️ Au lieu de refreshToken
})
```

### Solution 3 : Forcer logout si refresh échoue
```typescript
if (!res.ok) {
  console.error('❌ Token refresh failed, logging out...');
  await clearSession();
  // Rediriger vers ConnectionScreen
  throw new Error('SESSION_EXPIRED');
}
```

---

## 📊 **STATUT**

- **Date** : 7 novembre 2025 - 16h30
- **Statut** : 🔄 EN COURS DE DEBUG
- **Bloquant** : ❌ OUI - Les utilisateurs ne peuvent pas rester connectés
- **Priorité** : 🔴 CRITIQUE

---

## 🎯 **ACTION IMMÉDIATE**

1. **Relancer l'app**
2. **Reproduire l'erreur**
3. **Regarder les logs** pour voir le body de l'erreur :
   ```
   🔍 [TOKEN REFRESH] Error response body: ...
   ```
4. **Partager le message d'erreur complet** pour identifier la cause

---

**Dernière mise à jour** : 7 novembre 2025 - 16h30

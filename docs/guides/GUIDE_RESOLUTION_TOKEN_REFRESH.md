# 🔧 GUIDE DE RÉSOLUTION - TOKEN REFRESH 400

## 🎯 **OBJECTIF**
Identifier et corriger le bug Token Refresh qui déconnecte les utilisateurs.

---

## 📋 **ÉTAPE 1 : TEST & DIAGNOSTIC** (EN COURS)

### **A. Préparer l'environnement**

1. **Lancer l'app en mode développement**
   ```bash
   npm start
   # ou
   npx expo start
   ```

2. **Ouvrir les DevTools pour voir les logs**
   - Chrome DevTools : `Ctrl+Shift+J` (Windows) ou `Cmd+Option+J` (Mac)
   - Ou regarder le terminal où Expo est lancé

### **B. Reproduire l'erreur**

#### **Option 1 : Attendre l'expiration naturelle** ⏰
- Se connecter à l'app
- Attendre ~30 minutes (durée typique d'un token)
- Essayer d'effectuer une action (charger un job, etc.)
- Observer les logs

#### **Option 2 : Forcer l'expiration** ⚡ (RECOMMANDÉ)
```typescript
// TEMPORAIRE - À ajouter dans src/utils/auth.ts pour test

export async function forceTokenExpiration() {
  // Récupérer le refresh token actuel
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  console.log('🧪 [TEST] Current refresh token:', refreshToken?.substring(0, 20) + '...');
  
  // Tester le refresh immédiatement
  const result = await refreshToken();
  console.log('🧪 [TEST] Refresh result:', result);
}

// Puis appeler cette fonction depuis un bouton ou au démarrage
```

#### **Option 3 : Modifier manuellement le token** 🔧
```typescript
// TEMPORAIRE - Remplacer le token par un token invalide
import * as SecureStore from 'expo-secure-store';

// Dans un useEffect ou bouton de test
await SecureStore.setItemAsync("session_token", "EXPIRED_TOKEN");
// Puis essayer une requête API
```

### **C. Capturer les logs**

Chercher dans les logs :
```
🔍 [TOKEN REFRESH] === STARTING TOKEN REFRESH ===
🔍 [TOKEN REFRESH] Step 5: API response received - Status: 400
🔍 [TOKEN REFRESH] Error response body: {...}  ⬅️ IMPORTANT
🔍 [TOKEN REFRESH] Error JSON parsed: {...}    ⬅️ IMPORTANT
```

### **D. Partager les informations**

Copier et partager :
1. Le **body de l'erreur** complet
2. Le **status code**
3. Les **headers** si disponibles

---

## 🔍 **ÉTAPE 2 : ANALYSE** (SELON LE RÉSULTAT)

### **CAS A : Token expiré/révoqué** 🕐
```json
{
  "error": "refresh_token_expired",
  "message": "Refresh token has expired"
}
```
ou
```json
{
  "error": "token_revoked",
  "message": "Token has been revoked"
}
```

**Solution** : Gérer gracieusement l'expiration
```typescript
// src/utils/auth.ts
if (!res.ok) {
  const errorBody = await res.text();
  const errorJson = JSON.parse(errorBody);
  
  if (errorJson.error === 'refresh_token_expired' || 
      errorJson.error === 'token_revoked') {
    console.log('🔄 Token expired, clearing session...');
    await clearSession();
    // Rediriger vers login
    return false;
  }
}
```

---

### **CAS B : Format de requête invalide** 📋
```json
{
  "error": "invalid_request",
  "message": "Expected 'refresh_token' but got 'refreshToken'"
}
```
ou
```json
{
  "error": "bad_request",
  "message": "Missing required field: device"
}
```

**Solution 1** : Changer le nom du champ
```typescript
// AVANT
body: JSON.stringify({ 
  refreshToken: refreshToken 
})

// APRÈS
body: JSON.stringify({ 
  refresh_token: refreshToken  // snake_case au lieu de camelCase
})
```

**Solution 2** : Ajouter le champ device
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

---

### **CAS C : Endpoint changé** 🔄
```json
{
  "error": "not_found",
  "message": "Endpoint not found"
}
```

**Solution** : Vérifier avec le backend
- L'endpoint est-il toujours `/auth/refresh` ?
- Le méthode est-elle toujours POST ?
- Y a-t-il une nouvelle version d'API (`/v1/auth/refresh`) ?

---

### **CAS D : Headers manquants** 📨
```json
{
  "error": "unauthorized",
  "message": "Missing x-client header"
}
```

**Solution** : Ajouter les headers manquants
```typescript
headers: { 
  "Content-Type": "application/json", 
  "x-client": "mobile",
  "Authorization": `Bearer ${currentSessionToken}` // Si nécessaire
}
```

---

## 🔧 **ÉTAPE 3 : CORRECTION** (À DÉTERMINER)

### **Template de correction**

```typescript
// src/utils/auth.ts - Fonction refreshToken()

export async function refreshToken(): Promise<boolean> {
  try {
    console.log('🔍 [TOKEN REFRESH] === STARTING TOKEN REFRESH ===');
    
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    
    if (!refreshToken) {
      console.log('⚠️ [TOKEN REFRESH] No refresh token available');
      return false;
    }

    console.log('🔍 [TOKEN REFRESH] Refresh token found, length:', refreshToken.length);
    
    // ✅ CORRECTION À APPLIQUER ICI SELON LE CAS
    const requestBody = {
      // CAS B1: Changer le nom
      refresh_token: refreshToken, // Au lieu de refreshToken
      
      // CAS B2: Ajouter device si nécessaire
      // device: await collectDevicePayload(),
    };
    
    console.log('🔍 [TOKEN REFRESH] Request body:', requestBody);
    
    const res = await fetch(`${API}auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-client": "mobile"
        // CAS D: Ajouter headers si nécessaire
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🔍 [TOKEN REFRESH] Response - Status:', res.status, 'OK:', res.ok);

    if (!res.ok) {
      const errorBody = await res.text();
      console.log('🔍 [TOKEN REFRESH] Error response body:', errorBody);
      
      try {
        const errorJson = JSON.parse(errorBody);
        console.log('🔍 [TOKEN REFRESH] Error JSON parsed:', errorJson);
        
        // CAS A: Gérer l'expiration
        if (errorJson.error === 'refresh_token_expired' || 
            errorJson.error === 'token_revoked') {
          console.log('🔄 Token expired/revoked, clearing session...');
          await clearSession();
          throw new Error('SESSION_EXPIRED');
        }
      } catch (parseError) {
        console.log('🔍 [TOKEN REFRESH] Error body is not JSON');
      }
      
      console.error('❌ Token refresh failed:', res.status);
      return false;
    }

    const json = await res.json();
    console.log('✅ Token refresh response:', json);
    
    const { sessionToken, refreshToken: newRefreshToken, success } = json;

    if (!sessionToken || !success) {
      console.error('❌ Invalid refresh response');
      return false;
    }

    // Sauvegarder les nouveaux tokens
    await SecureStore.setItemAsync("session_token", sessionToken);
    
    if (newRefreshToken) {
      await SecureStore.setItemAsync("refresh_token", newRefreshToken);
    }

    console.log('✅ Token refresh completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
}
```

---

## 🧪 **ÉTAPE 4 : TESTS**

### **A. Test unitaire du refresh**

```typescript
// Ajouter temporairement un bouton de test
<Pressable onPress={async () => {
  console.log('🧪 Testing token refresh...');
  const result = await refreshToken();
  console.log('🧪 Refresh result:', result);
  Alert.alert('Test Result', `Refresh ${result ? 'SUCCESS' : 'FAILED'}`);
}}>
  <Text>Test Token Refresh</Text>
</Pressable>
```

### **B. Test du cycle complet**

1. ✅ Se connecter
2. ✅ Utiliser l'app normalement
3. ✅ Attendre l'expiration (ou forcer)
4. ✅ Effectuer une action nécessitant authentification
5. ✅ Vérifier que le refresh fonctionne
6. ✅ Vérifier que l'action réussit après refresh

### **C. Test des cas d'erreur**

1. ❌ Token complètement invalide → Doit rediriger vers login
2. ❌ Token expiré → Doit rediriger vers login
3. ❌ Pas de refresh token → Doit rediriger vers login

---

## 📊 **CHECKLIST DE RÉSOLUTION**

### **Phase 1 : Diagnostic**
- [x] ✅ Logs ajoutés pour capturer l'erreur
- [ ] 🔄 App relancée
- [ ] 🔄 Erreur reproduite
- [ ] 🔄 Body d'erreur capturé
- [ ] 🔄 Cause identifiée

### **Phase 2 : Correction**
- [ ] ⏳ Solution choisie selon la cause
- [ ] ⏳ Code modifié
- [ ] ⏳ Tests unitaires ajoutés
- [ ] ⏳ Documentation mise à jour

### **Phase 3 : Validation**
- [ ] ⏳ Tests manuels passés
- [ ] ⏳ Cycle complet validé
- [ ] ⏳ Cas d'erreur gérés
- [ ] ⏳ Déploiement effectué

---

## 💡 **SOLUTIONS RAPIDES SELON LE CAS**

| Erreur API | Correction | Fichier | Ligne |
|------------|-----------|---------|-------|
| `refresh_token` attendu | Changer `refreshToken` → `refresh_token` | `auth.ts` | ~97 |
| `device` requis | Ajouter `device: await collectDevicePayload()` | `auth.ts` | ~97 |
| Token expiré | Ajouter gestion d'erreur + clearSession | `auth.ts` | ~104 |
| Headers manquants | Ajouter headers requis | `auth.ts` | ~92 |

---

## 📞 **PROCHAINES ACTIONS**

1. **MAINTENANT** : Relancer l'app et reproduire l'erreur
2. **ENSUITE** : Copier le body de l'erreur 400
3. **PUIS** : Identifier le cas (A, B, C ou D)
4. **ENFIN** : Appliquer la correction correspondante

---

**Dernière mise à jour** : 8 novembre 2025 - 09h00  
**Statut** : 🔄 EN COURS - En attente du diagnostic

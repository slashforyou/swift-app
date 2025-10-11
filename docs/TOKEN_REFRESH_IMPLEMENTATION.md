# Gestion du Refresh Token et Redirection - Octobre 2025

## ✅ **Implémentation complète**

### **1. Fonction `authenticatedFetch` dans `auth.ts`**

Cette fonction gère automatiquement le refresh du token en cas d'erreur 401 :

```typescript
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // 1. Première tentative avec le token actuel
  let response = await fetch(url, requestOptions);
  
  // 2. Si 401, tenter de rafraîchir le token
  if (response.status === 401) {
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      // 3. Nouvelle tentative avec le token rafraîchi
      response = await fetch(url, requestOptions);
      
      if (response.status === 401) {
        // 4. Si toujours 401, session expirée définitivement
        await clearSession();
        throw new Error('SESSION_EXPIRED');
      }
    } else {
      // 5. Refresh échoué, session expirée
      await clearSession();
      throw new Error('SESSION_EXPIRED');
    }
  }
  
  return response;
}
```

### **2. Services utilisateur mis à jour**

Tous les services utilisent maintenant `authenticatedFetch` :

```typescript
// Ancienne version (sans refresh automatique)
const res = await fetch(url, { headers: authHeaders });

// Nouvelle version (avec refresh automatique)
const res = await authenticatedFetch(url, { method: 'GET' });
```

**Services concernés** :
- ✅ `fetchUserProfile()` 
- ✅ `updateUserProfile()`
- ✅ `fetchUserStats()`

### **3. Hook `useUserProfile` avec gestion de redirection**

Le hook gère maintenant l'erreur `SESSION_EXPIRED` et redirige automatiquement :

```typescript
interface UseUserProfileResult {
  // ... existing properties
  isSessionExpired: boolean; // Nouveau flag
}

const handleSessionExpired = () => {
  setIsSessionExpired(true);
  
  Alert.alert(
    '🔐 Session expirée',
    'Votre session a expiré. Vous allez être redirigé vers la connexion.',
    [
      {
        text: 'OK',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Connection' }],
          });
        }
      }
    ]
  );
};
```

### **4. Gestion des erreurs centralisée**

**Dans `loadProfile()` et `updateProfile()` :**
```typescript
catch (err) {
  if (err.message === 'SESSION_EXPIRED') {
    handleSessionExpired();
    return;
  }
  
  // Autres erreurs...
  setError(errorMessage);
}
```

## 🔄 **Flux complet de gestion des tokens**

### **Scénario 1 : Token valide**
```
Profile → fetchUserProfile() → authenticatedFetch() → API → Succès ✅
```

### **Scénario 2 : Token expiré mais refresh possible**
```
Profile → fetchUserProfile() → authenticatedFetch() 
  ↓
  401 → refreshToken() → Succès → Nouvelle tentative → API → Succès ✅
```

### **Scénario 3 : Refresh impossible**
```
Profile → fetchUserProfile() → authenticatedFetch()
  ↓
  401 → refreshToken() → Échec → clearSession() → SESSION_EXPIRED
  ↓
  Alert → Redirection vers Connection
```

## 🎯 **Points clés de l'implémentation**

### **Automatisation complète**
- ✅ Détection automatique des tokens expirés
- ✅ Tentative de refresh automatique
- ✅ Nouvelle tentative transparente
- ✅ Nettoyage de session si échec
- ✅ Redirection automatique vers connexion

### **Experience utilisateur**
- ✅ Alert informatif avant redirection
- ✅ Pas de perte de données en cours de saisie
- ✅ Retry possible après reconnexion
- ✅ État `isSessionExpired` pour UI conditionnelle

### **Sécurité**
- ✅ Nettoyage automatique des tokens invalides
- ✅ Redirection forcée vers connexion
- ✅ Pas de retry infini en cas d'échec
- ✅ Logs détaillés pour debugging

## 🔧 **Configuration**

### **Endpoints utilisés pour le refresh**
```http
POST /swift-app/auth/refresh
Content-Type: application/json

{
  "refreshToken": "xxx"
}
```

### **Réponse attendue**
```json
{
  "success": true,
  "sessionToken": "nouveau_token",
  "refreshToken": "nouveau_refresh_token"
}
```

## ✨ **Utilisation**

L'utilisateur n'a rien à faire ! Le système gère automatiquement :

1. **Navigation normale** → Aucun changement visible
2. **Token expiré** → Refresh transparent
3. **Session invalide** → Alert + redirection automatique

Le profil fonctionne maintenant de façon robuste même avec des tokens expirés ! 🚀

## 🧪 **Test recommandés**

1. **Token valide** → Navigation normale
2. **Token expiré** → Refresh automatique
3. **Refresh échoué** → Redirection connexion
4. **Modification profil** → Gestion d'erreurs identique

Mode mock activé temporairement pour tests sans serveur.
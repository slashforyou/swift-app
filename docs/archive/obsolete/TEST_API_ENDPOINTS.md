# 🔍 TEST API - ENDPOINT JOB DETAILS

## 🎯 **OBJECTIF**
Tester différentes URLs pour l'endpoint job details et trouver celle qui fonctionne.

---

## 📋 **INFORMATIONS**

### **Job à tester**
- **ID** : `6`
- **CODE** : `JOB-NERD-URGENT-006`

### **Base URL**
```
https://altivo.fr/swift-app/
```

### **Token (à remplacer)**
Utilisez le token de session actuel de l'app.
Dans les logs, cherchez :
```
🔐 Session token found, length: 128
🔐 Token preview: 5f87028f4da292de821b...
```

---

## 🧪 **TESTS À EFFECTUER**

### **Test 1 : Avec CODE + /job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/job/JOB-NERD-URGENT-006/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 2 : Avec ID + /job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/job/6/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 3 : Avec CODE + /v1/job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/JOB-NERD-URGENT-006/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 4 : Avec ID + /v1/job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/6/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 5 : Avec CODE + /jobs/...** (pluriel)
```bash
curl -X GET "https://altivo.fr/swift-app/jobs/JOB-NERD-URGENT-006" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 6 : Avec ID + /jobs/...** (pluriel)
```bash
curl -X GET "https://altivo.fr/swift-app/jobs/6" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 7 : Avec CODE + /api/job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/api/job/JOB-NERD-URGENT-006/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

### **Test 8 : Avec ID + /api/job/.../full**
```bash
curl -X GET "https://altivo.fr/swift-app/api/job/6/full" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

---

## 📊 **TABLEAU DE RÉSULTATS**

| Test | URL | Status | Résultat |
|------|-----|--------|----------|
| 1 | `/job/JOB-NERD-URGENT-006/full` | ❌ 404 | Testé |
| 2 | `/job/6/full` | ? | À tester |
| 3 | `/v1/job/JOB-NERD-URGENT-006/full` | ? | À tester |
| 4 | `/v1/job/6/full` | ❌ 404 | Testé |
| 5 | `/jobs/JOB-NERD-URGENT-006` | ? | À tester |
| 6 | `/jobs/6` | ? | À tester |
| 7 | `/api/job/JOB-NERD-URGENT-006/full` | ? | À tester |
| 8 | `/api/job/6/full` | ? | À tester |

---

## 🔍 **COMMENT OBTENIR LE TOKEN**

### **Méthode 1 : Depuis les logs de l'app**
1. Ouvrir l'app
2. Regarder les logs
3. Chercher : `🔐 Token preview: 5f87028f4da292de821b...`
4. Le token complet fait 128 caractères

### **Méthode 2 : Ajouter un log temporaire**
Ajoutez dans `src/utils/auth.ts` :

```typescript
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const st = await SecureStore.getItemAsync("session_token");
  
  if (st) {
    console.log('🔐 Session token found, length:', st.length);
    console.log('🔐 Token preview:', st.substring(0, 20) + '...');
    console.log('🧪 [DEBUG] FULL TOKEN:', st); // ⬅️ AJOUTER TEMPORAIREMENT
    return { Authorization: `Bearer ${st}` };
  }
  // ...
}
```

---

## 💡 **ANALYSE DES RÉSULTATS**

### **Si 200 OK** ✅
L'endpoint fonctionne ! Utiliser cette URL dans le code.

### **Si 404 Not Found** ❌
L'endpoint n'existe pas. Essayer une autre URL.

### **Si 401 Unauthorized** 🔐
Le token est invalide ou expiré. Récupérer un nouveau token.

### **Si 500 Internal Server Error** 💥
Erreur serveur. Vérifier les paramètres ou contacter le backend.

---

## 🎯 **ENDPOINTS À VÉRIFIER AUSSI**

### **Endpoint qui FONCTIONNE déjà** ✅
```
POST https://altivo.fr/swift-app/calendar-days
```
Cet endpoint fonctionne, donc le serveur est accessible.

### **Comparaison**
- ✅ `/calendar-days` (fonctionne)
- ❌ `/job/JOB-NERD-URGENT-006/full` (404)
- ❌ `/v1/job/6/full` (404)
- ? `/jobs/...` (à tester)

---

## 🔧 **ALTERNATIVE : UTILISER LES DONNÉES DU CALENDRIER**

Si AUCUN endpoint `/job/.../full` ne fonctionne, on peut :

1. **Utiliser uniquement les données du calendrier**
   - L'endpoint `/calendar-days` retourne déjà beaucoup d'infos
   - Voir si ça suffit pour afficher les détails du job

2. **Vérifier s'il y a un endpoint /jobs (pluriel)**
   ```bash
   curl -X GET "https://altivo.fr/swift-app/jobs" \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Contacter le backend**
   - Demander quel est l'endpoint correct pour les détails d'un job

---

## 📝 **INSTRUCTIONS POUR TESTER**

### **Étape 1 : Récupérer le token**
Lancer l'app et copier le token complet depuis les logs.

### **Étape 2 : Remplacer VOTRE_TOKEN_ICI**
Dans chaque commande curl, remplacer `VOTRE_TOKEN_ICI` par le token réel.

### **Étape 3 : Exécuter les commandes**
Tester les 8 URLs une par une dans PowerShell ou Git Bash.

### **Étape 4 : Noter les résultats**
Pour chaque test, noter :
- ✅ Status code (200, 404, 401, etc.)
- ✅ Body de la réponse
- ✅ Headers de la réponse

---

## 🚀 **COMMANDES POWERSHELL** (Windows)

Si vous utilisez PowerShell au lieu de bash :

```powershell
# Test 1
$headers = @{
    "Authorization" = "Bearer VOTRE_TOKEN_ICI"
    "Content-Type" = "application/json"
    "x-client" = "mobile"
}

Invoke-WebRequest -Uri "https://altivo.fr/swift-app/job/JOB-NERD-URGENT-006/full" -Headers $headers -Method Get -Verbose

# Test 2
Invoke-WebRequest -Uri "https://altivo.fr/swift-app/job/6/full" -Headers $headers -Method Get -Verbose

# Test 3
Invoke-WebRequest -Uri "https://altivo.fr/swift-app/v1/job/JOB-NERD-URGENT-006/full" -Headers $headers -Method Get -Verbose

# Etc.
```

---

**Date** : 8 novembre 2025 - 09h40  
**Statut** : 🔍 EN COURS DE TEST

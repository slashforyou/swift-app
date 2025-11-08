# 🚀 GUIDE RAPIDE - TEST DES ENDPOINTS API

## 🎯 **BUT**
Trouver quel endpoint fonctionne pour récupérer les détails d'un job.

---

## ⚡ **MÉTHODE RAPIDE (2 MINUTES)**

### **Étape 1 : Récupérer le token** (30 secondes)

1. Ouvrez votre app
2. Regardez les logs dans le terminal
3. Cherchez cette ligne :
   ```
   🔐 Session token found, length: 128
   🔐 Token preview: 5f87028f4da292de821b...
   ```
4. Le token complet fait 128 caractères

**OU** ajoutez temporairement dans `src/utils/auth.ts` :

```typescript
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const st = await SecureStore.getItemAsync("session_token");
  
  if (st) {
    console.log('🔐 Session token found, length:', st.length);
    console.log('🔐 Token preview:', st.substring(0, 20) + '...');
    console.log('🧪 FULL TOKEN FOR TESTING:', st); // ⬅️ AJOUTER
    return { Authorization: `Bearer ${st}` };
  }
  // ...
}
```

Puis relancez l'app et copiez le token complet.

---

### **Étape 2 : Lancer le script** (1 minute)

Ouvrez PowerShell dans le dossier du projet et exécutez :

```powershell
.\test-api-endpoints.ps1 -Token "VOTRE_TOKEN_COMPLET_ICI"
```

Le script va tester **10 URLs différentes** automatiquement.

---

### **Étape 3 : Lire les résultats** (30 secondes)

Le script affiche :

```
📊 RÉSUMÉ DES RÉSULTATS
| Test | Status | Result |
|------|--------|--------|
| Test 1 | 404 | ❌ |
| Test 2 | 200 | ✅ |  ⬅️ CELUI-LÀ FONCTIONNE !
| Test 3 | 404 | ❌ |
...

🎉 ENDPOINTS QUI FONCTIONNENT:
   ✅ https://altivo.fr/swift-app/job/6/full

💡 SOLUTION:
   Utiliser cette URL dans src/services/jobs.ts:
   const fullUrl = `${API}job/6/full`;
```

---

## 🔧 **MÉTHODE MANUELLE** (si le script ne fonctionne pas)

Testez manuellement avec curl ou PowerShell :

### **Test avec PowerShell**

```powershell
$token = "VOTRE_TOKEN_ICI"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "x-client" = "mobile"
}

# Test 1: avec CODE
Invoke-WebRequest -Uri "https://altivo.fr/swift-app/job/JOB-NERD-URGENT-006/full" -Headers $headers -Method Get

# Test 2: avec ID
Invoke-WebRequest -Uri "https://altivo.fr/swift-app/job/6/full" -Headers $headers -Method Get

# Test 3: avec /jobs (pluriel)
Invoke-WebRequest -Uri "https://altivo.fr/swift-app/jobs/6" -Headers $headers -Method Get
```

### **Test avec curl** (Git Bash ou WSL)

```bash
TOKEN="VOTRE_TOKEN_ICI"

# Test 1: avec CODE
curl -X GET "https://altivo.fr/swift-app/job/JOB-NERD-URGENT-006/full" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v

# Test 2: avec ID
curl -X GET "https://altivo.fr/swift-app/job/6/full" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -v
```

---

## 📊 **INTERPRÉTATION DES RÉSULTATS**

| Status | Emoji | Signification | Action |
|--------|-------|---------------|--------|
| 200 | ✅ | Succès ! | Utiliser cette URL |
| 404 | ❌ | Non trouvé | Essayer une autre URL |
| 401 | 🔐 | Token invalide | Récupérer un nouveau token |
| 500 | 💥 | Erreur serveur | Contacter le backend |

---

## 🎯 **APRÈS LES TESTS**

### **Si un endpoint fonctionne** ✅

Exemple : `/job/6/full` retourne 200

**1. Mettre à jour `src/services/jobs.ts`** :

```typescript
export async function getJobDetails(jobId: string): Promise<any> {
  // ...
  const fullUrl = `${API}job/${jobId}/full`; // ⬅️ UTILISER L'URL QUI FONCTIONNE
  // ...
}
```

**2. Relancer l'app et tester** ✅

---

### **Si AUCUN endpoint ne fonctionne** ❌

**Options** :

1. **Vérifier le token**
   - Est-il expiré ?
   - Est-il complet (128 caractères) ?

2. **Vérifier l'ID/Code du job**
   - Le job existe-t-il vraiment ?
   - Essayer avec un autre job ID

3. **Contacter le backend**
   - Demander quel est l'endpoint correct
   - Vérifier la documentation API

4. **Alternative : utiliser les données du calendrier**
   - L'endpoint `/calendar-days` fonctionne
   - Peut-être que les données retournées suffisent ?

---

## 💡 **CONSEILS**

### **Pour un test rapide**

Le plus simple est d'utiliser le script PowerShell :

```powershell
# 1. Copier le token depuis les logs de l'app
# 2. Lancer le script
.\test-api-endpoints.ps1 -Token "5f87028f4da292de821b..."

# Le script teste les 10 URLs en 5 secondes !
```

### **Pour débugger**

Si rien ne fonctionne, ajoutez `-Verbose` pour voir plus de détails :

```powershell
Invoke-WebRequest -Uri "..." -Headers $headers -Method Get -Verbose
```

---

## 🆘 **PROBLÈMES COURANTS**

### **"Token invalide" (401)**
➡️ Le token a expiré. Récupérez-en un nouveau depuis l'app.

### **"Execution Policy" (PowerShell)**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\test-api-endpoints.ps1 -Token "..."
```

### **"curl not found"**
➡️ Utilisez PowerShell avec `Invoke-WebRequest` à la place.

---

**Date** : 8 novembre 2025 - 09h45  
**Temps estimé** : 2-5 minutes  
**Statut** : 🚀 PRÊT À TESTER

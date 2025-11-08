# 🧪 INSTRUCTIONS - TEST TOKEN REFRESH

## ✅ **CODE PRÊT À TESTER**

J'ai ajouté :
1. ✅ Fonction `testTokenRefresh()` dans `src/utils/auth.ts`
2. ✅ Bouton de test dans `src/screens/connection.tsx`
3. ✅ Logs détaillés pour capturer l'erreur 400

---

## 🚀 **COMMENT TESTER (3 ÉTAPES)**

### **1️⃣ Relancer l'app**

```bash
# Terminal
npm start
# ou
npx expo start
```

Puis ouvrir l'app sur votre appareil/simulateur

---

### **2️⃣ Voir le bouton de test**

Le bouton de test **n'apparaît QUE si vous êtes déjà connecté** :

**CAS A : Vous n'êtes PAS connecté**
1. L'écran de connexion s'affiche
2. **PAS de bouton de test** (normal)
3. ➡️ **Connectez-vous d'abord** (bouton "Se connecter")
4. Puis **déconnectez-vous** et revenez à l'écran de connexion
5. Le bouton de test devrait apparaître

**CAS B : Vous êtes DÉJÀ connecté**
1. L'app va directement sur Home
2. ➡️ **Déconnectez-vous** (Menu > Déconnexion)
3. Retournez à l'écran de connexion
4. Le bouton de test devrait apparaître : 🧪 **TEST TOKEN REFRESH (DEBUG)**

---

### **3️⃣ Cliquer sur le bouton de test**

1. Cliquer sur le bouton : **🧪 TEST TOKEN REFRESH (DEBUG)**
2. Une alerte va s'afficher
3. **IMPORTANT** : Regarder les **logs dans le terminal/DevTools**

---

## 📋 **LIRE LES LOGS**

### **Où trouver les logs ?**

#### **Option 1 : Terminal Expo** 
Regarder le terminal où `npm start` est lancé :
```
🧪 ========================================
🧪 [TEST] DÉBUT DU TEST TOKEN REFRESH
🧪 ========================================

🧪 [TEST] 1. Refresh token exists: true
🧪 [TEST] 2. Refresh token length: 128
🧪 [TEST] 3. Refresh token preview: c5ef8925f93269246b9a...
🧪 [TEST] 4. Calling refreshToken()...

🔍 [TOKEN REFRESH] === STARTING TOKEN REFRESH ===
🔍 [TOKEN REFRESH] Step 1: Getting refresh token from storage...
...
🔍 [TOKEN REFRESH] Error response body: {"error": "...", "message": "..."}  ⬅️ IMPORTANT
🔍 [TOKEN REFRESH] Error JSON parsed: {...}  ⬅️ IMPORTANT
```

#### **Option 2 : DevTools Chrome**
- Ouvrir Chrome DevTools : `Ctrl+Shift+J` (Windows) ou `Cmd+Option+J` (Mac)
- Onglet **Console**
- Chercher les logs commençant par `🧪` et `🔍 [TOKEN REFRESH]`

---

## 🎯 **CE QUI VA SE PASSER**

### **Scénario 1 : Token refresh OK** ✅
```
🧪 [TEST] ✅ TEST RÉUSSI - Token refresh OK

Alerte affichée :
"✅ Token refresh OK!
Token length: 128
📋 Vérifiez les logs pour plus de détails."
```
➡️ **Pas de bug !** (peu probable)

---

### **Scénario 2 : Token refresh ÉCHOUÉ** ❌ (ATTENDU)
```
🧪 [TEST] ❌ TEST ÉCHOUÉ - Token refresh a retourné false

Alerte affichée :
"❌ Token refresh ÉCHOUÉ
Token length: 128
📋 VÉRIFIEZ LES LOGS pour voir l'erreur 400 détaillée!"
```

**Dans les logs, chercher** :
```
🔍 [TOKEN REFRESH] Error response body: {...}
```

---

## 📸 **CAPTURER L'ERREUR**

### **IMPORTANT** : Copier ces 2 logs

1. **Body de l'erreur** :
```
🔍 [TOKEN REFRESH] Error response body: ...
```

2. **JSON parsé** :
```
🔍 [TOKEN REFRESH] Error JSON parsed: ...
```

**Exemple attendu** :
```json
{
  "error": "invalid_request",
  "message": "Expected field 'refresh_token' but got 'refreshToken'"
}
```
ou
```json
{
  "error": "token_expired",
  "message": "Refresh token has expired"
}
```

---

## 🔍 **APRÈS LE TEST**

### **M'envoyer :**
1. Le **body de l'erreur 400** complet
2. Le **message d'erreur** dans l'objet JSON
3. Le **status code** (devrait être 400)

### **Selon l'erreur, je vais :**

| Erreur API | Correction à appliquer |
|------------|------------------------|
| `refresh_token` attendu | Changer `refreshToken` → `refresh_token` |
| `device` requis | Ajouter `device: await collectDevicePayload()` |
| Token expiré | Ajouter gestion d'erreur + clearSession |
| Headers manquants | Ajouter headers requis |

---

## ⚠️ **EN CAS DE PROBLÈME**

### **Le bouton n'apparaît pas ?**
➡️ **Solution** : Vous devez d'abord vous connecter, puis vous déconnecter

### **"Aucun refresh token trouvé" ?**
➡️ **Solution** : Le refresh token n'est pas sauvegardé. Vérifiez :
1. Que le login fonctionne
2. Que `wantRefreshInBody: true` est bien dans la requête de login
3. Que le backend renvoie bien un `refreshToken`

### **L'app crash ?**
➡️ **Solution** : Regardez les logs d'erreur dans le terminal

---

## 🎯 **OBJECTIF**

Capturer le body de l'erreur 400 pour identifier **EXACTEMENT** ce que le backend attend.

Une fois qu'on a ça, on peut corriger en **5 minutes** ! ⚡

---

## 📞 **PROCHAINE ÉTAPE**

1. ✅ **MAINTENANT** : Tester avec le bouton
2. ✅ **ENSUITE** : M'envoyer les logs d'erreur
3. ✅ **PUIS** : J'applique la correction
4. ✅ **ENFIN** : On teste à nouveau

---

**Dernière mise à jour** : 8 novembre 2025 - 09h15  
**Statut** : 🚀 PRÊT À TESTER

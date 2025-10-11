# 🔍 Debug Logs - Profile Loading Process

## ✅ **Logs ajoutés dans tous les composants**

### 🎯 **Points de vérification**

#### **1. useUserProfile Hook** (`src/hooks/useUserProfile.ts`)
- `[PROFILE LOAD]` - Processus de chargement complet
- `[PROFILE UPDATE]` - Processus de mise à jour
- Vérification du flag `USE_MOCK_DATA`
- État des données mock vs API réelle
- Gestion des erreurs et session expirée

#### **2. API Service** (`src/services/user.ts`)
- `[API FETCH]` - Appels API détaillés
- Statut des réponses HTTP
- Parsing des données JSON
- Validation du format de réponse
- Normalisation des données utilisateur

#### **3. Auth System** (`src/utils/auth.ts`)
- `[AUTH FETCH]` - Wrapper d'authentification
- `[TOKEN REFRESH]` - Processus de refresh token
- Gestion des tokens en storage
- Retry automatique après refresh
- Nettoyage de session si échec

#### **4. Profile Screen** (`src/screens/profile.tsx`)
- `[PROFILE SCREEN]` - État du composant
- Données reçues du hook
- Mise à jour du formulaire
- État de chargement et erreurs

## 🔍 **Comment tester**

### **Étape 1: Démarrer l'app**
```bash
cd swift-app
npm start
```

### **Étape 2: Naviguer vers Profile**
- Aller dans l'onglet Profile
- Observer la console pour voir tous les logs

### **Étape 3: Analyser le flux**
Rechercher ces patterns dans les logs :

```
🔍 [PROFILE SCREEN] === PROFILE COMPONENT RENDERING ===
🔍 [PROFILE LOAD] === STARTING PROFILE LOAD ===
🔍 [PROFILE LOAD] Step 1: Setting loading state...
🔍 [PROFILE LOAD] Step 2: Checking USE_MOCK_DATA flag: true
🔍 [PROFILE LOAD] Step 3: Using MOCK data path
🔍 [PROFILE LOAD] Step 4: Selected mock type: employee/worker
🔍 [PROFILE LOAD] Step 5: Mock profile generated: {...}
🔍 [PROFILE LOAD] ✅ SUCCESS: Profile loaded and state updated
```

### **Étape 4: Si API réelle**
Si `USE_MOCK_DATA = false`, rechercher :

```
🔍 [AUTH FETCH] === STARTING AUTHENTICATED FETCH ===
🔍 [API FETCH] === STARTING API PROFILE FETCH ===
🔍 [TOKEN REFRESH] === STARTING TOKEN REFRESH ===
```

## 🚨 **Erreurs possibles à surveiller**

### **Mock Data Issues**
- `❌ Step X: No current profile to update`
- `🔍 [PROFILE LOAD] Step X: Mock profile generated: null`

### **API Issues**  
- `❌ Step X: API call FAILED - Status: XXX`
- `🔍 [API FETCH] ❌ Step X: Invalid response format`

### **Auth Issues**
- `🔍 [TOKEN REFRESH] ❌ Step X: No refresh token available`
- `🔍 [AUTH FETCH] ❌ Step X: Still 401 after refresh`

### **Component Issues**
- `🔍 [PROFILE SCREEN] Hook state: { hasProfile: false, isLoading: false, hasError: true }`

## 📊 **Flux normal attendu**

### **Mode Mock (USE_MOCK_DATA = true)**
```
1. [PROFILE SCREEN] Component render
2. [PROFILE LOAD] Start load
3. [PROFILE LOAD] Mock data path
4. [PROFILE LOAD] Mock profile generated
5. [PROFILE SCREEN] useEffect - Profile changed
6. [PROFILE SCREEN] Setting form data
```

### **Mode API (USE_MOCK_DATA = false)**
```
1. [PROFILE SCREEN] Component render  
2. [PROFILE LOAD] Start load
3. [PROFILE LOAD] Real API path
4. [AUTH FETCH] Authenticated request
5. [API FETCH] API call
6. [API FETCH] Response parsing
7. [PROFILE LOAD] Profile received
8. [PROFILE SCREEN] Profile updated
```

## 🛠️ **Actions après test**

1. **Copier tous les logs de la console**
2. **Identifier où le processus s'arrête**
3. **Noter les erreurs spécifiques**
4. **Vérifier les données reçues/attendues**

**Exemple de rapport :**
```
❌ Problème identifié à l'étape: [PROFILE LOAD] Step 5
✅ Données mock générées: { id: "1", firstName: "John" }
❌ Composant ne reçoit pas les données: hasProfile: false
```

---

**Ready pour test! 🧪**

Lancez l'app et naviguez vers Profile, puis copiez tous les logs de la console ici pour analyse.
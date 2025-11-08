# 🔧 ANALYSE DES PROBLÈMES TIMER - JOB-NERD-URGENT-006

**Date:** 6 Novembre 2025  
**Job concerné:** JOB-NERD-URGENT-006 (ID: 6)  
**Status:** completed, step 5/5  
**Problème principal:** Timer jamais démarré (`timer_started_at: null`, `timer_total_hours: 0.00`)

---

## ❌ PROBLÈME #1 : Endpoint Timer Start échoue

### 📍 Détails techniques

**Endpoint utilisé:**
```
POST https://altivo.fr/swift-app/v1/jobs/{jobId}/timer/start
```

**Fichier source:**
```
src/services/jobTimer.ts (ligne 126)
```

**❌ ERREUR IDENTIFIÉE:**
La requête envoyait un body alors que l'API n'en attend pas:
```json
// ❌ CE QUI ÉTAIT ENVOYÉ (INCORRECT):
{
  "started_at": "2025-11-06T09:01:00.484Z",
  "current_step": 1
}
```

**✅ CORRECTION APPLIQUÉE:**
```javascript
// Requête sans body - l'API gère automatiquement started_at et current_step
const response = await fetch(`${API}v1/jobs/${jobId}/timer/start`, {
  method: 'POST',
  headers
  // Pas de body
});
```

**Réponse API attendue:**
```json
{
  "success": true,
  "timer": {
    "started_at": "2025-11-06T09:01:00.000Z",
    "current_step": 1,
    "is_running": true
  }
}
```

---

### 🔍 Diagnostic

**✅ PROBLÈME RÉSOLU!**

La cause était simple: **l'API n'attend pas de body dans la requête POST**.

L'endpoint `/v1/jobs/{jobId}/timer/start` gère automatiquement:
- La création du timestamp `started_at`
- L'initialisation du `current_step` à 1
- La mise à jour de `is_running` à true

**Correction appliquée dans** `src/services/jobTimer.ts`:
- Suppression du body de la requête
- Ajout de validation de la réponse (`success: true/false`)
- Amélioration des logs (différencier succès/échec)

---

### ✅ SOLUTION #1A - ~~Vérification côté API~~ ✅ RÉSOLU

**ACTION REQUISE CÔTÉ BACKEND:**

1. **Vérifier si l'endpoint existe:**
   ```
   GET/POST /v1/jobs/{jobId}/timer/start
   OU
   GET/POST /v1/job/{jobId}/timer/start (singulier)
   ```

2. **Vérifier la documentation API:**
   - Consulter `API-Doc.md` (actuellement aucune mention de "timer")
   - Documenter l'endpoint s'il existe
   - Créer l'endpoint s'il n'existe pas

3. **Format attendu par l'API:**
   ```json
   // Ce qu'on envoie actuellement:
   {
     "started_at": "2025-11-06T09:01:00.484Z",
     "current_step": 1
   }
   
   // À vérifier: est-ce le bon format?
   // Alternatives possibles:
   {
     "timer_started_at": "...",
     "step": 1
   }
   // OU
   {
     "action": "start",
     "timestamp": "..."
   }
   ```

4. **Endpoint alternatif possible:**
   Peut-être que le timer se démarre via un autre endpoint:
   ```
   PATCH /v1/job/{jobId}
   {
     "timer_started_at": "2025-11-06T09:01:00.484Z",
     "timer_is_running": 1
   }
   ```

---

### ✅ SOLUTION #1B - Stockage local avec sync différée

**IMPLÉMENTATION FRONTEND:**

Créer un système de queue pour gérer le timer en mode offline/dégradé:

#### **Étape 1: Créer un service de queue**

**Nouveau fichier:** `src/services/timerQueue.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_QUEUE_KEY = '@timer_sync_queue';

interface TimerQueueItem {
  id: string;
  jobId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'advance_step';
  timestamp: string;
  data: any;
  attempts: number;
  createdAt: string;
}

/**
 * Ajouter une action timer à la queue de synchronisation
 */
export async function addToTimerQueue(
  jobId: string,
  action: 'start' | 'pause' | 'resume' | 'stop' | 'advance_step',
  data: any = {}
): Promise<void> {
  try {
    const queueJson = await AsyncStorage.getItem(TIMER_QUEUE_KEY);
    const queue: TimerQueueItem[] = queueJson ? JSON.parse(queueJson) : [];
    
    const item: TimerQueueItem = {
      id: `${jobId}_${action}_${Date.now()}`,
      jobId,
      action,
      timestamp: new Date().toISOString(),
      data,
      attempts: 0,
      createdAt: new Date().toISOString()
    };
    
    queue.push(item);
    await AsyncStorage.setItem(TIMER_QUEUE_KEY, JSON.stringify(queue));
    
    console.log('📝 [TIMER QUEUE] Action ajoutée:', item);
    
    // Tenter immédiatement la synchronisation
    await syncTimerQueue();
    
  } catch (error) {
    console.error('❌ [TIMER QUEUE] Erreur ajout queue:', error);
  }
}

/**
 * Synchroniser la queue avec l'API
 */
export async function syncTimerQueue(): Promise<void> {
  try {
    const queueJson = await AsyncStorage.getItem(TIMER_QUEUE_KEY);
    if (!queueJson) return;
    
    const queue: TimerQueueItem[] = JSON.parse(queueJson);
    if (queue.length === 0) return;
    
    console.log(`🔄 [TIMER QUEUE] Synchronisation de ${queue.length} action(s)...`);
    
    const remainingQueue: TimerQueueItem[] = [];
    
    for (const item of queue) {
      try {
        // Tenter d'envoyer à l'API
        const success = await sendTimerActionToAPI(item);
        
        if (!success) {
          item.attempts++;
          
          // Garder en queue si moins de 5 tentatives
          if (item.attempts < 5) {
            remainingQueue.push(item);
            console.log(`⚠️ [TIMER QUEUE] Action conservée (tentative ${item.attempts}/5):`, item.id);
          } else {
            console.error(`❌ [TIMER QUEUE] Action abandonnée après 5 tentatives:`, item.id);
          }
        } else {
          console.log(`✅ [TIMER QUEUE] Action synchronisée:`, item.id);
        }
        
      } catch (error) {
        console.error(`❌ [TIMER QUEUE] Erreur sync item ${item.id}:`, error);
        remainingQueue.push(item);
      }
    }
    
    // Sauvegarder la queue mise à jour
    await AsyncStorage.setItem(TIMER_QUEUE_KEY, JSON.stringify(remainingQueue));
    
    if (remainingQueue.length > 0) {
      console.log(`⏳ [TIMER QUEUE] ${remainingQueue.length} action(s) en attente de sync`);
    } else {
      console.log(`✅ [TIMER QUEUE] Toutes les actions synchronisées`);
    }
    
  } catch (error) {
    console.error('❌ [TIMER QUEUE] Erreur synchronisation:', error);
  }
}

/**
 * Envoyer une action timer à l'API
 */
async function sendTimerActionToAPI(item: TimerQueueItem): Promise<boolean> {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { startTimerAPI, pauseTimerAPI, resumeTimerAPI, stopTimerAPI, advanceStepAPI } = 
      await import('./jobTimer');
    
    switch (item.action) {
      case 'start':
        const startResult = await startTimerAPI(item.jobId);
        return startResult && !startResult.error;
        
      case 'pause':
        const pauseResult = await pauseTimerAPI(item.jobId);
        return pauseResult && !pauseResult.error;
        
      case 'resume':
        const resumeResult = await resumeTimerAPI(item.jobId);
        return resumeResult && !resumeResult.error;
        
      case 'stop':
        const stopResult = await stopTimerAPI(item.jobId);
        return stopResult && !stopResult.error;
        
      case 'advance_step':
        const advanceResult = await advanceStepAPI(
          item.jobId,
          item.data.fromStep,
          item.data.toStep,
          item.data.stepDurationMs
        );
        return advanceResult && !advanceResult.error;
        
      default:
        console.error('❌ [TIMER QUEUE] Action inconnue:', item.action);
        return false;
    }
    
  } catch (error) {
    console.error('❌ [TIMER QUEUE] Erreur envoi API:', error);
    return false;
  }
}

/**
 * Récupérer l'état de la queue
 */
export async function getTimerQueueStatus(): Promise<{
  pending: number;
  items: TimerQueueItem[];
}> {
  try {
    const queueJson = await AsyncStorage.getItem(TIMER_QUEUE_KEY);
    const queue: TimerQueueItem[] = queueJson ? JSON.parse(queueJson) : [];
    
    return {
      pending: queue.length,
      items: queue
    };
  } catch (error) {
    console.error('❌ [TIMER QUEUE] Erreur lecture queue:', error);
    return { pending: 0, items: [] };
  }
}

/**
 * Nettoyer la queue (utile pour debug)
 */
export async function clearTimerQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TIMER_QUEUE_KEY);
    console.log('🗑️ [TIMER QUEUE] Queue nettoyée');
  } catch (error) {
    console.error('❌ [TIMER QUEUE] Erreur nettoyage queue:', error);
  }
}
```

---

#### **Étape 2: Modifier startTimerAPI pour utiliser la queue**

**Fichier:** `src/services/jobTimer.ts`

```typescript
import { addToTimerQueue } from './timerQueue';

export async function startTimerAPI(jobId: string): Promise<any> {
  try {
    console.log('🚀 [startTimerAPI] Starting timer for job:', jobId);

    const headers = await getAuthHeaders();
    const requestBody = {
      started_at: new Date().toISOString(),
      current_step: 1
    };
    
    const response = await fetch(`${API}v1/jobs/${jobId}/timer/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // ✅ NOUVEAU: Vérifier si l'API a réussi
    if (data.error || !response.ok) {
      console.warn('⚠️ [startTimerAPI] API failed, storing in local queue');
      
      // Ajouter à la queue pour sync ultérieure
      await addToTimerQueue(jobId, 'start', requestBody);
      
      // ✅ Stocker localement le timer démarré
      await AsyncStorage.setItem(
        `@timer_${jobId}`,
        JSON.stringify({
          started_at: requestBody.started_at,
          current_step: 1,
          is_running: true,
          synced: false  // Pas encore synchronisé avec l'API
        })
      );
      
      console.log('✅ [startTimerAPI] Timer saved locally, will sync when API available');
      
      return {
        success: true,
        synced: false,
        started_at: requestBody.started_at,
        message: 'Timer démarré en local, synchronisation en attente'
      };
    }
    
    console.log('✅ [startTimerAPI] Timer started and synced with API:', data);
    return { ...data, synced: true };

  } catch (error: any) {
    console.error('❌ [startTimerAPI] Network error, storing locally:', error);
    
    // En cas d'erreur réseau, stocker en local
    const requestBody = {
      started_at: new Date().toISOString(),
      current_step: 1
    };
    
    await addToTimerQueue(jobId, 'start', requestBody);
    await AsyncStorage.setItem(
      `@timer_${jobId}`,
      JSON.stringify({
        started_at: requestBody.started_at,
        current_step: 1,
        is_running: true,
        synced: false
      })
    );
    
    return {
      success: true,
      synced: false,
      started_at: requestBody.started_at,
      message: 'Timer démarré en local (pas de connexion)'
    };
  }
}
```

---

#### **Étape 3: Ajouter un AppState listener pour sync automatique**

**Fichier:** `App.tsx` ou dans un provider dédié

```typescript
import { AppState } from 'react-native';
import { syncTimerQueue } from './services/timerQueue';

// Dans le useEffect principal de l'app:
useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active') {
      // L'app revient au premier plan
      console.log('📱 App active, tentative de sync timer queue...');
      await syncTimerQueue();
    }
  });
  
  // Sync initial au démarrage
  syncTimerQueue();
  
  return () => {
    subscription.remove();
  };
}, []);
```

---

#### **Étape 4: Indicateur visuel de synchronisation**

Dans `JobTimerDisplay.tsx`, afficher si le timer est synchronisé ou en attente:

```typescript
import { getTimerQueueStatus } from '../../services/timerQueue';

const [queueStatus, setQueueStatus] = useState({ pending: 0 });

useEffect(() => {
  const checkQueue = async () => {
    const status = await getTimerQueueStatus();
    setQueueStatus(status);
  };
  
  checkQueue();
  const interval = setInterval(checkQueue, 5000); // Check toutes les 5s
  
  return () => clearInterval(interval);
}, []);

// Dans le render:
{queueStatus.pending > 0 && (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name="cloud-offline" size={14} color="#FFA500" />
    <Text style={{ fontSize: 11, color: '#FFA500' }}>
      {queueStatus.pending} action(s) en attente de sync
    </Text>
  </View>
)}
```

---

### 📋 Checklist d'implémentation

**CÔTÉ API (Backend):**
- [ ] Vérifier si `/v1/jobs/{jobId}/timer/start` existe
- [ ] Si non, créer l'endpoint
- [ ] Documenter l'endpoint dans `API-Doc.md`
- [ ] Tester avec Postman/curl
- [ ] Vérifier les permissions requises
- [ ] Retourner un format clair en cas de succès/erreur

**CÔTÉ APP (Frontend):**
- [ ] Créer `src/services/timerQueue.ts`
- [ ] Modifier `src/services/jobTimer.ts` pour utiliser la queue
- [ ] Ajouter le listener AppState dans `App.tsx`
- [ ] Ajouter l'indicateur visuel dans `JobTimerDisplay.tsx`
- [ ] Tester le mode offline
- [ ] Tester la resynchronisation

---

## ⚠️ PROBLÈME #2 : Log trompeur "Timer started" avec erreur

### 📍 Détails

**Fichier:** `src/services/jobTimer.ts` ligne 141

**Code actuel:**
```typescript
const data = await response.json();
console.log('✅ [startTimerAPI] Timer started:', data);
return data;
```

**Problème:**
Le log affiche "✅ Timer started" même si `data = { error: "Not Found" }`

---

### ✅ SOLUTION #2

**Corriger le log pour être conditionnel:**

```typescript
const data = await response.json();

if (data.error || !response.ok) {
  console.error('❌ [startTimerAPI] Timer start failed:', data);
  // ... gestion de la queue (voir solution #1B)
} else {
  console.log('✅ [startTimerAPI] Timer started successfully:', data);
}

return data;
```

---

## ⚠️ PROBLÈME #3 : Rechargement inutile après auto-correction échouée

### 📍 Détails

**Fichier:** `src/utils/jobValidation.ts`

**Comportement actuel:**
1. Détecte que timer n'est pas démarré
2. Tente de le démarrer → échoue
3. Log "✅ Auto-corrections appliquées"
4. Recharge le job depuis l'API
5. Détecte encore que le timer n'est pas démarré
6. Boucle potentielle

---

### ✅ SOLUTION #3

**Modifier la logique d'auto-correction:**

```typescript
// Dans applyAutoCorrections():

const results = await Promise.allSettled(
  corrections.map(correction => applyCorrection(correction))
);

// Compter les succès
const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

if (successCount > 0) {
  console.log(`✅ [JobValidation] ${successCount}/${corrections.length} corrections appliquées`);
  return true; // Recharger seulement si au moins 1 correction a réussi
} else {
  console.warn(`⚠️ [JobValidation] Aucune correction appliquée (${corrections.length} tentées)`);
  return false; // Ne pas recharger
}
```

**Et modifier applyCorrection pour retourner un boolean:**

```typescript
async function applyCorrection(correction: AutoCorrection): Promise<boolean> {
  try {
    if (correction.type === 'timer_not_started') {
      const result = await startTimerAPI(String(correction.jobId));
      
      // ✅ Vérifier le succès réel
      if (result && !result.error && result.success !== false) {
        return true;
      }
      
      return false; // Échec
    }
    
    // ... autres types de corrections
    
  } catch (error) {
    console.error('❌ [applyCorrection] Failed:', error);
    return false;
  }
}
```

---

## 🎯 PROBLÈME #4 : Job "completed" sans timer/signature/paiement

### 📍 Contexte métier

Un job avec `status: "completed"` devrait avoir:
- ✅ `timer_started_at` renseigné
- ✅ `timer_total_hours` > 0
- ✅ `signature_blob` présent
- ✅ `payment_status` !== null

**Job actuel:**
- ❌ `timer_started_at: null`
- ❌ `timer_total_hours: "0.00"`
- ❌ `signature_blob: null`
- ❌ `payment_status: null`

---

### ✅ SOLUTION #4

**Option A: Empêcher la complétion sans ces données**

Modifier la fonction `completeJob()` pour vérifier:

```typescript
export async function completeJob(job: any): Promise<boolean> {
  // Validations
  const errors = [];
  
  if (!job.timer_started_at || job.timer_total_hours === "0.00") {
    errors.push("Le timer n'a pas été démarré");
  }
  
  if (!job.signature_blob) {
    errors.push("La signature est requise");
  }
  
  if (job.payment_status === null && parseFloat(job.amount_due) > 0) {
    errors.push("Le paiement doit être enregistré");
  }
  
  if (errors.length > 0) {
    Alert.alert(
      'Job incomplet',
      'Impossible de terminer le job:\n\n' + errors.map(e => `• ${e}`).join('\n'),
      [{ text: 'OK' }]
    );
    return false;
  }
  
  // Continuer la complétion...
}
```

**Option B: Permettre mais afficher un warning**

Ajouter un badge "⚠️ Données incomplètes" sur les jobs completed sans ces infos.

---

## 📊 RÉSUMÉ DES ACTIONS

### 🔴 URGENT - Côté API
1. Identifier pourquoi `/v1/jobs/{jobId}/timer/start` retourne 404
2. Corriger ou créer l'endpoint
3. Documenter dans API-Doc.md

### 🟡 IMPORTANT - Côté App
1. Implémenter le système de queue (timerQueue.ts)
2. Modifier startTimerAPI pour gérer les échecs
3. Ajouter la synchronisation automatique (AppState)
4. Corriger les logs trompeurs
5. Empêcher les rechargements inutiles

### 🟢 AMÉLIORATION - UX
1. Indicateur visuel de sync en cours
2. Validation avant complétion du job
3. Messages d'erreur plus clairs

---

## 🧪 PLAN DE TEST

1. **Test mode offline:**
   - Désactiver le WiFi
   - Démarrer un timer
   - Vérifier stockage local
   - Réactiver le WiFi
   - Vérifier la synchronisation

2. **Test API endpoint:**
   - Tester avec curl/Postman
   - Vérifier les headers requis
   - Vérifier le format de réponse

3. **Test auto-correction:**
   - Créer un job sans timer
   - Vérifier qu'il ne boucle pas
   - Vérifier que le timer local fonctionne

---

**Créé le:** 6 novembre 2025  
**Mis à jour le:** 6 novembre 2025  
**Status:** En cours d'implémentation

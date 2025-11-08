# 🚨 JobDetails - Problèmes Critiques & Plan d'Action

**Date** : 26 Octobre 2025  
**Contexte** : Retour utilisateur - 4 problèmes critiques identifiés  
**Priorité** : 🔴 URGENT - L'utilisateur passe 3/4 du temps sur JobDetails

---

## 📋 PROBLÈMES IDENTIFIÉS

### 🔴 PROBLÈME 1 - Photos Cropées au lieu de Réduites

**Symptôme** :
```
❌ Les photos sont cropées (aspect: [4,3])
❌ Perte d'information visuelle importante
❌ Pas de compression optimisée
```

**Fichier affecté** : `src/components/jobDetails/modals/PhotoSelectionModal.tsx`

**Code actuel** :
```tsx
const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,      // ❌ PROBLÈME : Permet crop
    aspect: [4, 3],           // ❌ PROBLÈME : Force crop 4:3
    quality: 0.8,             // ✅ OK mais pas optimal
});
```

**Impact** :
- ❌ Photos cropées = perte d'informations
- ❌ Taille fichier non optimisée
- ❌ UX frustrante (utilisateur perd des détails)

**Solution requise** :
```tsx
const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,     // ✅ Pas de crop
    quality: 0.6,            // ✅ Compression optimale (balance qualité/poids)
    // Redimensionnement automatique à max 1920x1080 (Full HD)
    // Poids cible : 200-500 KB par photo
});
```

**Priorité** : 🔴 CRITIQUE

---

### 🔴 PROBLÈME 2 - Photos ne s'envoient pas au Serveur

**Symptôme** :
```
❌ Pas de feedback visuel upload
❌ Photos stockées localement seulement
❌ Pas de confirmation envoi serveur
❌ Pas de retry si échec
```

**Fichiers affectés** :
1. `src/hooks/useJobPhotos.ts` (ligne 117-144)
2. `src/screens/JobDetailsScreens/summary.tsx` (ligne 68-81)

**Code actuel - Problèmes** :

```tsx
// useJobPhotos.ts - Ligne 117
const uploadPhotoCallback = useCallback(async (photoUri: string, description?: string): Promise<JobPhotoAPI | null> => {
    if (!jobId || !profile) return null;

    try {
      const newPhoto = await uploadJobPhoto(jobId, photoUri, description);
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
      return newPhoto; // ❌ Pas de feedback utilisateur !
    } catch (err) {
      console.error('Error uploading photo:', err);
      
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        console.log('📸 API photo upload not available, saving locally');
        
        // ❌ PROBLÈME : Sauvegarde locale SILENCIEUSE
        // L'utilisateur ne sait pas que ça a échoué !
        
        const localPhoto: JobPhotoAPI = { ... };
        const updatedPhotos = [localPhoto, ...photos];
        setPhotos(updatedPhotos);
        await saveLocalPhotos(jobId, updatedPhotos);
        return localPhoto; // ❌ Retourne success même si échec API !
      }
    }
}, [jobId, photos, profile]);
```

```tsx
// summary.tsx - Ligne 68
const handlePhotoSelected = async (photoUri: string) => {
    try {
        const result = await uploadPhoto(photoUri, `Photo job ${job?.id}`);
        if (result) {
            showSuccess('Photo ajoutée', 'Photo ajoutée avec succès');
            // ❌ PROBLÈME : showSuccess même si stockage LOCAL !
        } else {
            throw new Error('Erreur upload');
        }
    } catch (error) {
        showError('Erreur', 'Impossible d\'uploader la photo');
        // ❌ PROBLÈME : Message générique, pas de détails
    }
};
```

**Impact** :
- ❌ Utilisateur pense que photo est envoyée (mais c'est local !)
- ❌ Photos perdues si app désinstallée
- ❌ Pas de synchronisation serveur
- ❌ Pas de retry automatique

**Solution requise** :

1. **Feedback Upload Visuel**
```tsx
// Ajouter état upload
const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    progress: number; // 0-100
    status: 'idle' | 'uploading' | 'success' | 'error' | 'local';
}>({ isUploading: false, progress: 0, status: 'idle' });
```

2. **Messages Clairs**
```tsx
// Si API success
showSuccess('✅ Photo envoyée', 'Photo envoyée au serveur avec succès');

// Si stockage local (fallback)
showWarning('⚠️ Photo sauvegardée localement', 
    'Photo sauvegardée temporairement. Sera envoyée au serveur plus tard.');

// Si erreur
showError('❌ Échec envoi photo', 
    'Impossible d\'envoyer la photo au serveur. Réessayez plus tard.');
```

3. **Retry Automatique**
```tsx
// Background sync pour photos locales
useEffect(() => {
    const syncInterval = setInterval(async () => {
        await syncLocalPhotosToServer();
    }, 60000); // Retry toutes les minutes
    
    return () => clearInterval(syncInterval);
}, []);
```

4. **Indicateur Visuel Status**
```tsx
// Dans la liste photos
<PhotoCard photo={photo}>
    {photo.id.startsWith('local-') && (
        <Badge color="warning">📤 En attente d'envoi</Badge>
    )}
    {photo.uploadError && (
        <Badge color="error">❌ Échec envoi</Badge>
    )}
</PhotoCard>
```

**Priorité** : 🔴 CRITIQUE

---

### 🔴 PROBLÈME 3 - Étapes Job Non Persistantes

**Symptôme** :
```
❌ Étapes différentes entre pages (summary vs payment vs job)
❌ État étape reset à chaque rechargement jobDetails
❌ Perte de progression utilisateur
❌ Confusion sur étape actuelle
```

**Fichiers affectés** :
1. `src/screens/jobDetails.tsx` (ligne 101-211)
2. `src/screens/JobDetailsScreens/summary.tsx` (ligne 83-118)
3. `src/screens/JobDetailsScreens/payment.tsx` (ligne 25)

**Code actuel - Problème** :

```tsx
// jobDetails.tsx - Ligne 101
const [job, setJob] = useState({
    id: actualJobId || "#LM0000000001",
    code: actualJobId || "#LM0000000001",
    step : {
        actualStep: 1,  // ❌ HARDCODÉ à 1 !
        steps : [
            { id: 1, name: 'Pickup', ... },
            { id: 2, name: 'Intermediate', ... },
            { id: 3, name: 'Dropoff', ... },
        ],
    },
    // ...
});

// Effet pour mettre à jour les données locales quand jobDetails change
React.useEffect(() => {
    if (jobDetails) {
        setJob(prevJob => ({
            ...prevJob,
            // ❌ PROBLÈME : Données API écrasées par hardcodé !
            job: jobDetails.job || prevJob.job,
            client: jobDetails.client || prevJob.client,
            // ... autres champs
            // Mais step.actualStep reste à 1 !!!
        }));
    }
}, [jobDetails]);
```

**Données incohérentes** :
```tsx
// summary.tsx utilise :
const currentStep = job?.step?.actualStep || job?.current_step || 1;

// payment.tsx utilise :
const currentStep = job?.job?.current_step || job?.current_step || 0;

// ❌ PROBLÈME : 3 sources différentes !
// - job.step.actualStep (état local)
// - job.current_step (API ?)
// - job.job.current_step (API nested ?)
```

**Impact** :
- ❌ Utilisateur perd sa progression
- ❌ Étapes incohérentes entre pages
- ❌ Timer fonctionne pas correctement
- ❌ Paiement ne se déclenche jamais

**Solution requise** :

1. **Source Unique de Vérité**
```tsx
// Créer un Context pour Job State
// src/context/JobStateProvider.tsx
export const JobStateProvider = ({ children, jobId }) => {
    const [jobState, setJobState] = useState(() => {
        // Charger depuis AsyncStorage au démarrage
        return loadJobState(jobId);
    });
    
    // Persister à chaque changement
    useEffect(() => {
        saveJobState(jobId, jobState);
    }, [jobState, jobId]);
    
    return (
        <JobStateContext.Provider value={{ jobState, setJobState }}>
            {children}
        </JobStateContext.Provider>
    );
};
```

2. **AsyncStorage Persistence**
```tsx
// utils/jobStateStorage.ts
const JOB_STATE_KEY = 'jobStates';

export async function loadJobState(jobId: string): Promise<JobState> {
    try {
        const stored = await AsyncStorage.getItem(JOB_STATE_KEY);
        const states = stored ? JSON.parse(stored) : {};
        return states[jobId] || getDefaultJobState();
    } catch (error) {
        console.error('Error loading job state:', error);
        return getDefaultJobState();
    }
}

export async function saveJobState(jobId: string, state: JobState): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(JOB_STATE_KEY);
        const states = stored ? JSON.parse(stored) : {};
        states[jobId] = state;
        await AsyncStorage.setItem(JOB_STATE_KEY, JSON.stringify(states));
    } catch (error) {
        console.error('Error saving job state:', error);
    }
}
```

3. **Synchronisation API ↔ Local**
```tsx
// Dans JobStateProvider
useEffect(() => {
    if (jobDetailsFromAPI) {
        // Merge API data avec état local (API = source de vérité)
        setJobState(prevState => ({
            ...prevState,
            currentStep: jobDetailsFromAPI.current_step || prevState.currentStep,
            // Autres champs API
        }));
    }
}, [jobDetailsFromAPI]);

// Quand état local change, envoyer à l'API
const updateJobStep = async (newStep: number) => {
    // Optimistic update local
    setJobState(prev => ({ ...prev, currentStep: newStep }));
    
    try {
        // Envoyer à l'API
        await updateJobStepAPI(jobId, newStep);
    } catch (error) {
        // Rollback si échec
        setJobState(prev => ({ ...prev, currentStep: prev.currentStep }));
        showError('Erreur', 'Impossible de mettre à jour l\'étape');
    }
};
```

4. **Utilisation Uniforme**
```tsx
// Partout dans JobDetails pages
const { jobState, updateJobStep } = useJobState();
const currentStep = jobState.currentStep; // ✅ Source unique !
```

**Priorité** : 🔴 CRITIQUE

---

### 🔴 PROBLÈME 4 - Timer ne s'arrête pas à l'étape finale

**Symptôme** :
```
❌ Timer continue même après dernière étape validée
❌ Paiement ne se déclenche jamais automatiquement
❌ Coûts continuent d'augmenter indéfiniment
❌ Pas de finalisation claire du job
```

**Fichier affecté** : `src/hooks/useJobTimer.ts` (ligne 149-170)

**Code actuel** :
```tsx
// Ligne 149
const advanceStep = useCallback((newStep: number) => {
    if (!timerData || !timerData.isRunning) return;

    const now = Date.now();
    const updatedStepTimes = [...timerData.stepTimes];
    
    // Terminer l'étape actuelle
    if (updatedStepTimes.length > 0) {
        const currentStepIndex = updatedStepTimes.length - 1;
        updatedStepTimes[currentStepIndex] = {
            ...updatedStepTimes[currentStepIndex],
            endTime: now,
            duration: now - updatedStepTimes[currentStepIndex].startTime
        };
    }

    // Démarrer la nouvelle étape (sauf si c'est la fin - step 6)
    if (newStep < 6) {
        updatedStepTimes.push({
            step: newStep,
            stepName: JOB_STEPS[newStep as keyof typeof JOB_STEPS] || `Étape ${newStep}`,
            startTime: now
        });
    }

    const updatedData: JobTimerData = {
        ...timerData,
        currentStep: newStep,
        stepTimes: updatedStepTimes,
        isRunning: newStep < 6, // ✅ Arrêter le timer à l'étape 6
        totalElapsed: newStep >= 6 ? now - timerData.startTime : timerData.totalElapsed
        // ❌ PROBLÈME : Pas de callback pour déclencher paiement !
    };

    setTimerData(updatedData);
    saveTimerData(updatedData);
}, [timerData, saveTimerData]);
```

**Problèmes identifiés** :

1. **Pas de callback pour déclencher paiement**
```tsx
// ❌ Quand timer s'arrête, rien ne se passe !
isRunning: newStep >= 6 // Timer s'arrête
// Mais pas de :
// - Callback onJobCompleted
// - Navigation vers paiement
// - Notification utilisateur
```

2. **Étape 6 hardcodée**
```tsx
// ❌ PROBLÈME : Nombre d'étapes fixe à 6
if (newStep < 6) { ... }
isRunning: newStep < 6

// Mais dans jobDetails.tsx :
steps: [
    { id: 1, name: 'Pickup' },
    { id: 2, name: 'Intermediate' },
    { id: 3, name: 'Dropoff' }
]
// ❌ Seulement 3 étapes ! Incohérence !
```

3. **Pas de finalisation coûts**
```tsx
// ❌ totalElapsed calculé mais pas freezé
totalElapsed: newStep >= 6 ? now - timerData.startTime : timerData.totalElapsed

// ❌ Pas de :
// - Freeze du coût final
// - Calcul facture
// - Lock des données
```

**Impact** :
- ❌ Coûts continuent d'augmenter après fin job
- ❌ Paiement jamais déclenché automatiquement
- ❌ Utilisateur confus sur quand payer
- ❌ Risque de surcout pour client

**Solution requise** :

1. **Callback onJobCompleted**
```tsx
export const useJobTimer = (
    jobId: string, 
    currentStep: number = 0,
    onJobCompleted?: (finalCost: number) => void // ✅ NOUVEAU
) => {
    const advanceStep = useCallback((newStep: number) => {
        // ... code existant ...
        
        // ✅ NOUVEAU : Déclencher callback si dernière étape
        if (newStep >= totalSteps) {
            const finalElapsed = now - timerData.startTime;
            const { cost } = calculateCost(finalElapsed - timerData.totalBreakTime);
            
            const updatedData: JobTimerData = {
                ...timerData,
                currentStep: newStep,
                stepTimes: updatedStepTimes,
                isRunning: false, // Arrêter timer
                totalElapsed: finalElapsed, // Freeze temps final
                isCompleted: true, // ✅ Nouveau flag
                finalCost: cost // ✅ Freeze coût final
            };
            
            setTimerData(updatedData);
            saveTimerData(updatedData);
            
            // ✅ Déclencher callback
            if (onJobCompleted) {
                onJobCompleted(cost);
            }
        }
    }, [timerData, saveTimerData, onJobCompleted, calculateCost]);
    
    return {
        // ... existing returns ...
        isCompleted: timerData?.isCompleted || false,
        finalCost: timerData?.finalCost || null
    };
};
```

2. **Utilisation dans JobDetails**
```tsx
// Dans summary.tsx ou JobProgressSection
const { advanceStep, isCompleted, finalCost } = useJobTimer(
    jobId, 
    currentStep,
    (finalCost) => {
        // ✅ Callback quand job terminé
        console.log('🎉 Job completed! Final cost:', finalCost);
        
        // Afficher modal confirmation
        Alert.alert(
            '🎉 Job Terminé !',
            `Temps total : ${formatTime(totalElapsed)}\nCoût final : $${finalCost.toFixed(2)} AUD`,
            [
                {
                    text: 'Voir Paiement',
                    onPress: () => {
                        // Naviguer vers page paiement
                        setJobPanel('payment');
                    }
                }
            ]
        );
    }
);
```

3. **Nombre d'étapes dynamique**
```tsx
// Dans JOB_STEPS
export const getJobSteps = (job: any) => {
    const steps = job?.step?.steps || job?.steps || DEFAULT_STEPS;
    return steps.length; // ✅ Dynamique !
};

// Dans advanceStep
const totalSteps = getJobSteps(job);
if (newStep >= totalSteps) {
    // Finaliser job
}
```

4. **Lock des données finales**
```tsx
// Dans useJobTimer
export interface JobTimerData {
    // ... existing fields ...
    isCompleted: boolean; // ✅ Flag finale
    finalCost: number | null; // ✅ Coût freezé
    completedAt: number | null; // ✅ Timestamp fin
}

// Empêcher modifications après complétion
const advanceStep = useCallback((newStep: number) => {
    if (timerData?.isCompleted) {
        console.warn('⚠️ Job already completed, cannot advance step');
        return;
    }
    // ... reste du code
}, [timerData]);
```

**Priorité** : 🔴 CRITIQUE

---

## 🎯 PLAN D'ACTION GLOBAL

### Phase 0 - Préparation (30 min)

**Tâches** :
1. ✅ Créer branche feature
```bash
git checkout -b fix/jobdetails-critical-issues
```

2. ✅ Backup fichiers critiques
```bash
cp src/components/jobDetails/modals/PhotoSelectionModal.tsx src/components/jobDetails/modals/PhotoSelectionModal.backup.tsx
cp src/hooks/useJobPhotos.ts src/hooks/useJobPhotos.backup.ts
cp src/hooks/useJobTimer.ts src/hooks/useJobTimer.backup.ts
cp src/screens/jobDetails.tsx src/screens/jobDetails.backup.tsx
```

3. ✅ Créer fichiers nouveaux
```bash
# JobState Context
touch src/context/JobStateProvider.tsx
touch src/utils/jobStateStorage.ts
touch src/types/jobState.ts

# Photo compression utils
touch src/utils/imageCompression.ts
```

---

### Phase 1 - Fix Photos (🔴 Priorité 1 - 2 heures)

#### Étape 1.1 - Désactiver Crop (15 min)

**Fichier** : `src/components/jobDetails/modals/PhotoSelectionModal.tsx`

```tsx
// Ligne 55-63 : handleTakePhoto
const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,     // ✅ CHANGEMENT
    quality: 0.6,            // ✅ CHANGEMENT (0.8 → 0.6)
});

// Ligne 76-84 : handleSelectFromGallery
const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,     // ✅ CHANGEMENT
    quality: 0.6,            // ✅ CHANGEMENT
});
```

#### Étape 1.2 - Ajouter Compression Optimale (30 min)

**Nouveau fichier** : `src/utils/imageCompression.ts`

```tsx
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const MAX_WIDTH = 1920;  // Full HD
const MAX_HEIGHT = 1080;
const TARGET_SIZE_KB = 400; // Taille cible: 400 KB
const QUALITY_STEP = 0.05; // Step pour ajuster qualité

export async function compressImage(uri: string): Promise<{
    uri: string;
    width: number;
    height: number;
    fileSize: number;
}> {
    // 1. Redimensionner si trop grand
    const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // 2. Vérifier taille fichier
    const fileInfo = await FileSystem.getInfoAsync(resized.uri);
    const fileSizeKB = (fileInfo.size || 0) / 1024;
    
    // 3. Ajuster qualité si nécessaire
    let quality = 0.8;
    let finalUri = resized.uri;
    
    if (fileSizeKB > TARGET_SIZE_KB) {
        // Trop gros, réduire qualité progressivement
        while (fileSizeKB > TARGET_SIZE_KB && quality > 0.3) {
            quality -= QUALITY_STEP;
            
            const compressed = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
                { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            const compressedInfo = await FileSystem.getInfoAsync(compressed.uri);
            const newSizeKB = (compressedInfo.size || 0) / 1024;
            
            if (newSizeKB <= TARGET_SIZE_KB) {
                finalUri = compressed.uri;
                break;
            }
        }
    }
    
    // 4. Retourner infos finales
    const finalInfo = await FileSystem.getInfoAsync(finalUri);
    const dimensions = await ImageManipulator.manipulateAsync(
        finalUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return {
        uri: finalUri,
        width: dimensions.width || MAX_WIDTH,
        height: dimensions.height || MAX_HEIGHT,
        fileSize: finalInfo.size || 0
    };
}
```

**Utilisation dans PhotoSelectionModal** :

```tsx
import { compressImage } from '../../../utils/imageCompression';

// Dans handleTakePhoto et handleSelectFromGallery
if (!result.canceled && result.assets[0]) {
    // ✅ NOUVEAU : Compression avant envoi
    const compressed = await compressImage(result.assets[0].uri);
    
    console.log('📷 Photo compressed:', {
        originalSize: result.assets[0].fileSize,
        compressedSize: compressed.fileSize,
        compression: ((1 - compressed.fileSize / result.assets[0].fileSize) * 100).toFixed(1) + '%'
    });
    
    onPhotoSelected(compressed.uri);
    onClose();
}
```

#### Étape 1.3 - Améliorer Feedback Upload (1h15)

**Nouveau type** : `src/types/photoUpload.ts`

```tsx
export interface PhotoUploadStatus {
    id: string;
    uri: string;
    status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error' | 'local';
    progress: number; // 0-100
    error?: string;
    uploadedAt?: string;
    isLocal: boolean;
}
```

**Modifier** : `src/hooks/useJobPhotos.ts`

```tsx
// Ajouter état upload
const [uploadStatuses, setUploadStatuses] = useState<Record<string, PhotoUploadStatus>>({});

const uploadPhotoCallback = useCallback(async (
    photoUri: string, 
    description?: string,
    onProgress?: (progress: number) => void
): Promise<JobPhotoAPI | null> => {
    if (!jobId || !profile) return null;

    const uploadId = `upload-${Date.now()}`;
    
    // ✅ État initial
    setUploadStatuses(prev => ({
        ...prev,
        [uploadId]: {
            id: uploadId,
            uri: photoUri,
            status: 'compressing',
            progress: 10,
            isLocal: false
        }
    }));
    
    try {
        // ✅ Compression
        const compressed = await compressImage(photoUri);
        
        setUploadStatuses(prev => ({
            ...prev,
            [uploadId]: { ...prev[uploadId], status: 'uploading', progress: 30 }
        }));
        
        // ✅ Upload API
        const newPhoto = await uploadJobPhoto(jobId, compressed.uri, description);
        
        setUploadStatuses(prev => ({
            ...prev,
            [uploadId]: { 
                ...prev[uploadId], 
                status: 'success', 
                progress: 100,
                uploadedAt: new Date().toISOString()
            }
        }));
        
        setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
        return newPhoto;
        
    } catch (err) {
        console.error('Error uploading photo:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // ✅ Si API indisponible, sauvegarder localement
        if (errorMessage.includes('404') || errorMessage.includes('400') || errorMessage.includes('Network')) {
            console.log('📸 API unavailable, saving locally for later sync');
            
            const localPhoto: JobPhotoAPI = {
                id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                job_id: jobId,
                user_id: profile.id,
                filename: compressed.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
                original_name: compressed.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
                description: description || '',
                file_size: compressed.fileSize,
                mime_type: 'image/jpeg',
                width: compressed.width,
                height: compressed.height,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // ✅ Marquer comme local (en attente sync)
            setUploadStatuses(prev => ({
                ...prev,
                [uploadId]: { 
                    ...prev[uploadId], 
                    status: 'local', 
                    progress: 100,
                    isLocal: true
                }
            }));
            
            const updatedPhotos = [localPhoto, ...photos];
            setPhotos(updatedPhotos);
            await saveLocalPhotos(jobId, updatedPhotos);
            
            // ✅ NOUVEAU : Planifier retry automatique
            schedulePhotoSync(jobId, localPhoto.id);
            
            return localPhoto;
        } else {
            // ✅ Erreur réelle
            setUploadStatuses(prev => ({
                ...prev,
                [uploadId]: { 
                    ...prev[uploadId], 
                    status: 'error', 
                    error: errorMessage
                }
            }));
            
            return null;
        }
    }
}, [jobId, photos, profile]);

// ✅ NOUVEAU : Sync automatique photos locales
const syncLocalPhotosToServer = useCallback(async () => {
    const localPhotos = photos.filter(p => p.id.startsWith('local-'));
    
    if (localPhotos.length === 0) return;
    
    console.log(`📤 Syncing ${localPhotos.length} local photos to server...`);
    
    for (const localPhoto of localPhotos) {
        try {
            const uploaded = await uploadJobPhoto(
                jobId, 
                localPhoto.filename, // URI stocké dans filename
                localPhoto.description
            );
            
            // Remplacer photo locale par photo serveur
            setPhotos(prev => prev.map(p => 
                p.id === localPhoto.id ? uploaded : p
            ));
            
            console.log(`✅ Synced photo ${localPhoto.id} → ${uploaded.id}`);
        } catch (error) {
            console.warn(`⚠️ Failed to sync photo ${localPhoto.id}:`, error);
            // Garder la photo locale, retry plus tard
        }
    }
    
    // Sauvegarder photos mises à jour
    await saveLocalPhotos(jobId, photos);
}, [jobId, photos]);

// ✅ Sync auto toutes les 5 minutes
useEffect(() => {
    const syncInterval = setInterval(() => {
        syncLocalPhotosToServer();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(syncInterval);
}, [syncLocalPhotosToServer]);

return {
    // ... existing
    uploadStatuses,  // ✅ NOUVEAU
    syncLocalPhotosToServer  // ✅ NOUVEAU
};
```

**Modifier** : `src/screens/JobDetailsScreens/summary.tsx`

```tsx
const { uploadPhoto, uploadStatuses, syncLocalPhotosToServer } = useJobPhotos(job?.id);

const handlePhotoSelected = async (photoUri: string) => {
    try {
        const result = await uploadPhoto(photoUri, `Photo job ${job?.id}`);
        
        if (result) {
            // ✅ Distinguer API success vs local
            if (result.id.startsWith('local-')) {
                showWarning(
                    '⚠️ Photo sauvegardée localement',
                    'La photo sera envoyée au serveur automatiquement plus tard.'
                );
            } else {
                showSuccess('✅ Photo envoyée', 'Photo envoyée au serveur avec succès');
            }
        } else {
            throw new Error('Échec upload photo');
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
        showError('❌ Erreur', 'Impossible de sauvegarder la photo. Réessayez.');
    }
};

// ✅ Bouton manuel sync (optionnel)
<Pressable onPress={syncLocalPhotosToServer}>
    <Text>📤 Synchroniser photos locales</Text>
</Pressable>
```

**Tests** :
1. ✅ Prendre photo → Vérifier compression
2. ✅ Upload avec API disponible → Vérifier success
3. ✅ Upload sans API → Vérifier sauvegarde locale
4. ✅ Retry auto → Vérifier sync après 5 min

---

### Phase 2 - Fix État Étapes Persistant (🔴 Priorité 2 - 3 heures)

#### Étape 2.1 - Créer JobState Context (1h)

**Nouveau fichier** : `src/types/jobState.ts`

```tsx
export interface JobStep {
    id: number;
    name: string;
    description?: string;
    completed: boolean;
    startedAt?: string;
    completedAt?: string;
}

export interface JobState {
    jobId: string;
    currentStep: number;
    totalSteps: number;
    steps: JobStep[];
    isCompleted: boolean;
    completedAt?: string;
    lastUpdated: string;
}

export function getDefaultJobState(jobId: string): JobState {
    return {
        jobId,
        currentStep: 0,
        totalSteps: 5,
        steps: [
            { id: 1, name: 'Départ', completed: false },
            { id: 2, name: 'Arrivée première adresse', completed: false },
            { id: 3, name: 'Départ première adresse', completed: false },
            { id: 4, name: 'Arrivée adresse suivante', completed: false },
            { id: 5, name: 'Retour dépôt', completed: false }
        ],
        isCompleted: false,
        lastUpdated: new Date().toISOString()
    };
}
```

**Nouveau fichier** : `src/utils/jobStateStorage.ts`

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobState, getDefaultJobState } from '../types/jobState';

const JOB_STATES_KEY = 'jobStates';

export async function loadJobState(jobId: string): Promise<JobState> {
    try {
        const stored = await AsyncStorage.getItem(JOB_STATES_KEY);
        const states: Record<string, JobState> = stored ? JSON.parse(stored) : {};
        
        return states[jobId] || getDefaultJobState(jobId);
    } catch (error) {
        console.error('Error loading job state:', error);
        return getDefaultJobState(jobId);
    }
}

export async function saveJobState(jobState: JobState): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(JOB_STATES_KEY);
        const states: Record<string, JobState> = stored ? JSON.parse(stored) : {};
        
        states[jobState.jobId] = {
            ...jobState,
            lastUpdated: new Date().toISOString()
        };
        
        await AsyncStorage.setItem(JOB_STATES_KEY, JSON.stringify(states));
        console.log('✅ Job state saved:', jobState.jobId, 'step:', jobState.currentStep);
    } catch (error) {
        console.error('Error saving job state:', error);
    }
}

export async function clearJobState(jobId: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(JOB_STATES_KEY);
        const states: Record<string, JobState> = stored ? JSON.parse(stored) : {};
        
        delete states[jobId];
        await AsyncStorage.setItem(JOB_STATES_KEY, JSON.stringify(states));
    } catch (error) {
        console.error('Error clearing job state:', error);
    }
}
```

**Nouveau fichier** : `src/context/JobStateProvider.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobState, getDefaultJobState } from '../types/jobState';
import { loadJobState, saveJobState } from '../utils/jobStateStorage';
import { updateJobStep as updateJobStepAPI } from '../services/jobSteps';

interface JobStateContextValue {
    jobState: JobState;
    updateCurrentStep: (step: number) => Promise<void>;
    completeStep: (step: number) => Promise<void>;
    resetJobState: () => Promise<void>;
    isLoading: boolean;
}

const JobStateContext = createContext<JobStateContextValue | null>(null);

export const JobStateProvider: React.FC<{ jobId: string; children: React.ReactNode }> = ({ 
    jobId, 
    children 
}) => {
    const [jobState, setJobState] = useState<JobState>(getDefaultJobState(jobId));
    const [isLoading, setIsLoading] = useState(true);

    // Charger état au montage
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const state = await loadJobState(jobId);
            setJobState(state);
            setIsLoading(false);
        };
        load();
    }, [jobId]);

    // Sauvegarder à chaque changement
    useEffect(() => {
        if (!isLoading) {
            saveJobState(jobState);
        }
    }, [jobState, isLoading]);

    // Mettre à jour étape actuelle
    const updateCurrentStep = useCallback(async (newStep: number) => {
        const updatedState: JobState = {
            ...jobState,
            currentStep: newStep,
            steps: jobState.steps.map((step, index) => ({
                ...step,
                completed: index < newStep - 1,
                startedAt: index === newStep - 1 ? new Date().toISOString() : step.startedAt
            })),
            isCompleted: newStep >= jobState.totalSteps,
            completedAt: newStep >= jobState.totalSteps ? new Date().toISOString() : undefined
        };

        // Optimistic update
        setJobState(updatedState);

        // Sync with API
        try {
            await updateJobStepAPI(jobId, newStep);
        } catch (error) {
            console.error('Failed to update job step on server:', error);
            // État local reste, on retry plus tard
        }
    }, [jobState, jobId]);

    // Compléter une étape
    const completeStep = useCallback(async (stepNumber: number) => {
        const updatedState: JobState = {
            ...jobState,
            steps: jobState.steps.map(step => 
                step.id === stepNumber 
                    ? { ...step, completed: true, completedAt: new Date().toISOString() }
                    : step
            )
        };

        setJobState(updatedState);
    }, [jobState]);

    // Reset
    const resetJobState = useCallback(async () => {
        const defaultState = getDefaultJobState(jobId);
        setJobState(defaultState);
    }, [jobId]);

    return (
        <JobStateContext.Provider value={{
            jobState,
            updateCurrentStep,
            completeStep,
            resetJobState,
            isLoading
        }}>
            {children}
        </JobStateContext.Provider>
    );
};

export const useJobState = (): JobStateContextValue => {
    const context = useContext(JobStateContext);
    if (!context) {
        throw new Error('useJobState must be used within JobStateProvider');
    }
    return context;
};
```

#### Étape 2.2 - Intégrer Context dans JobDetails (1h)

**Modifier** : `src/screens/jobDetails.tsx`

```tsx
import { JobStateProvider } from '../context/JobStateProvider';

const JobDetails: React.FC<JobDetailsProps> = ({ route, navigation, jobId }) => {
    // ... code existant ...
    
    return (
        <JobStateProvider jobId={actualJobId}>
            {/* Wrapper tout le contenu */}
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {/* ... reste du code ... */}
            </View>
        </JobStateProvider>
    );
};
```

**Modifier** : `src/screens/JobDetailsScreens/summary.tsx`

```tsx
import { useJobState } from '../../context/JobStateProvider';

const JobSummary = ({ job, setJob }) => {
    const { jobState, updateCurrentStep } = useJobState();
    
    // ✅ Utiliser jobState.currentStep partout
    const currentStep = jobState.currentStep;
    
    const handleAdvanceStep = async (targetStep: number) => {
        await updateCurrentStep(targetStep);
        showSuccess('Étape avancée', `Passé à l'étape ${targetStep}`);
    };
    
    return (
        <>
            <JobProgressSection 
                currentStep={jobState.currentStep} 
                totalSteps={jobState.totalSteps}
                steps={jobState.steps}
                onAdvanceStep={handleAdvanceStep}
            />
            {/* ... reste */}
        </>
    );
};
```

**Modifier** : `src/screens/JobDetailsScreens/payment.tsx`

```tsx
import { useJobState } from '../../context/JobStateProvider';

const PaymentScreen = ({ job, setJob }) => {
    const { jobState } = useJobState();
    
    // ✅ Source unique
    const currentStep = jobState.currentStep;
    const isJobCompleted = jobState.isCompleted;
    
    return (
        <>
            {isJobCompleted && (
                <View>
                    <Text>🎉 Job terminé !</Text>
                    <PaymentWindow job={job} />
                </View>
            )}
        </>
    );
};
```

#### Étape 2.3 - Tests Persistence (30 min)

**Tests manuels** :
1. ✅ Avancer étape → Fermer app → Rouvrir → Vérifier étape conservée
2. ✅ Vérifier cohérence entre summary, job, payment pages
3. ✅ Compléter job → Vérifier isCompleted persisté
4. ✅ Sync API → Vérifier état serveur

---

### Phase 3 - Fix Timer Stop & Déclenchement Paiement (🔴 Priorité 3 - 2 heures)

#### Étape 3.1 - Modifier useJobTimer (1h)

**Modifier** : `src/hooks/useJobTimer.ts`

```tsx
// Ligne 12 - Ajouter champs
export interface JobTimerData {
    // ... existing fields
    isCompleted: boolean;         // ✅ NOUVEAU
    completedAt?: number;         // ✅ NOUVEAU
    finalCost?: number;           // ✅ NOUVEAU
    finalBillableTime?: number;   // ✅ NOUVEAU
}

// Ligne 169 - Modifier advanceStep
export const useJobTimer = (
    jobId: string, 
    currentStep: number = 0,
    totalSteps: number = 5,  // ✅ NOUVEAU : dynamique
    onJobCompleted?: (data: {  // ✅ NOUVEAU callback
        finalCost: number;
        billableTime: number;
        totalElapsed: number;
    }) => void
) => {
    // ... code existant ...
    
    const advanceStep = useCallback((newStep: number) => {
        if (!timerData || !timerData.isRunning) return;
        
        // ❌ Empêcher modification si déjà complété
        if (timerData.isCompleted) {
            console.warn('⚠️ Job already completed, cannot advance step');
            return;
        }

        const now = Date.now();
        const updatedStepTimes = [...timerData.stepTimes];
        
        // Terminer l'étape actuelle
        if (updatedStepTimes.length > 0) {
            const currentStepIndex = updatedStepTimes.length - 1;
            updatedStepTimes[currentStepIndex] = {
                ...updatedStepTimes[currentStepIndex],
                endTime: now,
                duration: now - updatedStepTimes[currentStepIndex].startTime
            };
        }

        // ✅ Vérifier si c'est la dernière étape
        const isLastStep = newStep >= totalSteps;
        
        if (!isLastStep) {
            // Démarrer la nouvelle étape
            updatedStepTimes.push({
                step: newStep,
                stepName: JOB_STEPS[newStep as keyof typeof JOB_STEPS] || `Étape ${newStep}`,
                startTime: now
            });
        }

        // Calculer temps final
        const finalElapsed = now - timerData.startTime;
        const finalBreakTime = timerData.totalBreakTime + (timerData.isOnBreak ? currentTime - timerData.breakTimes[timerData.breakTimes.length - 1].startTime : 0);
        const finalBillableTime = finalElapsed - finalBreakTime;
        const { cost: finalCost } = calculateCost(finalBillableTime);

        const updatedData: JobTimerData = {
            ...timerData,
            currentStep: newStep,
            stepTimes: updatedStepTimes,
            isRunning: !isLastStep,  // ✅ Arrêter si dernière étape
            totalElapsed: isLastStep ? finalElapsed : timerData.totalElapsed,
            isCompleted: isLastStep,  // ✅ NOUVEAU
            completedAt: isLastStep ? now : undefined,  // ✅ NOUVEAU
            finalCost: isLastStep ? finalCost : undefined,  // ✅ NOUVEAU
            finalBillableTime: isLastStep ? finalBillableTime : undefined  // ✅ NOUVEAU
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);
        
        // ✅ NOUVEAU : Déclencher callback si complété
        if (isLastStep && onJobCompleted) {
            console.log('🎉 Job completed! Triggering payment...');
            onJobCompleted({
                finalCost,
                billableTime: finalBillableTime,
                totalElapsed: finalElapsed
            });
        }
    }, [timerData, saveTimerData, totalSteps, onJobCompleted, calculateCost, currentTime]);
    
    return {
        // ... existing returns
        isCompleted: timerData?.isCompleted || false,  // ✅ NOUVEAU
        finalCost: timerData?.finalCost || null,  // ✅ NOUVEAU
        finalBillableTime: timerData?.finalBillableTime || null  // ✅ NOUVEAU
    };
};
```

#### Étape 3.2 - Intégrer Callback Paiement (1h)

**Modifier** : `src/screens/JobDetailsScreens/summary.tsx`

```tsx
import { useJobState } from '../../context/JobStateProvider';
import { Alert } from 'react-native';

const JobSummary = ({ job, setJob }) => {
    const { jobState, updateCurrentStep } = useJobState();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    
    // ✅ Hook timer avec callback
    const { advanceStep, formatTime, isCompleted, finalCost } = useJobTimer(
        job?.id,
        jobState.currentStep,
        jobState.totalSteps,
        (completionData) => {
            // ✅ Callback quand job terminé
            console.log('🎉 Job completed!', completionData);
            
            // Sauvegarder données paiement
            setPaymentData(completionData);
            
            // Afficher modal confirmation
            Alert.alert(
                '🎉 Job Terminé !',
                `Temps facturable : ${formatTime(completionData.billableTime, false)}\n` +
                `Temps total : ${formatTime(completionData.totalElapsed, false)}\n` +
                `Coût final : $${completionData.finalCost.toFixed(2)} AUD`,
                [
                    {
                        text: 'Annuler',
                        style: 'cancel'
                    },
                    {
                        text: 'Voir Paiement',
                        onPress: () => {
                            // Ouvrir page paiement ou modal
                            setShowPaymentModal(true);
                            // OU naviguer vers onglet paiement
                            // setJobPanel('payment');
                        }
                    }
                ]
            );
        }
    );
    
    const handleNextStep = async () => {
        const nextStep = jobState.currentStep + 1;
        
        // Mettre à jour état job
        await updateCurrentStep(nextStep);
        
        // Avancer timer
        advanceStep(nextStep);
        
        // Afficher toast sauf si dernière étape (modal paiement va s'afficher)
        if (nextStep < jobState.totalSteps) {
            showSuccess('Étape suivante', `Passé à l'étape ${nextStep}`);
        }
    };
    
    return (
        <>
            {/* ... existing code ... */}
            
            {/* ✅ Modal paiement si job terminé */}
            {showPaymentModal && paymentData && (
                <PaymentWindow 
                    job={job}
                    setJob={setJob}
                    paymentAmount={paymentData.finalCost}
                    billableTime={paymentData.billableTime}
                    visibleCondition="paymentWindow"
                    setVisibleCondition={(val) => setShowPaymentModal(val === 'paymentWindow')}
                />
            )}
        </>
    );
};
```

**Modifier** : `src/screens/JobDetailsScreens/payment.tsx`

```tsx
import { useJobState } from '../../context/JobStateProvider';

const PaymentScreen = ({ job, setJob }) => {
    const { jobState } = useJobState();
    const { finalCost, finalBillableTime, isCompleted } = useJobTimer(job?.id, jobState.currentStep);
    
    // ✅ Afficher coût final si job terminé
    const paymentAmount = isCompleted && finalCost ? finalCost : getRealTimePaymentInfo().current;
    
    return (
        <ScrollView>
            {/* Header */}
            <View>
                {isCompleted && (
                    <View style={{ backgroundColor: colors.success + '20', padding: 16, borderRadius: 8 }}>
                        <Text style={{ color: colors.success, fontWeight: 'bold' }}>
                            🎉 Job Terminé
                        </Text>
                        <Text>
                            Coût final : ${finalCost?.toFixed(2)} AUD
                        </Text>
                    </View>
                )}
            </View>
            
            {/* ... reste du code ... */}
        </ScrollView>
    );
};
```

#### Étape 3.3 - Tests Timer Stop (30 min)

**Tests manuels** :
1. ✅ Démarrer job → Avancer étapes → Vérifier timer running
2. ✅ Atteindre dernière étape → Vérifier timer stop
3. ✅ Vérifier modal paiement s'affiche
4. ✅ Vérifier coût freezé (ne change plus)
5. ✅ Essayer avancer étape après fin → Vérifier bloqué

---

## 📊 RÉSUMÉ PLAN D'ACTION

```
┌──────────────────────────────────────────────────────────┐
│              PLAN D'ACTION JOBDETAILS                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Phase 0 : Préparation ..................... 30 min     │
│  ├─ Branche feature                                     │
│  ├─ Backups                                             │
│  └─ Fichiers nouveaux                                   │
│                                                          │
│  Phase 1 : Fix Photos ..................... 2h          │
│  ├─ Désactiver crop ........................ 15 min     │
│  ├─ Compression optimale ................... 30 min     │
│  └─ Feedback upload ........................ 1h15        │
│                                                          │
│  Phase 2 : État Étapes Persistant ......... 3h          │
│  ├─ Context JobState ....................... 1h         │
│  ├─ Intégration JobDetails ................. 1h         │
│  └─ Tests persistence ...................... 30 min     │
│                                                          │
│  Phase 3 : Timer Stop & Paiement .......... 2h          │
│  ├─ Modifier useJobTimer ................... 1h         │
│  ├─ Callback paiement ...................... 1h         │
│  └─ Tests timer ............................ 30 min     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  TOTAL ESTIMÉ : 7h30                                     │
│  (1 jour de développement)                               │
└──────────────────────────────────────────────────────────┘
```

### Séquence Recommandée

**Jour 1 Matin (3h)** :
- Phase 0 : Préparation (30 min)
- Phase 1 : Fix Photos complète (2h)
- Tests photos (30 min)

**Jour 1 Après-midi (4h30)** :
- Phase 2 : État Étapes Persistant (3h)
- Phase 3 : Timer Stop & Paiement (2h)
- Tests complets (30 min)

---

## ✅ CHECKLIST FINALE

### Photos
- [ ] allowsEditing: false dans PhotoSelectionModal
- [ ] Compression optimale (quality 0.6, max 1920x1080)
- [ ] Feedback upload (compressing → uploading → success/local/error)
- [ ] Messages clairs (API success vs local storage)
- [ ] Retry automatique toutes les 5 min
- [ ] Badge statut photos ("En attente", "Échec", etc.)

### État Étapes
- [ ] Context JobStateProvider créé
- [ ] AsyncStorage persistence
- [ ] Source unique jobState.currentStep
- [ ] Sync API ↔ Local
- [ ] Utilisation uniforme dans toutes pages

### Timer
- [ ] Callback onJobCompleted
- [ ] totalSteps dynamique (pas hardcodé 6)
- [ ] Timer stop à dernière étape
- [ ] isCompleted flag
- [ ] finalCost freezé
- [ ] completedAt timestamp
- [ ] Empêcher avancer après complétion

### Paiement
- [ ] Modal paiement auto-ouverte fin job
- [ ] Affichage coût final
- [ ] Navigation vers page paiement
- [ ] Lock données après paiement

---

## 🎯 RÉSULTAT ATTENDU

Après ces fixes :

✅ **Photos** :
- Photos complètes (pas cropées)
- Taille optimisée (~400 KB)
- Feedback upload clair
- Sync auto vers serveur
- Retry automatique si échec

✅ **Étapes Job** :
- État persistant entre sessions
- Cohérence entre toutes pages
- Sync API automatique
- Pas de perte progression

✅ **Timer** :
- Stop automatique fin job
- Coût final freezé
- Modal paiement auto
- Workflow clair pour utilisateur

✅ **UX Globale** :
- Confiance utilisateur ++++
- Pas de perte données
- Feedback transparent
- Workflow fluide

---

**Temps Total** : ~7h30 (1 jour développement)  
**Impact** : 🚀 JobDetails devient production-ready  
**Priorité** : 🔴 URGENT (utilisateur passe 3/4 temps ici)

---

*Document créé le 26 Octobre 2025*  
*Prêt à commencer Phase 0*

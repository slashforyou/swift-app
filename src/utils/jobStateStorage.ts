/**
 * Job State Storage Utility
 * 
 * Gestion du stockage persistant de l'état du job dans AsyncStorage
 * Permet de restaurer l'état après fermeture de l'app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobState } from '../types/jobState';

const STORAGE_PREFIX = 'job_state_';
const STORAGE_INDEX_KEY = 'job_states_index';

/**
 * Génère la clé de stockage pour un job
 */
function getStorageKey(jobId: string): string {
    return `${STORAGE_PREFIX}${jobId}`;
}

/**
 * Sauvegarde l'état d'un job dans AsyncStorage
 * 
 * @param jobState État du job à sauvegarder
 * @returns Promise<void>
 */
export async function saveJobState(jobState: JobState): Promise<void> {
    try {
        const key = getStorageKey(jobState.jobId);
        const data = JSON.stringify(jobState);
        await AsyncStorage.setItem(key, data);
        
        // Mettre à jour l'index des jobs
        await updateJobsIndex(jobState.jobId);
        
        console.log(`💾 Job state saved: ${jobState.jobId}, step ${jobState.progress.actualStep}`);
    } catch (error) {
        console.error('Error saving job state:', error);
        throw new Error('Failed to save job state');
    }
}

/**
 * Récupère l'état d'un job depuis AsyncStorage
 * 
 * @param jobId ID du job
 * @returns Promise<JobState | null>
 */
export async function loadJobState(jobId: string): Promise<JobState | null> {
    try {
        const key = getStorageKey(jobId);
        const data = await AsyncStorage.getItem(key);
        
        if (!data) {
            console.log(`💾 No stored state found for job: ${jobId}`);
            return null;
        }
        
        const jobState: JobState = JSON.parse(data);
        console.log(`💾 Job state loaded: ${jobId}, step ${jobState.progress.actualStep}`);
        
        return jobState;
    } catch (error) {
        console.error('Error loading job state:', error);
        return null;
    }
}

/**
 * Supprime l'état d'un job de AsyncStorage
 * 
 * @param jobId ID du job
 * @returns Promise<void>
 */
export async function deleteJobState(jobId: string): Promise<void> {
    try {
        const key = getStorageKey(jobId);
        await AsyncStorage.removeItem(key);
        
        // Retirer de l'index
        await removeFromJobsIndex(jobId);
        
        console.log(`💾 Job state deleted: ${jobId}`);
    } catch (error) {
        console.error('Error deleting job state:', error);
        throw new Error('Failed to delete job state');
    }
}

/**
 * Récupère tous les états de jobs stockés
 * 
 * @returns Promise<JobState[]>
 */
export async function loadAllJobStates(): Promise<JobState[]> {
    try {
        const jobIds = await getJobsIndex();
        const states: JobState[] = [];
        
        for (const jobId of jobIds) {
            const state = await loadJobState(jobId);
            if (state) {
                states.push(state);
            }
        }
        
        console.log(`💾 Loaded ${states.length} job states`);
        return states;
    } catch (error) {
        console.error('Error loading all job states:', error);
        return [];
    }
}

/**
 * Nettoie les états de jobs anciens (> 30 jours)
 * 
 * @returns Promise<number> Nombre d'états nettoyés
 */
export async function cleanOldJobStates(daysOld: number = 30): Promise<number> {
    try {
        const allStates = await loadAllJobStates();
        const now = new Date();
        let cleaned = 0;
        
        for (const state of allStates) {
            const lastModified = new Date(state.lastModifiedAt);
            const daysDiff = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > daysOld) {
                await deleteJobState(state.jobId);
                cleaned++;
            }
        }
        
        console.log(`💾 Cleaned ${cleaned} old job states (older than ${daysOld} days)`);
        return cleaned;
    } catch (error) {
        console.error('Error cleaning old job states:', error);
        return 0;
    }
}

/**
 * Met à jour l'index des jobs stockés
 * 
 * @param jobId ID du job à ajouter
 */
async function updateJobsIndex(jobId: string): Promise<void> {
    try {
        const index = await getJobsIndex();
        
        if (!index.includes(jobId)) {
            index.push(jobId);
            await AsyncStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
        }
    } catch (error) {
        console.error('Error updating jobs index:', error);
    }
}

/**
 * Retire un job de l'index
 * 
 * @param jobId ID du job à retirer
 */
async function removeFromJobsIndex(jobId: string): Promise<void> {
    try {
        const index = await getJobsIndex();
        const newIndex = index.filter(id => id !== jobId);
        await AsyncStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(newIndex));
    } catch (error) {
        console.error('Error removing from jobs index:', error);
    }
}

/**
 * Récupère l'index des jobs
 * 
 * @returns Promise<string[]>
 */
async function getJobsIndex(): Promise<string[]> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_INDEX_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting jobs index:', error);
        return [];
    }
}

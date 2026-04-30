/**
 * useOnboardingMilestones.ts
 *
 * Gère les milestones d'onboarding progressif :
 *  - Sync DB ↔ AsyncStorage au mount + au refocus
 *  - isUnlocked(milestone) — vrai si le milestone a été atteint
 *  - isShown(milestone) — vrai si l'animation de reveal a déjà été jouée
 *  - markShown(milestone) — marque shown_at côté serveur + cache local
 *  - unlock(milestone) — débloque un milestone côté client (pour tests / triggers manuels)
 *
 * Les milestones sont débloqués automatiquement côté serveur (trigger dans createJob.js).
 * Ce hook ne fait que lire et mettre à jour l'état d'affichage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;
const STORAGE_KEY = '@cobbr_onboarding_milestones_v1';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MilestoneName =
  | 'first_job_created'
  | 'first_job_started'
  | 'first_job_completed'
  | 'team_assigned'
  | 'stripe_activated';

interface MilestoneRecord {
  milestone: MilestoneName;
  unlocked_at: string;
  shown_at: string | null;
}

interface MilestonesCache {
  milestones: MilestoneRecord[];
  fetchedAt: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useOnboardingMilestones() {
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const appState = useRef(AppState.currentState);

  // ── Charger depuis AsyncStorage au démarrage ──────────────────────────────
  useEffect(() => {
    loadFromCache().then((cached) => {
      if (cached) setMilestones(cached);
      setIsReady(true);
    });
    // Puis synchroniser avec le serveur
    syncFromServer();
  }, []);

  // ── Resync au refocus de l'app (retour foreground) ────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        syncFromServer();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // ── Sync serveur ──────────────────────────────────────────────────────────
  const syncFromServer = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API}v1/users/me/onboarding-milestones`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;
      const fetched: MilestoneRecord[] = json.data?.milestones ?? [];
      setMilestones(fetched);
      await saveToCache(fetched);
    } catch {
      // Offline ou session expirée — on garde le cache local
    }
  }, []);

  // ── Cache AsyncStorage ────────────────────────────────────────────────────
  async function loadFromCache(): Promise<MilestoneRecord[] | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: MilestonesCache = JSON.parse(raw);
      return parsed.milestones ?? null;
    } catch {
      return null;
    }
  }

  async function saveToCache(data: MilestoneRecord[]) {
    try {
      const payload: MilestonesCache = { milestones: data, fetchedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }

  // ── API publique ──────────────────────────────────────────────────────────

  /** Vrai si ce milestone a été débloqué */
  const isUnlocked = useCallback(
    (name: MilestoneName): boolean => milestones.some((m) => m.milestone === name),
    [milestones],
  );

  /** Vrai si l'animation de reveal a déjà été jouée */
  const isShown = useCallback(
    (name: MilestoneName): boolean =>
      milestones.some((m) => m.milestone === name && m.shown_at !== null),
    [milestones],
  );

  /**
   * Marque l'animation de reveal comme jouée.
   * Met à jour l'état local immédiatement, puis confirme côté serveur.
   */
  const markShown = useCallback(
    async (name: MilestoneName) => {
      // Update local state optimistically
      setMilestones((prev) =>
        prev.map((m) =>
          m.milestone === name ? { ...m, shown_at: new Date().toISOString() } : m,
        ),
      );
      // Persist to cache
      const updated = milestones.map((m) =>
        m.milestone === name ? { ...m, shown_at: new Date().toISOString() } : m,
      );
      await saveToCache(updated);
      // Confirm on server
      try {
        await authenticatedFetch(
          `${API}v1/users/me/onboarding-milestones/${name}/shown`,
          { method: 'PATCH' },
        );
      } catch {
        // Ignore — shown_at already set locally
      }
    },
    [milestones],
  );

  /**
   * Débloque un milestone manuellement (pour triggers côté client si besoin).
   * Le serveur est la source de vérité — préférer les triggers backend.
   */
  const unlock = useCallback(
    async (name: MilestoneName) => {
      if (isUnlocked(name)) return;
      try {
        await authenticatedFetch(`${API}v1/users/me/onboarding-milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone: name }),
        });
        await syncFromServer();
      } catch {
        // Ignore
      }
    },
    [isUnlocked, syncFromServer],
  );

  return {
    isReady,
    milestones,
    isUnlocked,
    isShown,
    markShown,
    unlock,
    refresh: syncFromServer,
  };
}

/**
 * Tests de validation de cohérence des jobs
 * 
 * Teste tous les cas d'incohérence possibles et les mécanismes de correction
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { startJob } from '../../src/services/jobSteps'; // ✅ FIX: Utiliser jobSteps au lieu de jobTimer
import {
    applyPendingCorrections,
    checkNetworkConnectivity,
    formatValidationReport,
    JobValidationResult,
    reconcileJobData,
    validateJobConsistency
} from '../../src/utils/jobValidation';

// Mock des dépendances
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../src/services/jobSteps'); // ✅ FIX: Mock jobSteps

// Mock fetch global
global.fetch = jest.fn();

describe('Job Validation - Détection des incohérences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  // ============================================
  // INCOHÉRENCE 1: Étape > 1 mais timer jamais démarré
  // ============================================
  describe('Incohérence 1: Timer non démarré', () => {
    it('devrait détecter un job à l\'étape 3 sans timer', async () => {
      const jobData = {
        id: 6,
        code: 'JOB-NERD-URGENT-006',
        current_step: 3,
        status: 'active',
        timer_started_at: null,
        timer_total_hours: '0.00',
        timer_is_running: false
      };

      const result = await validateJobConsistency(jobData);

      expect(result.isValid).toBe(false);
      expect(result.inconsistencies).toHaveLength(1);
      expect(result.inconsistencies[0]).toMatchObject({
        type: 'timer_not_started',
        severity: 'critical',
        jobId: 6
      });
      expect(result.inconsistencies[0].description).toContain('étape 3/5');
    });

    it('devrait auto-corriger en créant un timer rétroactif', async () => {
      (startJob as jest.Mock).mockResolvedValue({ success: true });

      const jobData = {
        id: 6,
        current_step: 3,
        timer_started_at: null,
        timer_total_hours: '0.00'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.autoCorrected).toBe(true);
      expect(result.corrections).toContain('Timer créé rétroactivement pour étape 3');
      expect(startJob).toHaveBeenCalledWith(6);
    });

    it('devrait stocker la correction localement si hors-ligne', async () => {
      (startJob as jest.Mock).mockRejectedValue(new Error('Network error'));

      const jobData = {
        id: 6,
        current_step: 3,
        timer_started_at: null
      };

      await validateJobConsistency(jobData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@job_pending_corrections',
        expect.stringContaining('"jobId":6')
      );
    });

    it('ne devrait PAS détecter d\'incohérence si job à l\'étape 1', async () => {
      const jobData = {
        id: 1,
        current_step: 1,
        timer_started_at: null,
        timer_total_hours: '0.00'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.isValid).toBe(true);
      expect(result.inconsistencies).toHaveLength(0);
    });
  });

  // ============================================
  // INCOHÉRENCE 2: Job complété mais pas à l'étape finale
  // ============================================
  describe('Incohérence 2: Job complété mais étape < 5', () => {
    it('devrait détecter un job "completed" à l\'étape 3', async () => {
      const jobData = {
        id: 7,
        current_step: 3,
        status: 'completed',
        timer_started_at: '2025-11-01T10:00:00Z',
        timer_total_hours: '5.5'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.isValid).toBe(false);
      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'completed_not_final_step',
          severity: 'critical'
        })
      );
    });

    it('ne devrait PAS détecter d\'incohérence si complété à l\'étape 5', async () => {
      const jobData = {
        id: 8,
        current_step: 5,
        status: 'completed',
        timer_started_at: '2025-11-01T10:00:00Z',
        timer_total_hours: '8.0'
      };

      const result = await validateJobConsistency(jobData);

      // Peut avoir d'autres warnings mais pas celui-ci
      const hasCompletedNotFinalStepError = result.inconsistencies.some(
        inc => inc.type === 'completed_not_final_step'
      );
      expect(hasCompletedNotFinalStepError).toBe(false);
    });
  });

  // ============================================
  // INCOHÉRENCE 3: Étape finale mais pas complété
  // ============================================
  describe('Incohérence 3: Étape 5 mais status !== completed', () => {
    it('devrait détecter un job à l\'étape 5 avec status "active"', async () => {
      const jobData = {
        id: 9,
        current_step: 5,
        status: 'active',
        timer_started_at: '2025-11-01T10:00:00Z',
        timer_total_hours: '7.0'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.isValid).toBe(false);
      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'final_step_not_completed',
          severity: 'warning'
        })
      );
    });

    it('devrait suggérer de marquer comme completed', async () => {
      const jobData = {
        id: 10,
        current_step: 5,
        status: 'pending'
      };

      const result = await validateJobConsistency(jobData);

      const inconsistency = result.inconsistencies.find(
        inc => inc.type === 'final_step_not_completed'
      );
      expect(inconsistency?.suggestedFix).toContain('completed');
    });
  });

  // ============================================
  // INCOHÉRENCE 4: Timer actif mais job complété
  // ============================================
  describe('Incohérence 4: Timer running sur job completed', () => {
    it('devrait détecter un timer actif sur job complété', async () => {
      const jobData = {
        id: 11,
        current_step: 5,
        status: 'completed',
        timer_is_running: true,
        timer_started_at: '2025-11-01T10:00:00Z'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'timer_running_but_completed',
          severity: 'warning'
        })
      );
    });

    it('devrait suggérer d\'arrêter le timer', async () => {
      const jobData = {
        id: 12,
        status: 'completed',
        timer_is_running: 1 // test avec int aussi
      };

      const result = await validateJobConsistency(jobData);

      const inconsistency = result.inconsistencies.find(
        inc => inc.type === 'timer_running_but_completed'
      );
      expect(inconsistency?.suggestedFix).toContain('Arrêter le timer');
    });
  });

  // ============================================
  // INCOHÉRENCE 5: Temps négatif
  // ============================================
  describe('Incohérence 5: Temps négatif', () => {
    it('devrait détecter un temps total négatif', async () => {
      const jobData = {
        id: 13,
        timer_total_hours: '-5.2',
        current_step: 2
      };

      const result = await validateJobConsistency(jobData);

      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'timer_negative',
          severity: 'critical'
        })
      );
    });

    it('devrait suggérer de réinitialiser à 0', async () => {
      const jobData = {
        id: 14,
        timer_total_hours: '-2.0'
      };

      const result = await validateJobConsistency(jobData);

      const inconsistency = result.inconsistencies.find(
        inc => inc.type === 'timer_negative'
      );
      expect(inconsistency?.suggestedFix).toContain('Réinitialiser');
    });
  });

  // ============================================
  // INCOHÉRENCE 6: Temps anormalement élevé
  // ============================================
  describe('Incohérence 6: Temps anormalement élevé', () => {
    it('devrait détecter un temps > 240h (10 jours)', async () => {
      const jobData = {
        id: 15,
        timer_total_hours: '300.0', // 12.5 jours
        current_step: 3
      };

      const result = await validateJobConsistency(jobData);

      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'timer_exceeds_reasonable',
          severity: 'warning'
        })
      );
    });

    it('ne devrait PAS détecter si temps < 240h', async () => {
      const jobData = {
        id: 16,
        timer_total_hours: '48.0' // 2 jours, OK
      };

      const result = await validateJobConsistency(jobData);

      const hasExceedsError = result.inconsistencies.some(
        inc => inc.type === 'timer_exceeds_reasonable'
      );
      expect(hasExceedsError).toBe(false);
    });

    it('devrait suggérer de vérifier le timer oublié', async () => {
      const jobData = {
        id: 17,
        timer_total_hours: '442.0' // Cas réel de l'utilisateur
      };

      const result = await validateJobConsistency(jobData);

      const inconsistency = result.inconsistencies.find(
        inc => inc.type === 'timer_exceeds_reasonable'
      );
      expect(inconsistency?.suggestedFix).toContain('oublié');
    });
  });

  // ============================================
  // INCOHÉRENCE 7: Step vs timer mismatch
  // ============================================
  describe('Incohérence 7: Timer actif mais step = 1', () => {
    it('devrait détecter du temps accumulé à l\'étape 1', async () => {
      const jobData = {
        id: 18,
        current_step: 1,
        timer_total_hours: '15.5',
        timer_started_at: '2025-11-01T10:00:00Z'
      };

      const result = await validateJobConsistency(jobData);

      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'step_mismatch',
          severity: 'warning'
        })
      );
    });

    it('devrait suggérer que l\'utilisateur a oublié d\'avancer', async () => {
      const jobData = {
        id: 19,
        current_step: 1,
        timer_total_hours: '20.0'
      };

      const result = await validateJobConsistency(jobData);

      const inconsistency = result.inconsistencies.find(
        inc => inc.type === 'step_mismatch'
      );
      expect(inconsistency?.suggestedFix).toContain('oublié');
    });
  });

  // ============================================
  // INCOHÉRENCE 8: Pause > temps total
  // ============================================
  describe('Incohérence 8: Temps pause > temps total', () => {
    it('devrait détecter une pause plus longue que le travail', async () => {
      const jobData = {
        id: 20,
        timer_total_hours: '10.0',
        timer_break_hours: '15.0' // Impossible!
      };

      const result = await validateJobConsistency(jobData);

      expect(result.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'break_longer_than_work',
          severity: 'critical'
        })
      );
    });

    it('ne devrait PAS détecter si pause < temps total', async () => {
      const jobData = {
        id: 21,
        timer_total_hours: '10.0',
        timer_break_hours: '2.0' // OK
      };

      const result = await validateJobConsistency(jobData);

      const hasBreakError = result.inconsistencies.some(
        inc => inc.type === 'break_longer_than_work'
      );
      expect(hasBreakError).toBe(false);
    });
  });

  // ============================================
  // CAS MULTIPLES
  // ============================================
  describe('Cas avec incohérences multiples', () => {
    it('devrait détecter plusieurs incohérences simultanément', async () => {
      const jobData = {
        id: 22,
        current_step: 3, // Incohérence 1: pas de timer
        status: 'active',
        timer_started_at: null,
        timer_total_hours: '-5.0', // Incohérence 5: négatif
        timer_break_hours: '10.0' // Incohérence 8 (si total était positif)
      };

      const result = await validateJobConsistency(jobData);

      expect(result.isValid).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThanOrEqual(2);
      
      const types = result.inconsistencies.map(inc => inc.type);
      expect(types).toContain('timer_not_started');
      expect(types).toContain('timer_negative');
    });

    it('devrait prioriser les critical sur les warnings', async () => {
      const jobData = {
        id: 23,
        current_step: 3,
        timer_started_at: null, // critical
        timer_total_hours: '250.0' // warning (exceeds)
      };

      const result = await validateJobConsistency(jobData);

      const criticals = result.inconsistencies.filter(inc => inc.severity === 'critical');
      const warnings = result.inconsistencies.filter(inc => inc.severity === 'warning');
      
      expect(criticals.length).toBeGreaterThan(0);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// TESTS DE RÉCONCILIATION (réseau + local)
// ============================================
describe('Job Validation - Réconciliation données', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('checkNetworkConnectivity', () => {
    it('devrait retourner true si réseau disponible', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const hasNetwork = await checkNetworkConnectivity();

      expect(hasNetwork).toBe(true);
    });

    it('devrait retourner false si réseau indisponible', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const hasNetwork = await checkNetworkConnectivity();

      expect(hasNetwork).toBe(false);
    });

    it('devrait timeout après 5 secondes', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const start = Date.now();
      const hasNetwork = await checkNetworkConnectivity();
      const duration = Date.now() - start;

      expect(hasNetwork).toBe(false);
      expect(duration).toBeLessThan(6000);
    });
  });

  describe('reconcileJobData', () => {
    it('devrait utiliser les données locales si hors-ligne', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Offline'));

      const apiData = { current_step: 3 };
      const localData = { step: 2, notes: 'Local data' };

      const result = await reconcileJobData('JOB-001', apiData, localData);

      expect(result.reconciled).toEqual(localData);
      expect(result.resolution).toContain('Hors-ligne: données locales utilisées');
    });

    it('devrait détecter les conflits step entre API et local', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const apiData = { current_step: 5 };
      const localData = { step: 3 };

      const result = await reconcileJobData('JOB-002', apiData, localData);

      expect(result.hadConflicts).toBe(true);
      expect(result.resolution).toContainEqual(
        expect.stringContaining('Step: API')
      );
    });

    it('devrait fusionner les données sans conflit', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const apiData = { current_step: 3, status: 'active' };
      const localData = { notes: 'Test note' };

      const result = await reconcileJobData('JOB-003', apiData, localData);

      expect(result.hadConflicts).toBe(false);
      expect(result.reconciled).toMatchObject({
        current_step: 3,
        status: 'active',
        notes: 'Test note'
      });
    });

    it('devrait appliquer les corrections en attente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([
        {
          jobId: 'JOB-004',
          correction: { type: 'start_timer', data: {} }
        }
      ]));
      (startJob as jest.Mock).mockResolvedValue({ success: true });

      const result = await reconcileJobData('JOB-004', {}, {});

      expect(result.resolution).toContainEqual(
        expect.stringContaining('corrections hors-ligne appliquées')
      );
      expect(startJob).toHaveBeenCalled();
    });
  });

  describe('applyPendingCorrections', () => {
    it('devrait appliquer toutes les corrections d\'un job', async () => {
      const corrections = [
        { jobId: 'JOB-005', correction: { type: 'start_timer' } },
        { jobId: 'JOB-006', correction: { type: 'start_timer' } }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(corrections));
      (startJob as jest.Mock).mockResolvedValue({ success: true });

      const count = await applyPendingCorrections('JOB-005');

      expect(count).toBe(1);
      expect(startJob).toHaveBeenCalledWith('JOB-005');
    });

    it('devrait nettoyer les corrections appliquées', async () => {
      const corrections = [
        { jobId: 'JOB-007', correction: { type: 'start_timer' } }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(corrections));
      (startJob as jest.Mock).mockResolvedValue({ success: true });

      await applyPendingCorrections('JOB-007');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@job_pending_corrections',
        '[]'
      );
    });

    it('devrait gérer les échecs d\'application', async () => {
      const corrections = [
        { jobId: 'JOB-008', correction: { type: 'start_timer' } }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(corrections));
      (startJob as jest.Mock).mockRejectedValue(new Error('API Error'));

      const count = await applyPendingCorrections('JOB-008');

      expect(count).toBe(0); // Aucune correction appliquée
    });
  });
});

// ============================================
// TESTS DE FORMATAGE
// ============================================
describe('Job Validation - Formatage des rapports', () => {
  it('devrait formater un rapport valide', () => {
    const result: JobValidationResult = {
      isValid: true,
      inconsistencies: [],
      autoCorrected: false
    };

    const report = formatValidationReport(result);

    expect(report).toContain('✅ Job valide');
  });

  it('devrait formater les incohérences critiques avec 🔴', () => {
    const result: JobValidationResult = {
      isValid: false,
      inconsistencies: [
        {
          type: 'timer_not_started',
          severity: 'critical',
          description: 'Timer non démarré',
          detectedAt: new Date().toISOString(),
          jobId: 1,
          currentState: {}
        }
      ],
      autoCorrected: false
    };

    const report = formatValidationReport(result);

    expect(report).toContain('🔴');
    expect(report).toContain('Timer non démarré');
  });

  it('devrait formater les warnings avec 🟡', () => {
    const result: JobValidationResult = {
      isValid: false,
      inconsistencies: [
        {
          type: 'final_step_not_completed',
          severity: 'warning',
          description: 'Job pas complété',
          detectedAt: new Date().toISOString(),
          jobId: 2,
          currentState: {}
        }
      ],
      autoCorrected: false
    };

    const report = formatValidationReport(result);

    expect(report).toContain('🟡');
  });

  it('devrait inclure les suggestions de correction', () => {
    const result: JobValidationResult = {
      isValid: false,
      inconsistencies: [
        {
          type: 'timer_negative',
          severity: 'critical',
          description: 'Temps négatif',
          detectedAt: new Date().toISOString(),
          jobId: 3,
          currentState: {},
          suggestedFix: 'Réinitialiser à 0'
        }
      ],
      autoCorrected: false
    };

    const report = formatValidationReport(result);

    expect(report).toContain('💡 Solution: Réinitialiser à 0');
  });

  it('devrait afficher les auto-corrections', () => {
    const result: JobValidationResult = {
      isValid: false,
      inconsistencies: [],
      autoCorrected: true,
      corrections: ['Timer créé', 'Step synchronisé']
    };

    const report = formatValidationReport(result);

    expect(report).toContain('🔧 Auto-corrections');
    expect(report).toContain('✓ Timer créé');
    expect(report).toContain('✓ Step synchronisé');
  });
});

// ============================================
// TESTS D'INTÉGRATION
// ============================================
describe('Job Validation - Scénarios réels', () => {
  it('SCÉNARIO 1: Job JOB-NERD-URGENT-006 (cas utilisateur)', async () => {
    // Données exactes de l'utilisateur
    const jobData = {
      id: 6,
      code: 'JOB-NERD-URGENT-006',
      current_step: 3,
      status: 'active',
      timer_started_at: null,
      timer_total_hours: '0.00',
      timer_is_running: 0
    };

    (startJob as jest.Mock).mockResolvedValue({ success: true });

    const result = await validateJobConsistency(jobData);

    // Doit détecter l'incohérence
    expect(result.isValid).toBe(false);
    expect(result.inconsistencies).toContainEqual(
      expect.objectContaining({
        type: 'timer_not_started',
        severity: 'critical'
      })
    );

    // Doit auto-corriger
    expect(result.autoCorrected).toBe(true);
    expect(startJob).toHaveBeenCalledWith(6);
  });

  it('SCÉNARIO 2: Job avec 442h accumulées (timer oublié)', async () => {
    const jobData = {
      id: 7,
      current_step: 4,
      timer_total_hours: '442.0',
      timer_is_running: true,
      timer_started_at: '2025-10-01T10:00:00Z'
    };

    const result = await validateJobConsistency(jobData);

    // Doit détecter temps anormal
    expect(result.inconsistencies).toContainEqual(
      expect.objectContaining({
        type: 'timer_exceeds_reasonable'
      })
    );
  });

  it('SCÉNARIO 3: Job complété mais timer toujours actif', async () => {
    const jobData = {
      id: 8,
      current_step: 5,
      status: 'completed',
      timer_is_running: true,
      timer_total_hours: '8.0'
    };

    const result = await validateJobConsistency(jobData);

    expect(result.inconsistencies).toContainEqual(
      expect.objectContaining({
        type: 'timer_running_but_completed'
      })
    );
  });

  it('SCÉNARIO 4: Hors-ligne puis reconnexion', async () => {
    // Phase 1: Hors-ligne, correction stockée
    (startJob as jest.Mock).mockRejectedValueOnce(new Error('Offline'));

    const jobData = {
      id: 9,
      current_step: 2,
      timer_started_at: null
    };

    await validateJobConsistency(jobData);

    expect(AsyncStorage.setItem).toHaveBeenCalled();

    // Phase 2: Reconnexion, correction appliquée
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    (startJob as jest.Mock).mockResolvedValue({ success: true });

    const count = await applyPendingCorrections(9);

    expect(count).toBeGreaterThan(0);
  });

  it('SCÉNARIO 5: Job valide (aucune incohérence)', async () => {
    const jobData = {
      id: 10,
      code: 'JOB-PERFECT',
      current_step: 3,
      status: 'active',
      timer_started_at: '2025-11-04T10:00:00Z',
      timer_total_hours: '5.5',
      timer_break_hours: '0.5',
      timer_is_running: true
    };

    const result = await validateJobConsistency(jobData);

    expect(result.isValid).toBe(true);
    expect(result.inconsistencies).toHaveLength(0);
    expect(result.autoCorrected).toBe(false);
  });
});

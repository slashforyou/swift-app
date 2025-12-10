/**
 * useModuleAccess - Hook pour gérer l'accès aux modules
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type ModuleId = 'module1' | 'module2' | 'module3' | 'module4' | 'module5';

export interface ModuleAccess {
  id: ModuleId;
  title: string;
  description: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number;
  requiredModules?: ModuleId[];
}

export const useModuleAccess = () => {
  const { user, isAuthenticated } = useAuth();
  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration des modules
  const moduleConfig: ModuleAccess[] = [
    {
      id: 'module1',
      title: 'Module 1: Fondamentaux',
      description: 'Introduction aux concepts de base',
      isUnlocked: true, // Toujours accessible
      isCompleted: false,
      progress: 0,
    },
    {
      id: 'module2',
      title: 'Module 2: Paiements',
      description: 'Gestion des paiements et transactions',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      requiredModules: ['module1'],
    },
    {
      id: 'module3',
      title: 'Module 3: Avancé',
      description: 'Fonctionnalités avancées et optimisations',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      requiredModules: ['module1', 'module2'],
    },
    {
      id: 'module4',
      title: 'Module 4: Analytics',
      description: 'Analyse et reporting avancé',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      requiredModules: ['module2'],
    },
    {
      id: 'module5',
      title: 'Module 5: Expert',
      description: 'Niveau expert et cas complexes',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      requiredModules: ['module3', 'module4'],
    },
  ];

  const checkModuleAccess = (moduleId: ModuleId, completedModules: ModuleId[]): boolean => {
    const module = moduleConfig.find(m => m.id === moduleId);
    if (!module || !module.requiredModules) return true;
    
    return module.requiredModules.every(requiredId => 
      completedModules.includes(requiredId)
    );
  };

  const loadModuleAccess = async () => {
    if (!isAuthenticated || !user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simuler le chargement depuis l'API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Données simulées pour l'exemple
      const userProgress = {
        completedModules: ['module1'] as ModuleId[],
        moduleProgress: {
          module1: 100,
          module2: 45,
          module3: 0,
          module4: 0,
          module5: 0,
        },
      };

      const updatedModules = moduleConfig.map(module => ({
        ...module,
        isUnlocked: module.id === 'module1' || checkModuleAccess(module.id, userProgress.completedModules),
        isCompleted: userProgress.completedModules.includes(module.id),
        progress: userProgress.moduleProgress[module.id] || 0,
      }));

      setModules(updatedModules);
    } catch (err) {
      setError('Erreur lors du chargement des modules');
      console.error('Erreur module access:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeModule = async (moduleId: ModuleId): Promise<boolean> => {
    try {
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      if (moduleIndex === -1) return false;

      // Simuler l'API
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        isCompleted: true,
        progress: 100,
      };

      // Déverrouiller les modules suivants
      const completedModuleIds = updatedModules
        .filter(m => m.isCompleted)
        .map(m => m.id);

      updatedModules.forEach((module, index) => {
        if (!module.isCompleted) {
          updatedModules[index] = {
            ...module,
            isUnlocked: module.id === 'module1' || checkModuleAccess(module.id, completedModuleIds),
          };
        }
      });

      setModules(updatedModules);
      return true;
    } catch (err) {
      console.error('Erreur completion module:', err);
      return false;
    }
  };

  const updateModuleProgress = async (moduleId: ModuleId, progress: number): Promise<void> => {
    try {
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      if (moduleIndex === -1) return;

      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        progress: Math.min(100, Math.max(0, progress)),
        isCompleted: progress >= 100,
      };

      setModules(updatedModules);

      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error('Erreur mise à jour progress:', err);
    }
  };

  const getModule = (moduleId: ModuleId): ModuleAccess | undefined => {
    return modules.find(m => m.id === moduleId);
  };

  const getUnlockedModules = (): ModuleAccess[] => {
    return modules.filter(m => m.isUnlocked);
  };

  const getCompletedModules = (): ModuleAccess[] => {
    return modules.filter(m => m.isCompleted);
  };

  const getTotalProgress = (): number => {
    if (modules.length === 0) return 0;
    const totalProgress = modules.reduce((sum, module) => sum + module.progress, 0);
    return Math.round(totalProgress / modules.length);
  };

  useEffect(() => {
    loadModuleAccess();
  }, [isAuthenticated, user]);

  return {
    modules,
    loading,
    error,
    completeModule,
    updateModuleProgress,
    getModule,
    getUnlockedModules,
    getCompletedModules,
    getTotalProgress,
    refresh: loadModuleAccess,
  };
};
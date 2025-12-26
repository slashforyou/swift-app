/**
 * useJobTemplates - Hook pour la gestion des templates de jobs
 * Gère l'état des templates avec API intégrée
 */
import { useCallback, useEffect, useState } from 'react';
import {
    createJobTemplate,
    deleteJobTemplate,
    duplicateJobTemplate,
    fetchJobTemplates,
    updateJobTemplate,
    type JobTemplate,
    type TemplateCreateData,
} from '../../services/business';

interface UseJobTemplatesReturn {
  // État
  templates: JobTemplate[];
  
  // États de chargement
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  
  // État d'erreur
  error: string | null;
  
  // Actions
  loadTemplates: () => Promise<void>;
  createTemplate: (templateData: TemplateCreateData) => Promise<JobTemplate | null>;
  duplicateTemplate: (templateId: string) => Promise<JobTemplate | null>;
  updateTemplate: (templateId: string, updates: Partial<TemplateCreateData>) => Promise<JobTemplate | null>;
  removeTemplate: (templateId: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  clearError: () => void;
  
  // Utilitaires
  getTemplatesByType: (type: string) => JobTemplate[];
  searchTemplates: (query: string) => JobTemplate[];
  getTemplateStats: () => {
    total: number;
    byType: Record<string, number>;
    mostUsed: JobTemplate[];
  };
}

export const useJobTemplates = (): UseJobTemplatesReturn => {
  // États
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la liste des templates
   */
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const templatesList = await fetchJobTemplates();
      setTemplates(templatesList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée un nouveau template
   */
  const createTemplate = useCallback(async (
    templateData: TemplateCreateData
  ): Promise<JobTemplate | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newTemplate = await createJobTemplate(templateData);
      
      // Ajouter à la liste
      setTemplates(prev => [...prev, newTemplate]);
      
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      console.error('Error creating template:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Duplique un template existant
   */
  const duplicateTemplate = useCallback(async (
    templateId: string
  ): Promise<JobTemplate | null> => {
    try {
      setIsDuplicating(true);
      setError(null);
      
      const duplicatedTemplate = await duplicateJobTemplate(templateId);
      
      // Ajouter à la liste
      setTemplates(prev => [...prev, duplicatedTemplate]);
      
      return duplicatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate template';
      setError(errorMessage);
      console.error('Error duplicating template:', err);
      return null;
    } finally {
      setIsDuplicating(false);
    }
  }, []);

  /**
   * Met à jour un template existant
   */
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<TemplateCreateData>
  ): Promise<JobTemplate | null> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedTemplate = await updateJobTemplate(templateId, updates);
      
      // Mettre à jour la liste
      setTemplates(prev => 
        prev.map(t => t.id === templateId ? updatedTemplate : t)
      );
      
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      console.error('Error updating template:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Supprime un template
   */
  const removeTemplate = useCallback(async (templateId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteJobTemplate(templateId);
      
      // Retirer de la liste
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      console.error('Error deleting template:', err);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  /**
   * Actualise la liste des templates
   */
  const refreshTemplates = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Filtre les templates par catégorie
   */
  const getTemplatesByType = useCallback((category: string): JobTemplate[] => {
    return templates.filter(template => 
      template.category?.toLowerCase().includes(category.toLowerCase())
    );
  }, [templates]);

  /**
   * Recherche dans les templates
   */
  const searchTemplates = useCallback((query: string): JobTemplate[] => {
    const searchLower = query.toLowerCase();
    return templates.filter(template => 
      template.name?.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      template.category?.toLowerCase().includes(searchLower)
    );
  }, [templates]);

  /**
   * Calcule les statistiques des templates
   */
  const getTemplateStats = useCallback(() => {
    const byType: Record<string, number> = {};
    
    templates.forEach(template => {
      const category = template.category || 'Unknown';
      byType[category] = (byType[category] || 0) + 1;
    });

    // Templates les plus utilisés (simulation basée sur created_at récent)
    const mostUsed = [...templates]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return {
      total: templates.length,
      byType,
      mostUsed,
    };
  }, [templates]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    // État
    templates,
    
    // États de chargement
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isDuplicating,
    
    // État d'erreur
    error,
    
    // Actions
    loadTemplates,
    createTemplate,
    duplicateTemplate,
    updateTemplate,
    removeTemplate,
    refreshTemplates,
    clearError,
    
    // Utilitaires
    getTemplatesByType,
    searchTemplates,
    getTemplateStats,
  };
};
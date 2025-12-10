/**
 * TemplatesService - Service API pour la gestion des templates de jobs
 * Utilise les endpoints Quote Management pour les templates
 */
import { ServerData } from '../../constants/ServerData';
import { fetchWithAuth } from '../../utils/session';

// Mock data pour fallback
const mockTemplates: JobTemplate[] = [
  {
    id: 'template-001',
    name: 'Standard Residential Move',
    category: 'residential',
    description: 'Complete residential moving service for 2-3 bedroom homes',
    estimatedDuration: '4-6 hours',
    basePrice: 800,
    inclusions: ['Packing materials', 'Furniture protection', 'Basic insurance', 'Loading/unloading'],
    requirements: {
      staff: 3,
      vehicles: ['moving-truck'],
      equipment: ['trolleys', 'blankets', 'straps']
    },
    pricing: {
      type: 'hourly',
      rate: 120,
      minimumCharge: 400
    },
    isTemplate: true,
    created_at: '2023-01-10T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: 'template-002',
    name: 'Office Relocation',
    category: 'commercial',
    description: 'Professional office moving service with IT equipment care',
    estimatedDuration: '6-8 hours',
    basePrice: 1200,
    inclusions: ['IT equipment packing', 'Document boxes', 'Furniture dismantling/assembly', 'Insurance'],
    requirements: {
      staff: 4,
      vehicles: ['moving-truck', 'van'],
      equipment: ['IT containers', 'office trolleys', 'assembly tools']
    },
    pricing: {
      type: 'fixed',
      rate: 1200,
      minimumCharge: 1200
    },
    isTemplate: true,
    created_at: '2023-02-15T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: 'template-003',
    name: 'Packing Service Only',
    category: 'packing',
    description: 'Professional packing service without transport',
    estimatedDuration: '2-4 hours',
    basePrice: 300,
    inclusions: ['All packing materials', 'Fragile item protection', 'Labeling system'],
    requirements: {
      staff: 2,
      vehicles: [],
      equipment: ['packing materials', 'labels', 'bubble wrap']
    },
    pricing: {
      type: 'hourly',
      rate: 80,
      minimumCharge: 200
    },
    isTemplate: true,
    created_at: '2023-03-01T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  }
];

// Types Templates
export interface JobTemplate {
  id: string;
  name: string;
  category: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  description: string;
  estimatedDuration: string;
  basePrice: number;
  inclusions: string[];
  requirements: {
    staff: number;
    vehicles: string[];
    equipment: string[];
  };
  pricing: {
    type: 'fixed' | 'hourly' | 'volume-based';
    rate: number;
    minimumCharge: number;
  };
  isTemplate: boolean; // Distingue templates des quotes
  created_at: string;
  updated_at: string;
}

export interface TemplateCreateData {
  name: string;
  category: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  description: string;
  estimatedDuration: string;
  basePrice: number;
  inclusions: string[];
  requirements: {
    staff: number;
    vehicles: string[];
    equipment: string[];
  };
  pricing: {
    type: 'fixed' | 'hourly' | 'volume-based';
    rate: number;
    minimumCharge: number;
  };
}

// API Response Types
interface TemplateResponse {
  success: boolean;
  quote: JobTemplate; // API uses 'quote' field for templates
}

interface TemplateListResponse {
  success: boolean;
  quotes: JobTemplate[]; // API uses 'quotes' field for templates
}

/**
 * Récupère la liste des templates de jobs
 */
export const fetchJobTemplates = async (): Promise<JobTemplate[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quotes?type=template`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (__DEV__) {
        console.warn('⚠️ [DEV] Templates API not available, using mock data');
        return mockTemplates;
      } else {
        throw new Error(`Templates API error: ${response.status}`);
      }
    }

    const data: TemplateListResponse = await response.json();
    
    if (!data.success) {
      if (__DEV__) {
        console.warn('⚠️ [DEV] Templates API returned success: false, using mock data');
        return mockTemplates;
      } else {
        throw new Error('Templates API returned unsuccessful response');
      }
    }

    // Filtrer seulement les templates (si l'API renvoie aussi des quotes normaux)
    const templates = (data.quotes || []).filter(quote => quote.isTemplate);
    
    if (templates.length === 0) {
      console.log('ℹ️ No templates found in API response');
      return __DEV__ ? mockTemplates : [];
    }
    
    console.log(`✅ Retrieved ${templates.length} job templates from API`);
    return templates;
  } catch (error) {
    console.error('❌ Error fetching job templates:', error);
    if (__DEV__) {
      console.warn('🔄 Using mock job templates as fallback in DEV mode');
      return mockTemplates;
    } else {
      throw new Error('Failed to fetch job templates from API');
    }
  }
};

/**
 * Récupère les détails d'un template par ID
 */
export const fetchTemplateDetails = async (templateId: string): Promise<JobTemplate> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${templateId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TemplateResponse = await response.json();
    
    if (!data.success || !data.quote) {
      throw new Error('API returned invalid template data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error fetching template details:', error);
    throw new Error('Failed to fetch template details');
  }
};

/**
 * Crée un nouveau template de job
 */
export const createJobTemplate = async (templateData: TemplateCreateData): Promise<JobTemplate> => {
  try {
    // Ajouter le flag isTemplate pour distinguer des quotes normaux
    const templatePayload = {
      ...templateData,
      isTemplate: true,
    };

    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatePayload),
    });

    if (!response.ok) {
      console.warn('Template creation API not available, creating mock template');
      const mockTemplate: JobTemplate = {
        id: `template-${Date.now()}`,
        ...templateData,
        isTemplate: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockTemplate;
    }

    const data: TemplateResponse = await response.json();
    
    if (!data.success || !data.quote) {
      if (__DEV__) {
        console.warn('Template creation API returned invalid data, creating mock template');
        const mockTemplate: JobTemplate = {
          id: `template-${Date.now()}`,
          ...templateData,
          isTemplate: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return mockTemplate;
      }
      throw new Error('Template creation API returned invalid data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error creating job template:', error);
    if (__DEV__) {
      console.warn('Creating mock job template as fallback in DEV mode');
      const mockTemplate: JobTemplate = {
        id: `template-${Date.now()}`,
        ...templateData,
        isTemplate: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockTemplate;
    }
    throw new Error(`Failed to create job template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Met à jour un template existant
 */
export const updateJobTemplate = async (
  templateId: string,
  updates: Partial<TemplateCreateData>
): Promise<JobTemplate> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TemplateResponse = await response.json();
    
    if (!data.success || !data.quote) {
      throw new Error('API returned invalid template data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error updating job template:', error);
    throw new Error('Failed to update job template');
  }
};

/**
 * Supprime un template
 */
export const deleteJobTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${templateId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    console.error('Error deleting job template:', error);
    throw new Error('Failed to delete job template');
  }
};

/**
 * Duplique un template existant
 */
export const duplicateJobTemplate = async (templateId: string, newName?: string): Promise<JobTemplate> => {
  try {
    // Récupérer le template existant
    const existingTemplate = await fetchTemplateDetails(templateId);
    
    // Créer une copie avec un nouveau nom
    const duplicateData: TemplateCreateData = {
      name: newName || `${existingTemplate.name} (Copy)`,
      category: existingTemplate.category,
      description: existingTemplate.description,
      estimatedDuration: existingTemplate.estimatedDuration,
      basePrice: existingTemplate.basePrice,
      inclusions: [...existingTemplate.inclusions],
      requirements: {
        staff: existingTemplate.requirements.staff,
        vehicles: [...existingTemplate.requirements.vehicles],
        equipment: [...existingTemplate.requirements.equipment],
      },
      pricing: { ...existingTemplate.pricing },
    };

    return await createJobTemplate(duplicateData);
  } catch (error) {
    console.error('Error duplicating job template:', error);
    throw new Error('Failed to duplicate job template');
  }
};
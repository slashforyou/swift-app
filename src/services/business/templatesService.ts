/**
 * TemplatesService - Service API pour la gestion des templates de jobs
 * Utilise les endpoints Quote Management pour les templates
 */
import { ServerData } from '../../constants/ServerData';
import type { ModularJobTemplate } from '../../types/jobSegment';
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
        return mockTemplates;
      } else {
        throw new Error(`Templates API error: ${response.status}`);
      }
    }

    const data: TemplateListResponse = await response.json();
    
    if (!data.success) {
      if (__DEV__) {
        return mockTemplates;
      } else {
        throw new Error('Templates API returned unsuccessful response');
      }
    }

    // Filtrer seulement les templates (si l'API renvoie aussi des quotes normaux)
    const templates = (data.quotes || []).filter(quote => quote.isTemplate);
    
    if (templates.length === 0) {
      return __DEV__ ? mockTemplates : [];
    }
    
    return templates;
  } catch (error) {

    console.error('❌ Error fetching job templates:', error);
    if (__DEV__) {
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

// ============================================================================
// TEMPLATES MODULAIRES — CRUD
// ============================================================================

interface ModularTemplateListResponse {
  success: boolean;
  templates: ModularJobTemplate[];
}

interface ModularTemplateResponse {
  success: boolean;
  template: ModularJobTemplate;
}

/**
 * Récupère la liste des templates modulaires de la company
 */
export const fetchModularTemplates = async (): Promise<ModularJobTemplate[]> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/templates/modular`,
      { method: 'GET' },
    );

    if (!response.ok) {
      if (__DEV__) return getDefaultModularTemplates();
      throw new Error(`Modular templates API error: ${response.status}`);
    }

    const data: ModularTemplateListResponse = await response.json();
    if (!data.success) {
      if (__DEV__) return getDefaultModularTemplates();
      throw new Error('Modular templates API returned unsuccessful response');
    }

    return data.templates.length > 0
      ? data.templates
      : __DEV__
        ? getDefaultModularTemplates()
        : [];
  } catch (error) {
    console.error('❌ Error fetching modular templates:', error);
    if (__DEV__) return getDefaultModularTemplates();
    throw new Error('Failed to fetch modular templates from API');
  }
};

/**
 * Crée un nouveau template modulaire
 */
export const createModularTemplate = async (
  data: Omit<ModularJobTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ModularJobTemplate> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/templates/modular`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ModularTemplateResponse = await response.json();
    if (!result.success || !result.template) {
      throw new Error('API returned invalid modular template data');
    }
    return result.template;
  } catch (error) {
    console.error('Error creating modular template:', error);
    throw new Error('Failed to create modular template');
  }
};

/**
 * Met à jour un template modulaire existant
 */
export const updateModularTemplate = async (
  id: string,
  updates: Partial<ModularJobTemplate>,
): Promise<ModularJobTemplate> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/templates/modular/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ModularTemplateResponse = await response.json();
    if (!result.success || !result.template) {
      throw new Error('API returned invalid modular template data');
    }
    return result.template;
  } catch (error) {
    console.error('Error updating modular template:', error);
    throw new Error('Failed to update modular template');
  }
};

/**
 * Supprime un template modulaire
 */
export const deleteModularTemplate = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/templates/modular/${id}`,
      { method: 'DELETE' },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    console.error('Error deleting modular template:', error);
    throw new Error('Failed to delete modular template');
  }
};

/**
 * Récupère un template modulaire par ID
 */
export const fetchModularTemplate = async (id: string): Promise<ModularJobTemplate> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/templates/modular/${id}`,
      { method: 'GET' },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ModularTemplateResponse = await response.json();
    if (!data.success || !data.template) {
      throw new Error('API returned invalid modular template data');
    }
    return data.template;
  } catch (error) {
    console.error('Error fetching modular template:', error);
    throw new Error('Failed to fetch modular template');
  }
};

// ============================================================================
// TEMPLATES MODULAIRES PAR DÉFAUT
// ============================================================================

const now = new Date().toISOString();

/**
 * 8 templates par défaut : 5 convertis de l'existant + 3 nouveaux
 */
export function getDefaultModularTemplates(): ModularJobTemplate[] {
  return [
    // 1. Simple Move
    {
      id: 'default-simple-move',
      name: 'Simple Move',
      description: 'Direct move from one address to another',
      category: 'residential',
      billingMode: 'location_to_location',
      segments: [
        { id: 'seg-1', order: 1, type: 'travel', label: 'Travel to Location #1', isBillable: false },
        { id: 'seg-2', order: 2, type: 'location', label: 'Location #1', locationType: 'house', isBillable: true, estimatedDurationMinutes: 60, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-3', order: 3, type: 'travel', label: 'Travel to Location #2', isBillable: true, estimatedDurationMinutes: 30, requiredRoles: ['driver'] },
        { id: 'seg-4', order: 4, type: 'location', label: 'Location #2', locationType: 'apartment', isBillable: true, estimatedDurationMinutes: 60, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-5', order: 5, type: 'travel', label: 'Return trip', isBillable: false },
      ],
      defaultHourlyRate: 120,
      minimumHours: 2,
      timeRoundingMinutes: 15,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // 2. Multiple Addresses
    {
      id: 'default-multi-stop',
      name: 'Multiple Addresses',
      description: 'Move with multiple pickup/dropoff points',
      category: 'residential',
      billingMode: 'location_to_location',
      segments: [
        { id: 'seg-1', order: 1, type: 'travel', label: 'Travel to Location #1', isBillable: false },
        { id: 'seg-2', order: 2, type: 'location', label: 'Location #1', locationType: 'house', isBillable: true, estimatedDurationMinutes: 60, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-3', order: 3, type: 'travel', label: 'Travel to Location #2', isBillable: true, estimatedDurationMinutes: 20 },
        { id: 'seg-4', order: 4, type: 'location', label: 'Location #2', locationType: 'apartment', isBillable: true, estimatedDurationMinutes: 45, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-5', order: 5, type: 'travel', label: 'Travel to Location #3', isBillable: true, estimatedDurationMinutes: 20 },
        { id: 'seg-6', order: 6, type: 'location', label: 'Location #3', locationType: 'house', isBillable: true, estimatedDurationMinutes: 45, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-7', order: 7, type: 'travel', label: 'Return trip', isBillable: false },
      ],
      defaultHourlyRate: 120,
      minimumHours: 2,
      timeRoundingMinutes: 15,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // 3. With Storage
    {
      id: 'default-with-storage',
      name: 'With Storage',
      description: 'Move with storage at depot',
      category: 'storage',
      billingMode: 'location_to_location',
      segments: [
        { id: 'seg-1', order: 1, type: 'travel', label: 'Travel to Location #1', isBillable: false },
        { id: 'seg-2', order: 2, type: 'location', label: 'Location #1', locationType: 'house', isBillable: true, estimatedDurationMinutes: 60, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-3', order: 3, type: 'travel', label: 'Travel to Location #2', isBillable: true, estimatedDurationMinutes: 30 },
        { id: 'seg-4', order: 4, type: 'location', label: 'Location #2', locationType: 'apartment', isBillable: true, estimatedDurationMinutes: 60, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-5', order: 5, type: 'travel', label: 'Return to depot', isBillable: false },
        { id: 'seg-6', order: 6, type: 'storage', label: 'Storage drop-off', locationType: 'depot', isBillable: true, estimatedDurationMinutes: 45, requiredRoles: ['driver', 'offsider'] },
      ],
      defaultHourlyRate: 120,
      minimumHours: 2,
      timeRoundingMinutes: 15,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // 4. Simple Delivery
    {
      id: 'default-delivery-only',
      name: 'Simple Delivery',
      description: 'Delivery from depot',
      category: 'commercial',
      billingMode: 'depot_to_depot',
      segments: [
        { id: 'seg-1', order: 1, type: 'loading', label: 'Loading at depot', locationType: 'depot', isBillable: true, estimatedDurationMinutes: 20, requiredRoles: ['driver'] },
        { id: 'seg-2', order: 2, type: 'travel', label: 'Travel to location', isBillable: true, estimatedDurationMinutes: 30, requiredRoles: ['driver'] },
        { id: 'seg-3', order: 3, type: 'location', label: 'Delivery address', locationType: 'house', isBillable: true, estimatedDurationMinutes: 30, requiredRoles: ['driver'] },
        { id: 'seg-4', order: 4, type: 'travel', label: 'Return to depot', isBillable: true, isReturnTrip: true } as any,
      ],
      defaultHourlyRate: 120,
      minimumHours: 2,
      timeRoundingMinutes: 15,
      returnTripDefaultMinutes: 30,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // 5. Packing/Unpacking
    {
      id: 'default-packing-only',
      name: 'Packing/Unpacking',
      description: 'On-site packing and unpacking service',
      category: 'packing',
      billingMode: 'packing_only',
      segments: [
        { id: 'seg-1', order: 1, type: 'travel', label: 'Travel to location', isBillable: false },
        { id: 'seg-2', order: 2, type: 'location', label: 'Location (packing)', locationType: 'house', isBillable: true, estimatedDurationMinutes: 120, requiredRoles: ['packer'] },
        { id: 'seg-3', order: 3, type: 'travel', label: 'Return trip', isBillable: false },
      ],
      defaultHourlyRate: 80,
      minimumHours: 2,
      timeRoundingMinutes: 15,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // 6. Standard Flat Rate
    {
      id: 'default-flat-rate',
      name: 'Standard Flat Rate',
      description: 'Complete move at a fixed price',
      category: 'residential',
      billingMode: 'flat_rate',
      segments: [
        { id: 'seg-1', order: 1, type: 'travel', label: 'Travel to Location #1', isBillable: false },
        { id: 'seg-2', order: 2, type: 'location', label: 'Location #1', locationType: 'house', isBillable: false, estimatedDurationMinutes: 120, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-3', order: 3, type: 'travel', label: 'Travel to Location #2', isBillable: false, estimatedDurationMinutes: 30 },
        { id: 'seg-4', order: 4, type: 'location', label: 'Location #2', locationType: 'apartment', isBillable: false, estimatedDurationMinutes: 90, requiredRoles: ['driver', 'offsider'] },
        { id: 'seg-5', order: 5, type: 'travel', label: 'Return trip', isBillable: false },
      ],
      flatRateAmount: 2500,
      flatRateMaxHours: 8,
      flatRateOverageRate: 150,
      flatRateOptions: [
        { id: 'opt-1', label: 'Piano', price: 200 },
        { id: 'opt-2', label: 'Bed disassembly', price: 80 },
        { id: 'opt-3', label: 'Fragile wrapping', price: 120 },
      ],
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

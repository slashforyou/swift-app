// services/jobDetails.ts
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';
import { getMockJobDetails } from './jobDetailsMockData';

const API = ServerData.serverUrl;

// Flag pour utiliser les données mock (développement/test)
const USE_MOCK_DATA = __DEV__;

// Types pour les données complètes d'un job
export interface JobDetailsComplete {
  // Informations de base du job
  job: JobInfo;
  
  // Informations du client
  client: ClientInfo;
  
  // Équipe assignée
  crew: CrewMember[];
  
  // Camions assignés
  trucks: TruckInfo[];
  
  // Articles/items du job
  items: JobItem[];
  
  // Notes du job
  notes: JobNote[];
  
  // Timeline/historique
  timeline: TimelineEvent[];
  
  // Photos et médias
  media: JobMedia[];
  
  // Adresses du job
  addresses: JobAddress[];
}

// Interface pour les adresses
export interface JobAddress {
  id: string;
  type: 'pickup' | 'dropoff' | 'stop';
  street: string;
  city: string;
  state: string;
  zip: string;
  position?: {
    latitude: number;
    longitude: number;
  };
}

export interface JobInfo {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Dates
  createdAt: string;
  updatedAt: string;
  scheduledDate: string;
  startDate?: string;
  endDate?: string;
  
  // Adresses
  pickupAddress: string;
  deliveryAddress: string;
  
  // Informations financières
  estimatedDuration: number; // en minutes
  actualDuration?: number;
  estimatedCost: number;
  actualCost?: number;
  
  // Métadonnées
  clientId: string;
  createdBy: string;
  assignedTo?: string;
  
  // Statuts spécialisés
  isArchived: boolean;
  isUrgent: boolean;
  requiresSignature: boolean;
  
  // Coordonnées GPS
  pickupCoordinates?: {
    latitude: number;
    longitude: number;
  };
  deliveryCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  
  // Informations supplémentaires
  company?: string;
  contactPerson?: string;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  
  // Historique
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  
  // Statut
  isActive: boolean;
  createdAt: string;
}

export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'driver' | 'helper' | 'supervisor' | 'technician';
  
  // Statut pour ce job
  assignedAt: string;
  assignedBy: string;
  status: 'assigned' | 'confirmed' | 'en-route' | 'on-site' | 'completed';
  
  // Informations complémentaires
  experience: number; // années
  rating: number;
  availability: 'available' | 'busy' | 'off-duty';
}

export interface TruckInfo {
  id: string;
  name: string;
  plateNumber: string;
  model: string;
  capacity: number; // en m³
  
  // Statut pour ce job
  assignedAt: string;
  status: 'assigned' | 'en-route' | 'on-site' | 'loaded' | 'completed';
  
  // Informations techniques
  fuelLevel?: number;
  mileage?: number;
  lastMaintenance?: string;
  isOperational: boolean;
  
  // Coordonnées actuelles
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    updatedAt: string;
  };
}

export interface JobItem {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Quantité et dimensions
  quantity: number;
  unit: 'pieces' | 'boxes' | 'm³' | 'kg' | 'liters';
  
  // Dimensions physiques
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  
  // Statut
  status: 'pending' | 'packed' | 'loaded' | 'in-transit' | 'delivered';
  
  // Informations spéciales
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  instructions?: string;
  
  // Prix
  estimatedValue?: number;
  
  // Métadonnées
  addedAt: string;
  updatedAt: string;
}

export interface JobNote {
  id: string;
  content: string;
  type: 'general' | 'issue' | 'instruction' | 'update' | 'completion';
  
  // Auteur
  authorId: string;
  authorName: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  
  // Métadonnées
  isInternal: boolean; // visible seulement par l'équipe
  isPinned: boolean;
  
  // Attachments
  attachments?: {
    id: string;
    filename: string;
    url: string;
    type: 'image' | 'document' | 'video';
  }[];
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'started' | 'paused' | 'resumed' | 'completed' | 'updated' | 'note_added';
  title: string;
  description: string;
  
  // Timestamp
  occurredAt: string;
  
  // Acteur
  userId: string;
  userName: string;
  
  // Données associées
  metadata?: {
    oldValue?: any;
    newValue?: any;
    changes?: string[];
    [key: string]: any; // ✅ Allow flexible properties
  };
}

export interface JobMedia {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'signature';
  
  // Métadonnées
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  
  // Informations contextuelles
  description?: string;
  location?: 'pickup' | 'delivery' | 'in-transit' | 'damage' | 'completion';
  
  // Pour les images
  thumbnailUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Récupère toutes les données complètes d'un job par ID
 * Utilise l'endpoint calendar-days optimisé qui retourne toutes les données d'un coup
 */
export async function fetchJobDetails(jobId: string): Promise<JobDetailsComplete> {
  // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] === FETCHING COMPLETE JOB DATA ===');
  // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Job ID:', jobId);
  // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] USE_MOCK_DATA:', USE_MOCK_DATA);
  
  // Mode développement avec données mock
  if (USE_MOCK_DATA) {return await getMockJobDetails(jobId);
  }
  
  try {
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Using optimized calendar-days endpoint...');
    
    // D'abord, récupérer le job de base pour avoir sa date
    const jobResponse = await authenticatedFetch(`${API}v1/job/${jobId}`, { method: 'GET' });
    
    if (!jobResponse.ok) {
      throw new Error(`Failed to fetch job: ${jobResponse.status}`);
    }
    
    const basicJobData = await jobResponse.json();
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Basic job data received:', { id: basicJobData.id, scheduledDate: basicJobData.scheduledDate });
    
    // Utiliser la date du job pour récupérer toutes les données complètes via calendar-days
    const jobDate = new Date(basicJobData.scheduledDate || basicJobData.created_at || new Date());
    
    // Préparer la requête calendar-days pour ce jour spécifique
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const requestBody = {
      startDate: formatDate(jobDate),
      endDate: formatDate(jobDate)
    };
    
    // TEMP_DISABLED: console.log('� [JOB DETAILS] Fetching complete job data via calendar-days for date:', formatDate(jobDate));
    
    const calendarResponse = await authenticatedFetch(`${API}calendar-days`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    if (!calendarResponse.ok) {
      console.warn('⚠️ Calendar-days failed, falling back to individual endpoints');
      return await fetchJobDetailsClassic(jobId);
    }
    
    const calendarData = await calendarResponse.json();
    const jobs = calendarData.jobs || calendarData || [];
    
    // TEMP_DISABLED: console.log('✅ [JOB DETAILS] Calendar-days response received, jobs count:', jobs.length);
    
    // Trouver notre job spécifique dans la réponse
    const targetJob = jobs.find((job: any) => job.id === jobId || job.id === parseInt(jobId));
    
    if (!targetJob) {
      console.warn('⚠️ Job not found in calendar-days response, falling back to individual endpoints');
      return await fetchJobDetailsClassic(jobId);
    }
    
    // TEMP_DISABLED: console.log('🎯 [JOB DETAILS] Target job found in calendar response:', targetJob.title || targetJob.name);
    // TEMP_DISABLED: console.log('🎯 [JOB DETAILS] Full targetJob structure:', JSON.stringify(targetJob, null, 2));
    
    // Normaliser les données complètes reçues de calendar-days
    const completeJobDetails: JobDetailsComplete = {
      job: normalizeJobInfo(targetJob),
      client: targetJob.client ? normalizeClientInfo(targetJob.client) : getDefaultClient(targetJob.clientId || ''),
      crew: (targetJob.crew || []).map(normalizeCrewMember),
      trucks: (targetJob.trucks || []).map(normalizeTruckInfo),
      items: (targetJob.items || []).map(normalizeJobItem),
      notes: (targetJob.notes || []).map(normalizeJobNote),
      timeline: (targetJob.timeline || []).map(normalizeTimelineEvent),
      media: (targetJob.media || []).map(normalizeJobMedia),
      addresses: (targetJob.addresses || []).map(normalizeJobAddress) // Ajouter le support des adresses
    };
    
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] ✅ Complete job details assembled from calendar-days successfully');
    return completeJobDetails;
    
  } catch (error) {

    console.error('❌ [JOB DETAILS] Error fetching job details via calendar-days:', error);
    // TEMP_DISABLED: console.log('🔄 [JOB DETAILS] Falling back to classic endpoint approach...');
    return await fetchJobDetailsClassic(jobId);
  }
}

// Fonctions de normalisation pour assurer la cohérence des données

function normalizeJobInfo(apiData: any): JobInfo {
  return {
    id: apiData.id?.toString() || '',
    title: apiData.title || apiData.name || 'Job sans titre',
    description: apiData.description || '',
    status: apiData.status || 'pending',
    priority: apiData.priority || 'medium',
    
    createdAt: apiData.createdAt || apiData.created_at || '',
    updatedAt: apiData.updatedAt || apiData.updated_at || '',
    scheduledDate: apiData.scheduledDate || apiData.scheduled_date || '',
    startDate: apiData.startDate || apiData.start_date,
    endDate: apiData.endDate || apiData.end_date,
    
    pickupAddress: apiData.pickupAddress || apiData.pickup_address || '',
    deliveryAddress: apiData.deliveryAddress || apiData.delivery_address || '',
    
    estimatedDuration: apiData.estimatedDuration || apiData.estimated_duration || 0,
    actualDuration: apiData.actualDuration || apiData.actual_duration,
    estimatedCost: apiData.estimatedCost || apiData.estimated_cost || 0,
    actualCost: apiData.actualCost || apiData.actual_cost,
    
    clientId: apiData.clientId || apiData.client_id || '',
    createdBy: apiData.createdBy || apiData.created_by || '',
    assignedTo: apiData.assignedTo || apiData.assigned_to,
    
    isArchived: apiData.isArchived || apiData.is_archived || false,
    isUrgent: apiData.isUrgent || apiData.is_urgent || apiData.priority === 'urgent',
    requiresSignature: apiData.requiresSignature || apiData.requires_signature || false,
    
    pickupCoordinates: apiData.pickupCoordinates || apiData.pickup_coordinates,
    deliveryCoordinates: apiData.deliveryCoordinates || apiData.delivery_coordinates
  };
}

function normalizeClientInfo(apiData: any): ClientInfo {
  return {
    id: apiData.id?.toString() || '',
    name: apiData.name || apiData.clientName || 'Client inconnu',
    email: apiData.email || '',
    phone: apiData.phone || '',
    address: apiData.address || '',
    city: apiData.city || '',
    postalCode: apiData.postalCode || apiData.postal_code || '',
    country: apiData.country || '',
    
    company: apiData.company || apiData.companyName,
    contactPerson: apiData.contactPerson || apiData.contact_person,
    preferredContactMethod: apiData.preferredContactMethod || apiData.preferred_contact_method || 'email',
    
    totalJobs: apiData.totalJobs || apiData.total_jobs || 0,
    completedJobs: apiData.completedJobs || apiData.completed_jobs || 0,
    averageRating: apiData.averageRating || apiData.average_rating || 5,
    
    isActive: apiData.isActive !== false,
    createdAt: apiData.createdAt || apiData.created_at || ''
  };
}

function getDefaultClient(clientId: string): ClientInfo {
  return {
    id: clientId,
    name: 'Client non trouvé',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    preferredContactMethod: 'email',
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    isActive: false,
    createdAt: ''
  };
}

function normalizeCrewMember(apiData: any): CrewMember {
  return {
    id: apiData.id?.toString() || '',
    firstName: apiData.firstName || apiData.first_name || '',
    lastName: apiData.lastName || apiData.last_name || '',
    email: apiData.email || '',
    phone: apiData.phone || '',
    role: apiData.role || 'helper',
    
    assignedAt: apiData.assignedAt || apiData.assigned_at || '',
    assignedBy: apiData.assignedBy || apiData.assigned_by || '',
    status: apiData.status || 'assigned',
    
    experience: apiData.experience || 0,
    rating: apiData.rating || 5,
    availability: apiData.availability || 'available'
  };
}

function normalizeTruckInfo(apiData: any): TruckInfo {
  return {
    id: apiData.id?.toString() || '',
    name: apiData.name || `Camion ${apiData.plateNumber || apiData.id}`,
    plateNumber: apiData.plateNumber || apiData.plate_number || '',
    model: apiData.model || '',
    capacity: apiData.capacity || 0,
    
    assignedAt: apiData.assignedAt || apiData.assigned_at || '',
    status: apiData.status || 'assigned',
    
    fuelLevel: apiData.fuelLevel || apiData.fuel_level,
    mileage: apiData.mileage,
    lastMaintenance: apiData.lastMaintenance || apiData.last_maintenance,
    isOperational: apiData.isOperational !== false,
    
    currentLocation: apiData.currentLocation || apiData.current_location
  };
}

function normalizeJobItem(apiData: any): JobItem {
  return {
    id: apiData.id?.toString() || '',
    name: apiData.name || 'Article sans nom',
    description: apiData.description || '',
    category: apiData.category || 'general',
    
    quantity: apiData.quantity || 1,
    unit: apiData.unit || 'pieces',
    
    dimensions: apiData.dimensions,
    
    status: apiData.status || 'pending',
    
    isFragile: apiData.isFragile || apiData.is_fragile || false,
    requiresSpecialHandling: apiData.requiresSpecialHandling || apiData.requires_special_handling || false,
    instructions: apiData.instructions,
    
    estimatedValue: apiData.estimatedValue || apiData.estimated_value,
    
    addedAt: apiData.addedAt || apiData.added_at || apiData.createdAt || '',
    updatedAt: apiData.updatedAt || apiData.updated_at || ''
  };
}

function normalizeJobNote(apiData: any): JobNote {
  return {
    id: apiData.id?.toString() || '',
    content: apiData.content || apiData.text || '',
    type: apiData.type || 'general',
    
    authorId: apiData.authorId || apiData.author_id || apiData.userId || '',
    authorName: apiData.authorName || apiData.author_name || apiData.userName || 'Utilisateur inconnu',
    
    createdAt: apiData.createdAt || apiData.created_at || '',
    updatedAt: apiData.updatedAt || apiData.updated_at,
    
    isInternal: apiData.isInternal || apiData.is_internal || false,
    isPinned: apiData.isPinned || apiData.is_pinned || false,
    
    attachments: apiData.attachments || []
  };
}

function normalizeTimelineEvent(apiData: any): TimelineEvent {
  return {
    id: apiData.id?.toString() || '',
    type: apiData.type || apiData.action || 'updated',
    title: apiData.title || apiData.event || 'Événement',
    description: apiData.description || apiData.message || '',
    
    occurredAt: apiData.occurredAt || apiData.occurred_at || apiData.createdAt || '',
    
    userId: apiData.userId || apiData.user_id || '',
    userName: apiData.userName || apiData.user_name || 'Système',
    
    metadata: apiData.metadata || apiData.data
  };
}

function normalizeJobMedia(apiData: any): JobMedia {
  return {
    id: apiData.id?.toString() || '',
    filename: apiData.filename || apiData.file_name || '',
    originalName: apiData.originalName || apiData.original_name || apiData.filename || '',
    url: apiData.url || apiData.file_url || '',
    type: apiData.type || apiData.file_type || 'image',
    
    size: apiData.size || apiData.file_size || 0,
    uploadedAt: apiData.uploadedAt || apiData.uploaded_at || '',
    uploadedBy: apiData.uploadedBy || apiData.uploaded_by || '',
    
    description: apiData.description,
    location: apiData.location,
    
    thumbnailUrl: apiData.thumbnailUrl || apiData.thumbnail_url,
    dimensions: apiData.dimensions
  };
}

function normalizeJobAddress(apiData: any): JobAddress {
  return {
    id: apiData.id?.toString() || '',
    type: apiData.type || 'pickup',
    street: apiData.street || apiData.address || '',
    city: apiData.city || '',
    state: apiData.state || '',
    zip: apiData.zip || apiData.zipCode || apiData.postal_code || '',
    position: apiData.position || (apiData.latitude && apiData.longitude ? {
      latitude: apiData.latitude,
      longitude: apiData.longitude
    } : undefined)
  };
}

/**
 * Met à jour les informations de base d'un job
 */
export async function updateJobInfo(jobId: string, updates: Partial<JobInfo>): Promise<JobInfo> {
  // TEMP_DISABLED: console.log('🔄 [JOB DETAILS] Updating job info:', jobId, updates);
  
  const response = await authenticatedFetch(`${API}v1/job/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update job: ${response.status}`);
  }
  
  const updatedJob = await response.json();
  // TEMP_DISABLED: console.log('✅ [JOB DETAILS] Job updated successfully');
  
  return normalizeJobInfo(updatedJob);
}

/**
 * Ajoute une note à un job
 */
export async function addJobNote(jobId: string, content: string, type: JobNote['type'] = 'general'): Promise<JobNote> {
  const response = await authenticatedFetch(`${API}v1/job/${jobId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content, type })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add note: ${response.status}`);
  }
  
  const newNote = await response.json();
  // TEMP_DISABLED: console.log('✅ [JOB DETAILS] Note added successfully');
  
  return normalizeJobNote(newNote);
}

/**
 * Actions rapides sur un job (start, pause, complete, etc.)
 */
export async function performJobAction(jobId: string, action: 'start' | 'pause' | 'resume' | 'complete'): Promise<void> {
  const response = await authenticatedFetch(`${API}v1/job/${jobId}/${action}`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ${action} job: ${response.status}`);
  }
  
  // TEMP_DISABLED: console.log(`✅ [JOB DETAILS] Job ${action} completed successfully`);
}

/**
 * Méthode classique avec appels individuels (fallback)
 */
async function fetchJobDetailsClassic(jobId: string): Promise<JobDetailsComplete> {
  // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] === CLASSIC ENDPOINT APPROACH ===');
  
  try {
        const [
      jobResponse,
      crewResponse,
      trucksResponse,
      itemsResponse,
      notesResponse,
      timelineResponse,
      mediaResponse
    ] = await Promise.all([
      // Informations de base du job
      authenticatedFetch(`${API}v1/job/${jobId}`, { method: 'GET' }),
      
      // Équipe assignée
      authenticatedFetch(`${API}v1/job/${jobId}/crew`, { method: 'GET' }),
      
      // Camions assignés
      authenticatedFetch(`${API}v1/job/${jobId}/trucks`, { method: 'GET' }),
      
      // Articles/items
      authenticatedFetch(`${API}v1/job/${jobId}/items`, { method: 'GET' }),
      
      // Notes
      authenticatedFetch(`${API}v1/job/${jobId}/notes`, { method: 'GET' }),
      
      // Timeline
      authenticatedFetch(`${API}v1/job/${jobId}/timeline`, { method: 'GET' }),
      
      // Médias/photos
      authenticatedFetch(`${API}v1/job/${jobId}/media`, { method: 'GET' }).catch(() => null) // Optionnel
    ]);
    
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] API calls completed');
    
    // Parsing des données de base du job
    if (!jobResponse?.ok) {
      throw new Error(`Failed to fetch job: ${jobResponse?.status}`);
    }
    
    const jobData = await jobResponse.json();
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Job data received:', { id: jobData.id, title: jobData.title });
    
    // Maintenant récupérer les données du client avec l'ID client
    let clientData = null;
    if (jobData.clientId) {
      // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Fetching client data for ID:', jobData.clientId);
      const clientResp = await authenticatedFetch(`${API}v1/client/${jobData.clientId}`, { method: 'GET' });
      if (clientResp.ok) {
        clientData = await clientResp.json();
        // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Client data received:', clientData.name);
      }
    }
    
    // Parsing de toutes les autres réponses
    const [crewData, trucksData, itemsData, notesData, timelineData, mediaData] = await Promise.all([
      crewResponse?.ok ? crewResponse.json() : { crew: [] },
      trucksResponse?.ok ? trucksResponse.json() : { trucks: [] },
      itemsResponse?.ok ? itemsResponse.json() : { items: [] },
      notesResponse?.ok ? notesResponse.json() : { notes: [] },
      timelineResponse?.ok ? timelineResponse.json() : { timeline: [] },
      mediaResponse?.ok ? mediaResponse.json() : { media: [] }
    ]);
    
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] All data parsed successfully');
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] Data summary:', {
      // jobTitle: jobData.title,
      // clientName: clientData?.name || 'Unknown',
      // crewCount: crewData.crew?.length || 0,
      // trucksCount: trucksData.trucks?.length || 0,
      // itemsCount: itemsData.items?.length || 0,
      // notesCount: notesData.notes?.length || 0,
      // timelineCount: timelineData.timeline?.length || 0,
      // mediaCount: mediaData.media?.length || 0
    // });
    
    // Construction de l'objet complet
    const completeJobDetails: JobDetailsComplete = {
      job: normalizeJobInfo(jobData),
      client: clientData ? normalizeClientInfo(clientData) : getDefaultClient(jobData.clientId),
      crew: (crewData.crew || []).map(normalizeCrewMember),
      trucks: (trucksData.trucks || []).map(normalizeTruckInfo),
      items: (itemsData.items || []).map(normalizeJobItem),
      notes: (notesData.notes || []).map(normalizeJobNote),
      timeline: (timelineData.timeline || []).map(normalizeTimelineEvent),
      media: (mediaData.media || []).map(normalizeJobMedia),
      addresses: jobData.addresses ? jobData.addresses.map(normalizeJobAddress) : []
    };
    
    // TEMP_DISABLED: console.log('🔍 [JOB DETAILS] ✅ Complete job details assembled successfully (classic method)');
    return completeJobDetails;
  } catch (error) {

    console.error('❌ [JOB DETAILS] Error fetching job details (classic method):', error);
    throw error;
  }
}

/**
 * Sauvegarde la signature d'un job via l'API
 * @param jobId - ID du job
 * @param signatureDataUrl - Data URL de la signature (format: data:image/png;base64,...)
 * @returns Promise avec le résultat de la sauvegarde
 */
export async function saveJobSignature(
  jobId: number | string,
  signatureDataUrl: string,
  signatureType: 'client' | 'delivery' | 'pickup' = 'client'
): Promise<{
  success: boolean;
  signatureUrl?: string;
  signatureId?: string;
  message?: string;
  existingSignatureId?: number; // ID de la signature existante si erreur 400
}> {
  try {
    // TEMP_DISABLED: console.log('📝 [SAVE SIGNATURE] Starting signature save for job:', jobId);
    
    // ✅ Vérifier que signatureDataUrl commence par "data:image/"
    if (!signatureDataUrl.startsWith('data:image/')) {
      console.error('❌ [SAVE SIGNATURE] Invalid signature format - must start with data:image/');
      return {
        success: false,
        message: 'Format de signature invalide'
      };
    }

    // TEMP_DISABLED: console.log('📝 [SAVE SIGNATURE] Signature format valid:', {
      // length: signatureDataUrl.length,
      // type: signatureDataUrl.substring(0, 30) + '...'
    // });

    // ✅ Créer le body JSON selon les specs de l'API
    const requestBody = {
      signature_data: signatureDataUrl, // Chaîne Base64 complète avec data:image/
      signature_type: signatureType     // "client", "delivery", ou "pickup"
    };

    // TEMP_DISABLED: console.log('📝 [SAVE SIGNATURE] Sending to API:', {
      // jobId,
      // signature_type: signatureType,
      // signature_data_length: signatureDataUrl.length
    // });

    // ✅ Envoyer à l'API avec l'ID numérique
    const uploadResponse = await authenticatedFetch(
      `${API}v1/job/${jobId}/signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [SAVE SIGNATURE] Upload failed:', {
        status: uploadResponse.status,
        error: errorText
      });
      
      // ⚡ Parser le JSON d'erreur pour extraire le message réel
      let errorMessage = `Erreur lors de l'upload: ${uploadResponse.status}`;
      let existingSignatureId: number | undefined;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
        if (errorJson.existing_signature_id) {
          existingSignatureId = errorJson.existing_signature_id;
        }
      } catch (e) {
        // Si parsing échoue, garder le message par défaut
      }
      
      return {
        success: false,
        message: errorMessage,
        existingSignatureId
      };
    }

    const result = await uploadResponse.json();
    // TEMP_DISABLED: console.log('✅ [SAVE SIGNATURE] Signature saved successfully:', result);

    return {
      success: true,
      signatureUrl: result.signatureUrl || result.url,
      signatureId: result.signatureId || result.id,
      message: 'Signature enregistrée avec succès'
    };

  } catch (error: any) {

    console.error('❌ [SAVE SIGNATURE] Exception:', error);
    return {
      success: false,
      message: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Récupère les signatures existantes pour un job
 * @param jobId - ID du job
 * @returns Promise avec les signatures du job
 */
export async function getJobSignatures(
  jobId: number | string
): Promise<{
  success: boolean;
  signatures?: Array<{
    id: number;
    signature_type: string;
    signature_url?: string;
    signature_data?: string;
    created_at?: string;
  }>;
  message?: string;
}> {
  try {
    console.log('🔍 [GET SIGNATURES] Fetching signatures for job:', jobId);
    
    const response = await authenticatedFetch(
      `${API}v1/job/${jobId}/signatures`,
      { method: 'GET' }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Pas de signatures = OK, juste vide
        console.log('ℹ️ [GET SIGNATURES] No signatures found (404)');
        return { success: true, signatures: [] };
      }
      
      const errorText = await response.text();
      console.error('❌ [GET SIGNATURES] Failed:', {
        status: response.status,
        error: errorText
      });
      return {
        success: false,
        message: `Erreur ${response.status}: ${errorText}`
      };
    }

    const result = await response.json();
    console.log('✅ [GET SIGNATURES] Signatures fetched:', {
      count: result.signatures?.length || result.length || 0
    });

    // Normaliser la réponse (le backend peut retourner { signatures: [...] } ou directement [...])
    const signatures = result.signatures || result.data || (Array.isArray(result) ? result : []);

    return {
      success: true,
      signatures
    };

  } catch (error: any) {
    console.error('❌ [GET SIGNATURES] Exception:', error);
    return {
      success: false,
      message: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Vérifie si une signature de type donné existe pour un job
 * @param jobId - ID du job
 * @param signatureType - Type de signature à vérifier ('client', 'delivery', 'pickup')
 * @returns Promise avec le résultat de la vérification
 */
export async function checkJobSignatureExists(
  jobId: number | string,
  signatureType: 'client' | 'delivery' | 'pickup' = 'client'
): Promise<{
  exists: boolean;
  signatureId?: number;
  signatureUrl?: string;
  signatureData?: string;
}> {
  const result = await getJobSignatures(jobId);
  
  if (!result.success || !result.signatures?.length) {
    return { exists: false };
  }

  const signature = result.signatures.find(
    sig => sig.signature_type === signatureType
  );

  if (signature) {
    console.log('✅ [CHECK SIGNATURE] Found existing signature:', {
      id: signature.id,
      type: signatureType
    });
    return {
      exists: true,
      signatureId: signature.id,
      signatureUrl: signature.signature_url,
      signatureData: signature.signature_data
    };
  }

  return { exists: false };
}
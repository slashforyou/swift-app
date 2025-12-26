// services/jobDetailsMockData.ts
import { JobDetailsComplete } from './jobDetails';

export const mockJobDetailsData: JobDetailsComplete = {
  job: {
    id: "1",
    title: "Déménagement Résidentiel - Duplex 3 chambres",
    description: "Déménagement complet d'un duplex de 3 chambres avec mobilier lourd (piano, mobilier antique). Nécessite équipement spécialisé et équipe expérimentée.",
    status: "in-progress",
    priority: "high",
    
    createdAt: "2025-10-10T08:00:00Z",
    updatedAt: "2025-10-11T14:30:00Z",
    scheduledDate: "2025-10-11T09:00:00Z",
    startDate: "2025-10-11T09:15:00Z",
    
    pickupAddress: "123 Rue de la Paix, 75001 Paris",
    deliveryAddress: "456 Avenue des Champs-Élysées, 75008 Paris",
    
    estimatedDuration: 480, // 8 heures
    actualDuration: 300, // 5 heures en cours
    estimatedCost: 850.00,
    actualCost: 650.00,
    
    clientId: "101",
    createdBy: "admin_user",
    assignedTo: "driver_001",
    
    isArchived: false,
    isUrgent: true,
    requiresSignature: true,
    
    pickupCoordinates: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    deliveryCoordinates: {
      latitude: 48.8738,
      longitude: 2.2950
    }
  },
  
  client: {
    id: "101",
    name: "Marie Dubois",
    email: "marie.dubois@email.com",
    phone: "+33 1 42 34 56 78",
    address: "123 Rue de la Paix",
    city: "Paris",
    postalCode: "75001",
    country: "France",
    
    company: "Dubois & Associés",
    contactPerson: "Marie Dubois",
    preferredContactMethod: "phone",
    
    totalJobs: 8,
    completedJobs: 7,
    averageRating: 4.8,
    
    isActive: true,
    createdAt: "2024-03-15T10:00:00Z"
  },
  
  crew: [
    {
      id: "crew_001",
      firstName: "Jean",
      lastName: "Martin",
      email: "jean.martin@swiftapp.com",
      phone: "+33 6 12 34 56 78",
      role: "driver",
      
      assignedAt: "2025-10-11T08:00:00Z",
      assignedBy: "supervisor_001",
      status: "on-site",
      
      experience: 5,
      rating: 4.9,
      availability: "busy"
    },
    {
      id: "crew_002", 
      firstName: "Pierre",
      lastName: "Durand",
      email: "pierre.durand@swiftapp.com",
      phone: "+33 6 98 76 54 32",
      role: "helper",
      
      assignedAt: "2025-10-11T08:00:00Z",
      assignedBy: "supervisor_001",
      status: "on-site",
      
      experience: 3,
      rating: 4.6,
      availability: "busy"
    }
  ],
  
  trucks: [
    {
      id: "truck_001",
      name: "Camion Déménagement - Grand",
      plateNumber: "AB-123-CD",
      model: "Mercedes Sprinter 3.5T",
      capacity: 20,
      
      assignedAt: "2025-10-11T07:30:00Z",
      status: "on-site",
      
      fuelLevel: 75,
      mileage: 145230,
      lastMaintenance: "2025-09-15T10:00:00Z",
      isOperational: true,
      
      currentLocation: {
        latitude: 48.8566,
        longitude: 2.3522,
        address: "123 Rue de la Paix, Paris",
        updatedAt: "2025-10-11T14:45:00Z"
      }
    }
  ],
  
  items: [
    {
      id: "item_001",
      name: "Piano droit Yamaha",
      description: "Piano droit Yamaha U1, environ 250kg, nécessite équipement spécialisé",
      category: "mobilier_lourd",
      
      quantity: 1,
      unit: "pieces",
      
      dimensions: {
        length: 1.5,
        width: 0.6,
        height: 1.3,
        weight: 250
      },
      
      status: "loaded",
      
      isFragile: true,
      requiresSpecialHandling: true,
      instructions: "Utiliser sangles piano et équipe de 3 personnes minimum",
      
      estimatedValue: 8000,
      
      addedAt: "2025-10-10T08:15:00Z",
      updatedAt: "2025-10-11T11:30:00Z"
    },
    {
      id: "item_002",
      name: "Canapé 3 places",
      description: "Canapé en cuir beige, 3 places",
      category: "mobilier",
      
      quantity: 1,
      unit: "pieces",
      
      dimensions: {
        length: 2.2,
        width: 0.9,
        height: 0.8,
        weight: 65
      },
      
      status: "loaded",
      
      isFragile: false,
      requiresSpecialHandling: false,
      
      estimatedValue: 1200,
      
      addedAt: "2025-10-10T08:20:00Z",
      updatedAt: "2025-10-11T10:15:00Z"
    },
    {
      id: "item_003",
      name: "Cartons divers",
      description: "Cartons de vêtements, livres et objets personnels",
      category: "cartons",
      
      quantity: 25,
      unit: "pieces",
      
      status: "loaded",
      
      isFragile: false,
      requiresSpecialHandling: false,
      instructions: "Empiler maximum 3 cartons lourds",
      
      addedAt: "2025-10-10T08:25:00Z",
      updatedAt: "2025-10-11T10:45:00Z"
    }
  ],
  
  notes: [
    {
      id: "note_001",
      content: "Client très satisfait du service. Piano transporté sans problème.",
      type: "update",
      
      authorId: "crew_001",
      authorName: "Jean Martin",
      
      createdAt: "2025-10-11T11:30:00Z",
      
      isInternal: false,
      isPinned: false
    },
    {
      id: "note_002", 
      content: "Attention: escalier étroit à la livraison. Prévoir plus de temps.",
      type: "instruction",
      
      authorId: "supervisor_001",
      authorName: "Sophie Supervisor",
      
      createdAt: "2025-10-11T08:45:00Z",
      
      isInternal: true,
      isPinned: true
    },
    {
      id: "note_003",
      content: "Client demande livraison avant 16h impérativement.",
      type: "general",
      
      authorId: "client_service",
      authorName: "Service Client",
      
      createdAt: "2025-10-10T16:20:00Z",
      
      isInternal: false,
      isPinned: true
    }
  ],
  
  timeline: [
    {
      id: "timeline_001",
      type: "created",
      title: "Job créé",
      description: "Nouveau déménagement créé par le service commercial",
      
      occurredAt: "2025-10-10T08:00:00Z",
      
      userId: "admin_user",
      userName: "Admin Système"
    },
    {
      id: "timeline_002",
      type: "assigned",
      title: "Équipe assignée",
      description: "Équipe Jean Martin + Pierre Durand assignée au job",
      
      occurredAt: "2025-10-11T08:00:00Z",
      
      userId: "supervisor_001", 
      userName: "Sophie Supervisor"
    },
    {
      id: "timeline_003",
      type: "started",
      title: "Déménagement commencé",
      description: "Équipe arrivée sur site, début du chargement",
      
      occurredAt: "2025-10-11T09:15:00Z",
      
      userId: "crew_001",
      userName: "Jean Martin"
    },
    {
      id: "timeline_004",
      type: "updated",
      title: "Piano chargé avec succès",
      description: "Piano Yamaha U1 chargé sans incident",
      
      occurredAt: "2025-10-11T11:30:00Z",
      
      userId: "crew_001",
      userName: "Jean Martin",
      
      metadata: {
        itemId: "item_001",
        previousStatus: "pending",
        newStatus: "loaded"
      }
    }
  ],
  
  media: [
    {
      id: "media_001",
      filename: "piano_chargement.jpg",
      originalName: "IMG_20251011_113045.jpg",
      url: "https://storage.swiftapp.com/media/job_1/piano_chargement.jpg",
      type: "image",
      
      size: 2048576,
      uploadedAt: "2025-10-11T11:32:00Z", 
      uploadedBy: "crew_001",
      
      description: "Piano chargé dans le camion",
      location: "pickup",
      
      thumbnailUrl: "https://storage.swiftapp.com/media/job_1/thumb_piano_chargement.jpg",
      dimensions: {
        width: 1920,
        height: 1080
      }
    },
    {
      id: "media_002",
      filename: "signature_client.png",
      originalName: "signature_depart.png", 
      url: "https://storage.swiftapp.com/media/job_1/signature_client.png",
      type: "signature",
      
      size: 45620,
      uploadedAt: "2025-10-11T12:00:00Z",
      uploadedBy: "crew_001",
      
      description: "Signature client pour enlèvement mobilier",
      location: "pickup"
    }
  ],

  addresses: [
    {
      id: "addr_001",
      type: "pickup",
      street: "123 Rue de la Paix",
      city: "Paris",
      state: "Île-de-France",
      zip: "75001",
      position: {
        latitude: 48.8566,
        longitude: 2.3522
      }
    },
    {
      id: "addr_002",
      type: "dropoff",
      street: "456 Avenue des Champs-Élysées",
      city: "Paris",
      state: "Île-de-France",
      zip: "75008",
      position: {
        latitude: 48.8738,
        longitude: 2.2950
      }
    }
  ]
};

/**
 * Simule un délai d'API pour tester les états de chargement
 */
export function getMockJobDetails(jobId: string): Promise<JobDetailsComplete> {
  return new Promise((resolve) => {
    // Simuler un délai de réseau réaliste
    setTimeout(() => {
      // TEMP_DISABLED: console.log(`🧪 [MOCK] Returning mock job details for ID: ${jobId}`);
      resolve({
        ...mockJobDetailsData,
        job: {
          ...mockJobDetailsData.job,
          id: jobId // Utiliser l'ID demandé
        }
      });
    }, 1500); // 1.5 secondes pour simuler l'API
  });
}
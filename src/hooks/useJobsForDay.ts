import { useState, useEffect, useCallback } from 'react';
import { fetchJobs as fetchJobsAPI, JobAPI } from '../services/jobs';
import { isLoggedIn } from '../utils/auth';

export interface Job {
  id: string; // ID numérique pour les appels API
  code?: string; // Code job pour l'affichage
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client: {
    name?: string; // Nom complet du client (prioritaire sur firstName/lastName)
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  addresses: Array<{
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    latitude: number;
    longitude: number;
  }>;
  time: {
    startWindowStart: string;
    startWindowEnd: string;
    endWindowStart: string;
    endWindowEnd: string;
  };
  truck: {
    licensePlate: string;
    name: string;
  };
  estimatedDuration?: number; // in minutes
  notes?: string;
}

interface UseJobsForDayReturn {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filteredJobs: Job[];
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
}

// Fonction utilitaire pour convertir les données API vers le format local
function convertAPIJobToLocal(apiJob: any): Job {
  console.log('🔄 Converting API job:', JSON.stringify(apiJob, null, 2));
  
  // Utiliser les vraies données client de l'API ou fallback sur contact_name
  let firstName = 'Client';
  let lastName = 'Anonyme';
  let fullName = 'Client Anonyme';
  
  if (apiJob.client?.firstName && apiJob.client?.lastName) {
    // Utiliser les données client de l'API
    firstName = apiJob.client.firstName;
    lastName = apiJob.client.lastName;
    fullName = apiJob.client.fullName || `${firstName} ${lastName}`;
  } else if (apiJob.contact?.firstName && apiJob.contact?.lastName) {
    // Fallback sur les données contact
    firstName = apiJob.contact.firstName;
    lastName = apiJob.contact.lastName;
    fullName = `${firstName} ${lastName}`;
  } else if (apiJob.contact_name) {
    // Fallback sur contact_name (ancien format)
    const contactNameParts = apiJob.contact_name.split(' ');
    firstName = contactNameParts[0] || 'Client';
    lastName = contactNameParts.slice(1).join(' ') || 'Anonyme';
    fullName = apiJob.contact_name;
  }
  
  // Générer des données réalistes pour les champs manquants
  const jobCode = apiJob.code || `JOB-${apiJob.id}`;
  
  const converted = {
    id: apiJob.id, // Garder l'ID numérique original pour les appels API
    code: jobCode, // Ajouter le code séparément pour l'affichage
    status: mapApiStatus(apiJob.status),
    priority: apiJob.priority || 'medium',
    client: {
      name: fullName, // Utiliser le nom complet (prioritaire)
      firstName: firstName,
      lastName: lastName,
      phone: apiJob.client?.phone || apiJob.contact?.phone || apiJob.phone || '+33 6 XX XX XX XX',
      email: apiJob.client?.email || apiJob.contact?.email || apiJob.email || `${firstName.toLowerCase()}@email.com`,
    },
    contact: {
      firstName: firstName,
      lastName: lastName,
      phone: apiJob.phone || '+33 6 XX XX XX XX',
      email: apiJob.email || `${firstName.toLowerCase()}@email.com`,
    },
    addresses: [{
      type: 'pickup',
      street: generateAddress('pickup'),
      city: generateCity(),
      state: 'France',
      zip: generatePostalCode(),
      latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
      longitude: 2.3522 + (Math.random() - 0.5) * 0.1
    }, {
      type: 'delivery',
      street: generateAddress('delivery'),
      city: generateCity(),
      state: 'France',
      zip: generatePostalCode(),
      latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
      longitude: 2.3522 + (Math.random() - 0.5) * 0.1
    }],
    time: {
      startWindowStart: apiJob.start_window_start || '',
      startWindowEnd: apiJob.start_window_end || '',
      endWindowStart: apiJob.end_window_start || apiJob.start_window_start || '',
      endWindowEnd: apiJob.end_window_end || apiJob.start_window_end || '',
    },
    truck: {
      licensePlate: generateLicensePlate(),
      name: generateTruckName(),
    },
    estimatedDuration: calculateDuration(apiJob.start_window_start, apiJob.start_window_end),
    notes: `Code: ${jobCode}${apiJob.notes ? ' - ' + apiJob.notes : ''}`,
  };
  
  console.log('✅ Converted job:', JSON.stringify(converted, null, 2));
  return converted;
}

// Fonctions helper pour générer des données réalistes
function mapApiStatus(status: string): 'pending' | 'in-progress' | 'completed' | 'cancelled' {
  const statusMap: Record<string, 'pending' | 'in-progress' | 'completed' | 'cancelled'> = {
    'scheduled': 'pending',
    'in_progress': 'in-progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'deleted': 'cancelled'
  };
  return statusMap[status] || 'pending';
}

function generateAddress(type: 'pickup' | 'delivery'): string {
  const streets = [
    'Avenue des Champs-Élysées', 'Rue de Rivoli', 'Boulevard Saint-Germain',
    'Avenue Montaigne', 'Rue du Faubourg Saint-Honoré', 'Boulevard Haussmann'
  ];
  const numbers = Math.floor(Math.random() * 200) + 1;
  return `${numbers} ${streets[Math.floor(Math.random() * streets.length)]}`;
}

function generateCity(): string {
  const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function generatePostalCode(): string {
  return `${Math.floor(Math.random() * 95) + 1}`.padStart(2, '0') + '000';
}

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  return `${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}-${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}-${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}`;
}

function generateTruckName(): string {
  const brands = ['Iveco Daily', 'Mercedes Sprinter', 'Ford Transit', 'Renault Master', 'Fiat Ducato'];
  return brands[Math.floor(Math.random() * brands.length)];
}

function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 120;
  
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  return Math.max(60, Math.min(480, diffMinutes)); // Entre 1h et 8h
}

export const useJobsForDay = (
  day: number, 
  month: number, 
  year: number,
  statusFilter?: string,
  sortBy?: 'time' | 'priority' | 'status'
): UseJobsForDayReturn => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data generator - replace with real API call
  const generateMockJobs = useCallback((): Job[] => {
    const mockJobs: Job[] = [
      {
        id: "#LM0000000001",
        status: 'pending',
        priority: 'high',
        client: {
          firstName: "Emma",
          lastName: "Thompson",
          phone: "+1234567890",
          email: "emma.thompson@email.com"
        },
        contact: {
          firstName: "David",
          lastName: "Wilson",
          phone: "+1234567891",
          email: "david.wilson@email.com"
        },
        addresses: [
          {
            type: "Pickup",
            street: "123 Oak Avenue",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8136,
            longitude: 144.9631
          },
          {
            type: "Delivery",
            street: "456 Collins Street",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8172,
            longitude: 144.9668
          }
        ],
        time: {
          startWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T08:00:00Z`,
          startWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T10:00:00Z`,
          endWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T14:00:00Z`,
          endWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T16:00:00Z`
        },
        truck: {
          licensePlate: "VIC123",
          name: "Truck Alpha"
        },
        estimatedDuration: 120,
        notes: "Fragile items - handle with care"
      },
      {
        id: "#LM0000000002",
        status: 'in-progress',
        priority: 'medium',
        client: {
          firstName: "James",
          lastName: "Rodriguez",
          phone: "+1234567892",
          email: "james.rodriguez@email.com"
        },
        contact: {
          firstName: "Sarah",
          lastName: "Chen",
          phone: "+1234567893",
          email: "sarah.chen@email.com"
        },
        addresses: [
          {
            type: "Pickup",
            street: "789 Swanston Street",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8088,
            longitude: 144.9653
          },
          {
            type: "Delivery",
            street: "321 Flinders Lane",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8166,
            longitude: 144.9692
          }
        ],
        time: {
          startWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T09:00:00Z`,
          startWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T11:00:00Z`,
          endWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T13:00:00Z`,
          endWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T15:00:00Z`
        },
        truck: {
          licensePlate: "VIC456",
          name: "Truck Beta"
        },
        estimatedDuration: 90
      },
      {
        id: "#LM0000000003",
        status: 'completed',
        priority: 'low',
        client: {
          firstName: "Lisa",
          lastName: "Anderson",
          phone: "+1234567894",
          email: "lisa.anderson@email.com"
        },
        contact: {
          firstName: "Michael",
          lastName: "Brown",
          phone: "+1234567895",
          email: "michael.brown@email.com"
        },
        addresses: [
          {
            type: "Pickup",
            street: "555 Bourke Street",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8136,
            longitude: 144.9631
          },
          {
            type: "Delivery",
            street: "777 Elizabeth Street",
            city: "Melbourne",
            state: "VIC",
            zip: "3000",
            latitude: -37.8102,
            longitude: 144.9628
          }
        ],
        time: {
          startWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T07:00:00Z`,
          startWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T09:00:00Z`,
          endWindowStart: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T11:00:00Z`,
          endWindowEnd: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T13:00:00Z`
        },
        truck: {
          licensePlate: "VIC789",
          name: "Truck Gamma"
        },
        estimatedDuration: 60
      }
    ];

    // Simulate some days with no jobs
    if (day % 7 === 0) return [];
    
    // Simulate varying number of jobs
    return mockJobs.slice(0, Math.floor(Math.random() * 3) + 1);
  }, [day, month, year]);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est connecté
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        // Si pas connecté, utiliser les données mock pour les tests/développement
        console.warn('User not logged in, using mock data');
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockJobs = generateMockJobs();
        setJobs(mockJobs);
        return;
      }
      
      // Utiliser l'API réelle avec les dates du jour sélectionné
      const startDate = new Date(year, month - 1, day);
      const endDate = new Date(year, month - 1, day, 23, 59, 59); // Fin de journée
      
      console.log(`📅 Fetching jobs for ${day}/${month}/${year} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
      
      const apiJobs = await fetchJobsAPI(startDate, endDate);
      
      // 🔍 DIAGNOSTIC: Analyser ce qu'on a reçu
      console.log('🔍 [useJobsForDay] apiJobs type:', typeof apiJobs);
      console.log('🔍 [useJobsForDay] apiJobs is array:', Array.isArray(apiJobs));
      console.log('🔍 [useJobsForDay] apiJobs length:', apiJobs?.length);
      console.log('🔍 [useJobsForDay] apiJobs content:', JSON.stringify(apiJobs, null, 2));
      
      // Vérifier que c'est bien un tableau avant de faire .map()
      if (!Array.isArray(apiJobs)) {
        console.error('❌ [useJobsForDay] apiJobs is not an array, cannot call .map()');
        throw new Error(`apiJobs.map is not a function (it is ${typeof apiJobs})`);
      }
      
      // Convertir les données API vers le format local
      const convertedJobs = apiJobs.map(convertAPIJobToLocal);
      
      console.log(`✅ Found ${convertedJobs.length} jobs for ${day}/${month}/${year}`);
      console.log('🔍 Jobs data:', JSON.stringify(convertedJobs, null, 2));
      
      setJobs(convertedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      
      // En cas d'erreur API, fallback vers les données mock avec un message d'avertissement
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Gestion d'erreur plus précise
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
        setError('🔐 Session expirée. Reconnexion automatique en cours...');
        setJobs([]);
      } else if (errorMessage.includes('IP_BLOCKED')) {
        setError('🚫 Accès temporairement bloqué. Réessayez plus tard.');
        setJobs([]);
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('📡 Problème de connexion réseau.');
        setJobs([]);
      } else {
        setError(`❌ Erreur: ${errorMessage}`);
        setJobs([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [generateMockJobs]);

  const refetch = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => !statusFilter || job.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(a.time.startWindowStart).getTime() - new Date(b.time.startWindowStart).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { 'in-progress': 4, pending: 3, completed: 2, cancelled: 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        default:
          return 0;
      }
    });

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const pendingJobs = jobs.filter(job => job.status === 'pending' || job.status === 'in-progress').length;

  return {
    jobs,
    isLoading,
    error,
    refetch,
    filteredJobs,
    totalJobs,
    completedJobs,
    pendingJobs
  };
};
import { useState, useEffect, useCallback } from 'react';

export interface Job {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client: {
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      // Simulate occasional errors
      if (Math.random() < 0.1) {
        throw new Error('Failed to load jobs. Please check your connection.');
      }
      
      const mockJobs = generateMockJobs();
      setJobs(mockJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
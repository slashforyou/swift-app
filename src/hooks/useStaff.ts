import { useCallback, useEffect, useState } from 'react';
import { staffService } from '../services/staff/staffService';
import { Contractor, Employee, InviteEmployeeData, StaffFilters, StaffMember, UseStaffResult } from '../types/staff';

// Configuration pour basculer entre mock et API
const USE_MOCK_DATA = __DEV__; // En dev on peut utiliser les mocks en cas de problème API

export const useStaff = (): UseStaffResult => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données mockées pour démonstration
  const mockStaff: StaffMember[] = [
    {
      id: 'emp_1',
      type: 'employee',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@swift-removals.com.au',
      phone: '+61 412 345 678',
      role: 'Moving Supervisor',
      team: 'Local Moving Team A',
      startDate: '2022-03-15',
      status: 'active',
      tfn: '123-456-789',
      hourlyRate: 35,
      invitationStatus: 'completed',
      accountLinked: true,
    } as Employee,
    {
      id: 'emp_2',
      type: 'employee',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@swift-removals.com.au',
      phone: '+61 423 456 789',
      role: 'Senior Mover',
      team: 'Interstate Moving Team',
      startDate: '2021-08-20',
      status: 'active',
      tfn: '987-654-321',
      hourlyRate: 32,
      invitationStatus: 'completed',
      accountLinked: true,
    } as Employee,
    {
      id: 'emp_3',
      type: 'employee',
      firstName: 'Mike',
      lastName: 'Williams',
      email: 'mike.williams@swift-removals.com.au',
      phone: '+61 434 567 890',
      role: 'Packing Specialist',
      team: 'Local Moving Team A',
      startDate: '2023-01-10',
      status: 'pending',
      hourlyRate: 28,
      invitationStatus: 'sent',
      accountLinked: false,
    } as Employee,
    {
      id: 'con_1',
      type: 'contractor',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@freelancer.com',
      phone: '+61 445 678 901',
      role: 'Truck Driver',
      team: 'External Contractors',
      startDate: '2023-06-01',
      status: 'active',
      abn: '12 345 678 901',
      contractStatus: 'non-exclusive',
      rateType: 'hourly',
      rate: 40,
      isVerified: true,
    } as Contractor,
    {
      id: 'con_2',
      type: 'contractor',
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@contractor.au',
      phone: '+61 456 789 012',
      role: 'Storage Specialist',
      team: 'External Contractors',
      startDate: '2023-08-15',
      status: 'active',
      abn: '98 765 432 109',
      contractStatus: 'exclusive',
      rateType: 'project',
      rate: 150,
      isVerified: true,
    } as Contractor,
  ];

  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TEMP_DISABLED: console.log(`📋 [useStaff] Loading staff members... (USE_MOCK: ${USE_MOCK_DATA})`);

      if (USE_MOCK_DATA) {
        // Utiliser les données mock en développement ou en cas de problème API
        // TEMP_DISABLED: console.log('🔄 [useStaff] Using mock data');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler latence réseau
        setStaff(mockStaff);
        // TEMP_DISABLED: console.log(`✅ [useStaff] Loaded ${mockStaff.length} mock staff members`);
      } else {
        // Utiliser la vraie API
        // TEMP_DISABLED: console.log('🌐 [useStaff] Using real API');
        const apiStaff = await staffService.fetchStaff();
        setStaff(apiStaff);
        // TEMP_DISABLED: console.log(`✅ [useStaff] Loaded ${apiStaff.length} staff members from API`);
      }

    } catch (err) {

      console.error('❌ [useStaff] Error loading staff:', err);
      
      if (!USE_MOCK_DATA) {
        // En cas d'erreur API, fallback vers les mocks
        // TEMP_DISABLED: console.log('🔄 [useStaff] API failed, falling back to mock data');
        try {
          setStaff(mockStaff);
          setError('Connexion API limitée - données de démonstration');
          // TEMP_DISABLED: console.log(`✅ [useStaff] Fallback: loaded ${mockStaff.length} mock staff members`);
          return;
        } catch (mockError) {

          console.error('❌ [useStaff] Even mock data failed:', mockError);
        }
      }
      
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du personnel');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStaff = useCallback(async () => {
    await loadStaff();
  }, [loadStaff]);

  // Alias pour compatibilité avec les tests
  const refreshData = useCallback(async () => {
    await loadStaff();
  }, [loadStaff]);

  const filterStaff = useCallback((filters: StaffFilters): StaffMember[] => {
    let filtered = [...staff];

    // Filtrer par type
    if (filters.type !== 'all') {
      filtered = filtered.filter(member => member.type === filters.type);
    }

    // Filtrer par équipe
    if (filters.team && filters.team !== '') {
      filtered = filtered.filter(member => member.team === filters.team);
    }

    // Filtrer par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(member => member.status === filters.status);
    }

    return filtered;
  }, [staff]);

  const inviteEmployee = useCallback(async (employeeData: InviteEmployeeData) => {
    try {
      // TEMP_DISABLED: console.log('📧 [useStaff] Inviting employee:', employeeData.email);
      
      if (USE_MOCK_DATA) {await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newEmployee: Employee = {
          id: `emp_${Date.now()}`,
          type: 'employee',
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          role: employeeData.role,
          team: employeeData.team,
          startDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          hourlyRate: employeeData.hourlyRate,
          invitationStatus: 'sent',
          accountLinked: false,
        };

        setStaff(prev => [...prev, newEmployee]);
        // TEMP_DISABLED: console.log(`✅ [useStaff] Mock employee invitation sent to ${employeeData.email}`);
      } else {
        // Mode API : vraie invitation
        const result = await staffService.inviteEmployee(employeeData);
        
        // Recharger la liste pour avoir les données à jour
        await loadStaff();
        
        // TEMP_DISABLED: console.log(`✅ [useStaff] Real employee invitation sent to ${employeeData.email}, ID: ${result.employeeId}`);
      }

    } catch (err) {

      console.error('❌ [useStaff] Error inviting employee:', err);
      throw new Error('Erreur lors de l\'envoi de l\'invitation');
    }
  }, [loadStaff]);

  const searchContractor = useCallback(async (searchTerm: string): Promise<Contractor[]> => {
    try {
      // TEMP_DISABLED: console.log('🔍 [useStaff] Searching contractors:', searchTerm);
      
      if (USE_MOCK_DATA) {await new Promise(resolve => setTimeout(resolve, 800));

        const mockSearchResults: Contractor[] = [
          {
            id: 'search_1',
            type: 'contractor',
            firstName: 'Alex',
            lastName: 'Thompson',
            email: 'alex.thompson@contractor.com',
            phone: '+61 467 890 123',
            role: 'Furniture Mover',
            team: 'External Contractors',
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
            abn: '11 222 333 444',
            contractStatus: 'standard',
            rateType: 'hourly',
            rate: 35,
            isVerified: true,
          },
          {
            id: 'search_2',
            type: 'contractor',
            firstName: 'Lisa',
            lastName: 'Chen',
            email: 'lisa.chen@freelance.au',
            phone: '+61 478 901 234',
            role: 'Packing Expert',
            team: 'External Contractors',
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
            abn: '55 666 777 888',
            contractStatus: 'standard',
            rateType: 'project',
            rate: 120,
            isVerified: true,
          },
        ];

        // Filtrer selon le terme de recherche
        const results = mockSearchResults.filter(contractor => {
          const fullName = `${contractor.firstName} ${contractor.lastName}`.toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          
          if (searchTerm.replace(/\s/g, '').length === 11) {
            return contractor.abn.replace(/\s/g, '') === searchTerm.replace(/\s/g, '');
          }
          
          return fullName.includes(searchLower);
        });

        // TEMP_DISABLED: console.log(`✅ [useStaff] Found ${results.length} mock contractors`);
        return results;
      } else {
        // Mode API : vraie recherche
        const results = await staffService.searchContractors(searchTerm);
        // TEMP_DISABLED: console.log(`✅ [useStaff] Found ${results.length} contractors via API`);
        return results;
      }

    } catch (err) {

      console.error('❌ [useStaff] Error searching contractors:', err);
      throw new Error('Erreur lors de la recherche de prestataires');
    }
  }, []);

  const addContractor = useCallback(async (contractorId: string, contractStatus: Contractor['contractStatus']) => {
    try {
      // TEMP_DISABLED: console.log('🤝 [useStaff] Adding contractor to staff:', contractorId, contractStatus);
      
      if (USE_MOCK_DATA) {await new Promise(resolve => setTimeout(resolve, 1000));

        const contractorData: Contractor = {
          id: contractorId,
          type: 'contractor',
          firstName: 'New',
          lastName: 'Contractor',
          email: 'contractor@email.com',
          phone: '+61 400 000 000',
          role: 'Specialist',
          team: 'External Contractors',
          startDate: new Date().toISOString().split('T')[0],
          status: 'active',
          abn: '99 888 777 666',
          contractStatus,
          rateType: 'hourly',
          rate: 38,
          isVerified: true,
        };

        setStaff(prev => [...prev, contractorData]);
        // TEMP_DISABLED: console.log(`✅ [useStaff] Mock contractor added with ${contractStatus} status`);
      } else {
        // Mode API : vraie ajout
        const result = await staffService.addContractorToStaff(contractorId, contractStatus);
        
        // Recharger la liste pour avoir les données à jour
        await loadStaff();
        
        // TEMP_DISABLED: console.log(`✅ [useStaff] Real contractor added with ${contractStatus} status`);
      }

    } catch (err) {

      console.error('❌ [useStaff] Error adding contractor:', err);
      throw new Error('Erreur lors de l\'ajout du prestataire');
    }
  }, [loadStaff]);

  const updateStaff = useCallback(async (staffId: string, updateData: Partial<StaffMember>) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStaff(prev => prev.map(member => {
          if (member.id !== staffId) return member;
          
          // Préserver le type discriminant pour TypeScript
          if (member.type === 'employee') {
            return { ...member, ...updateData, type: 'employee' as const } as Employee;
          } else {
            return { ...member, ...updateData, type: 'contractor' as const } as Contractor;
          }
        }));
      } else {
        await staffService.updateStaffMember(staffId, updateData);
        await loadStaff();
      }
    } catch (err) {
      console.error('❌ [useStaff] Error updating staff:', err);
      throw new Error('Erreur lors de la mise à jour du membre');
    }
  }, [loadStaff]);

  const removeStaff = useCallback(async (staffId: string) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStaff(prev => prev.filter(member => member.id !== staffId));
      } else {
        await staffService.removeStaffMember(staffId);
        await loadStaff();
      }
    } catch (err) {
      console.error('❌ [useStaff] Error removing staff:', err);
      throw new Error('Erreur lors de la suppression du membre');
    }
  }, [loadStaff]);

  const inviteContractor = useCallback(async (email: string, firstName: string, lastName: string) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // En mode mock, on simule juste l'envoi
        return { success: true, message: `Invitation envoyée à ${email}` };
      } else {
        // Utiliser l'API réelle
        const result = await staffService.inviteContractor(email, firstName, lastName);
        return result;
      }
    } catch (err) {
      console.error('❌ [useStaff] Error inviting contractor:', err);
      throw new Error('Erreur lors de l\'envoi de l\'invitation');
    }
  }, []);

  // Calculer les statistiques
  const employees = staff.filter((member): member is Employee => member.type === 'employee');
  const contractors = staff.filter((member): member is Contractor => member.type === 'contractor');
  
  const totalActive = staff.filter(member => member.status === 'active').length;
  const totalEmployees = employees.length;
  const totalContractors = contractors.length;
  const totalTeams = new Set(staff.map(member => member.team)).size;
  
  const averageEmployeeRate = employees.length > 0 
    ? Math.round(employees.reduce((acc, emp) => acc + emp.hourlyRate, 0) / employees.length)
    : 0;

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  return {
    staff,
    employees,
    contractors,
    isLoading,
    error,
    totalActive,
    totalEmployees,
    totalContractors,
    totalTeams,
    averageEmployeeRate,
    refreshStaff,
    refreshData,
    inviteEmployee,
    searchContractor,
    addContractor,
    updateStaff,
    removeStaff,
    inviteContractor,
    filterStaff,
  };
};

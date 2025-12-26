// Types pour la gestion du personnel

export interface BaseStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  team?: string; // ✅ Optional pour flexibilité
  startDate: string;
  status: 'active' | 'inactive' | 'pending';
}

// Employé TFN (employé de l'entreprise)
export interface Employee extends BaseStaffMember {
  type: 'employee';
  tfn?: string; // Optionnel car peut être rempli après invitation
  hourlyRate: number;
  invitationStatus: 'sent' | 'accepted' | 'completed' | 'pending' | 'expired'; // ✅ Ajout pending & expired
  accountLinked: boolean;
}

// Prestataire ABN (contractor externe)
export interface Contractor extends BaseStaffMember {
  type: 'contractor';
  abn: string;
  contractStatus: 'exclusive' | 'non-exclusive' | 'preferred' | 'standard';
  rateType: 'hourly' | 'fixed' | 'project';
  rate: number;
  isVerified: boolean;
}

export type StaffMember = Employee | Contractor;

export interface StaffFilters {
  type: 'all' | 'employee' | 'contractor';
  team: string;
  status: 'all' | 'active' | 'inactive' | 'pending';
}

export interface UseStaffResult {
  staff: StaffMember[];
  employees: Employee[];
  contractors: Contractor[];
  isLoading: boolean;
  error: string | null;
  totalActive: number;
  totalEmployees: number;
  totalContractors: number;
  totalTeams: number;
  averageEmployeeRate: number;
  refreshStaff: () => Promise<void>;
  refreshData: () => Promise<void>; // Alias pour refreshStaff
  inviteEmployee: (employeeData: InviteEmployeeData) => Promise<void>;
  searchContractor: (searchTerm: string) => Promise<Contractor[]>;
  addContractor: (contractorId: string, contractStatus: Contractor['contractStatus']) => Promise<void>;
  updateStaff: (staffId: string, updateData: Partial<StaffMember>) => Promise<void>;
  removeStaff: (staffId: string) => Promise<void>;
  inviteContractor: (email: string, firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>;
  filterStaff: (filters: StaffFilters) => StaffMember[];
}

export interface InviteEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  team: string;
  hourlyRate: number;
}

export interface SearchContractorData {
  searchType: 'name' | 'abn';
  searchValue: string;
}
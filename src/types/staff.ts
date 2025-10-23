// Types pour la gestion du personnel

export interface BaseStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  team: string;
  startDate: string;
  status: 'active' | 'inactive' | 'pending';
}

// Employé TFN (employé de l'entreprise)
export interface Employee extends BaseStaffMember {
  type: 'employee';
  tfn?: string; // Optionnel car peut être rempli après invitation
  hourlyRate: number;
  invitationStatus: 'sent' | 'accepted' | 'completed';
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
  inviteEmployee: (employeeData: InviteEmployeeData) => Promise<void>;
  searchContractor: (searchTerm: string) => Promise<Contractor[]>;
  addContractor: (contractorId: string, contractStatus: Contractor['contractStatus']) => Promise<void>;
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
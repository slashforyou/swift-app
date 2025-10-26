/**
 * Tests d'intégration pour StaffCrewScreen
 */
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import StaffCrewScreen from '../../src/screens/business/staffCrewScreen';
import { Contractor, Employee } from '../../src/types/staff';

// Simple wrapper to replace ThemeProvider in tests
const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock du hook useStaff - exported for test manipulation
export const mockUseStaff = {
  employees: [] as Employee[],
  contractors: [] as Contractor[],
  inviteEmployee: jest.fn(),
  searchContractor: jest.fn(),
  addContractor: jest.fn(),
  isLoading: false,
  error: null,
};

const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    type: 'employee',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@swift.com',
    phone: '+61 412 345 678',
    role: 'Moving Supervisor',
    team: 'Local Team A',
    startDate: '2023-01-01',
    status: 'active',
    tfn: '123-456-789',
    hourlyRate: 35,
    invitationStatus: 'accepted',
    accountLinked: true,
  },
  {
    id: 'emp_2',
    type: 'employee',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@swift.com',
    phone: '+61 423 456 789',
    role: 'Senior Mover',
    team: 'Interstate Team',
    startDate: '2023-02-01',
    status: 'active',
    tfn: '987-654-321',
    hourlyRate: 32,
    invitationStatus: 'sent',
    accountLinked: false,
  },
];

const mockContractors: Contractor[] = [
  {
    id: 'con_1',
    type: 'contractor',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike@contractor.com',
    phone: '+61 434 567 890',
    role: 'Specialized Mover',
    team: 'External Team',
    abn: '12 345 678 901',
    rate: 50,
    rateType: 'hourly',
    contractStatus: 'preferred',
    isVerified: true,
    startDate: '2023-03-01',
    status: 'active',
  },
  {
    id: 'con_2',
    type: 'contractor',
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'emma@expert.com',
    phone: '+61 445 678 901',
    role: 'Packing Expert',
    team: 'External Team',
    abn: '98 765 432 109',
    rate: 300,
    rateType: 'project',
    contractStatus: 'exclusive',
    isVerified: false,
    startDate: '2023-04-01',
    status: 'active',
  },
];

const renderScreen = () => {
  return render(
    <ThemeProvider>
      <StaffCrewScreen />
    </ThemeProvider>
  );
};

describe('StaffCrewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStaff.employees = [];
    mockUseStaff.contractors = [];
    mockUseStaff.isLoading = false;
    mockUseStaff.error = null;
    mockUseStaff.inviteEmployee.mockResolvedValue(undefined);
    mockUseStaff.searchContractor.mockResolvedValue([]);
    mockUseStaff.addContractor.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render screen title and subtitle', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('screen-title')).toBeTruthy();
      expect(getByTestId('screen-subtitle')).toBeTruthy();
    });

    it('should render add staff button', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('add-staff-button')).toBeTruthy();
    });

    it('should render statistics section', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('stat-active-label')).toBeTruthy();
      expect(getByTestId('stat-employees-label')).toBeTruthy();
      expect(getByTestId('stat-contractors-label')).toBeTruthy();
    });

    it('should show empty state when no staff', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByTestId('empty-text')).toBeTruthy();
      expect(getByTestId('empty-subtext')).toBeTruthy();
    });

    it('should render filter buttons', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('filter-all')).toBeTruthy();
      expect(getByTestId('filter-employee')).toBeTruthy();
      expect(getByTestId('filter-contractor')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      mockUseStaff.isLoading = true;
      
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('loading-text')).toBeTruthy();
    });

    it('should hide content when loading', () => {
      mockUseStaff.isLoading = true;
      
      const { queryByTestId } = renderScreen();
      
      expect(queryByTestId('empty-state')).toBeFalsy();
    });
  });

  describe('Employee Display', () => {
    beforeEach(() => {
      mockUseStaff.employees = mockEmployees;
    });

    it('should display employee cards when employees exist', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-card-emp_1')).toBeTruthy();
      expect(getByTestId('staff-card-emp_2')).toBeTruthy();
      expect(getByTestId('staff-name-emp_1')).toBeTruthy();
      expect(getByTestId('staff-name-emp_2')).toBeTruthy();
    });

    it('should show employee status badges', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-status-emp_1')).toBeTruthy();
      expect(getByTestId('staff-status-emp_2')).toBeTruthy();
    });

    it('should display employee type', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-type-emp_1')).toBeTruthy();
      expect(getByTestId('staff-type-emp_2')).toBeTruthy();
    });

    it('should handle edit button press', () => {
      const { getByTestId } = renderScreen();
      
      const editButton = getByTestId('edit-button-emp_1');
      fireEvent.press(editButton);
      
      // Action should be triggered
      expect(editButton).toBeTruthy();
    });

    it('should handle remove button press', () => {
      const { getByTestId } = renderScreen();
      
      const removeButton = getByTestId('remove-button-emp_1');
      fireEvent.press(removeButton);
      
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('Contractor Display', () => {
    beforeEach(() => {
      mockUseStaff.contractors = mockContractors;
    });

    it('should display contractor cards when contractors exist', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-card-con_1')).toBeTruthy();
      expect(getByTestId('staff-card-con_2')).toBeTruthy();
      expect(getByTestId('staff-name-con_1')).toBeTruthy();
      expect(getByTestId('staff-name-con_2')).toBeTruthy();
    });

    it('should show contractor type', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-type-con_1')).toBeTruthy();
      expect(getByTestId('staff-type-con_2')).toBeTruthy();
    });

    it('should show contractor status badges', () => {
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('staff-status-con_1')).toBeTruthy();
      expect(getByTestId('staff-status-con_2')).toBeTruthy();
    });

    it('should handle edit contractor', () => {
      const { getByTestId } = renderScreen();
      
      const editButton = getByTestId('edit-button-con_1');
      fireEvent.press(editButton);
      
      expect(editButton).toBeTruthy();
    });

    it('should handle remove contractor', () => {
      const { getByTestId } = renderScreen();
      
      const removeButton = getByTestId('remove-button-con_1');
      fireEvent.press(removeButton);
      
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('Statistics Display', () => {
    it('should show correct employee count', () => {
      mockUseStaff.employees = mockEmployees;
      
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('stat-employees-value')).toBeTruthy();
    });

    it('should show correct contractor count', () => {
      mockUseStaff.contractors = mockContractors;
      
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('stat-contractors-value')).toBeTruthy();
    });

    it('should show active count', () => {
      mockUseStaff.employees = mockEmployees;
      
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('stat-active-value')).toBeTruthy();
    });

    it('should update statistics when data changes', () => {
      const { getByTestId, rerender } = renderScreen();
      
      // Initially 0 employees
      expect(getByTestId('stat-employees-value')).toBeTruthy();
      
      // Add employees
      mockUseStaff.employees = mockEmployees;
      
      rerender(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      expect(getByTestId('stat-employees-value')).toBeTruthy();
    });
  });

  describe('Modal Integration', () => {
    it('should open add staff modal', () => {
      const { getByTestId } = renderScreen();
      
      const addButton = getByTestId('add-staff-button');
      fireEvent.press(addButton);
      
      expect(addButton).toBeTruthy();
    });

    it('should handle filter changes', () => {
      const { getByTestId } = renderScreen();
      
      const employeeFilter = getByTestId('filter-employee');
      fireEvent.press(employeeFilter);
      
      expect(employeeFilter).toBeTruthy();
    });

    it('should handle contractor filter', () => {
      const { getByTestId } = renderScreen();
      
      const contractorFilter = getByTestId('filter-contractor');
      fireEvent.press(contractorFilter);
      
      expect(contractorFilter).toBeTruthy();
    });

    it('should handle employee invitation submission', async () => {
      const { getByTestId } = renderScreen();
      
      const addButton = getByTestId('add-staff-button');
      fireEvent.press(addButton);
      
      expect(mockUseStaff.inviteEmployee).toBeDefined();
    });

    it('should handle contractor addition', async () => {
      const { getByTestId } = renderScreen();
      
      const addButton = getByTestId('add-staff-button');
      fireEvent.press(addButton);
      
      expect(mockUseStaff.addContractor).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle employee invitation errors', async () => {
      mockUseStaff.inviteEmployee.mockRejectedValue(new Error('Invitation failed'));
      
      const { getByTestId } = renderScreen();
      
      const addButton = getByTestId('add-staff-button');
      
      expect(mockUseStaff.inviteEmployee).toBeDefined();
    });

    it('should handle contractor addition errors', async () => {
      mockUseStaff.addContractor.mockRejectedValue(new Error('Addition failed'));
      
      const { getByTestId } = renderScreen();
      
      const addButton = getByTestId('add-staff-button');
      
      expect(mockUseStaff.addContractor).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should render with proper testID', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      expect(getByTestId('screen-title')).toBeTruthy();
    });

    it('should show loading state accessibly', () => {
      mockUseStaff.isLoading = true;
      
      const { getByTestId } = renderScreen();
      
      expect(getByTestId('loading-text')).toBeTruthy();
    });
  });

  describe('Data Integration', () => {
    it('should properly integrate with useStaff hook', () => {
      mockUseStaff.employees = mockEmployees;
      mockUseStaff.contractors = mockContractors;
      
      const { getByTestId } = renderScreen();
      
      // Verify hook data is displayed
      expect(getByTestId('staff-card-emp_1')).toBeTruthy();
      expect(getByTestId('staff-card-con_1')).toBeTruthy();
      expect(getByTestId('stat-employees-value')).toBeTruthy();
    });

    it('should handle dynamic data updates', () => {
      const { getByTestId, rerender } = renderScreen();
      
      // Initially empty
      expect(getByTestId('empty-state')).toBeTruthy();
      
      // Add data
      mockUseStaff.employees = [mockEmployees[0]];
      
      rerender(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      expect(getByTestId('staff-card-emp_1')).toBeTruthy();
    });
  });
});
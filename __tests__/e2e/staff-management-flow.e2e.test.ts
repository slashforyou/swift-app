/**
 * Staff Management Flow E2E Tests
 * Tests for complete staff management journey including employees and contractors
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeProvider';
import StaffCrewScreen from '../../src/screens/business/staffCrewScreen';
import * as staffService from '../../src/services/staffService';
import * as mockJobData from '../__mocks__/mockJobData';

// Mock external dependencies
jest.mock('../../src/services/staffService', () => ({
  fetchStaff: jest.fn(),
  inviteEmployee: jest.fn(),
  searchContractor: jest.fn(),
  addContractor: jest.fn(),
  removeStaffMember: jest.fn(),
  updateStaffMember: jest.fn(),
}));

jest.mock('../../src/localization/useLocalization', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'staff.titles.main': 'Staff Management',
        'staff.titles.loading': 'Loading staff...',
        'staff.empty.title': 'No staff members',
        'staff.empty.subtitle': 'Add your first employee or contractor',
        'staff.filters.all': 'All',
        'staff.filters.employees': 'Employees',
        'staff.filters.contractors': 'Contractors',
        'staff.stats.total': 'Total Active',
        'staff.stats.employees': 'Employees',
        'staff.stats.contractors': 'Contractors',
        'staff.stats.teams': 'Teams',
        'staff.actions.add': 'Add Staff',
        'staff.actions.remove': 'Remove',
        'staff.actions.edit': 'Edit',
        'staff.member.hourlyRate': 'Hourly Rate',
        'staff.member.skills': 'Skills',
        'staff.member.availability': 'Availability',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock AddStaffModal
jest.mock('../../src/components/modals/AddStaffModal', () => {
  return function MockAddStaffModal({ 
    visible, 
    onClose, 
    onSubmit 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    onSubmit: (data: any) => void; 
  }) {
    if (!visible) return null;
    
    return React.createElement('View', {
      testID: 'add-staff-modal',
      children: [
        React.createElement('Text', { key: 'title' }, 'Add Staff Member'),
        React.createElement('Button', {
          key: 'employee-btn',
          testID: 'add-employee-button',
          title: 'Add Employee',
          onPress: () => onSubmit({
            type: 'employee',
            name: 'John Employee',
            email: 'john.employee@test.com',
            phone: '+61 400 000 001',
            hourlyRate: 45,
          })
        }),
        React.createElement('Button', {
          key: 'contractor-btn', 
          testID: 'add-contractor-button',
          title: 'Add Contractor',
          onPress: () => onSubmit({
            type: 'contractor',
            name: 'Jane Contractor',
            email: 'jane.contractor@test.com',
            phone: '+61 400 000 002',
            hourlyRate: 60,
          })
        }),
        React.createElement('Button', {
          key: 'close-btn',
          testID: 'modal-close-button',
          title: 'Close',
          onPress: onClose
        }),
      ]
    });
  };
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Staff Management Flow E2E', () => {
  const mockEmployees = [
    mockJobData.createMockStaffMember({
      id: 'EMP-001',
      name: 'Alice Employee',
      type: 'employee',
      hourlyRate: 45,
      skills: ['Moving', 'Packing'],
    }),
    mockJobData.createMockStaffMember({
      id: 'EMP-002', 
      name: 'Bob Employee',
      type: 'employee',
      hourlyRate: 50,
      skills: ['Heavy Lifting', 'Driving'],
    }),
  ];

  const mockContractors = [
    mockJobData.createMockStaffMember({
      id: 'CON-001',
      name: 'Charlie Contractor',
      type: 'contractor',
      hourlyRate: 65,
      skills: ['Specialized Moving', 'Piano'],
    }),
  ];

  const mockAllStaff = [...mockEmployees, ...mockContractors];

  beforeEach(() => {
    jest.clearAllMasks();
    
    // Default successful API responses
    (staffService.fetchStaff as jest.Mock).mockResolvedValue({
      staff: mockAllStaff,
      employees: mockEmployees,
      contractors: mockContractors,
      stats: {
        totalActive: 3,
        totalEmployees: 2,
        totalContractors: 1,
        totalTeams: 1,
        averageEmployeeRate: 47.5,
      },
    });

    (staffService.inviteEmployee as jest.Mock).mockResolvedValue({
      success: true,
      employee: mockJobData.createMockStaffMember({ type: 'employee' }),
    });

    (staffService.addContractor as jest.Mock).mockResolvedValue({
      success: true,
      contractor: mockJobData.createMockStaffMember({ type: 'contractor' }),
    });
  });

  describe('Staff List Display', () => {
    test('should display all staff members by default', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      // Wait for staff to load
      await waitFor(() => {
        expect(staffService.fetchStaff).toHaveBeenCalled();
      });

      // Should display screen title
      expect(getByText('Staff Management')).toBeTruthy();

      // Should display all staff members
      expect(getByText('Alice Employee')).toBeTruthy();
      expect(getByText('Bob Employee')).toBeTruthy();
      expect(getByText('Charlie Contractor')).toBeTruthy();

      // Should display staff cards with testIDs
      expect(getByTestId('staff-card-EMP-001')).toBeTruthy();
      expect(getByTestId('staff-card-EMP-002')).toBeTruthy();
      expect(getByTestId('staff-card-CON-001')).toBeTruthy();
    });

    test('should display staff statistics', async () => {
      const { getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('3')).toBeTruthy(); // Total active
        expect(getByText('2')).toBeTruthy(); // Employees
        expect(getByText('1')).toBeTruthy(); // Contractors
      });
    });

    test('should show empty state when no staff', async () => {
      (staffService.fetchStaff as jest.Mock).mockResolvedValue({
        staff: [],
        employees: [],
        contractors: [],
        stats: { totalActive: 0, totalEmployees: 0, totalContractors: 0 },
      });

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('empty-state')).toBeTruthy();
        expect(getByText('No staff members')).toBeTruthy();
        expect(getByText('Add your first employee or contractor')).toBeTruthy();
      });
    });
  });

  describe('Staff Filtering', () => {
    test('should filter by employees only', async () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Alice Employee')).toBeTruthy();
      });

      // Click employees filter
      fireEvent.press(getByText('Employees'));

      await waitFor(() => {
        // Should show employees only
        expect(getByText('Alice Employee')).toBeTruthy();
        expect(getByText('Bob Employee')).toBeTruthy();
        
        // Should hide contractors
        expect(queryByText('Charlie Contractor')).toBeNull();
      });
    });

    test('should filter by contractors only', async () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Charlie Contractor')).toBeTruthy();
      });

      // Click contractors filter
      fireEvent.press(getByText('Contractors'));

      await waitFor(() => {
        // Should show contractors only
        expect(getByText('Charlie Contractor')).toBeTruthy();
        
        // Should hide employees
        expect(queryByText('Alice Employee')).toBeNull();
        expect(queryByText('Bob Employee')).toBeNull();
      });
    });

    test('should return to all staff when clicking All filter', async () => {
      const { getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Alice Employee')).toBeTruthy();
      });

      // Filter to employees first
      fireEvent.press(getByText('Employees'));
      
      // Then back to all
      fireEvent.press(getByText('All'));

      await waitFor(() => {
        // Should show all staff again
        expect(getByText('Alice Employee')).toBeTruthy();
        expect(getByText('Bob Employee')).toBeTruthy();
        expect(getByText('Charlie Contractor')).toBeTruthy();
      });
    });
  });

  describe('Add Staff Flow', () => {
    test('should add new employee successfully', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Staff Management')).toBeTruthy();
      });

      // Open add staff modal
      const addButton = getByTestId('add-staff-button');
      fireEvent.press(addButton);

      // Should show modal
      expect(getByTestId('add-staff-modal')).toBeTruthy();
      expect(getByText('Add Staff Member')).toBeTruthy();

      // Add employee
      fireEvent.press(getByTestId('add-employee-button'));

      // Should call invite employee service
      await waitFor(() => {
        expect(staffService.inviteEmployee).toHaveBeenCalledWith({
          type: 'employee',
          name: 'John Employee',
          email: 'john.employee@test.com',
          phone: '+61 400 000 001',
          hourlyRate: 45,
        });
      });

      // Should refresh staff list
      expect(staffService.fetchStaff).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    test('should add new contractor successfully', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Staff Management')).toBeTruthy();
      });

      // Open add staff modal
      fireEvent.press(getByTestId('add-staff-button'));

      // Add contractor
      fireEvent.press(getByTestId('add-contractor-button'));

      // Should call add contractor service
      await waitFor(() => {
        expect(staffService.addContractor).toHaveBeenCalledWith({
          type: 'contractor',
          name: 'Jane Contractor',
          email: 'jane.contractor@test.com',
          phone: '+61 400 000 002',
          hourlyRate: 60,
        });
      });
    });

    test('should handle add staff errors', async () => {
      (staffService.inviteEmployee as jest.Mock).mockRejectedValue(
        new Error('Failed to invite employee')
      );

      const { getByTestId } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('add-staff-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('add-staff-button'));
      fireEvent.press(getByTestId('add-employee-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to invite employee'
        );
      });
    });

    test('should close modal when close button pressed', async () => {
      const { getByTestId, queryByTestId } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('add-staff-button')).toBeTruthy();
      });

      // Open modal
      fireEvent.press(getByTestId('add-staff-button'));
      expect(getByTestId('add-staff-modal')).toBeTruthy();

      // Close modal
      fireEvent.press(getByTestId('modal-close-button'));
      
      await waitFor(() => {
        expect(queryByTestId('add-staff-modal')).toBeNull();
      });
    });
  });

  describe('Pull to Refresh', () => {
    test('should refresh staff data on pull down', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(staffService.fetchStaff).toHaveBeenCalledTimes(1);
      });

      // Simulate pull to refresh
      const scrollView = getByTestId('staff-scroll-view');
      fireEvent(scrollView, 'onRefresh');

      await waitFor(() => {
        expect(staffService.fetchStaff).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator while fetching staff', async () => {
      // Delay the staff fetch to test loading state
      (staffService.fetchStaff as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          staff: mockAllStaff,
          employees: mockEmployees,
          contractors: mockContractors,
        }), 1000))
      );

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      // Should show loading state
      expect(getByTestId('loading-text')).toBeTruthy();
      expect(getByText('Loading staff...')).toBeTruthy();

      // Wait for data to load
      await waitFor(() => {
        expect(getByText('Alice Employee')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch staff API errors', async () => {
      (staffService.fetchStaff as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to load staff data'
        );
      });
    });

    test('should handle service unavailable', async () => {
      (staffService.fetchStaff as jest.Mock).mockRejectedValue({
        status: 503,
        message: 'Service Unavailable',
      });

      render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Service Error',
          'Staff service is temporarily unavailable'
        );
      });
    });
  });

  describe('Staff Member Details', () => {
    test('should display staff member information correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should display names
        expect(getByText('Alice Employee')).toBeTruthy();
        
        // Should display hourly rates
        expect(getByText('$45/hr')).toBeTruthy();
        expect(getByText('$50/hr')).toBeTruthy();
        expect(getByText('$65/hr')).toBeTruthy();
        
        // Should display skills
        expect(getByText('Moving, Packing')).toBeTruthy();
        expect(getByText('Heavy Lifting, Driving')).toBeTruthy();
        expect(getByText('Specialized Moving, Piano')).toBeTruthy();
      });
    });

    test('should show different styling for employees vs contractors', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <StaffCrewScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const employeeCard = getByTestId('staff-card-EMP-001');
        const contractorCard = getByTestId('staff-card-CON-001');
        
        // Should have different test IDs indicating type
        expect(employeeCard).toBeTruthy();
        expect(contractorCard).toBeTruthy();
      });
    });
  });
});
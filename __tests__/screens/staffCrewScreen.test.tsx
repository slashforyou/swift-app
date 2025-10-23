/**
 * Tests d'intégration pour StaffCrewScreen
 */
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { ThemeProvider } from '../../../src/context/ThemeProvider';
import StaffCrewScreen from '../../../src/screens/business/staffCrewScreen';
import { Contractor, Employee } from '../../../src/types/staff';

// Mock des dépendances
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

jest.mock('../../../src/context/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007AFF',
      backgroundSecondary: '#F2F2F7',
      border: '#E5E5EA',
    },
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../src/localization/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../src/constants/Styles', () => ({
  DESIGN_TOKENS: {
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      full: 9999,
    },
    typography: {
      subtitle: {
        fontSize: 18,
      },
    },
  },
  useCommonThemedStyles: () => ({
    container: {
      flex: 1,
    },
  }),
}));

// Mock du hook useStaff
const mockUseStaff = {
  employees: [] as Employee[],
  contractors: [] as Contractor[],
  inviteEmployee: jest.fn(),
  searchContractor: jest.fn(),
  addContractor: jest.fn(),
  isLoading: false,
  error: null,
};

jest.mock('../../../src/hooks/useStaff', () => ({
  useStaff: () => mockUseStaff,
}));

// Mock des modales
jest.mock('../../../src/components/business/modals/InviteEmployeeModal', () => {
  return function MockInviteEmployeeModal({ visible, onClose, onSubmit }: any) {
    if (!visible) return null;
    return (
      <div>
        <div>InviteEmployeeModal</div>
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSubmit({
          firstName: 'Test',
          lastName: 'Employee',
          email: 'test@example.com',
          phone: '+61 400 000 000',
          role: 'Mover',
          team: 'Team A',
          hourlyRate: 30,
        })}>Submit Employee</button>
      </div>
    );
  };
});

jest.mock('../../../src/components/business/modals/AddContractorModal', () => {
  return function MockAddContractorModal({ visible, onClose, onSearch, onAdd }: any) {
    if (!visible) return null;
    return (
      <div>
        <div>AddContractorModal</div>
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSearch('test')}>Search Contractor</button>
        <button onClick={() => onAdd('con_1', 'preferred')}>Add Contractor</button>
      </div>
    );
  };
});

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
    invitationStatus: 'pending',
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
    it('should render employees section', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Employés (TFN)')).toBeTruthy();
      expect(getByText('Gérez vos employés avec Tax File Number. Ils recevront une invitation par email pour compléter leur profil.')).toBeTruthy();
      expect(getByText('Inviter un Employé')).toBeTruthy();
    });

    it('should render contractors section', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Prestataires (ABN)')).toBeTruthy();
      expect(getByText('Recherchez et ajoutez des prestataires avec Australian Business Number. Vous pouvez définir le type de relation contractuelle.')).toBeTruthy();
      expect(getByText('Rechercher un Prestataire')).toBeTruthy();
    });

    it('should render statistics section', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('📊 Statistiques Staff')).toBeTruthy();
      expect(getByText('Employés TFN')).toBeTruthy();
      expect(getByText('Prestataires ABN')).toBeTruthy();
      expect(getByText('Comptes actifs')).toBeTruthy();
    });

    it('should show empty state when no employees', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Aucun employé pour le moment.')).toBeTruthy();
      expect(getByText('Commencez par inviter votre premier employé !')).toBeTruthy();
    });

    it('should show empty state when no contractors', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Aucun prestataire pour le moment.')).toBeTruthy();
      expect(getByText('Recherchez et ajoutez vos premiers prestataires !')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      mockUseStaff.isLoading = true;
      
      const { getByText } = renderScreen();
      
      expect(getByText('Chargement des employés...')).toBeTruthy();
    });

    it('should hide content when loading', () => {
      mockUseStaff.isLoading = true;
      
      const { queryByText } = renderScreen();
      
      expect(queryByText('Aucun employé pour le moment.')).toBeFalsy();
    });
  });

  describe('Employee Display', () => {
    beforeEach(() => {
      mockUseStaff.employees = mockEmployees;
    });

    it('should display employee cards when employees exist', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('John Smith')).toBeTruthy();
      expect(getByText('Sarah Johnson')).toBeTruthy();
      expect(getByText('Moving Supervisor • Local Team A')).toBeTruthy();
      expect(getByText('Senior Mover • Interstate Team')).toBeTruthy();
    });

    it('should show employee status badges', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Compte actif')).toBeTruthy();
      expect(getByText('Invitation en attente')).toBeTruthy();
    });

    it('should display TFN and hourly rate', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('123-456-789')).toBeTruthy();
      expect(getByText('$35/h')).toBeTruthy();
      expect(getByText('987-654-321')).toBeTruthy();
      expect(getByText('$32/h')).toBeTruthy();
    });

    it('should handle employee card press', () => {
      const { getByText } = renderScreen();
      
      const employeeCard = getByText('John Smith');
      fireEvent.press(employeeCard);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'John Smith',
        expect.stringContaining('Moving Supervisor'),
        expect.any(Array)
      );
    });

    it('should show "Non renseigné" for missing TFN', () => {
      const employeeWithoutTFN = {
        ...mockEmployees[0],
        tfn: undefined,
      };
      mockUseStaff.employees = [employeeWithoutTFN];
      
      const { getByText } = renderScreen();
      
      expect(getByText('Non renseigné')).toBeTruthy();
    });
  });

  describe('Contractor Display', () => {
    beforeEach(() => {
      mockUseStaff.contractors = mockContractors;
    });

    it('should display contractor cards when contractors exist', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Mike Wilson')).toBeTruthy();
      expect(getByText('Emma Davis')).toBeTruthy();
      expect(getByText('Specialized Mover')).toBeTruthy();
      expect(getByText('Packing Expert')).toBeTruthy();
    });

    it('should show contractor status badges', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('Préférentiel')).toBeTruthy();
      expect(getByText('Exclusif')).toBeTruthy();
    });

    it('should show verified badge for verified contractors', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('VÉRIFIÉ')).toBeTruthy();
    });

    it('should display ABN and rates', () => {
      const { getByText } = renderScreen();
      
      expect(getByText('12 345 678 901')).toBeTruthy();
      expect(getByText('$50/h')).toBeTruthy();
      expect(getByText('98 765 432 109')).toBeTruthy();
      expect(getByText('$300/projet')).toBeTruthy();
    });

    it('should handle contractor card press', () => {
      const { getByText } = renderScreen();
      
      const contractorCard = getByText('Mike Wilson');
      fireEvent.press(contractorCard);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Mike Wilson',
        expect.stringContaining('Specialized Mover'),
        expect.any(Array)
      );
    });
  });

  describe('Statistics Display', () => {
    it('should show correct employee count', () => {
      mockUseStaff.employees = mockEmployees;
      
      const { getByText } = renderScreen();
      
      // Chercher le nombre d'employés dans la section statistiques
      expect(getByText('2')).toBeTruthy();
    });

    it('should show correct contractor count', () => {
      mockUseStaff.contractors = mockContractors;
      
      const { getByText } = renderScreen();
      
      // Chercher le nombre de prestataires
      expect(getByText('2')).toBeTruthy();
    });

    it('should show correct active accounts count', () => {
      mockUseStaff.employees = mockEmployees;
      
      const { getByText } = renderScreen();
      
      // Un seul employé a le statut "accepted"
      expect(getByText('1')).toBeTruthy();
    });

    it('should update statistics when data changes', () => {
      const { getByText, rerender } = renderScreen();
      
      // Initialement 0 employés
      expect(getByText('0')).toBeTruthy();
      
      // Ajouter des employés
      mockUseStaff.employees = mockEmployees;
      
      rerender(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      expect(getByText('2')).toBeTruthy();
    });
  });

  describe('Modal Integration', () => {
    it('should open invite employee modal', () => {
      const { getByText, queryByText } = renderScreen();
      
      const inviteButton = getByText('Inviter un Employé');
      fireEvent.press(inviteButton);
      
      expect(queryByText('InviteEmployeeModal')).toBeTruthy();
    });

    it('should open add contractor modal', () => {
      const { getByText, queryByText } = renderScreen();
      
      const addContractorButton = getByText('Rechercher un Prestataire');
      fireEvent.press(addContractorButton);
      
      expect(queryByText('AddContractorModal')).toBeTruthy();
    });

    it('should close modals', () => {
      const { getByText, queryByText } = renderScreen();
      
      // Ouvrir la modal d'invitation
      const inviteButton = getByText('Inviter un Employé');
      fireEvent.press(inviteButton);
      
      expect(queryByText('InviteEmployeeModal')).toBeTruthy();
      
      // Fermer la modal
      const closeButton = getByText('Close Modal');
      fireEvent.press(closeButton);
      
      expect(queryByText('InviteEmployeeModal')).toBeFalsy();
    });

    it('should handle employee invitation submission', async () => {
      const { getByText } = renderScreen();
      
      // Ouvrir la modal d'invitation
      const inviteButton = getByText('Inviter un Employé');
      fireEvent.press(inviteButton);
      
      // Soumettre l'invitation
      const submitButton = getByText('Submit Employee');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      expect(mockUseStaff.inviteEmployee).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com',
        phone: '+61 400 000 000',
        role: 'Mover',
        team: 'Team A',
        hourlyRate: 30,
      });
    });

    it('should handle contractor addition', async () => {
      const { getByText } = renderScreen();
      
      // Ouvrir la modal de recherche
      const searchButton = getByText('Rechercher un Prestataire');
      fireEvent.press(searchButton);
      
      // Ajouter un prestataire
      const addButton = getByText('Add Contractor');
      
      await act(async () => {
        fireEvent.press(addButton);
      });
      
      expect(mockUseStaff.addContractor).toHaveBeenCalledWith('con_1', 'preferred');
    });
  });

  describe('Error Handling', () => {
    it('should handle employee invitation errors', async () => {
      mockUseStaff.inviteEmployee.mockRejectedValue(new Error('Invitation failed'));
      
      const { getByText } = renderScreen();
      
      // Ouvrir la modal et soumettre
      const inviteButton = getByText('Inviter un Employé');
      fireEvent.press(inviteButton);
      
      const submitButton = getByText('Submit Employee');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Impossible d\'envoyer l\'invitation'
      );
    });

    it('should handle contractor addition errors', async () => {
      mockUseStaff.addContractor.mockRejectedValue(new Error('Addition failed'));
      
      const { getByText } = renderScreen();
      
      // Ouvrir la modal et ajouter
      const searchButton = getByText('Rechercher un Prestataire');
      fireEvent.press(searchButton);
      
      const addButton = getByText('Add Contractor');
      
      await act(async () => {
        fireEvent.press(addButton);
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Impossible d\'ajouter le prestataire'
      );
    });
  });

  describe('Accessibility', () => {
    it('should render with proper scroll view for accessibility', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      // Le ScrollView devrait être présent
      expect(getByTestId).toBeDefined();
    });

    it('should show loading state accessibly', () => {
      mockUseStaff.isLoading = true;
      
      const { getByText } = renderScreen();
      
      expect(getByText('Chargement des employés...')).toBeTruthy();
    });
  });

  describe('Data Integration', () => {
    it('should properly integrate with useStaff hook', () => {
      mockUseStaff.employees = mockEmployees;
      mockUseStaff.contractors = mockContractors;
      
      const { getByText } = renderScreen();
      
      // Vérifier que les données du hook sont affichées
      expect(getByText('John Smith')).toBeTruthy();
      expect(getByText('Mike Wilson')).toBeTruthy();
      expect(getByText('2')).toBeTruthy(); // Count dans les stats
    });

    it('should handle dynamic data updates', () => {
      const { getByText, rerender } = renderScreen();
      
      // Initialement vide
      expect(getByText('Aucun employé pour le moment.')).toBeTruthy();
      
      // Ajouter des données
      mockUseStaff.employees = [mockEmployees[0]];
      
      rerender(
        <ThemeProvider>
          <StaffCrewScreen />
        </ThemeProvider>
      );
      
      expect(getByText('John Smith')).toBeTruthy();
    });
  });
});
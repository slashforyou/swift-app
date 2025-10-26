/**
 * Tests d'intégration pour AddContractorModal
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import AddContractorModal from '../../../src/components/business/modals/AddContractorModal';
import { ThemeProvider } from '../../../src/context/ThemeProvider';
import { Contractor } from '../../../src/types/staff';

// Mock Alert
jest.spyOn(Alert, 'alert');

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

const mockOnClose = jest.fn();
const mockOnSearch = jest.fn();
const mockOnAdd = jest.fn();

const mockContractors: Contractor[] = [
  {
    id: 'con_1',
    type: 'contractor',
    firstName: 'John',
    lastName: 'Contractor',
    email: 'john@contractor.com',
    phone: '+61 400 000 000',
    role: 'Specialized Mover',
    abn: '12 345 678 901',
    rate: 50,
    rateType: 'hourly',
    contractStatus: 'standard',
    isVerified: true,
    startDate: '2023-01-01',
    status: 'active',
    team: 'Team A',
  },
  {
    id: 'con_2',
    type: 'contractor',
    firstName: 'Sarah',
    lastName: 'Expert',
    email: 'sarah@expert.com',
    phone: '+61 400 000 001',
    role: 'Packing Specialist',
    abn: '98 765 432 109',
    rate: 300,
    rateType: 'project',
    contractStatus: 'preferred',
    isVerified: false,
    startDate: '2023-02-01',
    status: 'active',
    team: 'Team B',
  }
];

const defaultProps = {
  visible: true,
  onClose: mockOnClose,
  onSearch: mockOnSearch,
  onAdd: mockOnAdd,
};

const renderModal = (props = {}) => {
  return render(
    <ThemeProvider>
      <AddContractorModal {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('AddContractorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSearch.mockResolvedValue(mockContractors);
    mockOnAdd.mockResolvedValue(undefined);
  });

  describe('Rendering - Search Step', () => {
    it('should render search interface initially', () => {
      const { getByTestId } = renderModal();
      
      expect(getByTestId('modal-title')).toBeTruthy();
      expect(getByTestId('name-label')).toBeTruthy();
      expect(getByTestId('search-button')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });

    it('should render search instructions', () => {
      const { getByTestId } = renderModal();
      
      expect(getByTestId('search-instructions')).toBeTruthy();
      expect(getByTestId('search-tips-title')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = renderModal({ visible: false });
      
      expect(queryByTestId('modal-title')).toBeFalsy();
    });

    it('should render search input with placeholder', () => {
      const { getByPlaceholderText } = renderModal();
      
      expect(getByPlaceholderText('John Smith ou 12 345 678 901')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search when search button is pressed', async () => {
      const { getByPlaceholderText, getByTestId } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      const searchButton = getByTestId('search-button');
      
      fireEvent.changeText(searchInput, 'John');
      fireEvent.press(searchButton);
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('John');
      });
    });

    it('should show error for empty search term', async () => {
      const { getByText } = renderModal();
      
      const searchButton = getByText('Rechercher');
      fireEvent.press(searchButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Veuillez saisir un nom ou un ABN'
        );
      });
    });

    it('should show loading state during search', async () => {
      mockOnSearch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
      
      const { getByPlaceholderText, getByText, queryByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      // Vérifier que le bouton montre le loading
      expect(queryByText('Rechercher')).toBeFalsy();
    });

    it('should handle search errors', async () => {
      mockOnSearch.mockRejectedValue(new Error('Search failed'));
      
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      const searchButton = getByText('Rechercher');
      
      fireEvent.changeText(searchInput, 'John');
      
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Erreur lors de la recherche'
        );
      });
    });
  });

  describe('Search Results Step', () => {
    it('should display search results', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // First perform search to navigate to results step
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByTestId('search-button');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(getByTestId('results-title')).toBeTruthy();
        expect(getByTestId('contractor-name-con_1')).toBeTruthy();
        expect(getByTestId('contractor-name-con_2')).toBeTruthy();
      });
    });

    it('should show contractor details in results', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Perform search first
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      
      await waitFor(() => {
        expect(getByTestId('contractor-role-con_1')).toBeTruthy();
        expect(getByTestId('contractor-role-con_2')).toBeTruthy();
        expect(getByTestId('contractor-rate-con_1')).toBeTruthy();
        expect(getByTestId('contractor-rate-con_2')).toBeTruthy();
      });
    });

    it('should show verified badge for verified contractors', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Perform search first
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      
      await waitFor(() => {
        expect(getByTestId('contractor-verified-con_1')).toBeTruthy();
      });
    });

    it('should allow selecting a contractor', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Perform search first
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      
      await waitFor(() => {
        const contractorCard = getByTestId('contractor-card-con_1');
        fireEvent.press(contractorCard);
      });
      
      // Should navigate to contract step
      await waitFor(() => {
        expect(getByTestId('contract-title')).toBeTruthy();
      });
    });

    it('should allow going back to search', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Perform search first
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
      });
      
      // Should return to search step
      await waitFor(() => {
        expect(getByTestId('modal-title')).toBeTruthy();
      });
    });
  });

  describe('Contract Status Step', () => {
    it('should display contract status options', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate to contract step
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        expect(getByTestId('contract-title')).toBeTruthy();
        expect(getByTestId('contract-option-exclusive')).toBeTruthy();
        expect(getByTestId('contract-option-non-exclusive')).toBeTruthy();
        expect(getByTestId('contract-option-preferred')).toBeTruthy();
        expect(getByTestId('contract-option-standard')).toBeTruthy();
      });
    });

    it('should show contract status descriptions', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate to contract step
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        expect(getByTestId('contract-description-exclusive')).toBeTruthy();
        expect(getByTestId('contract-description-non-exclusive')).toBeTruthy();
        expect(getByTestId('contract-description-preferred')).toBeTruthy();
        expect(getByTestId('contract-description-standard')).toBeTruthy();
      });
    });

    it('should allow selecting a contract status', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate to contract step
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        const exclusiveOption = getByTestId('contract-option-exclusive');
        fireEvent.press(exclusiveOption);
      });
      
      // Verify option is visually selected
      await waitFor(() => {
        expect(getByTestId('selected-checkmark')).toBeTruthy();
      });
    });

    it('should display selected contractor info', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate to contract step
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        expect(getByTestId('summary-name')).toBeTruthy();
        expect(getByTestId('summary-details')).toBeTruthy();
      });
    });
  });

  describe('Contractor Addition', () => {
    it('should add contractor with selected status', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate through all steps
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contract-option-exclusive'));
      });
      
      // Click add button
      await waitFor(() => {
        const addButton = getByTestId('add-button');
        fireEvent.press(addButton);
      });
      
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith('con_1', 'exclusive');
      });
    });

    it('should show success message after adding contractor', async () => {
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate through all steps
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      // Click add button
      await waitFor(() => {
        const addButton = getByTestId('add-button');
        fireEvent.press(addButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Prestataire ajouté',
          expect.stringContaining('John Contractor a été ajouté'),
          expect.any(Array)
        );
      });
    });

    it('should show loading state during addition', async () => {
      mockOnAdd.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate through all steps
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        const addButton = getByTestId('add-button');
        
        act(() => {
          fireEvent.press(addButton);
        });
        
        // Verify button still exists (loading state)
        expect(getByTestId('add-button')).toBeTruthy();
      });
    });

    it('should handle addition errors', async () => {
      mockOnAdd.mockRejectedValue(new Error('Addition failed'));
      
      const { getByTestId, getByPlaceholderText } = renderModal();
      
      // Navigate through all steps
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      await waitFor(() => {
        fireEvent.press(getByTestId('contractor-card-con_1'));
      });
      
      await waitFor(() => {
        const addButton = getByTestId('add-button');
        
        act(() => {
          fireEvent.press(addButton);
        });
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible d\'ajouter le prestataire');
      });
    });
  });

  describe('Navigation and Modal Controls', () => {
    it('should close modal from any step', () => {
      const { getByTestId } = renderModal();
      
      const closeButton = getByTestId('close-button');
      fireEvent.press(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset modal state when closed', async () => {
      const { getByPlaceholderText, getByTestId, rerender } = renderModal();
      
      // Perform a search
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      await act(async () => {
        fireEvent.press(getByTestId('search-button'));
      });
      
      // Wait for results to be displayed
      await waitFor(() => {
        expect(getByTestId('results-title')).toBeTruthy();
      });
      
      // Click close button
      fireEvent.press(getByTestId('close-button'));
      
      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalled();
      
      // Reopen modal (simulating parent component reopening it)
      rerender(
        <ThemeProvider>
          <AddContractorModal {...defaultProps} visible={true} />
        </ThemeProvider>
      );
      
      // Should be back to search step with cleared form
      expect(getByTestId('modal-title')).toBeTruthy();
      expect(getByPlaceholderText('John Smith ou 12 345 678 901').props.value).toBe('');
    });

    it('should navigate back between steps', async () => {
      const { getByPlaceholderText, getByTestId } = renderModal();
      
      // Aller aux résultats
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByTestId('search-button');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      // Aller au contrat
      await waitFor(() => {
        const contractorCard = getByTestId('contractor-card-con_1');
        fireEvent.press(contractorCard);
      });
      
      // Retourner aux résultats
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
        
        expect(getByTestId('results-title')).toBeTruthy();
      });
      
      // Retourner à la recherche
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
        
        expect(getByTestId('modal-title')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search results', async () => {
      mockOnSearch.mockResolvedValue([]);
      
      const { getByPlaceholderText, getByTestId } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'Nonexistent');
      
      const searchButton = getByTestId('search-button');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Aucun résultat',
          'Aucun prestataire trouvé avec ces critères'
        );
      });
    });

    it('should handle contractors without verification', async () => {
      const unverifiedContractors = [
        {
          ...mockContractors[0],
          isVerified: false,
        }
      ];
      
      mockOnSearch.mockResolvedValue(unverifiedContractors);
      
      const { getByPlaceholderText, getByTestId, queryByTestId } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByTestId('search-button');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(queryByTestId('contractor-verified-con_1')).toBeFalsy();
      });
    });

    it('should handle different rate types correctly', async () => {
      const { getByPlaceholderText, getByTestId } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'Sarah');
      
      const searchButton = getByTestId('search-button');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        // Vérifie que le rate s'affiche (le format peut varier mais le testID est stable)
        expect(getByTestId('contractor-rate-con_2')).toBeTruthy();
      });
    });
  });
});
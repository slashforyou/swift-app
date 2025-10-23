/**
 * Tests d'intégration pour AddContractorModal
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import AddContractorModal from '../../../src/components/business/modals/AddContractorModal';
import { ThemeProvider } from '../../../src/context/ThemeProvider';
import { Contractor } from '../../../src/types/staff';

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
      const { getByText } = renderModal();
      
      expect(getByText('Rechercher un Prestataire')).toBeTruthy();
      expect(getByText('Nom et prénom ou ABN')).toBeTruthy();
      expect(getByText('Rechercher')).toBeTruthy();
      expect(getByText('Annuler')).toBeTruthy();
    });

    it('should render search instructions', () => {
      const { getByText } = renderModal();
      
      expect(getByText(/Recherchez un prestataire par son nom complet ou son ABN/)).toBeTruthy();
      expect(getByText(/💡 Conseils de recherche/)).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderModal({ visible: false });
      
      expect(queryByText('Rechercher un Prestataire')).toBeFalsy();
    });

    it('should render search input with placeholder', () => {
      const { getByPlaceholderText } = renderModal();
      
      expect(getByPlaceholderText('John Smith ou 12 345 678 901')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search when search button is pressed', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      const searchButton = getByText('Rechercher');
      
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
    beforeEach(async () => {
      // Naviguer vers l'étape des résultats
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalled();
      });
    });

    it('should display search results', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('Résultats (2)')).toBeTruthy();
        expect(getByText('John Contractor')).toBeTruthy();
        expect(getByText('Sarah Expert')).toBeTruthy();
      });
    });

    it('should show contractor details in results', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('Specialized Mover')).toBeTruthy();
        expect(getByText('Packing Specialist')).toBeTruthy();
        expect(getByText('$50/h')).toBeTruthy();
        expect(getByText('$300/projet')).toBeTruthy();
      });
    });

    it('should show verified badge for verified contractors', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('VÉRIFIÉ')).toBeTruthy();
      });
    });

    it('should allow selecting a contractor', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const contractorCard = getByText('John Contractor');
        fireEvent.press(contractorCard);
        
        // Devrait naviguer vers l'étape du contrat
        expect(getByText('Statut du Contrat')).toBeTruthy();
      });
    });

    it('should allow going back to search', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const backButton = getByText('← Retour');
        fireEvent.press(backButton);
        
        // Devrait retourner à la recherche
        expect(getByText('Rechercher un Prestataire')).toBeTruthy();
      });
    });
  });

  describe('Contract Status Step', () => {
    beforeEach(async () => {
      // Naviguer vers l'étape du contrat
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        const contractorCard = getByText('John Contractor');
        fireEvent.press(contractorCard);
      });
    });

    it('should display contract status options', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('Statut du Contrat')).toBeTruthy();
        expect(getByText('Exclusif')).toBeTruthy();
        expect(getByText('Non-exclusif')).toBeTruthy();
        expect(getByText('Préférentiel')).toBeTruthy();
        expect(getByText('Standard')).toBeTruthy();
      });
    });

    it('should show contract status descriptions', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('Travaille uniquement pour votre entreprise')).toBeTruthy();
        expect(getByText('Peut travailler pour d\'autres entreprises')).toBeTruthy();
        expect(getByText('Prestataire privilégié avec conditions avantageuses')).toBeTruthy();
        expect(getByText('Relation contractuelle standard')).toBeTruthy();
      });
    });

    it('should allow selecting a contract status', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const exclusiveOption = getByText('Exclusif');
        fireEvent.press(exclusiveOption);
        
        // Vérifier que l'option est sélectionnée visuellement
        expect(getByText('✓')).toBeTruthy();
      });
    });

    it('should display selected contractor info', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        expect(getByText('John Contractor')).toBeTruthy();
        expect(getByText('Specialized Mover • $50/h')).toBeTruthy();
      });
    });
  });

  describe('Contractor Addition', () => {
    beforeEach(async () => {
      // Naviguer vers l'étape du contrat et sélectionner un statut
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        const contractorCard = getByText('John Contractor');
        fireEvent.press(contractorCard);
      });
      
      await waitFor(() => {
        const exclusiveOption = getByText('Exclusif');
        fireEvent.press(exclusiveOption);
      });
    });

    it('should add contractor with selected status', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const addButton = getByText('Ajouter au Staff');
        fireEvent.press(addButton);
      });
      
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith('con_1', 'exclusive');
      });
    });

    it('should show success message after adding contractor', async () => {
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const addButton = getByText('Ajouter au Staff');
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
      
      const { getByText, queryByText } = renderModal();
      
      await waitFor(() => {
        const addButton = getByText('Ajouter au Staff');
        
        act(() => {
          fireEvent.press(addButton);
        });
        
        // Vérifier que le bouton montre le loading
        expect(queryByText('Ajouter au Staff')).toBeFalsy();
      });
    });

    it('should handle addition errors', async () => {
      mockOnAdd.mockRejectedValue(new Error('Addition failed'));
      
      const { getByText } = renderModal();
      
      await waitFor(() => {
        const addButton = getByText('Ajouter au Staff');
        
        act(() => {
          fireEvent.press(addButton);
        });
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible d\'ajouter le prestataire'
        );
      });
    });
  });

  describe('Navigation and Modal Controls', () => {
    it('should close modal from any step', () => {
      const { getByText } = renderModal();
      
      const closeButton = getByText('×');
      fireEvent.press(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset modal state when closed', async () => {
      const { getByPlaceholderText, getByText, rerender } = renderModal();
      
      // Faire une recherche
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      // Fermer et rouvrir la modal
      rerender(
        <ThemeProvider>
          <AddContractorModal {...defaultProps} visible={false} />
        </ThemeProvider>
      );
      
      rerender(
        <ThemeProvider>
          <AddContractorModal {...defaultProps} visible={true} />
        </ThemeProvider>
      );
      
      // Devrait être retourné à l'étape de recherche
      expect(getByText('Rechercher un Prestataire')).toBeTruthy();
      expect(getByPlaceholderText('John Smith ou 12 345 678 901').props.value).toBe('');
    });

    it('should navigate back between steps', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      // Aller aux résultats
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      // Aller au contrat
      await waitFor(() => {
        const contractorCard = getByText('John Contractor');
        fireEvent.press(contractorCard);
      });
      
      // Retourner aux résultats
      await waitFor(() => {
        const backButton = getByText('← Retour');
        fireEvent.press(backButton);
        
        expect(getByText('Résultats (2)')).toBeTruthy();
      });
      
      // Retourner à la recherche
      await waitFor(() => {
        const backButton = getByText('← Retour');
        fireEvent.press(backButton);
        
        expect(getByText('Rechercher un Prestataire')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search results', async () => {
      mockOnSearch.mockResolvedValue([]);
      
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'Nonexistent');
      
      const searchButton = getByText('Rechercher');
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
      
      const { getByPlaceholderText, getByText, queryByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'John');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(queryByText('VÉRIFIÉ')).toBeFalsy();
      });
    });

    it('should handle different rate types correctly', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      const searchInput = getByPlaceholderText('John Smith ou 12 345 678 901');
      fireEvent.changeText(searchInput, 'Sarah');
      
      const searchButton = getByText('Rechercher');
      await act(async () => {
        fireEvent.press(searchButton);
      });
      
      await waitFor(() => {
        expect(getByText('$300/projet')).toBeTruthy();
      });
    });
  });
});
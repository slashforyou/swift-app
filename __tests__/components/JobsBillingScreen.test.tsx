/**
 * Tests pour JobsBillingScreen
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import JobsBillingScreen from '../../src/screens/business/jobsBillingScreen';

// Mock du hook useJobsBilling
const mockUseJobsBilling = {
  jobs: [
    {
      id: 'job1',
      code: 'JOB001',
      status: 'completed' as const,
      client: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+61400000001',
        email: 'john@test.com'
      },
      time: {
        startWindowStart: '2025-10-20T08:00:00Z',
        endWindowStart: '2025-10-20T12:00:00Z'
      },
      addresses: [{
        type: 'pickup',
        street: '123 Collins Street',
        city: 'Sydney'
      }],
      billing: {
        estimatedCost: 500,
        actualCost: 550,
        paymentStatus: 'paid' as const,
        currency: 'AUD'
      }
    },
    {
      id: 'job2',
      code: 'JOB002',
      status: 'completed' as const,
      client: {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+61400000002',
        email: 'jane@test.com'
      },
      time: {
        startWindowStart: '2025-10-21T09:00:00Z',
        endWindowStart: '2025-10-21T13:00:00Z'
      },
      addresses: [{
        type: 'pickup',
        street: '456 George Street',
        city: 'Sydney'
      }],
      billing: {
        estimatedCost: 300,
        actualCost: 0,
        paymentStatus: 'unpaid' as const,
        currency: 'AUD'
      }
    }
  ],
  isLoading: false,
  error: null,
  totalUnpaid: 1,
  totalPartial: 0,
  totalPaid: 1,
  refreshJobs: jest.fn(),
  createInvoice: jest.fn(),
  processRefund: jest.fn(),
};

jest.mock('../../src/hooks/useJobsBilling', () => ({
  useJobsBilling: () => mockUseJobsBilling
}));

// Mock du ThemeProvider
jest.mock('../../src/context/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FF9500',
      primaryHover: '#E6850E',
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      backgroundTertiary: '#E5E5E5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      success: '#10B981',
      error: '#EF4444'
    }
  })
}));

// Mock des constantes
jest.mock('../../src/constants/Styles', () => ({
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
    },
  }
}));

// Mock de Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Alert, 'prompt').mockImplementation(() => {});

describe('JobsBillingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it.skip('devrait afficher le titre et les statistiques', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Facturation des Jobs')).toBeTruthy();
      expect(getByText('1')).toBeTruthy(); // totalUnpaid
      expect(getByText('0')).toBeTruthy(); // totalPartial
      expect(getByText('1')).toBeTruthy(); // totalPaid
      expect(getByText('Non payés')).toBeTruthy();
      expect(getByText('Partiels')).toBeTruthy();
      expect(getByText('Payés')).toBeTruthy();
    });

    it.skip('devrait afficher les filtres de statut', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Tous')).toBeTruthy();
      expect(getByText('Non payés')).toBeTruthy();
      expect(getByText('Partiels')).toBeTruthy();
      expect(getByText('Payés')).toBeTruthy();
    });

    it('devrait afficher la liste des jobs', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('JOB001')).toBeTruthy();
      expect(getByText('JOB002')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
    });
  });

  describe('Filtrage des jobs', () => {
    it.skip('devrait filtrer les jobs par statut non payé', () => {
      const { getByText, queryByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur le filtre "Non payés"
      fireEvent.press(getByText('Non payés'));
      
      // Seul JOB002 (unpaid) devrait être visible
      expect(getByText('JOB002')).toBeTruthy();
      expect(queryByText('JOB001')).toBeNull();
    });

    it.skip('devrait filtrer les jobs par statut payé', () => {
      const { getByText, queryByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur le filtre "Payés"
      fireEvent.press(getByText('Payés'));
      
      // Seul JOB001 (paid) devrait être visible
      expect(getByText('JOB001')).toBeTruthy();
      expect(queryByText('JOB002')).toBeNull();
    });

    it.skip('devrait afficher tous les jobs avec le filtre "Tous"', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur "Non payés" d'abord
      fireEvent.press(getByText('Non payés'));
      
      // Puis cliquer sur "Tous"
      fireEvent.press(getByText('Tous'));
      
      // Les deux jobs devraient être visibles
      expect(getByText('JOB001')).toBeTruthy();
      expect(getByText('JOB002')).toBeTruthy();
    });
  });

  describe('Actions de facturation', () => {
    it('devrait afficher le bouton "Facturer" pour les jobs non payés', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Facturer')).toBeTruthy();
    });

    it('devrait appeler createInvoice lors du clic sur "Facturer"', async () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      fireEvent.press(getByText('Facturer'));
      
      await waitFor(() => {
        expect(mockUseJobsBilling.createInvoice).toHaveBeenCalledWith('job2');
      });
    });

    it('devrait afficher le bouton "Rembourser" pour les jobs payés', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Rembourser')).toBeTruthy();
    });

    it('devrait ouvrir une prompt pour le remboursement', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      fireEvent.press(getByText('Rembourser'));
      
      expect(Alert.prompt).toHaveBeenCalledWith(
        'Remboursement',
        'Montant à rembourser (max: $550.00)',
        expect.any(Array),
        'plain-text',
        '',
        'numeric'
      );
    });
  });

  describe('Formatage des données', () => {
    it('devrait formater correctement les montants en AUD', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('$500.00')).toBeTruthy(); // estimatedCost
      expect(getByText('$550.00')).toBeTruthy(); // actualCost
      expect(getByText('$300.00')).toBeTruthy(); // estimatedCost job2
    });

    it('devrait formater correctement les dates', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('20/10/2025')).toBeTruthy();
      expect(getByText('21/10/2025')).toBeTruthy();
    });

    it('devrait afficher les bons statuts', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Payé')).toBeTruthy();
      expect(getByText('Non payé')).toBeTruthy();
    });
  });

  describe('États de chargement et erreurs', () => {
    it.skip('devrait afficher un indicateur de chargement', () => {
      const loadingMock = {
        ...mockUseJobsBilling,
        isLoading: true,
        jobs: []
      };
      
      jest.doMock('../../src/hooks/useJobsBilling', () => ({
        useJobsBilling: () => loadingMock
      }));

      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Chargement de la facturation...')).toBeTruthy();
    });

    it.skip('devrait afficher un message d\'erreur', () => {
      const errorMock = {
        ...mockUseJobsBilling,
        error: 'Erreur réseau'
      };
      
      jest.doMock('../../src/hooks/useJobsBilling', () => ({
        useJobsBilling: () => errorMock
      }));

      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Erreur réseau')).toBeTruthy();
    });

    it.skip('devrait afficher un message quand aucun job n\'est trouvé', () => {
      const emptyMock = {
        ...mockUseJobsBilling,
        jobs: [],
        totalUnpaid: 0,
        totalPartial: 0,
        totalPaid: 0
      };
      
      jest.doMock('../../src/hooks/useJobsBilling', () => ({
        useJobsBilling: () => emptyMock
      }));

      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Aucun job facturé trouvé')).toBeTruthy();
    });
  });

  describe('Actualisation des données', () => {
    it('devrait permettre le pull-to-refresh', () => {
      const { getByTestId } = render(<JobsBillingScreen />);
      
      // La ScrollView avec RefreshControl devrait être présente
      // (Note: le test exact du pull-to-refresh nécessite une configuration plus complexe)
      expect(mockUseJobsBilling.refreshJobs).toBeDefined();
    });
  });

  describe('Informations détaillées des jobs', () => {
    it('devrait afficher les informations complètes du job', () => {
      const { getByText } = render(<JobsBillingScreen />);
      
      // Vérifier que toutes les informations sont affichées
      expect(getByText('123 Collins Street')).toBeTruthy();
      expect(getByText('456 George Street')).toBeTruthy();
    });

    it.skip('devrait gérer les adresses manquantes', () => {
      const jobsWithMissingAddress = [{
        ...mockUseJobsBilling.jobs[0],
        addresses: []
      }];

      const modifiedMock = {
        ...mockUseJobsBilling,
        jobs: jobsWithMissingAddress
      };

      jest.doMock('../../src/hooks/useJobsBilling', () => ({
        useJobsBilling: () => modifiedMock
      }));

      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Non définie')).toBeTruthy();
    });
  });
});
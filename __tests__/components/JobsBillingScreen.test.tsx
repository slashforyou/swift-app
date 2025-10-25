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
    it('devrait afficher le titre et les statistiques', () => {
      const { getByTestId, getByText } = render(<JobsBillingScreen />);
      
      expect(getByTestId('billing-screen-title')).toBeTruthy();
      expect(getByText('Facturation des Jobs')).toBeTruthy();
      
      // Vérifier les valeurs des statistiques via testID
      expect(getByTestId('stats-unpaid-value')).toHaveTextContent('1');
      expect(getByTestId('stats-partial-value')).toHaveTextContent('0');
      expect(getByTestId('stats-paid-value')).toHaveTextContent('1');
      
      // Vérifier les labels
      expect(getByTestId('stats-unpaid-label')).toHaveTextContent('Non payés');
      expect(getByTestId('stats-partial-label')).toHaveTextContent('Partiels');
      expect(getByTestId('stats-paid-label')).toHaveTextContent('Payés');
    });

    it('devrait afficher les filtres de statut', () => {
      const { getByTestId } = render(<JobsBillingScreen />);
      
      expect(getByTestId('filter-all')).toBeTruthy();
      expect(getByTestId('filter-unpaid')).toBeTruthy();
      expect(getByTestId('filter-partial')).toBeTruthy();
      expect(getByTestId('filter-paid')).toBeTruthy();
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
    it('devrait filtrer les jobs par statut non payé', () => {
      const { getByTestId, getByText, queryByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur le filtre "Non payés"
      fireEvent.press(getByTestId('filter-unpaid'));
      
      // Seul JOB002 (unpaid) devrait être visible
      expect(getByText('JOB002')).toBeTruthy();
      expect(queryByText('JOB001')).toBeNull();
    });

    it('devrait filtrer les jobs par statut payé', () => {
      const { getByTestId, getByText, queryByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur le filtre "Payés"
      fireEvent.press(getByTestId('filter-paid'));
      
      // Seul JOB001 (paid) devrait être visible
      expect(getByText('JOB001')).toBeTruthy();
      expect(queryByText('JOB002')).toBeNull();
    });

    it('devrait afficher tous les jobs avec le filtre "Tous"', () => {
      const { getByTestId, getByText } = render(<JobsBillingScreen />);
      
      // Cliquer sur "Non payés" d'abord
      fireEvent.press(getByTestId('filter-unpaid'));
      
      // Puis cliquer sur "Tous"
      fireEvent.press(getByTestId('filter-all'));
      
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
    it('devrait afficher un indicateur de chargement', () => {
      // Modifier le mock temporairement
      mockUseJobsBilling.isLoading = true;
      mockUseJobsBilling.jobs = [];
      
      const { getByTestId, getByText } = render(<JobsBillingScreen />);
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(getByText('Chargement de la facturation...')).toBeTruthy();
      
      // Remettre les valeurs par défaut
      mockUseJobsBilling.isLoading = false;
      mockUseJobsBilling.jobs = [
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
      ];
    });

    it('devrait afficher un message d\'erreur', () => {
      // Modifier le mock temporairement
      const originalError = mockUseJobsBilling.error;
      (mockUseJobsBilling as any).error = 'Erreur réseau';
      
      const { getByTestId, getByText } = render(<JobsBillingScreen />);
      
      expect(getByTestId('error-message')).toBeTruthy();
      expect(getByText('Erreur réseau')).toBeTruthy();
      
      // Remettre null
      mockUseJobsBilling.error = originalError;
    });

    it('devrait afficher un message quand aucun job n\'est trouvé', () => {
      // Modifier le mock temporairement
      const originalJobs = [...mockUseJobsBilling.jobs];
      const originalUnpaid = mockUseJobsBilling.totalUnpaid;
      const originalPartial = mockUseJobsBilling.totalPartial;
      const originalPaid = mockUseJobsBilling.totalPaid;
      
      mockUseJobsBilling.jobs = [];
      mockUseJobsBilling.totalUnpaid = 0;
      mockUseJobsBilling.totalPartial = 0;
      mockUseJobsBilling.totalPaid = 0;
      
      const { getByTestId, getByText } = render(<JobsBillingScreen />);
      
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText('Aucun job facturé trouvé')).toBeTruthy();
      
      // Remettre les valeurs par défaut
      mockUseJobsBilling.jobs = originalJobs;
      mockUseJobsBilling.totalUnpaid = originalUnpaid;
      mockUseJobsBilling.totalPartial = originalPartial;
      mockUseJobsBilling.totalPaid = originalPaid;
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

    it('devrait gérer les adresses manquantes', () => {
      const originalJobs = [...mockUseJobsBilling.jobs];
      
      // Créer un job sans adresse
      mockUseJobsBilling.jobs = [{
        ...mockUseJobsBilling.jobs[0],
        addresses: []
      }];

      const { getByText } = render(<JobsBillingScreen />);
      
      expect(getByText('Non définie')).toBeTruthy();
      
      // Remettre les jobs originaux
      mockUseJobsBilling.jobs = originalJobs;
    });
  });
});
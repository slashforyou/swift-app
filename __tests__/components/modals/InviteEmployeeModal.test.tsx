/**
 * Tests d'intégration pour InviteEmployeeModal
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import InviteEmployeeModal from '../../../src/components/business/modals/InviteEmployeeModal';
import { ThemeProvider } from '../../../src/context/ThemeProvider';

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
const mockOnSubmit = jest.fn();

const defaultProps = {
  visible: true,
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
};

const renderModal = (props = {}) => {
  return render(
    <ThemeProvider>
      <InviteEmployeeModal {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('InviteEmployeeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render when visible', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Inviter un Employé')).toBeTruthy();
      expect(getByText('Prénom')).toBeTruthy();
      expect(getByText('Nom de famille')).toBeTruthy();
      expect(getByText('Email professionnel')).toBeTruthy();
      expect(getByText('Téléphone')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderModal({ visible: false });
      
      expect(queryByText('Inviter un Employé')).toBeFalsy();
    });

    it('should render all form fields', () => {
      const { getByPlaceholderText } = renderModal();
      
      expect(getByPlaceholderText('John')).toBeTruthy();
      expect(getByPlaceholderText('Smith')).toBeTruthy();
      expect(getByPlaceholderText('john.smith@swift-removals.com.au')).toBeTruthy();
      expect(getByPlaceholderText('+61 412 345 678')).toBeTruthy();
    });

    it('should render role and team selection', () => {
      const { getByText } = renderModal();
      
      expect(getByText('Rôle')).toBeTruthy();
      expect(getByText('Équipe')).toBeTruthy();
      expect(getByText('Taux horaire')).toBeTruthy();
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields when typing', () => {
      const { getByPlaceholderText } = renderModal();
      
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Smith');
      const emailInput = getByPlaceholderText('john.smith@swift-removals.com.au');
      
      fireEvent.changeText(firstNameInput, 'Test');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.changeText(emailInput, 'test.user@swift-removals.com.au');
      
      expect(firstNameInput.props.value).toBe('Test');
      expect(lastNameInput.props.value).toBe('User');
      expect(emailInput.props.value).toBe('test.user@swift-removals.com.au');
    });

    it('should select role from dropdown', () => {
      const { getByText, getAllByText } = renderModal();
      
      // Ouvrir le dropdown des rôles
      const roleButton = getByText('Sélectionner un rôle');
      fireEvent.press(roleButton);
      
      // Sélectionner un rôle
      const movingSuper = getAllByText('Moving Supervisor')[0];
      fireEvent.press(movingSuper);
      
      expect(getByText('Moving Supervisor')).toBeTruthy();
    });

    it('should select team from dropdown', () => {
      const { getByText } = renderModal();
      
      // Ouvrir le dropdown des équipes
      const teamButton = getByText('Sélectionner une équipe');
      fireEvent.press(teamButton);
      
      // Sélectionner une équipe
      const teamA = getByText('Local Moving Team A');
      fireEvent.press(teamA);
      
      expect(getByText('Local Moving Team A')).toBeTruthy();
    });

    it('should update hourly rate', () => {
      const { getByPlaceholderText } = renderModal();
      
      const rateInput = getByPlaceholderText('30');
      fireEvent.changeText(rateInput, '35');
      
      expect(rateInput.props.value).toBe('35');
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty required fields', async () => {
      const { getByText } = renderModal();
      
      const submitButton = getByText('Envoyer l\'Invitation');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de validation',
          expect.stringContaining('Veuillez remplir tous les champs')
        );
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      // Remplir le formulaire avec un email invalide
      fireEvent.changeText(getByPlaceholderText('John'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Smith'), 'User');
      fireEvent.changeText(getByPlaceholderText('john.smith@swift-removals.com.au'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('+61 412 345 678'), '+61 400 000 000');
      
      // Sélectionner rôle et équipe
      fireEvent.press(getByText('Sélectionner un rôle'));
      fireEvent.press(getByText('Mover'));
      fireEvent.press(getByText('Sélectionner une équipe'));
      fireEvent.press(getByText('Local Moving Team A'));
      
      fireEvent.changeText(getByPlaceholderText('30'), '25');
      
      const submitButton = getByText('Envoyer l\'Invitation');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de validation',
          expect.stringContaining('email valide')
        );
      });
    });

    it('should validate phone format', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      // Remplir le formulaire avec un téléphone invalide
      fireEvent.changeText(getByPlaceholderText('John'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Smith'), 'User');
      fireEvent.changeText(getByPlaceholderText('john.smith@swift-removals.com.au'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('+61 412 345 678'), '123456');
      
      // Sélectionner rôle et équipe
      fireEvent.press(getByText('Sélectionner un rôle'));
      fireEvent.press(getByText('Mover'));
      fireEvent.press(getByText('Sélectionner une équipe'));
      fireEvent.press(getByText('Local Moving Team A'));
      
      fireEvent.changeText(getByPlaceholderText('30'), '25');
      
      const submitButton = getByText('Envoyer l\'Invitation');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de validation',
          expect.stringContaining('téléphone')
        );
      });
    });

    it('should validate hourly rate', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      // Remplir le formulaire avec un taux invalide
      fireEvent.changeText(getByPlaceholderText('John'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Smith'), 'User');
      fireEvent.changeText(getByPlaceholderText('john.smith@swift-removals.com.au'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('+61 412 345 678'), '+61 400 000 000');
      
      // Sélectionner rôle et équipe
      fireEvent.press(getByText('Sélectionner un rôle'));
      fireEvent.press(getByText('Mover'));
      fireEvent.press(getByText('Sélectionner une équipe'));
      fireEvent.press(getByText('Local Moving Team A'));
      
      fireEvent.changeText(getByPlaceholderText('30'), '-5');
      
      const submitButton = getByText('Envoyer l\'Invitation');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de validation',
          expect.stringContaining('taux horaire')
        );
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = (getByPlaceholderText: any, getByText: any) => {
      fireEvent.changeText(getByPlaceholderText('John'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Smith'), 'User');
      fireEvent.changeText(getByPlaceholderText('john.smith@swift-removals.com.au'), 'test.user@swift-removals.com.au');
      fireEvent.changeText(getByPlaceholderText('+61 412 345 678'), '+61 400 000 000');
      
      // Sélectionner rôle
      fireEvent.press(getByText('Sélectionner un rôle'));
      fireEvent.press(getByText('Mover'));
      
      // Sélectionner équipe
      fireEvent.press(getByText('Sélectionner une équipe'));
      fireEvent.press(getByText('Local Moving Team A'));
      
      fireEvent.changeText(getByPlaceholderText('30'), '25');
    };

    it('should submit form with valid data', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      fillValidForm(getByPlaceholderText, getByText);
      
      const submitButton = getByText('Envoyer l\'Invitation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@swift-removals.com.au',
          phone: '+61 400 000 000',
          role: 'Mover',
          team: 'Local Moving Team A',
          hourlyRate: 25,
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { getByPlaceholderText, getByText, queryByText } = renderModal();
      
      fillValidForm(getByPlaceholderText, getByText);
      
      const submitButton = getByText('Envoyer l\'Invitation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      // Vérifier que le bouton montre le loading
      expect(queryByText('Envoyer l\'Invitation')).toBeFalsy();
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      
      const { getByPlaceholderText, getByText } = renderModal();
      
      fillValidForm(getByPlaceholderText, getByText);
      
      const submitButton = getByText('Envoyer l\'Invitation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible d\'envoyer l\'invitation. Veuillez réessayer.'
        );
      });
    });

    it('should reset form after successful submission', async () => {
      const { getByPlaceholderText, getByText } = renderModal();
      
      fillValidForm(getByPlaceholderText, getByText);
      
      const submitButton = getByText('Envoyer l\'Invitation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Vérifier que les champs sont réinitialisés
      expect(getByPlaceholderText('John').props.value).toBe('');
      expect(getByPlaceholderText('Smith').props.value).toBe('');
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is pressed', () => {
      const { getByText } = renderModal();
      
      const closeButton = getByText('×');
      fireEvent.press(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when cancel button is pressed', () => {
      const { getByText } = renderModal();
      
      const cancelButton = getByText('Annuler');
      fireEvent.press(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', async () => {
      const { getByPlaceholderText, rerender } = renderModal();
      
      // Remplir partiellement le formulaire
      fireEvent.changeText(getByPlaceholderText('John'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Smith'), 'User');
      
      // Fermer et rouvrir la modal
      rerender(
        <ThemeProvider>
          <InviteEmployeeModal {...defaultProps} visible={false} />
        </ThemeProvider>
      );
      
      rerender(
        <ThemeProvider>
          <InviteEmployeeModal {...defaultProps} visible={true} />
        </ThemeProvider>
      );
      
      // Vérifier que les champs sont réinitialisés
      expect(getByPlaceholderText('John').props.value).toBe('');
      expect(getByPlaceholderText('Smith').props.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderModal();
      
      expect(getByLabelText('Prénom')).toBeTruthy();
      expect(getByLabelText('Nom de famille')).toBeTruthy();
      expect(getByLabelText('Email professionnel')).toBeTruthy();
      expect(getByLabelText('Téléphone')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const { getByPlaceholderText } = renderModal();
      
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Smith');
      
      // Simuler la navigation au clavier
      fireEvent(firstNameInput, 'onSubmitEditing');
      
      expect(lastNameInput).toBeTruthy();
    });
  });
});
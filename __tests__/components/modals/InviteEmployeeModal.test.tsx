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
      const { getByTestId } = renderModal();
      
      expect(getByTestId('modal-title')).toBeTruthy();
      expect(getByTestId('firstname-label')).toBeTruthy();
      expect(getByTestId('lastname-label')).toBeTruthy();
      expect(getByTestId('email-label')).toBeTruthy();
      expect(getByTestId('phone-label')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = renderModal({ visible: false });
      
      expect(queryByTestId('modal-title')).toBeFalsy();
    });

    it('should render all form fields', () => {
      const { getByPlaceholderText } = renderModal();
      
      expect(getByPlaceholderText('John')).toBeTruthy();
      expect(getByPlaceholderText('Smith')).toBeTruthy();
      expect(getByPlaceholderText('john.smith@swift-removals.com.au')).toBeTruthy();
      expect(getByPlaceholderText('+61 412 345 678')).toBeTruthy();
    });

    it('should render role and team selection', () => {
      const { getByTestId } = renderModal();
      
      expect(getByTestId('role-label')).toBeTruthy();
      expect(getByTestId('team-label')).toBeTruthy();
      expect(getByTestId('hourlyrate-label')).toBeTruthy();
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields when typing', () => {
      const { getByPlaceholderText, getByTestId } = renderModal();
      
      const firstNameInput = getByTestId('firstname-input');
      const lastNameInput = getByTestId('lastname-input');
      const emailInput = getByTestId('email-input');
      
      fireEvent.changeText(firstNameInput, 'Test');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.changeText(emailInput, 'test.user@swift-removals.com.au');
      
      expect(firstNameInput.props.value).toBe('Test');
      expect(lastNameInput.props.value).toBe('User');
      expect(emailInput.props.value).toBe('test.user@swift-removals.com.au');
    });

    it('should select role from dropdown', () => {
      const { getByTestId } = renderModal();
      
      // Select Moving Supervisor role
      const roleButton = getByTestId('role-option-moving-supervisor');
      fireEvent.press(roleButton);
      
      expect(getByTestId('role-option-moving-supervisor')).toBeTruthy();
    });

    it('should select team from dropdown', () => {
      const { getByTestId } = renderModal();
      
      // Select Local Moving Team A
      const teamButton = getByTestId('team-option-local-moving-team-a');
      fireEvent.press(teamButton);
      
      expect(getByTestId('team-option-local-moving-team-a')).toBeTruthy();
    });

    it('should update hourly rate', () => {
      const { getByTestId } = renderModal();
      
      const rateInput = getByTestId('hourlyrate-input');
      fireEvent.changeText(rateInput, '35');
      
      expect(rateInput.props.value).toBe('35');
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty required fields', async () => {
      const { getByTestId } = renderModal();
      
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should validate email format', async () => {
      const { getByTestId } = renderModal();
      
      // Fill form with invalid email
      fireEvent.changeText(getByTestId('firstname-input'), 'Test');
      fireEvent.changeText(getByTestId('lastname-input'), 'User');
      fireEvent.changeText(getByTestId('email-input'), 'invalid-email');
      fireEvent.changeText(getByTestId('phone-input'), '+61 400 000 000');
      
      // Select role and team
      fireEvent.press(getByTestId('role-option-moving-supervisor'));
      fireEvent.press(getByTestId('team-option-local-moving-team-a'));
      
      fireEvent.changeText(getByTestId('hourlyrate-input'), '25');
      
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should validate phone format', async () => {
      const { getByTestId } = renderModal();
      
      // Fill form with invalid phone
      fireEvent.changeText(getByTestId('firstname-input'), 'Test');
      fireEvent.changeText(getByTestId('lastname-input'), 'User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('phone-input'), '123456');
      
      // Select role and team
      fireEvent.press(getByTestId('role-option-moving-supervisor'));
      fireEvent.press(getByTestId('team-option-local-moving-team-a'));
      
      fireEvent.changeText(getByTestId('hourlyrate-input'), '25');
      
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should validate hourly rate', async () => {
      const { getByTestId } = renderModal();
      
      // Fill form with invalid rate
      fireEvent.changeText(getByTestId('firstname-input'), 'Test');
      fireEvent.changeText(getByTestId('lastname-input'), 'User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('phone-input'), '+61 400 000 000');
      
      // Select role and team
      fireEvent.press(getByTestId('role-option-moving-supervisor'));
      fireEvent.press(getByTestId('team-option-local-moving-team-a'));
      
      fireEvent.changeText(getByTestId('hourlyrate-input'), '-5');
      
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = (getByTestId: any) => {
      fireEvent.changeText(getByTestId('firstname-input'), 'Test');
      fireEvent.changeText(getByTestId('lastname-input'), 'User');
      fireEvent.changeText(getByTestId('email-input'), 'test.user@swift-removals.com.au');
      fireEvent.changeText(getByTestId('phone-input'), '+61 400 000 000');
      
      // Select role
      fireEvent.press(getByTestId('role-option-moving-supervisor'));
      
      // Select team
      fireEvent.press(getByTestId('team-option-local-moving-team-a'));
      
      fireEvent.changeText(getByTestId('hourlyrate-input'), '25');
    };

    it('should submit form with valid data', async () => {
      const { getByTestId } = renderModal();
      
      fillValidForm(getByTestId);
      
      const submitButton = getByTestId('submit-button');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { getByTestId, queryByTestId } = renderModal();
      
      fillValidForm(getByTestId);
      
      const submitButton = getByTestId('submit-button');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      // Check loading indicator appears
      expect(queryByTestId('loading-indicator')).toBeTruthy();
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      
      const { getByTestId } = renderModal();
      
      fillValidForm(getByTestId);
      
      const submitButton = getByTestId('submit-button');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should reset form after successful submission', async () => {
      const { getByTestId } = renderModal();
      
      fillValidForm(getByTestId);
      
      const submitButton = getByTestId('submit-button');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Check fields are reset
      expect(getByTestId('firstname-input').props.value).toBe('');
      expect(getByTestId('lastname-input').props.value).toBe('');
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is pressed', () => {
      const { getByTestId } = renderModal();
      
      const closeButton = getByTestId('close-button');
      fireEvent.press(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when cancel button is pressed', () => {
      const { getByTestId } = renderModal();
      
      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', async () => {
      const { getByTestId, rerender } = renderModal();
      
      // Partially fill form
      fireEvent.changeText(getByTestId('firstname-input'), 'Test');
      fireEvent.changeText(getByTestId('lastname-input'), 'User');
      
      // Close and reopen modal
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
      
      // Check fields are reset
      expect(getByTestId('firstname-input').props.value).toBe('');
      expect(getByTestId('lastname-input').props.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = renderModal();
      
      expect(getByTestId('firstname-label')).toBeTruthy();
      expect(getByTestId('lastname-label')).toBeTruthy();
      expect(getByTestId('email-label')).toBeTruthy();
      expect(getByTestId('phone-label')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const { getByTestId } = renderModal();
      
      const firstNameInput = getByTestId('firstname-input');
      const lastNameInput = getByTestId('lastname-input');
      
      // Simulate keyboard navigation
      fireEvent(firstNameInput, 'onSubmitEditing');
      
      expect(lastNameInput).toBeTruthy();
    });
  });
});
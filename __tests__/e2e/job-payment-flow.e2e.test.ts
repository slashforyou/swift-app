/**
 * Job Payment Flow E2E Tests
 * Tests for complete job payment journey from job creation to Stripe payment confirmation
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { JobTimerProvider } from '../../src/context/JobTimerProvider';
import { ThemeProvider } from '../../src/context/ThemeProvider';
import PaymentWindow from '../../src/screens/JobDetailsScreens/paymentWindow';
import * as StripeService from '../../src/services/StripeService';
import * as mockJobData from '../__mocks__/mockJobData';

// Mock external dependencies
jest.mock('@stripe/stripe-react-native', () => ({
  useConfirmPayment: () => ({
    confirmPayment: jest.fn().mockResolvedValue({ error: null, paymentIntent: { status: 'succeeded' } }),
  }),
  CardField: ({ onCardChange }: any) => {
    const MockCardField = require('react-native').View;
    return React.createElement(MockCardField, {
      testID: 'stripe-card-field',
      onTouchStart: () => onCardChange && onCardChange({ complete: true, validNumber: 'Valid', validExpiryDate: 'Valid' }),
    });
  },
}));

jest.mock('../../src/services/StripeService', () => ({
  createJobPaymentIntent: jest.fn(),
  confirmJobPayment: jest.fn(),
  getJobPaymentHistory: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Test context wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <JobTimerProvider>
      {children}
    </JobTimerProvider>
  </ThemeProvider>
);

describe('Job Payment Flow E2E', () => {
  const mockJob = mockJobData.createMockJob({
    id: 'TEST-JOB-001',
    status: 'completed',
    contractor: { ContactName: 'John Doe', Company: 'Acme Corp' },
    estimatedCost: 150.00,
    actualCost: 125.50,
  });

  const mockSetJob = jest.fn();
  const mockSetVisibleCondition = jest.fn();

  const defaultProps = {
    job: mockJob,
    setJob: mockSetJob,
    visibleCondition: 'payment',
    setVisibleCondition: mockSetVisibleCondition,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Stripe service mocks
    (StripeService.createJobPaymentIntent as jest.Mock).mockResolvedValue({
      payment_intent_id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_abc',
      amount: 12550,
      currency: 'aud',
    });

    (StripeService.confirmJobPayment as jest.Mock).mockResolvedValue({
      job: { ...mockJob, actualCost: 125.50, paymentStatus: 'paid' },
      payment: { status: 'succeeded', amount: 12550 },
    });
  });

  describe('Complete Payment Flow', () => {
    test('should complete card payment flow successfully', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // 1. Initial state should show payment methods
      await waitFor(() => {
        expect(getByText('Choisir le mode de paiement')).toBeTruthy();
        expect(getByTestId('payment-method-card')).toBeTruthy();
        expect(getByTestId('payment-method-cash')).toBeTruthy();
      });

      // 2. Select card payment
      fireEvent.press(getByTestId('payment-method-card'));

      // 3. Should show card input form
      await waitFor(() => {
        expect(getByText('Paiement par carte')).toBeTruthy();
        expect(getByTestId('stripe-card-field')).toBeTruthy();
      });

      // 4. Fill cardholder name
      const cardNameInput = getByTestId('card-name-input');
      fireEvent.changeText(cardNameInput, 'John Smith');

      // 5. Simulate card field completion
      fireEvent(getByTestId('stripe-card-field'), 'onTouchStart');

      // 6. Attempt payment
      const payButton = getByTestId('card-pay-button');
      fireEvent.press(payButton);

      // 7. Should create payment intent
      await waitFor(() => {
        expect(StripeService.createJobPaymentIntent).toHaveBeenCalledWith('TEST-JOB-001', {
          amount: 12550, // $125.50 in cents
          currency: 'AUD',
        });
      });

      // 8. Should confirm payment
      await waitFor(() => {
        expect(StripeService.confirmJobPayment).toHaveBeenCalledWith(
          'TEST-JOB-001',
          'pi_test_123',
          'succeeded'
        );
      });

      // 9. Should show success state
      await waitFor(() => {
        expect(getByText('Paiement réussi !')).toBeTruthy();
      });

      // 10. Should update job status
      expect(mockSetJob).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCost: 125.50,
          paymentStatus: 'paid',
        })
      );
    });

    test('should handle payment failure gracefully', async () => {
      // Mock payment failure
      (StripeService.confirmJobPayment as jest.Mock).mockRejectedValue(
        new Error('Payment failed')
      );

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // Navigate to card payment
      fireEvent.press(getByTestId('payment-method-card'));
      
      await waitFor(() => {
        expect(getByTestId('stripe-card-field')).toBeTruthy();
      });

      // Fill required fields
      fireEvent.changeText(getByTestId('card-name-input'), 'John Smith');
      fireEvent(getByTestId('stripe-card-field'), 'onTouchStart');

      // Attempt payment
      fireEvent.press(getByTestId('card-pay-button'));

      // Should show error alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de paiement',
          expect.stringContaining('Payment failed')
        );
      });
    });
  });

  describe('Cash Payment Flow', () => {
    test('should complete cash payment successfully', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // Select cash payment
      fireEvent.press(getByTestId('payment-method-cash'));

      await waitFor(() => {
        expect(getByText('Paiement en espèces')).toBeTruthy();
      });

      // Enter cash amount
      const cashAmountInput = getByTestId('cash-amount-input');
      fireEvent.changeText(cashAmountInput, '130.00');

      // Confirm cash payment
      const confirmButton = getByTestId('cash-confirm-button');
      fireEvent.press(confirmButton);

      // Should still create payment intent for cash (for tracking)
      await waitFor(() => {
        expect(StripeService.createJobPaymentIntent).toHaveBeenCalled();
      });

      // Should show success
      await waitFor(() => {
        expect(getByText('Paiement réussi !')).toBeTruthy();
      });
    });

    test('should validate cash amount is sufficient', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // Select cash payment
      fireEvent.press(getByTestId('payment-method-cash'));

      // Enter insufficient cash amount
      const cashAmountInput = getByTestId('cash-amount-input');
      fireEvent.changeText(cashAmountInput, '100.00'); // Less than $125.50 required

      // Confirm button should be disabled
      const confirmButton = getByTestId('cash-confirm-button');
      expect(confirmButton.props.accessibilityState?.disabled).toBe(true);

      // Should show error message
      expect(getByText('Montant insuffisant')).toBeTruthy();
    });
  });

  describe('Payment Context Integration', () => {
    test('should display correct amounts from JobTimerContext', async () => {
      const { getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // Should display calculated payment amount
      await waitFor(() => {
        expect(getByText('$125.50')).toBeTruthy(); // Actual cost
      });
    });

    test('should handle timer-based cost calculation', async () => {
      // Test with job that has timer data
      const timerJob = {
        ...mockJob,
        timer: {
          totalTime: 3600, // 1 hour
          billableTime: 3600,
          hourlyRate: 150,
        },
        actualCost: null, // Let timer calculate
      };

      const { getByText } = render(
        <TestWrapper>
          <PaymentWindow {...{ ...defaultProps, job: timerJob }} />
        </TestWrapper>
      );

      // Should calculate cost from timer data
      await waitFor(() => {
        expect(getByText('$150.00')).toBeTruthy(); // 1 hour * $150/hour
      });
    });
  });

  describe('Error Scenarios', () => {
    test('should handle network errors', async () => {
      (StripeService.createJobPaymentIntent as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('payment-method-card'));
      
      await waitFor(() => {
        expect(getByTestId('stripe-card-field')).toBeTruthy();
      });

      fireEvent.changeText(getByTestId('card-name-input'), 'John Smith');
      fireEvent(getByTestId('stripe-card-field'), 'onTouchStart');
      fireEvent.press(getByTestId('card-pay-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de paiement',
          expect.stringContaining('Network error')
        );
      });
    });

    test('should handle invalid job ID', async () => {
      const invalidJob = { ...mockJob, id: null };

      const { getByTestId } = render(
        <TestWrapper>
          <PaymentWindow {...{ ...defaultProps, job: invalidJob }} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('payment-method-card'));
      
      await waitFor(() => {
        expect(getByTestId('stripe-card-field')).toBeTruthy();
      });

      fireEvent.changeText(getByTestId('card-name-input'), 'John Smith');
      fireEvent.press(getByTestId('card-pay-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'ID du job invalide'
        );
      });
    });
  });

  describe('UI States', () => {
    test('should show loading state during payment', async () => {
      // Slow down the payment to test loading state
      (StripeService.createJobPaymentIntent as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          payment_intent_id: 'pi_test_123',
          client_secret: 'pi_test_123_secret_abc',
          amount: 12550,
          currency: 'aud',
        }), 1000))
      );

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('payment-method-card'));
      fireEvent.changeText(getByTestId('card-name-input'), 'John Smith');
      fireEvent(getByTestId('stripe-card-field'), 'onTouchStart');
      fireEvent.press(getByTestId('card-pay-button'));

      // Should show processing state
      expect(getByText('Traitement du paiement...')).toBeTruthy();
      
      // Processing button should be disabled
      const payButton = getByTestId('card-pay-button');
      expect(payButton.props.accessibilityState?.disabled).toBe(true);
    });

    test('should close modal after successful payment', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <PaymentWindow {...defaultProps} />
        </TestWrapper>
      );

      // Complete payment flow
      fireEvent.press(getByTestId('payment-method-card'));
      fireEvent.changeText(getByTestId('card-name-input'), 'John Smith');
      fireEvent(getByTestId('stripe-card-field'), 'onTouchStart');
      fireEvent.press(getByTestId('card-pay-button'));

      // Wait for success screen
      await waitFor(() => {
        expect(getByText('Paiement réussi !')).toBeTruthy();
      });

      // Should automatically close after delay
      await waitFor(() => {
        expect(mockSetVisibleCondition).toHaveBeenCalledWith(null);
      }, { timeout: 3000 });
    });
  });
});
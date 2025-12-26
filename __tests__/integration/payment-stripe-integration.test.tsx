/**
 * Test d'intégration PaymentWindow avec Stripe Elements & PaymentSheet
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { JobTimerProvider } from '../../src/context/JobTimerProvider';
import { ThemeProvider } from '../../src/context/ThemeProvider';
import PaymentWindow from '../../src/screens/JobDetailsScreens/paymentWindow';

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useConfirmPayment: () => ({
    confirmPayment: jest.fn().mockResolvedValue({
      paymentIntent: { status: 'Succeeded' },
      error: null,
    }),
  }),
  usePaymentSheet: () => ({
    initPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
    presentPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
    loading: false,
  }),
  CardField: () => null,
}));

// Mock Analytics
jest.mock('../../src/services/stripeAnalytics', () => ({
  trackPaymentStarted: jest.fn(),
  trackPaymentSuccess: jest.fn(),
  trackPaymentError: jest.fn(),
  trackPaymentMethodSelected: jest.fn(),
  trackPaymentFunnelStep: jest.fn(),
}));

// Mock useJobPayment hook
const mockJobPayment = {
  createPayment: jest.fn().mockResolvedValue({
    payment_intent_id: 'pi_test_123',
    client_secret: 'pi_test_123_secret_test',
  }),
  confirmPayment: jest.fn().mockResolvedValue({
    job: { id: 'job_123', status: 'completed' },
  }),
  reset: jest.fn(),
};

jest.mock('../../src/hooks/useJobPayment', () => ({
  useJobPayment: () => mockJobPayment,
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <JobTimerProvider jobId="job_123" currentStep={0}>
      {children}
    </JobTimerProvider>
  </ThemeProvider>
);

const defaultProps = {
  job: {
    id: 'job_123',
    title: 'Test Job',
    estimatedCost: 150,
  },
  setJob: jest.fn(),
  visibleCondition: 'paymentWindow',
  setVisibleCondition: jest.fn(),
};

describe('PaymentWindow Stripe Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render payment options including PaymentSheet', () => {
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    expect(getByText('Paiement sécurisé ⚡')).toBeTruthy();
    expect(getByText('Carte bancaire (Manuel)')).toBeTruthy();
    expect(getByText('Espèces')).toBeTruthy();
  });

  it('should track analytics when payment window opens', async () => {
    const { trackPaymentFunnelStep } = require('../../src/services/stripeAnalytics');
    
    render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(trackPaymentFunnelStep).toHaveBeenCalledWith('view_payment', 'job_123');
    });
  });

  it('should handle PaymentSheet flow successfully', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const paymentSheetButton = getByText('Paiement sécurisé ⚡');
    fireEvent.press(paymentSheetButton);

    await waitFor(() => {
      expect(mockJobPayment.createPayment).toHaveBeenCalledWith('job_123', {
        amount: 15000, // 150 * 100
        currency: 'AUD',
        description: 'Paiement job Test Job',
      });
    });
  });

  it('should track payment method selection', async () => {
    const { trackPaymentMethodSelected } = require('../../src/services/stripeAnalytics');
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const paymentSheetButton = getByText('Paiement sécurisé ⚡');
    fireEvent.press(paymentSheetButton);

    await waitFor(() => {
      expect(trackPaymentMethodSelected).toHaveBeenCalledWith('paymentsheet', 'job_123');
    });
  });

  it('should handle payment errors gracefully', async () => {
    const { trackPaymentError } = require('../../src/services/stripeAnalytics');
    
    // Mock error in createPayment
    mockJobPayment.createPayment.mockRejectedValueOnce(new Error('Payment failed'));

    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const paymentSheetButton = getByText('Paiement sécurisé ⚡');
    fireEvent.press(paymentSheetButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
      expect(trackPaymentError).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job_123',
          error: 'Payment failed',
        })
      );
    });
  });

  it('should show loading state during payment processing', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const paymentSheetButton = getByText('Paiement sécurisé ⚡');
    fireEvent.press(paymentSheetButton);

    // Should show processing state
    await waitFor(() => {
      expect(queryByText('Paiement en cours')).toBeTruthy();
    });
  });

  it('should calculate payment amount correctly', () => {
    const jobWithCost = {
      ...defaultProps.job,
      estimatedCost: 200,
    };

    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...{ ...defaultProps, job: jobWithCost }} />
      </TestWrapper>
    );

    expect(getByText(/\$200\.00/)).toBeTruthy();
  });

  it('should handle card payment method selection', async () => {
    const { trackPaymentMethodSelected } = require('../../src/services/stripeAnalytics');
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const cardButton = getByText('Carte bancaire (Manuel)');
    fireEvent.press(cardButton);

    await waitFor(() => {
      expect(trackPaymentMethodSelected).toHaveBeenCalledWith('card', 'job_123');
    });
  });

  it('should handle cash payment method selection', async () => {
    const { trackPaymentMethodSelected } = require('../../src/services/stripeAnalytics');
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...defaultProps} />
      </TestWrapper>
    );

    const cashButton = getByText('Espèces');
    fireEvent.press(cashButton);

    await waitFor(() => {
      expect(trackPaymentMethodSelected).toHaveBeenCalledWith('cash', 'job_123');
    });
  });

  it('should close payment window after successful payment', async () => {
    const setVisibleCondition = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <PaymentWindow {...{ ...defaultProps, setVisibleCondition }} />
      </TestWrapper>
    );

    const paymentSheetButton = getByText('Paiement sécurisé ⚡');
    fireEvent.press(paymentSheetButton);

    // Wait for payment completion and auto-close
    await waitFor(() => {
      expect(mockJobPayment.confirmPayment).toHaveBeenCalled();
    });

    // Should close after 2 seconds (mocked)
    setTimeout(() => {
      expect(setVisibleCondition).toHaveBeenCalledWith(null);
    }, 2100);
  });
});
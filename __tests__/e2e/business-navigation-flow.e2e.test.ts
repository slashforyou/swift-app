/**
 * Business Navigation Flow E2E Tests
 * Tests for complete business dashboard navigation including Stripe Hub and related screens
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Button, Text, View } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeProvider';
import Business from '../../src/navigation/business';
import * as StripeService from '../../src/services/StripeService';
import * as mockJobData from '../__mocks__/mockJobData';

// Mock external dependencies
jest.mock('../../src/services/StripeService', () => ({
  getStripeAccountStatus: jest.fn(),
  getBalance: jest.fn(),
  getPaymentsList: jest.fn(),
  getPayouts: jest.fn(),
  getTransactions: jest.fn(),
}));

jest.mock('../../src/localization/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'business.navigation.businessInfo': 'Business Info',
        'business.navigation.staffCrew': 'Staff & Crew',
        'business.navigation.trucks': 'Trucks',
        'business.navigation.jobsBilling': 'Jobs & Billing',
        'stripe.hub.title': 'Stripe Hub',
        'stripe.hub.subtitle': 'Payment Management Center',
        'stripe.paymentsList.title': 'Payments List',
        'stripe.payouts.title': 'Payouts',
        'stripe.settings.title': 'Stripe Settings',
        'stripe.connect.status.connected': 'Connected',
        'stripe.connect.status.disconnected': 'Not Connected',
        'navigation.back': 'Back',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock individual business screens
jest.mock('../../src/screens/business/BusinessInfoPage', () => {
  return function MockBusinessInfoPage() {
    return (
      <View testID="business-info-page">
        <Text>Business Information Content</Text>
      </View>
    );
  };
});

jest.mock('../../src/screens/business/StaffCrewScreen', () => {
  return function MockStaffCrewScreen() {
    return (
      <View testID="staff-crew-screen">
        <Text>Staff Management Content</Text>
      </View>
    );
  };
});

jest.mock('../../src/screens/business/TrucksScreen', () => {
  return function MockTrucksScreen() {
    return (
      <View testID="trucks-screen">
        <Text>Trucks Management Content</Text>
      </View>
    );
  };
});

jest.mock('../../src/screens/business/StripeHub', () => {
  return function MockStripeHub({ navigation }: { navigation: any }) {
    return (
      <View testID="stripe-hub">
        <Text>Stripe Hub</Text>
        <Button
          testID="navigate-payments-list"
          title="View Payments"
          onPress={() => navigation.navigate('PaymentsList')}
        />
        <Button
          testID="navigate-payouts"
          title="View Payouts"
          onPress={() => navigation.navigate('Payouts')}
        />
        <Button
          testID="navigate-settings"
          title="Settings"
          onPress={() => navigation.navigate('StripeSettings')}
        />
      </View>
    );
  };
});

jest.mock('../../src/screens/business/PaymentsListScreen', () => {
  return function MockPaymentsListScreen({ navigation }: { navigation: any }) {
    return (
      <View testID="payments-list-screen">
        <Text>Payments List</Text>
        <Button
          testID="payments-back-button"
          title="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  };
});

jest.mock('../../src/screens/business/PayoutsScreen', () => {
  return function MockPayoutsScreen({ navigation }: { navigation: any }) {
    return (
      <View testID="payouts-screen">
        <Text>Payouts</Text>
        <Button
          testID="payouts-back-button"
          title="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  };
});

jest.mock('../../src/screens/business/StripeSettingsScreen', () => {
  return function MockStripeSettingsScreen({ navigation }: { navigation: any }) {
    return (
      <View testID="stripe-settings-screen">
        <Text>Stripe Settings</Text>
        <Button
          testID="settings-back-button"
          title="Back"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  };
});

// Mock BusinessTabMenu
jest.mock('../../src/components/business/BusinessTabMenu', () => {
  return function MockBusinessTabMenu({ 
    activeTab, 
    onTabPress 
  }: { 
    activeTab: string; 
    onTabPress: (tab: string) => void; 
  }) {
    const tabs = [
      { id: 'BusinessInfo', label: 'Info' },
      { id: 'StaffCrew', label: 'Staff' },
      { id: 'Trucks', label: 'Trucks' },
      { id: 'JobsBilling', label: 'Billing' },
    ];
    
    return (
      <View testID="business-tab-menu">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            testID={`tab-${tab.id}`}
            title={tab.label}
            onPress={() => onTabPress(tab.id)}
          />
        ))}
      </View>
    );
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Business Navigation Flow E2E', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    setOptions: jest.fn(),
  };

  const defaultProps = {
    navigation: mockNavigation,
    route: { params: {} },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Stripe service mocks
    (StripeService.getStripeAccountStatus as jest.Mock).mockResolvedValue({
      connected: true,
      account_id: 'acct_test_123',
      charges_enabled: true,
      payouts_enabled: true,
    });

    (StripeService.getBalance as jest.Mock).mockResolvedValue({
      available: [{ amount: 15050, currency: 'aud' }],
      pending: [{ amount: 5000, currency: 'aud' }],
    });

    (StripeService.getPaymentsList as jest.Mock).mockResolvedValue([
      mockJobData.createMockPaymentConfirmation(),
    ]);
  });

  describe('Main Business Navigation', () => {
    test('should render business info by default', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Business {...defaultProps} />
        </TestWrapper>
      );

      // Should show business info page by default
      await waitFor(() => {
        expect(getByTestId('business-info-page')).toBeTruthy();
        expect(getByText('Business Information Content')).toBeTruthy();
      });

      // Should show tab menu
      expect(getByTestId('business-tab-menu')).toBeTruthy();
    });

    test('should navigate between main business tabs', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Business {...defaultProps} />
        </TestWrapper>
      );

      // Start at business info
      await waitFor(() => {
        expect(getByTestId('business-info-page')).toBeTruthy();
      });

      // Navigate to staff
      fireEvent.press(getByTestId('tab-StaffCrew'));
      
      await waitFor(() => {
        expect(getByTestId('staff-crew-screen')).toBeTruthy();
        expect(getByText('Staff Management Content')).toBeTruthy();
      });

      // Navigate to trucks
      fireEvent.press(getByTestId('tab-Trucks'));
      
      await waitFor(() => {
        expect(getByTestId('trucks-screen')).toBeTruthy();
        expect(getByText('Trucks Management Content')).toBeTruthy();
      });

      // Navigate to billing (StripeHub)
      fireEvent.press(getByTestId('tab-JobsBilling'));
      
      await waitFor(() => {
        expect(getByTestId('stripe-hub')).toBeTruthy();
        expect(getByText('Stripe Hub')).toBeTruthy();
      });
    });

    test('should handle tab state persistence', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Business {...defaultProps} />
        </TestWrapper>
      );

      // Navigate through panels multiple times to test state persistence
      fireEvent.press(getByTestId('tab-JobsBilling'));
      fireEvent.press(getByTestId('tab-StaffCrew'));
      fireEvent.press(getByTestId('tab-JobsBilling'));
      
      await waitFor(() => {
        // Should return to StripeHub, not any sub-screen
        expect(getByTestId('stripe-hub')).toBeTruthy();
      });
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper testIDs for all navigation elements', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Business {...defaultProps} />
        </TestWrapper>
      );

      // All main tabs should be accessible
      expect(getByTestId('tab-BusinessInfo')).toBeTruthy();
      expect(getByTestId('tab-StaffCrew')).toBeTruthy();
      expect(getByTestId('tab-Trucks')).toBeTruthy();
      expect(getByTestId('tab-JobsBilling')).toBeTruthy();
    });

    test('should handle rapid navigation without crashes', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Business {...defaultProps} />
        </TestWrapper>
      );

      // Rapid fire navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.press(getByTestId('tab-StaffCrew'));
        fireEvent.press(getByTestId('tab-JobsBilling'));
        fireEvent.press(getByTestId('tab-BusinessInfo'));
      }

      // Should still work normally
      await waitFor(() => {
        expect(getByTestId('business-info-page')).toBeTruthy();
      });
    });
  });
});
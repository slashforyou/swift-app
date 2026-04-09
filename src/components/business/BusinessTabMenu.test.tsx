/**
 * BusinessTabMenu Tests
 * Tests pour valider la navigation business 4 onglets
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Import des composants à tester
import { ThemeProvider } from '../../context/ThemeProvider';
import BusinessTabMenu from './BusinessTabMenu';
import type { BusinessTab } from './BusinessTabMenu';

const Stack = createNativeStackNavigator();

// Mock navigation
const mockNavigate = jest.fn();

// Wrapper de test avec tous les providers nécessaires
const TestWrapper = ({ children }: any) => (
  <ThemeProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </ThemeProvider>
);

describe('BusinessTabMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all 4 business tabs correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="Hub"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    expect(getByText('Hub')).toBeTruthy();
    expect(getByText('Ressources')).toBeTruthy();
    expect(getByText('Réseau')).toBeTruthy();
    expect(getByText('Finances')).toBeTruthy();
  });

  it('should highlight active tab correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="Resources"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    const activeTab = getByTestId('tab-Resources');
    const inactiveTab = getByTestId('tab-Hub');
    
    expect(activeTab).toBeTruthy();
    expect(inactiveTab).toBeTruthy();
  });

  it('should call onTabPress when tab is pressed', async () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="Hub"
          onTabPress={onTabPress}
        />
      </TestWrapper>
    );

    const financesTab = getByTestId('tab-Finances');
    fireEvent.press(financesTab);

    await waitFor(() => {
      expect(onTabPress).toHaveBeenCalledWith('Finances');
    });
  });

  it('should not call onTabPress for already active tab', async () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="Hub"
          onTabPress={onTabPress}
        />
      </TestWrapper>
    );

    const activeTab = getByTestId('tab-Hub');
    fireEvent.press(activeTab);

    expect(onTabPress).not.toHaveBeenCalled();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="Hub"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    expect(getByLabelText('Business Hub Overview Tab')).toBeTruthy();
    expect(getByLabelText('Resources Management Tab')).toBeTruthy();
    expect(getByLabelText('Network and Partners Tab')).toBeTruthy();
    expect(getByLabelText('Finances and Payments Tab')).toBeTruthy();
  });
});
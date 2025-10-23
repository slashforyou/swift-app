/**
 * BusinessTabMenu Tests - RÈGLE 2 : Tests obligatoires
 * Tests pour valider la navigation business avec TabMenu
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Import des composants à tester
import { ThemeProvider } from '../../context/ThemeProvider';
import BusinessTabMenu from './BusinessTabMenu';

// Mock du localization hook
jest.mock('../../localization/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'business.navigation.businessInfo': 'Business Info',
        'business.navigation.staffCrew': 'Staff & Crew',
        'business.navigation.trucks': 'Trucks',
        'business.navigation.jobsBilling': 'Billing',
      };
      return translations[key] || key;
    }
  })
}));

const Stack = createNativeStackNavigator();

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  canGoBack: () => true,
  goBack: () => {},
};

// Wrapper de test avec tous les providers nécessaires
const TestWrapper = ({ children, initialRoute = 'BusinessInfo' }: any) => (
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

  it('should render all business tabs correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="BusinessInfo"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    // Vérifier que tous les onglets sont présents
    expect(getByText('Business Info')).toBeTruthy();
    expect(getByText('Staff & Crew')).toBeTruthy();
    expect(getByText('Trucks')).toBeTruthy();
    expect(getByText('Billing')).toBeTruthy();
  });

  it('should highlight active tab correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="StaffCrew"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    const activeTab = getByTestId('tab-StaffCrew');
    const inactiveTab = getByTestId('tab-BusinessInfo');
    
    // L'onglet actif doit avoir le style actif
    expect(activeTab.props.style).toMatchObject(
      expect.objectContaining({ color: '#FF9500' })
    );
    
    // L'onglet inactif ne doit pas avoir le style actif
    expect(inactiveTab.props.style).not.toMatchObject(
      expect.objectContaining({ color: '#FF9500' })
    );
  });

  it('should call onTabPress when tab is pressed', async () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="BusinessInfo"
          onTabPress={onTabPress}
        />
      </TestWrapper>
    );

    const trucksTab = getByTestId('tab-Trucks');
    fireEvent.press(trucksTab);

    await waitFor(() => {
      expect(onTabPress).toHaveBeenCalledWith('Trucks');
    });
  });

  it('should not call onTabPress for already active tab', async () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="BusinessInfo"
          onTabPress={onTabPress}
        />
      </TestWrapper>
    );

    const activeTab = getByTestId('tab-BusinessInfo');
    fireEvent.press(activeTab);

    // Ne doit pas appeler onTabPress si l'onglet est déjà actif
    expect(onTabPress).not.toHaveBeenCalled();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <BusinessTabMenu 
          activeTab="BusinessInfo"
          onTabPress={mockNavigate}
        />
      </TestWrapper>
    );

    expect(getByLabelText('Business Information Tab')).toBeTruthy();
    expect(getByLabelText('Staff and Crew Management Tab')).toBeTruthy();
    expect(getByLabelText('Trucks Management Tab')).toBeTruthy();
    expect(getByLabelText('Jobs and Billing Tab')).toBeTruthy();
  });
});
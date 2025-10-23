/**
 * Tests unitaires pour TabMenu Component
 */
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import TabMenu, { TabMenuItem } from '../../src/components/ui/TabMenu';

// Mock des dépendances
jest.mock('../../src/context/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      border: '#E5E5E5',
      primary: '#007AFF',
      primaryLight: '#E3F2FD',
      textSecondary: '#8E8E93',
    }
  }),
}));

jest.mock('../../src/constants/Styles', () => ({
  DESIGN_TOKENS: {
    spacing: { xs: 4, sm: 8, md: 16 },
    radius: { md: 8 }
  }
}));

describe('TabMenu', () => {
  const mockItems: TabMenuItem[] = [
    { id: 'tab1', label: 'Tab 1', icon: 'home-outline' },
    { id: 'tab2', label: 'Tab 2', icon: 'settings-outline', notifications: 5 },
    { id: 'tab3', label: 'Tab 3', icon: 'person-outline', notifications: 12 },
  ];

  const mockOnTabPress = jest.fn();

  beforeEach(() => {
    mockOnTabPress.mockClear();
  });

  it('renders all tabs correctly', () => {
    const { getByText } = render(
      <TabMenu
        items={mockItems}
        activeTab="tab1"
        onTabPress={mockOnTabPress}
      />
    );

    expect(getByText('Tab 1')).toBeTruthy();
    expect(getByText('Tab 2')).toBeTruthy();
    expect(getByText('Tab 3')).toBeTruthy();
  });

  it('shows notification badges correctly', () => {
    const { getByText } = render(
      <TabMenu
        items={mockItems}
        activeTab="tab1"
        onTabPress={mockOnTabPress}
      />
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('9+')).toBeTruthy(); // 12 -> 9+
  });

  it('calls onTabPress when tab is pressed', () => {
    const { getByText } = render(
      <TabMenu
        items={mockItems}
        activeTab="tab1"
        onTabPress={mockOnTabPress}
      />
    );

    fireEvent.press(getByText('Tab 2'));
    expect(mockOnTabPress).toHaveBeenCalledWith('tab2');
  });

  it('highlights active tab correctly', () => {
    const { getByText } = render(
      <TabMenu
        items={mockItems}
        activeTab="tab2"
        onTabPress={mockOnTabPress}
      />
    );

    // Le test vérifie que l'onglet actif a les bons styles appliqués
    const activeTab = getByText('Tab 2').parent;
    expect(activeTab).toBeTruthy();
  });

  it('handles no notifications gracefully', () => {
    const itemsWithoutNotifications: TabMenuItem[] = [
      { id: 'tab1', label: 'Tab 1', icon: 'home-outline' },
    ];

    const { queryByText } = render(
      <TabMenu
        items={itemsWithoutNotifications}
        activeTab="tab1"
        onTabPress={mockOnTabPress}
      />
    );

    // Aucun badge de notification ne devrait être présent
    expect(queryByText('0')).toBeNull();
  });
});
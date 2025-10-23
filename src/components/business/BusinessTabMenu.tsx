/**
 * BusinessTabMenu - Navigation dédiée à la section Business
 * RÈGLE 3 : Composant SRP (Single Responsibility) pour le TabMenu business
 * RÈGLE 1 : Adaptation du TabMenu existant de JobDetails
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';

export interface BusinessTabItem {
  id: string;
  label: string;
  icon: string;
  routeName: string; // Nom de la route Navigation
  accessibilityLabel: string;
}

interface BusinessTabMenuProps {
  activeTab: string; // Route name actuelle
  onTabPress: (tabId: string) => void;
  style?: any;
}

/**
 * Configuration des onglets Business
 * RÈGLE 1 : Réutilise le pattern du TabMenu JobDetails
 */
const getBusinessTabsConfig = (t: any): BusinessTabItem[] => [
  { 
    id: 'BusinessInfo', 
    label: t('business.navigation.businessInfo'),
    icon: 'business',
    routeName: 'BusinessInfo',
    accessibilityLabel: 'Business Information Tab'
  },
  { 
    id: 'StaffCrew', 
    label: t('business.navigation.staffCrew'),
    icon: 'people',
    routeName: 'StaffCrew',
    accessibilityLabel: 'Staff and Crew Management Tab'
  },
  { 
    id: 'Trucks', 
    label: t('business.navigation.trucks'),
    icon: 'car-sport',
    routeName: 'Trucks',
    accessibilityLabel: 'Trucks Management Tab'
  },
  { 
    id: 'JobsBilling', 
    label: t('business.navigation.jobsBilling'),
    icon: 'receipt',
    routeName: 'JobsBilling',
    accessibilityLabel: 'Jobs and Billing Tab'
  },
];

const BusinessTabMenu: React.FC<BusinessTabMenuProps> = ({ 
  activeTab, 
  onTabPress, 
  style 
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const tabsConfig = getBusinessTabsConfig(t);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      paddingBottom: DESIGN_TOKENS.spacing.lg + 16, // Safe area padding
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      ...style,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.md,
      minHeight: 56, // Touch target minimum 44pt + padding
    },
    tabButtonActive: {
      backgroundColor: 'transparent',
    },
    tabButtonInactive: {
      backgroundColor: 'transparent',
    },
    iconContainer: {
      position: 'relative',
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 14,
    },
    tabLabelActive: {
      color: '#FF9500', // Orange pour cohérence avec JobDetails
    },
    tabLabelInactive: {
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {tabsConfig.map((tab) => {
        const isActive = activeTab === tab.routeName;
        
        return (
          <TouchableOpacity
            key={tab.id}
            testID={`tab-${tab.id}`}
            style={[
              styles.tabButton,
              isActive ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            onPress={() => {
              // RÈGLE 2 : Seulement naviguer si ce n'est pas l'onglet actif
              if (!isActive) {
                onTabPress(tab.routeName);
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={isActive ? '#FF9500' : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BusinessTabMenu;
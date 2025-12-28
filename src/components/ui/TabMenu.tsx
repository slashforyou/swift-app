import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';

export interface TabMenuItem {
  id: string;
  label: string;
  icon: string; // Simplified to string for Ionicons
  notifications?: number; // Nombre de notifications (optionnel)
}

interface TabMenuProps {
  items?: TabMenuItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  style?: any;
  page?: 'business' | 'jobDetails' | 'calendar'; // Type de page pour adapter le comportement
}

// Configuration des menus selon la page
const getMenuConfig = (page: string, t: any): TabMenuItem[] => {
  switch (page) {
    case 'business':
      return [
        { id: 'BusinessInfo', label: t('business.navigation.businessInfo'), icon: 'business' },
        { id: 'StaffCrew', label: t('business.navigation.staffCrew'), icon: 'people' },
        { id: 'Trucks', label: t('business.navigation.trucks'), icon: 'car-sport' },
        { id: 'JobsBilling', label: t('business.navigation.jobsBilling'), icon: 'receipt' },
      ];
    case 'jobDetails':
      return [
        { id: 'summary', label: t('jobDetails.panels.summary'), icon: 'bookmark' },
        { id: 'job', label: t('jobDetails.panels.jobDetails'), icon: 'construct' },
        { id: 'client', label: t('jobDetails.panels.clientInfo'), icon: 'person' },
        { id: 'notes', label: t('jobDetails.panels.notes'), icon: 'chatbubble' },
        { id: 'payment', label: t('jobDetails.panels.payment'), icon: 'card' },
      ];
    case 'calendar':
      return [
        { id: 'Day', label: t('calendar.navigation.dailyView'), icon: 'today' },
        { id: 'Month', label: t('calendar.navigation.monthlyView'), icon: 'calendar' },
        { id: 'Year', label: t('calendar.navigation.yearlyView'), icon: 'calendar-outline' },
        { id: 'MultipleYears', label: t('calendar.navigation.multiYearView'), icon: 'layers' },
      ];
    default:
      return [];
  }
};

const TabMenu: React.FC<TabMenuProps> = ({ 
  items, 
  activeTab, 
  onTabPress, 
  style,
  page 
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  // Si une page est spécifiée, utiliser la configuration automatique
  const menuItems = page ? getMenuConfig(page, t) : (items || []);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      paddingBottom: DESIGN_TOKENS.spacing.lg + 16, // Encore plus de padding pour éviter le menu Samsung
      ...style,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.md,
      position: 'relative',
      minHeight: 56, // Touch target minimum 44pt + padding
    },
    tabButtonActive: {
      backgroundColor: 'transparent', // Fond transparent même pour l'onglet actif
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
      color: colors.primary, // Couleur thème pour le texte actif
    },
    tabLabelInactive: {
      color: colors.textSecondary,
    },
    notificationBadge: {
      position: 'absolute',
      top: -6,
      right: -8,
      backgroundColor: colors.primary, // Couleur thème pour les notifications
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
      zIndex: 1,
    },
    notificationText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 12,
    },
  });

  const renderNotificationBadge = (count?: number) => {
    if (!count || count === 0) return null;

    // Afficher "9+" pour les nombres > 9
    const displayCount = count > 9 ? '9+' : count.toString();

    return (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationText}>{displayCount}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.tabButton,
              isActive ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            onPress={() => onTabPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.textSecondary} // Couleur thème pour l'icône active
              />
              {renderNotificationBadge(item.notifications)}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabMenu;
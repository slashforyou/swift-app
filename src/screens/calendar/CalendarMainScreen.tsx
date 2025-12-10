// CalendarMainScreen.tsx - Exemple d'intégration du CalendarHeader unifié
// NOTE: Ce fichier montre comment intégrer le CalendarHeader dans les écrans Calendar existants
// Les écrans Calendar gardent leur navigation naturelle (pas de menu du bas)

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

interface CalendarMainScreenProps {
  navigation: any;
  route?: {
    params?: {
      title?: string;
    };
  };
}

/**
 * Exemple d'utilisation du CalendarHeader unifié
 * À intégrer dans les écrans Calendar existants comme:
 * - dayScreen.tsx
 * - monthScreen.tsx  
 * - yearScreen.tsx
 * - multipleYearsScreen.tsx
 */
const CalendarMainScreen: React.FC<CalendarMainScreenProps> = ({ navigation, route }) => {
  const { colors } = useCommonThemedStyles();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header unifié avec style Business */}
      <CalendarHeader 
        navigation={navigation} 
        title={route?.params?.title || "Calendar"} 
      />

      {/* Contenu d'exemple */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>✨ Header Calendar Unifié</Text>
        <Text style={styles.description}>
          Ce header suit le design Business avec:{'\n'}
          • Bouton retour circulaire{'\n'}
          • Sélecteur de langue{'\n'}
          • Style épuré et moderne{'\n'}{'\n'}
          Les écrans Calendar gardent leur navigation naturelle
        </Text>
      </View>
    </View>
  );
};

export default CalendarMainScreen;
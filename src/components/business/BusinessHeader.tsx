/**
 * BusinessHeader - Composant header réutilisable pour les pages business
 * Inclut un bouton retour et le titre de la page, avec sélecteur de langue rond
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';
import LanguageSelector from '../ui/LanguageSelector';

interface BusinessHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showLanguageButton?: boolean;
  navigation?: any; // Prop navigation optionnelle pour cohérence avec JobDetails
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  showLanguageButton = true,
  navigation: propNavigation,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentLanguage, getSupportedLanguages } = useLocalization();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Utiliser la navigation passée en prop ou celle du hook
  const navToUse = propNavigation || navigation;
  
  const supportedLanguages = getSupportedLanguages();
  const currentLangInfo = supportedLanguages[currentLanguage];

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Naviguer vers Home au lieu de goBack()
      (navToUse as any).navigate('Home');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: insets.top + DESIGN_TOKENS.spacing.md, // Safe area + espacement
      paddingBottom: DESIGN_TOKENS.spacing.lg, // Plus d'espacement en bas
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 76 + insets.top, // Header plus grand
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: DESIGN_TOKENS.spacing.md,
      // Effet d'ombre légère pour iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      // Élévation pour Android
      elevation: 2,
    },
    backButtonPressed: {
      backgroundColor: colors.primaryLight,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    languageButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Retour"
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {showLanguageButton && (
            <Pressable
              onPress={() => setShowLanguageSelector(true)}
              style={({ pressed }) => [
                styles.languageButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
            >
              <Text style={{ fontSize: 18 }}>
                {currentLangInfo.flag}
              </Text>
            </Pressable>
          )}
          
          {rightComponent && rightComponent}
        </View>
      </View>

      {/* Sélecteur de langue modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
};

export default BusinessHeader;
/**
 * RoundLanguageButton - Bouton langue rond moderne
 * Version simplifiée et réutilisable du bouton de langue
 */
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';
import LanguageSelector from '../ui/LanguageSelector';

interface RoundLanguageButtonProps {
  size?: number;
  showLabel?: boolean;
}

const RoundLanguageButton: React.FC<RoundLanguageButtonProps> = ({ 
  size = 44,
  showLabel = false 
}) => {
  const { colors } = useTheme();
  const { currentLanguage, getSupportedLanguages } = useLocalization();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  const supportedLanguages = getSupportedLanguages();
  const currentLangInfo = supportedLanguages[currentLanguage];

  return (
    <>
      <Pressable
        onPress={() => setShowLanguageSelector(true)}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
        hitSlop={DESIGN_TOKENS.touch.hitSlop}
      >
        <Text style={{ fontSize: Math.round(size * 0.4) }}>
          {currentLangInfo.flag}
        </Text>
      </Pressable>

      {/* Modal de sélection */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
};

export default RoundLanguageButton;
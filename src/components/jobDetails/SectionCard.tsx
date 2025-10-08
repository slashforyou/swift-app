/**
 * SectionCard - Conteneur moderne avec niveaux de gris pour différenciation
 * Support thème clair/sombre avec variations subtiles
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../constants/Styles';

interface SectionCardProps {
    children: React.ReactNode;
    level?: 'primary' | 'secondary' | 'tertiary'; // Niveaux de contraste
    style?: ViewStyle;
    elevated?: boolean; // Ombre plus prononcée pour les sections importantes
}

const SectionCard: React.FC<SectionCardProps> = ({ 
    children, 
    level = 'primary', 
    style,
    elevated = false 
}) => {
    const { colors } = useTheme();

    // Définition des niveaux de couleurs selon le thème
    const getBackgroundColor = () => {
        if (level === 'primary') return colors.backgroundSecondary;
        if (level === 'secondary') return colors.backgroundTertiary || colors.background;
        if (level === 'tertiary') return colors.background;
        return colors.backgroundSecondary;
    };

    const getBorderColor = () => {
        // Utilise les couleurs existantes du thème
        if (level === 'primary') return colors.border;
        if (level === 'secondary') return colors.border + '80'; // Bordure plus claire
        if (level === 'tertiary') return colors.border + '40'; // Bordure très claire
        return colors.border;
    };

    return (
        <View style={[
            {
                backgroundColor: getBackgroundColor(),
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                borderWidth: 1,
                borderColor: getBorderColor(),
                marginBottom: DESIGN_TOKENS.spacing.md,
                shadowColor: colors.shadow,
                shadowOffset: {
                    width: 0,
                    height: elevated ? 4 : 2,
                },
                shadowOpacity: elevated ? 0.15 : 0.08,
                shadowRadius: elevated ? 6 : 3,
                elevation: elevated ? 6 : 3,
            },
            style,
        ]}>
            {children}
        </View>
    );
};

export default SectionCard;
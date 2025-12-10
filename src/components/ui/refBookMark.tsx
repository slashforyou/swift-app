
/**
 * RefBookMark - Onglet moderne pour afficher/copier la référence job
 * Design d'onglet attaché sous le TopMenu avec animation de feedback
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import copyToClipBoard from '../../services/copyToClipBoard';
import { HStack } from '../primitives/Stack';

interface RefBookMarkProps {
    jobRef: string;
    toastIt: (message: string, type: 'info' | 'success' | 'error') => void;
    isHeaderMode?: boolean; // Nouveau mode pour intégration dans header
}

const RefBookMark: React.FC<RefBookMarkProps> = ({ jobRef, toastIt, isHeaderMode = false }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useCommonThemedStyles();
    const [scaleAnim] = useState(new Animated.Value(1));

    const copyRefToClipboard = () => {
        // Animation de feedback
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();

        copyToClipBoard(jobRef);
        toastIt(`Job Ref. ${jobRef} copied to clipboard`, 'success');
    };

    // Style conditionnel selon le mode
    const containerStyle = isHeaderMode ? {
        // Mode header : élément inline
        transform: [{ scale: scaleAnim }],
    } : {
        // Mode classique : positionnement absolu
        position: 'absolute' as 'absolute',
        top: insets.top + 50 + 5, // Safe area + hauteur exacte du TopMenu + 5px d'espacement
        left: DESIGN_TOKENS.spacing.lg,
        right: DESIGN_TOKENS.spacing.lg,
        zIndex: 8, // Entre TopMenu (10) et le contenu
        transform: [{ scale: scaleAnim }],
    };

    return (
        <Animated.View style={containerStyle}>
            <Pressable
                onPress={copyRefToClipboard}
                style={({ pressed }) => (isHeaderMode ? {
                    // Mode header : style compact et intégré avec angles du haut à 0px
                    backgroundColor: pressed ? colors.backgroundTertiary : colors.border,
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderTopLeftRadius: 0,  // Angles du haut à 0px
                    borderTopRightRadius: 0, // Angles du haut à 0px
                    borderBottomLeftRadius: DESIGN_TOKENS.radius.md,
                    borderBottomRightRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 32,
                    margin: 0, // Pas de margin
                } : {
                    // Mode classique : style onglet
                    backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: DESIGN_TOKENS.radius.md,
                    borderBottomRightRadius: DESIGN_TOKENS.radius.md,
                    shadowColor: colors.shadow,
                    shadowOffset: {
                        width: 0,
                        height: 1,
                    },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderTopWidth: 0,
                    minHeight: 36,
                })}
            >
                <HStack gap="xs" align="center" justify="center">
                    {/* Icône de copie */}
                    <Ionicons 
                        name="copy-outline" 
                        size={16} 
                        color={colors.textSecondary}
                    />
                    
                    {/* Texte de référence */}
                    <Text 
                        style={{
                            color: colors.text,
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                            fontWeight: '500',
                        }}
                        numberOfLines={1}
                    >
                        Ref: {jobRef}
                    </Text>
                </HStack>
            </Pressable>
        </Animated.View>
    );
};

export default RefBookMark;

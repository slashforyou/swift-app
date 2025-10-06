
/**
 * RefBookMark - Onglet moderne pour afficher/copier la référence job
 * Design d'onglet attaché sous le TopMenu avec animation de feedback
 */
import React, { useState } from 'react';
import { Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HStack } from '../primitives/Stack';
import copyToClipBoard from '../../services/copyToClipBoard';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import Ionicons from '@react-native-vector-icons/ionicons';

interface RefBookMarkProps {
    jobRef: string;
    toastIt: (message: string, type: 'info' | 'success' | 'error') => void;
}

const RefBookMark: React.FC<RefBookMarkProps> = ({ jobRef, toastIt }) => {
    const insets = useSafeAreaInsets();
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

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: insets.top + 50 + 5, // Safe area + hauteur exacte du TopMenu + 5px d'espacement
                left: DESIGN_TOKENS.spacing.lg,
                right: DESIGN_TOKENS.spacing.lg,
                zIndex: 8, // Entre TopMenu (10) et le contenu
                transform: [{ scale: scaleAnim }],
            }}
        >
            <Pressable
                onPress={copyRefToClipboard}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? Colors.light.backgroundTertiary : Colors.light.backgroundSecondary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    // Style onglet : bords du haut droits, bords du bas arrondis
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: DESIGN_TOKENS.radius.md,
                    borderBottomRightRadius: DESIGN_TOKENS.radius.md,
                    shadowColor: Colors.light.shadow,
                    shadowOffset: {
                        width: 0,
                        height: 1,
                    },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: Colors.light.border,
                    borderTopWidth: 0, // Pas de bordure en haut pour l'effet onglet
                    minHeight: 36, // Plus compact que 44pt
                })}
            >
                <HStack gap="xs" align="center" justify="center">
                    {/* Icône de copie */}
                    <Ionicons 
                        name="copy-outline" 
                        size={16} 
                        color={Colors.light.textSecondary}
                    />
                    
                    {/* Texte de référence */}
                    <Text 
                        style={{
                            color: Colors.light.text,
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
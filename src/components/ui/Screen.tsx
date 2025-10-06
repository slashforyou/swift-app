/**
 * Screen - Composant de base pour les écrans avec Safe Area et gestion des marges
 * Conforme aux normes mobiles iOS/Android
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { DESIGN_TOKENS } from '../../constants/Styles';

interface ScreenProps {
    children: React.ReactNode;
    style?: ViewStyle;
    backgroundColor?: string;
    safeArea?: boolean;
    topPadding?: boolean;
    bottomPadding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
    children,
    style,
    backgroundColor = Colors.light.background,
    safeArea = true,
    topPadding = false,
    bottomPadding = false,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                {
                    flex: 1,
                    backgroundColor,
                    paddingTop: safeArea ? insets.top : topPadding ? DESIGN_TOKENS.spacing.xl : 0,
                    paddingBottom: safeArea ? insets.bottom : bottomPadding ? DESIGN_TOKENS.spacing.xl : 0,
                    paddingLeft: safeArea ? insets.left : 0,
                    paddingRight: safeArea ? insets.right : 0,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};
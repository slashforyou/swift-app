/**
 * JobDetailsHeader - Navigation moderne pour JobDetails
 * Remplace TopMenu avec navigation intégrée et RefBookMark repositionné
 */
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../constants/Styles';
import RefBookMark from '../ui/refBookMark';

interface JobDetailsHeaderProps {
    navigation: any;
    jobRef: string;
    title: string;
    onToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({ 
    navigation, 
    jobRef, 
    title, 
    onToast 
}) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const goHome = () => {
        navigation.navigate('Home');
    };

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    return (
        <View style={{
            paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
            zIndex: 10,
        }}>
            {/* Première ligne : Navigation et RefBookMark */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
                {/* Boutons de navigation */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                        onPress={goBack}
                        style={{
                            padding: DESIGN_TOKENS.spacing.sm,
                            marginRight: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            backgroundColor: colors.background,
                        }}
                        hitSlop={{
                            top: DESIGN_TOKENS.touch.hitSlop,
                            bottom: DESIGN_TOKENS.touch.hitSlop,
                            left: DESIGN_TOKENS.touch.hitSlop,
                            right: DESIGN_TOKENS.touch.hitSlop,
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </Pressable>

                    <Pressable
                        onPress={goHome}
                        style={{
                            padding: DESIGN_TOKENS.spacing.sm,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            backgroundColor: colors.background,
                        }}
                        hitSlop={{
                            top: DESIGN_TOKENS.touch.hitSlop,
                            bottom: DESIGN_TOKENS.touch.hitSlop,
                            left: DESIGN_TOKENS.touch.hitSlop,
                            right: DESIGN_TOKENS.touch.hitSlop,
                        }}
                    >
                        <Ionicons name="home" size={24} color={colors.primary} />
                    </Pressable>
                </View>

                {/* RefBookMark en haut à droite */}
                <RefBookMark 
                    jobRef={jobRef} 
                    toastIt={onToast}
                    isHeaderMode={true}
                />
            </View>

            {/* Deuxième ligne : Titre complet */}
            <View>
                <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.text,
                    textAlign: 'left',
                }}>
                    {title}
                </Text>
            </View>
        </View>
    );
};

export default JobDetailsHeader;
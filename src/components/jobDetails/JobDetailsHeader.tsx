/**
 * JobDetailsHeader - Header unifié pour JobDetails
 * Suit le même design pattern que BusinessHeader avec bouton langue circulaire
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';
import LanguageSelector from '../ui/LanguageSelector';
import RefBookMark from '../ui/refBookMark';

interface JobDetailsHeaderProps {
    navigation: any;
    jobRef: string;
    title: string;
    onToast: (message: string, type: 'info' | 'success' | 'error') => void;
    showLanguageButton?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({ 
    navigation, 
    jobRef, 
    title, 
    onToast,
    showLanguageButton = true,
    onEdit,
    onDelete,
}) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { currentLanguage, getSupportedLanguages } = useLocalization();
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    
    const supportedLanguages = getSupportedLanguages();
    const currentLangInfo = supportedLanguages[currentLanguage];

    const handleBackPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    return (
        <>
            {/* Header menu */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
                paddingBottom: DESIGN_TOKENS.spacing.lg,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                minHeight: 76 + insets.top,
            }}>
                {/* Bouton retour circulaire (style Business) */}
                <TouchableOpacity
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.background,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                    }}
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
                
                {/* Titre centré */}
                <Text style={{
                    fontSize: DESIGN_TOKENS.typography.title.fontSize,
                    fontWeight: '600',
                    color: colors.text,
                    textAlign: 'center',
                    flex: 1,
                }} numberOfLines={1}>
                    Job Details
                </Text>
                
                {/* Actions buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Bouton actions menu (Edit/Delete) */}
                    {(onEdit || onDelete) && (
                        <Pressable
                            onPress={() => setShowActionsMenu(!showActionsMenu)}
                            style={({ pressed }) => ({
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: colors.backgroundSecondary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: colors.border,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            })}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                        >
                            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                        </Pressable>
                    )}
                    
                    {/* Bouton langue circulaire (style Business) */}
                    {showLanguageButton && (
                        <Pressable
                            onPress={() => setShowLanguageSelector(true)}
                            style={({ pressed }) => ({
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: colors.backgroundSecondary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: colors.border,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            })}
                            hitSlop={DESIGN_TOKENS.touch.hitSlop}
                        >
                            <Text style={{ fontSize: 18 }}>
                                {currentLangInfo.flag}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Actions dropdown menu */}
            {showActionsMenu && (onEdit || onDelete) && (
                <View style={{
                    position: 'absolute',
                    top: insets.top + 76,
                    right: DESIGN_TOKENS.spacing.lg,
                    backgroundColor: colors.background,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 8,
                    zIndex: 100,
                    minWidth: 150,
                }}>
                    {onEdit && (
                        <Pressable
                            onPress={() => {
                                setShowActionsMenu(false);
                                onEdit();
                            }}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: DESIGN_TOKENS.spacing.md,
                                borderBottomWidth: onDelete ? 1 : 0,
                                borderBottomColor: colors.border,
                                backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                            })}
                        >
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                            <Text style={{ marginLeft: 12, color: colors.text, fontSize: 15 }}>
                                Edit Job
                            </Text>
                        </Pressable>
                    )}
                    {onDelete && (
                        <Pressable
                            onPress={() => {
                                setShowActionsMenu(false);
                                onDelete();
                            }}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: DESIGN_TOKENS.spacing.md,
                                backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                            })}
                        >
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                            <Text style={{ marginLeft: 12, color: colors.error, fontSize: 15 }}>
                                Delete Job
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* RefBookMark exactement en dessous du menu, centré */}
            <View style={{
                alignItems: 'center',
                paddingTop: 0, // Au pixel près sous le menu
            }}>
                <View style={{
                    backgroundColor: colors.border, // Même couleur que le border bottom du menu
                    borderTopLeftRadius: 0,  // Coins du haut à 0px
                    borderTopRightRadius: 0, // Coins du haut à 0px
                    borderBottomLeftRadius: DESIGN_TOKENS.radius.md,
                    borderBottomRightRadius: DESIGN_TOKENS.radius.md,
                }}>
                    <RefBookMark 
                        jobRef={jobRef} 
                        toastIt={onToast}
                        isHeaderMode={true}
                    />
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

export default JobDetailsHeader;
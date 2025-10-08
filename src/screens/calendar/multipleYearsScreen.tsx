// Modern multiple years selection screen with enhanced design and navigation

import React, { useState, useMemo, useCallback } from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    ScrollView, 
    StyleSheet, 
    RefreshControl,
    ActivityIndicator,
    Animated,
    Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

// Design tokens
const DESIGN_TOKENS = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    radius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
    },
};

const MultipleYearsScreen = ({ navigation }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    // States for modern UX
    const [isLoading, setIsLoading] = useState(false);
    const [animatedValue] = useState(new Animated.Value(1));

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    
    // Generate intelligent year range
    const yearList = useMemo(() => 
        Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
    , [startYear, endYear]);

    // Responsive dimensions
    const screenWidth = Dimensions.get('window').width;
    const yearCardWidth = (screenWidth - DESIGN_TOKENS.spacing.lg * 2 - DESIGN_TOKENS.spacing.md) / 2;

    // Pull to refresh functionality
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
    }, []);

    const useCustomStyles = () => {
        return StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: colors.background,
            },
            scrollContainer: {
                flexGrow: 1,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingBottom: 100, // Marge pour menu Samsung
            },
            header: {
                backgroundColor: colors.background,
                paddingTop: 50,
                paddingBottom: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            },
            headerTop: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: DESIGN_TOKENS.spacing.md,
            },
            leftButtons: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: DESIGN_TOKENS.spacing.sm,
            },
            homeButton: {
                backgroundColor: colors.primary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                ...DESIGN_TOKENS.shadows.md,
            },
            backButton: {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                ...DESIGN_TOKENS.shadows.sm,
            },
            titleArea: {
                alignItems: 'center',
                flex: 1,
            },
            infoContainer: {
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.md,
                ...DESIGN_TOKENS.shadows.sm,
            },
            yearRangeText: {
                fontSize: 14,
                color: colors.textSecondary,
                fontWeight: '500',
            },
            yearsGrid: {
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: DESIGN_TOKENS.spacing.md,
            },
            yearCard: {
                width: yearCardWidth,
                height: 80,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                ...DESIGN_TOKENS.shadows.sm,
            },
            yearCardCurrent: {
                width: yearCardWidth,
                height: 80,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                ...DESIGN_TOKENS.shadows.sm,
                borderWidth: 2,
                borderColor: colors.primary,
            },
            yearText: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
            },
            yearTextCurrent: {
                color: colors.primary,
                fontWeight: '700',
            },
            yearSubtext: {
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 2,
            },
            yearSubtextCurrent: {
                color: colors.primary,
                opacity: 0.9,
                fontWeight: '600',
            },
        });
    };

    const customStyles = useCustomStyles();

    return (
        <View style={customStyles.container}>
            <Animated.View style={[
                customStyles.header,
                { transform: [{ scale: animatedValue }] }
            ]}>
                {/* Header avec navigation */}
                <View style={customStyles.headerTop}>
                    <View style={customStyles.leftButtons}>
                        <Pressable
                            style={({ pressed }) => ({
                                ...customStyles.backButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                        </Pressable>
                        
                        <Pressable
                            style={({ pressed }) => ({
                                ...customStyles.homeButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Ionicons name="home" size={20} color={colors.buttonPrimaryText} />
                        </Pressable>
                    </View>

                    <View style={customStyles.titleArea}>
                        <Text style={[commonStyles.h2, { color: colors.text }]}>
                            Years
                        </Text>
                    </View>
                </View>

                {/* Informations sur la plage d'années */}
                <View style={customStyles.infoContainer}>
                    <Text style={customStyles.yearRangeText}>
                        Select from {startYear} - {endYear}
                    </Text>
                </View>
            </Animated.View>

            {/* Grille des années avec pull-to-refresh */}
            <ScrollView
                style={customStyles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {isLoading && (
                    <View style={[commonStyles.centerContent, { paddingVertical: DESIGN_TOKENS.spacing.xl }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}

                <View style={customStyles.yearsGrid}>
                    {yearList.map((year) => {
                        const isCurrentYear = year === currentYear;
                        const isPastYear = year < currentYear;
                        const isFutureYear = year > currentYear;
                        
                        return (
                            <Pressable
                                key={year}
                                style={({ pressed }) => ({
                                    ...(isCurrentYear ? customStyles.yearCardCurrent : customStyles.yearCard),
                                    opacity: pressed ? 0.8 : 1,
                                })}
                                onPress={() => navigation.navigate('Year', { year })}
                            >
                                <Text style={isCurrentYear ? customStyles.yearTextCurrent : customStyles.yearText}>
                                    {year}
                                </Text>
                                <Text style={isCurrentYear ? customStyles.yearSubtextCurrent : customStyles.yearSubtext}>
                                    {isCurrentYear ? 'Current' : isPastYear ? 'Past' : 'Future'}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

export default MultipleYearsScreen;
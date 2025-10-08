// Modern year calendar screen with monthly job indicators, statistics, and enhanced UX

import React, { useState, useMemo, useCallback } from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    Dimensions, 
    StyleSheet, 
    ScrollView, 
    RefreshControl,
    ActivityIndicator,
    Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

// Design tokens for consistent styling
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

// Mock function to get jobs statistics for a month
const getMonthJobsStats = (month: number, year: string) => {
    // Simulate monthly job data
    const mockData: { [key: number]: { total: number; urgent: number; completed: number } } = {
        1: { total: 15, urgent: 3, completed: 8 },
        2: { total: 12, urgent: 2, completed: 10 },
        3: { total: 18, urgent: 4, completed: 12 },
        4: { total: 8, urgent: 1, completed: 7 },
        5: { total: 22, urgent: 5, completed: 15 },
        6: { total: 14, urgent: 2, completed: 11 },
        7: { total: 19, urgent: 3, completed: 16 },
        8: { total: 11, urgent: 1, completed: 9 },
        9: { total: 16, urgent: 4, completed: 10 },
        10: { total: 13, urgent: 2, completed: 8 },
        11: { total: 9, urgent: 1, completed: 6 },
        12: { total: 17, urgent: 3, completed: 12 },
    };
    
    return mockData[month] || { total: 0, urgent: 0, completed: 0 };
};

const YearCalendarScreen = ({ navigation, route }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    // States for modern UX
    const [isLoading, setIsLoading] = useState(false);
    const [animatedValue] = useState(new Animated.Value(1));

    const { year } = route.params || {};
    const selectedYear = year || new Date().getFullYear();
    const currentYear = new Date().getFullYear();

    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Responsive dimensions
    const screenWidth = Dimensions.get('window').width;
    const monthCaseSize = (screenWidth - DESIGN_TOKENS.spacing.lg * 2 - DESIGN_TOKENS.spacing.md * 2) / 3;

    // Navigation functions
    const navigateToYear = useCallback((direction: 'prev' | 'next') => {
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
        navigation.navigate('Year', { year: newYear });
    }, [selectedYear, animatedValue, navigation]);

    // Pull to refresh functionality
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
    }, []);

    // Calculate year statistics
    const yearStats = useMemo(() => {
        let totalJobs = 0;
        let urgentJobs = 0;
        let completedJobs = 0;
        
        for (let month = 1; month <= 12; month++) {
            const monthStats = getMonthJobsStats(month, selectedYear.toString());
            totalJobs += monthStats.total;
            urgentJobs += monthStats.urgent;
            completedJobs += monthStats.completed;
        }
        
        return { totalJobs, urgentJobs, completedJobs };
    }, [selectedYear]);

    // Component for monthly job indicator
    const MonthJobIndicator = ({ monthStats }: { monthStats: any }) => {
        if (monthStats.total === 0) return null;

        return (
            <View style={{
                position: 'absolute',
                top: 4,
                right: 4,
                flexDirection: 'row',
                gap: 2,
            }}>
                {monthStats.urgent > 0 && (
                    <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#FF6B6B',
                    }} />
                )}
                {monthStats.completed > 0 && (
                    <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#51CF66',
                    }} />
                )}
                <Text style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: colors.primary,
                    marginLeft: 2,
                }}>
                    {monthStats.total}
                </Text>
            </View>
        );
    };

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
            statsContainer: {
                flexDirection: 'row',
                justifyContent: 'space-around',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                marginBottom: DESIGN_TOKENS.spacing.md,
                ...DESIGN_TOKENS.shadows.sm,
            },
            statItem: {
                alignItems: 'center',
            },
            statValue: {
                fontSize: 24,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 4,
            },
            statLabel: {
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: '500',
            },
            navigationContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: DESIGN_TOKENS.spacing.md,
                gap: DESIGN_TOKENS.spacing.sm,
            },
            navButton: {
                backgroundColor: colors.primary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                minWidth: 50,
                alignItems: 'center',
                ...DESIGN_TOKENS.shadows.sm,
            },
            yearButton: {
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                ...DESIGN_TOKENS.shadows.md,
            },
            yearButtonText: {
                fontSize: 20,
                fontWeight: '600',
                color: colors.buttonPrimaryText,
            },
            yearButtonSubtext: {
                fontSize: 12,
                color: colors.buttonPrimaryText,
                opacity: 0.8,
                marginTop: 2,
            },
            monthsGrid: {
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: DESIGN_TOKENS.spacing.md,
            },
            monthCard: {
                width: monthCaseSize,
                height: monthCaseSize,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                ...DESIGN_TOKENS.shadows.sm,
            },
            monthCardCurrent: {
                width: monthCaseSize,
                height: monthCaseSize,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                ...DESIGN_TOKENS.shadows.sm,
                borderWidth: 2,
                borderColor: colors.primary,
            },
            monthText: {
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
            },
            monthTextCurrent: {
                color: colors.primary,
                fontWeight: '700',
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
                {/* Header avec navigation moderne */}
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
                            {selectedYear}
                        </Text>
                        {selectedYear === currentYear && (
                            <Text style={[commonStyles.bodySmall, { color: colors.textSecondary }]}>
                                Current Year
                            </Text>
                        )}
                    </View>
                </View>

                {/* Statistiques de l'année */}
                <View style={customStyles.statsContainer}>
                    <View style={customStyles.statItem}>
                        <Text style={customStyles.statValue}>{yearStats.totalJobs}</Text>
                        <Text style={customStyles.statLabel}>Total Jobs</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#FF6B6B' }]}>
                            {yearStats.urgentJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>Urgent</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#51CF66' }]}>
                            {yearStats.completedJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Navigation entre années */}
                <View style={customStyles.navigationContainer}>
                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.navButton,
                            opacity: pressed ? 0.8 : 1,
                        })}
                        onPress={() => navigateToYear('prev')}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.buttonPrimaryText} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.yearButton,
                            opacity: pressed ? 0.95 : 1,
                        })}
                        onPress={() => navigation.navigate('MultipleYears')}
                    >
                        <Text style={customStyles.yearButtonText}>{selectedYear}</Text>
                        <Text style={customStyles.yearButtonSubtext}>Select Year</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.navButton,
                            opacity: pressed ? 0.8 : 1,
                        })}
                        onPress={() => navigateToYear('next')}
                    >
                        <Ionicons name="chevron-forward" size={20} color={colors.buttonPrimaryText} />
                    </Pressable>
                </View>
            </Animated.View>

            {/* Grille des mois avec pull-to-refresh */}
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

                <View style={customStyles.monthsGrid}>
                    {monthList.map((month, i) => {
                        const monthStats = getMonthJobsStats(i + 1, selectedYear.toString());
                        const isCurrentMonth = selectedYear === currentYear && i === new Date().getMonth();
                        
                        return (
                            <Pressable
                                key={i}
                                style={({ pressed }) => ({
                                    ...(isCurrentMonth ? customStyles.monthCardCurrent : customStyles.monthCard),
                                    opacity: pressed ? 0.8 : 1,
                                })}
                                onPress={() => navigation.navigate('Month', { 
                                    month: i + 1, 
                                    year: selectedYear 
                                })}
                            >
                                <Text style={isCurrentMonth ? customStyles.monthTextCurrent : customStyles.monthText}>
                                    {month}
                                </Text>
                                <MonthJobIndicator monthStats={monthStats} />
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

export default YearCalendarScreen;
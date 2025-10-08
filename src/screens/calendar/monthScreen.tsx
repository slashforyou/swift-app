// Modern month calendar screen with enhanced UX, job indicators, and modern design

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

// Design tokens for consistent spacing and styling
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

// Mock function to get jobs for a specific day
const getJobsForDay = (day: number, month: number, year: number) => {
    // Simulate some jobs for demonstration
    const mockJobs = [
        { day: 5, status: 'urgent', count: 2 },
        { day: 8, status: 'completed', count: 1 },
        { day: 12, status: 'pending', count: 3 },
        { day: 15, status: 'urgent', count: 1 },
        { day: 18, status: 'completed', count: 2 },
        { day: 22, status: 'pending', count: 1 },
        { day: 25, status: 'urgent', count: 1 },
    ];
    
    return mockJobs.find(job => job.day === day) || null;
};

const MonthCalendarScreen = ({ navigation, route }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();
    
    // States for modern UX
    const [isLoading, setIsLoading] = useState(false);
    const [animatedValue] = useState(new Animated.Value(1));
    
    // Calculate responsive dimensions
    const screenWidth = Dimensions.get('window').width;
    const buttonWidth = (screenWidth - DESIGN_TOKENS.spacing.lg * 2 - DESIGN_TOKENS.spacing.xs * 6) / 7;
    
    const monthList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const { month, year } = route.params || {};

    const selectedYear = year || new Date().getFullYear();
    const selectedMonthIndex = month ? month - 1 : new Date().getMonth();
    const selectedMonth = monthList[month - 1] || new Date().toLocaleString('default', { month: 'long' });

    const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);



    // We determine the number of day between the first day of the month and the last monday.
    const firstDayOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Adjusting for Monday as the first day

    const daysBefore = firstDayOfWeek; // Number of days before the first Monday
    const daysAfter = (7 - (daysInMonth + daysBefore) % 7) % 7; // Number of days after the last day of the month

    const today = new Date();
    const isToday = (day: number) => {
        return day === today.getDate() && selectedMonthIndex === today.getMonth() && selectedYear === today.getFullYear();
    };

    // Modern navigation functions with animations
    const navigateToMonth = useCallback((direction: 'prev' | 'next') => {
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

        const newMonth = direction === 'prev' 
            ? (selectedMonthIndex > 0 ? selectedMonthIndex : 12)
            : (selectedMonthIndex < 11 ? selectedMonthIndex + 2 : 1);
        const newYear = direction === 'prev'
            ? (selectedMonthIndex > 0 ? selectedYear : selectedYear - 1)
            : (selectedMonthIndex < 11 ? selectedYear : selectedYear + 1);

        navigation.navigate('Month', { year: newYear, month: newMonth });
    }, [selectedMonthIndex, selectedYear, animatedValue, navigation]);

    // Pull to refresh functionality
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
    }, []);

    // Calculate month statistics
    const monthStats = useMemo(() => {
        let totalJobs = 0;
        let urgentJobs = 0;
        let completedJobs = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayJobs = getJobsForDay(day, selectedMonthIndex + 1, selectedYear);
            if (dayJobs) {
                totalJobs += dayJobs.count;
                if (dayJobs.status === 'urgent') urgentJobs += dayJobs.count;
                if (dayJobs.status === 'completed') completedJobs += dayJobs.count;
            }
        }
        
        return { totalJobs, urgentJobs, completedJobs };
    }, [selectedMonthIndex, selectedYear, daysInMonth]);

    // Component for job indicator dot
    const JobIndicator = ({ job }: { job: any }) => {
        if (!job) return null;

        const getIndicatorColor = () => {
            switch (job.status) {
                case 'urgent': return '#FF6B6B';
                case 'completed': return '#51CF66';
                case 'pending': return '#FFD43B';
                default: return colors.primary;
            }
        };

        return (
            <View style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getIndicatorColor(),
                borderWidth: 1,
                borderColor: colors.background,
            }}>
                {job.count > 1 && (
                    <Text style={{
                        position: 'absolute',
                        top: -10,
                        right: -2,
                        fontSize: 8,
                        color: colors.text,
                        fontWeight: '600',
                    }}>
                        {job.count}
                    </Text>
                )}
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
                paddingHorizontal: 0, // Calendrier prend toute la largeur
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
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
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
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
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
            monthButton: {
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                alignItems: 'center',
                ...DESIGN_TOKENS.shadows.md,
            },
            monthButtonText: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.buttonPrimaryText,
            },
            monthButtonSubtext: {
                fontSize: 12,
                color: colors.buttonPrimaryText,
                opacity: 0.8,
                marginTop: 2,
            },
            calendarContainer: {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 0, // Pas de border radius pour prendre toute la largeur
                padding: DESIGN_TOKENS.spacing.md,
                marginHorizontal: 0, // Prend toute la largeur
            },
            daysHeader: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.xs,
            },
            dayHeaderItem: {
                width: buttonWidth,
                alignItems: 'center',
                paddingVertical: DESIGN_TOKENS.spacing.sm,
            },
            dayHeaderText: {
                fontSize: 12,
                fontWeight: '600',
                color: colors.textSecondary,
            },
            daysGrid: {
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: DESIGN_TOKENS.spacing.xs,
            },
            dayButton: {
                width: buttonWidth,
                height: buttonWidth,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: colors.background,
                position: 'relative',
                ...DESIGN_TOKENS.shadows.sm,
            },
            dayButtonToday: {
                width: buttonWidth,
                height: buttonWidth,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: colors.primary,
                position: 'relative',
                ...DESIGN_TOKENS.shadows.md,
            },
            dayText: {
                fontSize: 16,
                fontWeight: '500',
                color: colors.text,
            },
            dayTextToday: {
                fontSize: 16,
                fontWeight: '700',
                color: colors.buttonPrimaryText,
            },
            emptyDayButton: {
                width: buttonWidth,
                height: buttonWidth,
                backgroundColor: 'transparent',
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

                    <Pressable 
                        style={customStyles.titleArea}
                        onPress={() => navigation.navigate('MultipleYears')}
                    >
                        <Text style={[commonStyles.h2, { color: colors.text }]}>
                            {selectedYear}
                        </Text>
                    </Pressable>
                </View>

                {/* Statistiques du mois */}
                <View style={customStyles.statsContainer}>
                    <View style={customStyles.statItem}>
                        <Text style={customStyles.statValue}>{monthStats.totalJobs}</Text>
                        <Text style={customStyles.statLabel}>Total Jobs</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#FF6B6B' }]}>
                            {monthStats.urgentJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>Urgent</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#51CF66' }]}>
                            {monthStats.completedJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Navigation entre mois */}
                <View style={customStyles.navigationContainer}>
                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.navButton,
                            opacity: pressed ? 0.8 : 1,
                        })}
                        onPress={() => navigateToMonth('prev')}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.buttonPrimaryText} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.monthButton,
                            opacity: pressed ? 0.95 : 1,
                        })}
                        onPress={() => navigation.navigate('Year', { year: selectedYear, month: selectedMonthIndex + 1 })}
                    >
                        <Text style={customStyles.monthButtonText}>{selectedMonth}</Text>
                        <Text style={customStyles.monthButtonSubtext}>Select Month</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => ({
                            ...customStyles.navButton,
                            opacity: pressed ? 0.8 : 1,
                        })}
                        onPress={() => navigateToMonth('next')}
                    >
                        <Ionicons name="chevron-forward" size={20} color={colors.buttonPrimaryText} />
                    </Pressable>
                </View>
            </Animated.View>

            {/* Calendrier avec pull-to-refresh */}
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

                <View style={customStyles.calendarContainer}>
                    {/* En-têtes des jours */}
                    <View style={customStyles.daysHeader}>
                        {daysList.map((day) => (
                            <View key={day} style={customStyles.dayHeaderItem}>
                                <Text style={customStyles.dayHeaderText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Grille des jours */}
                    <View style={customStyles.daysGrid}>
                        {/* Jours vides avant le début du mois */}
                        {Array.from({ length: daysBefore }, (_, i) => (
                            <View key={`before-${i}`} style={customStyles.emptyDayButton} />
                        ))}

                        {/* Jours du mois */}
                        {daysArray.map((day) => {
                            const dayJobs = getJobsForDay(day, selectedMonthIndex + 1, selectedYear);
                            return (
                                <Pressable
                                    key={day}
                                    style={({ pressed }) => ({
                                        ...(isToday(day) ? customStyles.dayButtonToday : customStyles.dayButton),
                                        opacity: pressed ? 0.8 : 1,
                                    })}
                                    onPress={() => navigation.navigate('Day', { 
                                        day, 
                                        month: selectedMonthIndex + 1, 
                                        year: selectedYear 
                                    })}
                                >
                                    <Text style={isToday(day) ? customStyles.dayTextToday : customStyles.dayText}>
                                        {day}
                                    </Text>
                                    <JobIndicator job={dayJobs} />
                                </Pressable>
                            );
                        })}

                        {/* Jours vides après la fin du mois */}
                        {Array.from({ length: daysAfter }, (_, i) => (
                            <View key={`after-${i}`} style={customStyles.emptyDayButton} />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default MonthCalendarScreen;
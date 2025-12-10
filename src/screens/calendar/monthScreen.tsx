// Modern month calendar screen with enhanced UX, job indicators, and modern design

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { useJobsForMonth } from '../../hooks/useJobsForMonth';
import { useTranslation } from '../../localization';
import { JobAPI } from '../../services/jobs';

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

// Adapter pour normaliser les données de l'API
const normalizeJob = (rawJob: any): JobAPI => {
    return {
        id: rawJob.id?.toString() || '',
        status: rawJob.status || 'pending',
        priority: rawJob.priority || 'medium',
        client_id: rawJob.client_id?.toString() || '',
        addresses: rawJob.addresses || [],
        time: {
            startWindowStart: rawJob.start_window_start || rawJob.time?.startWindowStart || '',
            startWindowEnd: rawJob.start_window_end || rawJob.time?.startWindowEnd || '',
            endWindowStart: rawJob.end_window_start || rawJob.time?.endWindowStart,
            endWindowEnd: rawJob.end_window_end || rawJob.time?.endWindowEnd,
        },
        createdAt: rawJob.created_at || rawJob.createdAt || '',
        updatedAt: rawJob.updated_at || rawJob.updatedAt || '',
        notes: rawJob.notes,
        estimatedDuration: rawJob.estimated_duration || rawJob.estimatedDuration,
        client: rawJob.client,
        contact: rawJob.contact,
        truck: rawJob.truck,
    };
};

// Helper function to get jobs for a specific day from API data
const getJobsForDay = (day: number, jobs: any[]) => {
    const dayJobs = jobs.map(normalizeJob).filter(job => {
        if (!job.time?.startWindowStart) {
            return false;
        }
        
        const jobDate = new Date(job.time.startWindowStart);
        const isMatchingDay = jobDate.getDate() === day;
        
        return isMatchingDay;
    });
    
    if (dayJobs.length === 0) return null;

    // Count by status
    const statusCount = dayJobs.reduce((acc, job) => {
        const status = job.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Determine primary status (highest priority first)
    const statusPriority = ['urgent', 'pending', 'in-progress', 'completed'];
    const primaryStatus = statusPriority.find(status => statusCount[status] > 0) || 'pending';

    const result = {
        count: dayJobs.length,
        status: primaryStatus,
        jobs: dayJobs
    };
    
    return result;
};

const MonthCalendarScreen = ({ navigation, route }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();
    
    // States for modern UX
    const [animatedValue] = useState(new Animated.Value(1));
    
    // Calculate responsive dimensions
    const screenWidth = Dimensions.get('window').width;
    const buttonWidth = (screenWidth - DESIGN_TOKENS.spacing.lg * 2 - DESIGN_TOKENS.spacing.xs * 6) / 7;
    
    const { t } = useTranslation();
    
    const monthList = [
        t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), 
        t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'),
        t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), 
        t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')
    ];
    const daysList = [
        t('calendar.days.mon'), t('calendar.days.tue'), t('calendar.days.wed'), 
        t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat'), t('calendar.days.sun')
    ];
    const { month, year } = route.params || {};

    const selectedYear = year || new Date().getFullYear();
    const selectedMonthIndex = month ? month - 1 : new Date().getMonth();
    
    // Hook pour les jobs du mois
    const { jobs, isLoading, error, refreshJobs } = useJobsForMonth(selectedYear, selectedMonthIndex + 1);
    
    // Debug logs pour suivre l'état des jobs
    console.log('🔍 [MONTH SCREEN] Component state:', {
        selectedYear,
        selectedMonth: selectedMonthIndex + 1,
        jobsCount: jobs.length,
        isLoading,
        hasError: !!error
    });
    
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
        refreshJobs();
    }, [refreshJobs]);

    // Calculate month statistics
    const monthStats = useMemo(() => {
        console.log('🔍 [MONTH STATS] Calculating stats for', jobs.length, 'jobs');
        let totalJobs = 0;
        let urgentJobs = 0;
        let completedJobs = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayJobs = getJobsForDay(day, jobs);
            if (dayJobs) {
                totalJobs += dayJobs.count;
                if (dayJobs.status === 'urgent') urgentJobs += dayJobs.count;
                if (dayJobs.status === 'completed') completedJobs += dayJobs.count;
            }
        }
        
        console.log('🔍 [MONTH STATS] Result:', { totalJobs, urgentJobs, completedJobs });
        return { totalJobs, urgentJobs, completedJobs };
    }, [selectedMonthIndex, selectedYear, daysInMonth, jobs]);

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
            errorContainer: {
                backgroundColor: '#ffebee',
                marginHorizontal: DESIGN_TOKENS.spacing.lg,
                marginVertical: DESIGN_TOKENS.spacing.md,
                padding: DESIGN_TOKENS.spacing.lg,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderLeftWidth: 4,
                borderLeftColor: '#f44336',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            },
            errorText: {
                fontSize: 14,
                color: '#d32f2f',
                flex: 1,
                marginRight: DESIGN_TOKENS.spacing.md,
            },
            retryButton: {
                backgroundColor: '#f44336',
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.sm,
            },
            retryText: {
                fontSize: 12,
                color: 'white',
                fontWeight: '600',
            },
        });
    };

    const customStyles = useCustomStyles();

    return (
        <View style={customStyles.container}>
            {/* Header unifié avec style Business - Position fixe en haut */}
            <CalendarHeader 
                navigation={navigation} 
                title={selectedYear.toString()} 
            />

            {/* Affichage d'erreur si problème API */}
            {error && (
                <View style={customStyles.errorContainer}>
                    <Text style={customStyles.errorText}>⚠️ {error}</Text>
                    <Pressable style={customStyles.retryButton} onPress={refreshJobs}>
                        <Text style={customStyles.retryText}>Réessayer</Text>
                    </Pressable>
                </View>
            )}
            
            <Animated.View style={[
                customStyles.header,
                { transform: [{ scale: animatedValue }] }
            ]}>
                {/* Statistiques du mois */}
                <View style={customStyles.statsContainer}>
                    <View style={customStyles.statItem}>
                        <Text style={customStyles.statValue}>{monthStats.totalJobs}</Text>
                        <Text style={customStyles.statLabel}>{t('calendar.stats.totalJobs')}</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#FF6B6B' }]}>
                            {monthStats.urgentJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>{t('calendar.stats.urgent')}</Text>
                    </View>
                    <View style={customStyles.statItem}>
                        <Text style={[customStyles.statValue, { color: '#51CF66' }]}>
                            {monthStats.completedJobs}
                        </Text>
                        <Text style={customStyles.statLabel}>{t('calendar.stats.completed')}</Text>
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
                            const dayJobs = getJobsForDay(day, jobs);
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
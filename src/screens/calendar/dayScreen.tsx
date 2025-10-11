// Modern day screen with enhanced UX, loading states, filters, and animations

import JobBox from '@/src/components/calendar/modernJobBox';
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  RefreshControl, 
  Animated,
  Dimensions
} from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { useJobsForDay, Job } from '../../hooks/useJobsForDay';
import { JobsLoadingSkeleton, EmptyDayState, ErrorState } from '../../components/calendar/DayScreenComponents';
import { DESIGN_TOKENS } from '../../constants/Styles';

interface DayScreenProps {
    route: {
        params?: {
            day?: number;
            month?: number;
            year?: number;
        };
    };
    navigation: any;
}

const DayScreen: React.FC<DayScreenProps> = ({ route, navigation }) => {
    const { day, month, year } = route.params || {};
    const selectedDay = day || new Date().getDate();
    const selectedMonth = month || new Date().getMonth() + 1;
    const selectedYear = year || new Date().getFullYear();

    // States for filtering and sorting
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<'time' | 'priority' | 'status'>('time');
    const [showFilters, setShowFilters] = useState(false);

    // Get themed colors and styles
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    // Custom hook for jobs data
    const {
        jobs,
        isLoading,
        error,
        refetch,
        filteredJobs,
        totalJobs,
        completedJobs,
        pendingJobs
    } = useJobsForDay(selectedDay, selectedMonth, selectedYear, statusFilter, sortBy);
    
    // Debug logs
    console.log(`🏠 DayScreen Hook Results - Date: ${selectedDay}/${selectedMonth}/${selectedYear}`);
    console.log(`📊 Hook State - isLoading: ${isLoading}, error: ${error}, jobs: ${jobs.length}, filteredJobs: ${filteredJobs.length}`);
    
    // Format date for display
    const formattedDate = useMemo(() => {
        const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }, [selectedDay, selectedMonth, selectedYear]);

    // Handle job press
    const handleJobPress = useCallback((job: Job) => {
        // Utiliser le code du job (ex: JOB-NERD-URGENT-006) au lieu de l'ID numérique
        const jobCode = job.code || job.id; // Fallback sur ID si pas de code
        console.log(`Job ${job.id} (code: ${jobCode}) selected`);
        navigation.navigate('JobDetails', { 
            jobId: jobCode, // Passer le code du job
            day: selectedDay,
            month: selectedMonth,
            year: selectedYear
        });
    }, [navigation, selectedDay, selectedMonth, selectedYear]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    // Navigate to previous/next day
    const navigateDay = useCallback((direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        
        navigation.replace('Day', {
            day: newDate.getDate(),
            month: newDate.getMonth() + 1,
            year: newDate.getFullYear()
        });
    }, [selectedDay, selectedMonth, selectedYear, navigation]);

    // Filter buttons data
    const filterOptions = [
        { key: '', label: 'All', count: totalJobs },
        { key: 'pending', label: 'Pending', count: jobs.filter(j => j.status === 'pending').length },
        { key: 'in-progress', label: 'Active', count: jobs.filter(j => j.status === 'in-progress').length },
        { key: 'completed', label: 'Done', count: jobs.filter(j => j.status === 'completed').length },
    ];

    const sortOptions = [
        { key: 'time' as const, label: 'Time', icon: 'time' as const },
        { key: 'priority' as const, label: 'Priority', icon: 'flag' as const },
        { key: 'status' as const, label: 'Status', icon: 'checkmark-circle' as const },
    ];

    // Custom styles
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.backgroundSecondary,
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
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        backButton: {
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
        },
        dateContainer: {
            flex: 1,
            alignItems: 'center',
            marginHorizontal: DESIGN_TOKENS.spacing.md,
        },
        dateText: {
            fontSize: DESIGN_TOKENS.typography.title.fontSize,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
        },
        dayNavigation: {
            flexDirection: 'row',
            gap: DESIGN_TOKENS.spacing.xs,
        },
        navButton: {
            backgroundColor: colors.primary,
            borderRadius: DESIGN_TOKENS.radius.sm,
            padding: DESIGN_TOKENS.spacing.xs,
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: DESIGN_TOKENS.spacing.md,
        },
        statItem: {
            alignItems: 'center',
        },
        statNumber: {
            fontSize: DESIGN_TOKENS.typography.title.fontSize,
            fontWeight: '700',
            color: colors.primary,
        },
        statLabel: {
            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
            color: colors.textSecondary,
            marginTop: 2,
        },
        content: {
            flex: 1,
            paddingBottom: 100, // Marge pour menu Samsung
        },
        filtersContainer: {
            backgroundColor: colors.backgroundSecondary,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        filtersRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        filterButtons: {
            flexDirection: 'row',
            gap: DESIGN_TOKENS.spacing.xs,
            flexWrap: 'wrap',
            marginTop: DESIGN_TOKENS.spacing.sm,
        },
        filterButton: {
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
        },
        filterButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        filterButtonInactive: {
            backgroundColor: colors.background,
            borderColor: colors.border,
        },
        filterButtonText: {
            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
            fontWeight: '600',
        },
        sortContainer: {
            flexDirection: 'row',
            gap: DESIGN_TOKENS.spacing.xs,
            marginTop: DESIGN_TOKENS.spacing.sm,
        },
        sortButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.sm,
            gap: 4,
        },
        jobsList: {
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingTop: DESIGN_TOKENS.spacing.lg,
        },
    });

    // Render filter button
    const renderFilterButton = (option: typeof filterOptions[0]) => (
        <Pressable
            key={option.key}
            style={[
                styles.filterButton,
                statusFilter === option.key ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => setStatusFilter(option.key)}
        >
            <Text style={[
                styles.filterButtonText,
                { color: statusFilter === option.key ? colors.buttonPrimaryText : colors.text }
            ]}>
                {option.label} {option.count > 0 && `(${option.count})`}
            </Text>
        </Pressable>
    );

    // Render sort button
    const renderSortButton = (option: typeof sortOptions[0]) => (
        <Pressable
            key={option.key}
            style={[
                styles.sortButton,
                {
                    backgroundColor: sortBy === option.key ? colors.primary : colors.backgroundTertiary,
                }
            ]}
            onPress={() => setSortBy(option.key)}
        >
            <Ionicons 
                name={option.icon} 
                size={12} 
                color={sortBy === option.key ? colors.buttonPrimaryText : colors.textSecondary} 
            />
            <Text style={[
                styles.filterButtonText,
                { color: sortBy === option.key ? colors.buttonPrimaryText : colors.textSecondary }
            ]}>
                {option.label}
            </Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.leftButtons}>
                        <Pressable
                            style={({ pressed }) => ({
                                ...styles.backButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                        </Pressable>
                        
                        <Pressable
                            style={({ pressed }) => ({
                                ...styles.homeButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Ionicons name="home" size={20} color={colors.buttonPrimaryText} />
                        </Pressable>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>

                    <View style={styles.dayNavigation}>
                        <Pressable
                            style={({ pressed }) => ({
                                ...styles.navButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigateDay('prev')}
                        >
                            <Ionicons name="chevron-back" size={16} color={colors.buttonPrimaryText} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => ({
                                ...styles.navButton,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            onPress={() => navigateDay('next')}
                        >
                            <Ionicons name="chevron-forward" size={16} color={colors.buttonPrimaryText} />
                        </Pressable>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{totalJobs}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{pendingJobs}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{completedJobs}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <View style={styles.filtersRow}>
                    <Text style={[commonStyles.subtitle, { color: colors.text }]}>
                        Jobs & Filters
                    </Text>
                    <Pressable onPress={() => setShowFilters(!showFilters)}>
                        <Ionicons 
                            name={showFilters ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={colors.textSecondary} 
                        />
                    </Pressable>
                </View>

                {showFilters && (
                    <>
                        <View style={styles.filterButtons}>
                            {filterOptions.map(renderFilterButton)}
                        </View>
                        <View style={styles.sortContainer}>
                            <Text style={[styles.statLabel, { marginRight: 8 }]}>Sort by:</Text>
                            {sortOptions.map(renderSortButton)}
                        </View>
                    </>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {error ? (
                    <ErrorState error={error} onRetry={handleRefresh} />
                ) : (
                    <ScrollView 
                        style={styles.jobsList}
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
                        {(() => {
                            console.log(`🔍 Day Screen Render - isLoading: ${isLoading}, jobs: ${jobs.length}, filteredJobs: ${filteredJobs.length}`);
                            console.log('📋 Jobs data:', JSON.stringify(jobs, null, 2));
                            console.log('🔽 Filtered jobs:', JSON.stringify(filteredJobs, null, 2));
                            return null;
                        })()}
                        
                        {isLoading ? (
                            <JobsLoadingSkeleton />
                        ) : filteredJobs.length > 0 ? (
                            filteredJobs.map((job, index) => (
                                <JobBox
                                    key={job.id}
                                    job={job}
                                    onPress={() => handleJobPress(job)}
                                    navigation={navigation}
                                    day={selectedDay}
                                    month={selectedMonth}
                                    year={selectedYear}
                                />
                            ))
                        ) : (
                            <EmptyDayState 
                                date={formattedDate}
                                onRefresh={handleRefresh}
                            />
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

export default DayScreen;


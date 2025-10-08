import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Job } from '../../hooks/useJobsForDay';
// Modern job box component with enhanced UI and animations

interface JobBoxProps {
  job: Job;
  onPress: () => void;
  navigation: any;
  day: number;
  month: number;
  year: number;
}

const JobBox: React.FC<JobBoxProps> = ({ job, onPress, navigation, day, month, year }) => {
    const colors = useThemeColors();

    // Status configuration
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    color: colors.warning,
                    backgroundColor: colors.backgroundTertiary,
                    icon: 'time-outline' as const,
                    text: 'Pending'
                };
            case 'in-progress':
                return {
                    color: colors.info,
                    backgroundColor: colors.backgroundTertiary,
                    icon: 'play-circle-outline' as const,
                    text: 'In Progress'
                };
            case 'completed':
                return {
                    color: colors.success,
                    backgroundColor: colors.backgroundTertiary,
                    icon: 'checkmark-circle-outline' as const,
                    text: 'Completed'
                };
            case 'cancelled':
                return {
                    color: colors.error,
                    backgroundColor: colors.backgroundTertiary,
                    icon: 'close-circle-outline' as const,
                    text: 'Cancelled'
                };
            default:
                return {
                    color: colors.textSecondary,
                    backgroundColor: colors.backgroundTertiary,
                    icon: 'help-circle-outline' as const,
                    text: 'Unknown'
                };
        }
    };

    // Priority configuration
    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return { color: colors.error, text: 'URGENT', icon: 'flash' as const };
            case 'high':
                return { color: colors.warning, text: 'HIGH', icon: 'alert-circle' as const };
            case 'medium':
                return { color: colors.info, text: 'MED', icon: 'information-circle' as const };
            case 'low':
                return { color: colors.success, text: 'LOW', icon: 'checkmark-circle' as const };
            default:
                return { color: colors.textSecondary, text: 'NORM', icon: 'remove-circle' as const };
        }
    };

    // Format time
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const statusConfig = getStatusConfig(job.status);
    const priorityConfig = getPriorityConfig(job.priority);

    const styles = StyleSheet.create({
        jobCard: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            marginBottom: DESIGN_TOKENS.spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingTop: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.md,
        },
        jobId: {
            fontSize: DESIGN_TOKENS.typography.h4.fontSize,
            fontWeight: '700',
            color: colors.text,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: DESIGN_TOKENS.spacing.xs,
            borderRadius: DESIGN_TOKENS.radius.sm,
            gap: 4,
        },
        statusText: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'uppercase',
        },
        cardContent: {
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        },
        clientRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.sm,
            gap: DESIGN_TOKENS.spacing.sm,
        },
        clientName: {
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
        },
        priorityBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        priorityText: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        addressRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: DESIGN_TOKENS.spacing.sm,
            gap: DESIGN_TOKENS.spacing.sm,
        },
        addressText: {
            fontSize: DESIGN_TOKENS.typography.bodySmall.fontSize,
            color: colors.textSecondary,
            flex: 1,
            lineHeight: 18,
        },
        timeSection: {
            backgroundColor: colors.backgroundTertiary,
            borderRadius: DESIGN_TOKENS.radius.md,
            padding: DESIGN_TOKENS.spacing.md,
            marginVertical: DESIGN_TOKENS.spacing.md,
        },
        timeRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        timeLabel: {
            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            fontWeight: '600',
        },
        timeValue: {
            fontSize: DESIGN_TOKENS.typography.bodySmall.fontSize,
            color: colors.text,
            fontWeight: '600',
        },
        truckSection: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.lg,
        },
        truckInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.sm,
            flex: 1,
        },
        truckText: {
            fontSize: DESIGN_TOKENS.typography.bodySmall.fontSize,
            color: colors.text,
            fontWeight: '500',
        },
        licensePlate: {
            backgroundColor: colors.primary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
        },
        licensePlateText: {
            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
            color: colors.buttonPrimaryText,
            fontWeight: '700',
        },
        actionButton: {
            backgroundColor: colors.primary,
            borderRadius: DESIGN_TOKENS.radius.md,
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
        },
        actionButtonText: {
            color: colors.buttonPrimaryText,
            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
            fontWeight: '600',
        },
                padding: 5,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                borderRadius: 5,
            },
    });

    return (
        <Pressable
            style={({ pressed }) => ({
                ...styles.jobCard,
                transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                opacity: pressed ? 0.9 : 1,
            })}
            onPress={onPress}
        >
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.jobId}>{job.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                    <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.text}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
                {/* Client and Priority */}
                <View style={styles.clientRow}>
                    <Ionicons name="person" size={16} color={colors.textSecondary} />
                    <Text style={styles.clientName}>
                        {job.client.firstName} {job.client.lastName}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
                        <Ionicons name={priorityConfig.icon} size={8} color={priorityConfig.color} />
                        <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                            {priorityConfig.text}
                        </Text>
                    </View>
                </View>

                {/* Addresses */}
                <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color={colors.info} />
                    <Text style={styles.addressText}>
                        {job.addresses[0]?.street}, {job.addresses[0]?.city}
                    </Text>
                </View>

                {job.addresses[1] && (
                    <View style={styles.addressRow}>
                        <Ionicons name="flag" size={16} color={colors.success} />
                        <Text style={styles.addressText}>
                            {job.addresses[1].street}, {job.addresses[1].city}
                        </Text>
                    </View>
                )}

                {/* Time Section */}
                <View style={styles.timeSection}>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Start Window</Text>
                        <Text style={styles.timeValue}>
                            {formatTime(job.time.startWindowStart)} - {formatTime(job.time.startWindowEnd)}
                        </Text>
                    </View>
                    {job.estimatedDuration && (
                        <View style={[styles.timeRow, { marginTop: 4 }]}>
                            <Text style={styles.timeLabel}>Duration</Text>
                            <Text style={styles.timeValue}>{job.estimatedDuration} min</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer - Truck Info */}
            <View style={styles.truckSection}>
                <View style={styles.truckInfo}>
                    <Ionicons name="car" size={16} color={colors.textSecondary} />
                    <Text style={styles.truckText}>{job.truck.name}</Text>
                </View>
                <View style={styles.licensePlate}>
                    <Text style={styles.licensePlateText}>{job.truck.licensePlate}</Text>
                </View>
                <Pressable
                    style={({ pressed }) => ({
                        ...styles.actionButton,
                        opacity: pressed ? 0.8 : 1,
                    })}
                    onPress={() => navigation.navigate('JobDetails', { 
                        jobId: job.id, 
                        day, 
                        month, 
                        year 
                    })}
                >
                    <Text style={styles.actionButtonText}>View</Text>
                </Pressable>
            </View>
        </Pressable>
    );
};

export default JobBox;
            shadowRadius: 4,
            elevation: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: colors.primary,
        },
            jobQuickActionButtonMapText: {
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 5,
                textAlign: 'center',
            },
        });

    const styles = useThemedStyles(createStyles);

    const handlePress = (e: any) => {
        e.stopPropagation(); // Prevents the event from bubbling up
        if (navigation && typeof navigation.navigate === 'function') {
            console.log(`Job ${job.id} selected, navigating to details...`);
            navigation.navigate('JobDetails', { jobId: job.id, navigation, day, month, year });
        } else {
            console.log(`Job ${job.id} selected`);
        }
    }


    return (
        <Pressable style={styles.dayJobBox} onPress={handlePress}>
            <View style={ styles.dayJobBoxTopPanel }>
                <View style={ styles.dayJobBoxLeftPanel }>
                    <View style={ styles.jobTitle }>
                    <Text style={styles.jobTitleText}>{job.id}</Text>
                    </View>
                    <Text style={styles.jobStartSuburb }>{job.addresses[0].city}</Text>
                    <Text style={styles.jobClientName}>
                        {job.client.firstName} {job.client.lastName}
                    </Text>
                </View>
                <View style={ styles.dayJobBoxRightPanel }>
                    <Text style={styles.jobStartTimeTitle}>Start Time:</Text>
                    <Text style={styles.jobStartTime}>{
                        new Date(job.time.startWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                    <Text style={styles.jobStartTime}>{
                        new Date(job.time.startWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }</Text>
                </View>
            </View>
            <View style={ styles.dayJobBoxBottomPanel }>
                <View style={styles.dayJobBoxLeftPanel}>
                    <Text style={styles.jobTruckTitle}>
                         <Ionicons name="car" size={16} color="colors.textSecondary" />
                         Truck:
                    </Text>
                    <View style={styles.dayJobTruckPlate}>
                        <Text style={styles.jobTruckPlateText}>{job.truck.licensePlate}</Text>
                    </View>
                    <View style={styles.jobTruckName}>
                        <Text style={styles.jobTruckNameText}>{job.truck.name}</Text>
                    </View>
                </View>
                <View style={styles.dayJobBoxRightPanel}>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Call ${job.client.phone}`)} style={ styles.jobQuickActionButtonCall }>
                        <Ionicons name="call" size={18} color={colors.textSecondary} style={ styles.jobTruckIcon } />
                        <Text style={ styles.jobQuickActionButtonCallText }>Call</Text>
                    </Pressable>
                    <Pressable onPress={() => console.log(`QUICK ACTION : Map to ${job.addresses[0].street}`)} style={ styles.jobQuickActionButtonMap }>
                        <Ionicons name="navigate" size={18} color={colors.textSecondary} style={ styles.jobTruckIcon } />
                        <Text style={ styles.jobQuickActionButtonMapText }>Map</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

export default JobBox;

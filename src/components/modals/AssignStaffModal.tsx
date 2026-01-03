/**
 * AssignStaffModal - Modal pour assigner un membre du staff à un job
 * STAFF-01: Permet de sélectionner un employé/prestataire pour un job
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useStaff } from '../../hooks/useStaff';
import { useLocalization } from '../../localization';
import type { StaffMember } from '../../types/staff';

interface AssignStaffModalProps {
    visible: boolean;
    jobId: string;
    currentStaffId?: string;
    onClose: () => void;
    onAssign: (staffId: string) => Promise<void>;
}

export default function AssignStaffModal({
    visible,
    jobId,
    currentStaffId,
    onClose,
    onAssign,
}: AssignStaffModalProps) {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const { staff, isLoading, refreshStaff } = useStaff();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(currentStaffId || null);
    const [isAssigning, setIsAssigning] = useState(false);

    // Rafraîchir les données au montage
    useEffect(() => {
        if (visible) {
            refreshStaff();
            setSelectedStaffId(currentStaffId || null);
        }
    }, [visible, currentStaffId, refreshStaff]);

    // Filtrer le staff actif par recherche
    const filteredStaff = staff
        .filter(member => member.status === 'active')
        .filter(member => {
            if (!searchQuery) return true;
            const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
            const role = member.role?.toLowerCase() || '';
            return fullName.includes(searchQuery.toLowerCase()) || 
                   role.includes(searchQuery.toLowerCase());
        });

    const handleAssign = useCallback(async () => {
        if (!selectedStaffId) {
            Alert.alert(t('common.error'), 'Please select a staff member');
            return;
        }

        try {
            setIsAssigning(true);
            await onAssign(selectedStaffId);
            onClose();
        } catch (error) {
            console.error('Error assigning staff:', error);
            Alert.alert(t('common.error'), 'Failed to assign staff member');
        } finally {
            setIsAssigning(false);
        }
    }, [selectedStaffId, onAssign, onClose, t]);

    const handleUnassign = useCallback(async () => {
        Alert.alert(
            'Remove Assignment',
            'Are you sure you want to remove the staff assignment?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsAssigning(true);
                            await onAssign(''); // Empty string to unassign
                            setSelectedStaffId(null);
                            onClose();
                        } catch (error) {
                            console.error('Error unassigning staff:', error);
                            Alert.alert(t('common.error'), 'Failed to remove assignment');
                        } finally {
                            setIsAssigning(false);
                        }
                    }
                }
            ]
        );
    }, [onAssign, onClose, t]);

    const renderStaffItem = ({ item }: { item: StaffMember }) => {
        const isSelected = selectedStaffId === item.id;
        const isCurrent = currentStaffId === item.id;

        return (
            <Pressable
                style={[
                    styles.staffItem,
                    { 
                        backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                        borderColor: isSelected ? colors.primary : 'transparent',
                    }
                ]}
                onPress={() => setSelectedStaffId(item.id)}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {item.firstName[0]}{item.lastName[0]}
                    </Text>
                </View>
                
                <View style={styles.staffInfo}>
                    <Text style={[styles.staffName, { color: colors.text }]}>
                        {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.staffRole, { color: colors.textSecondary }]}>
                        {item.role || item.type}
                    </Text>
                    {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.currentBadgeText, { color: colors.success }]}>
                                Currently Assigned
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.radioContainer}>
                    <View style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? colors.primary : colors.border }
                    ]}>
                        {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Assign Staff
                    </Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search staff..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </Pressable>
                    )}
                </View>

                {/* Staff List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading staff...
                        </Text>
                    </View>
                ) : filteredStaff.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {searchQuery ? 'No staff found' : 'No active staff members'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredStaff}
                        keyExtractor={(item) => item.id}
                        renderItem={renderStaffItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Footer Actions */}
                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    {currentStaffId && (
                        <Pressable
                            style={[styles.unassignButton, { borderColor: colors.error }]}
                            onPress={handleUnassign}
                            disabled={isAssigning}
                        >
                            <Ionicons name="person-remove" size={20} color={colors.error} />
                            <Text style={[styles.unassignText, { color: colors.error }]}>
                                Remove
                            </Text>
                        </Pressable>
                    )}
                    
                    <Pressable
                        style={[
                            styles.assignButton,
                            { 
                                backgroundColor: selectedStaffId ? colors.primary : colors.border,
                                flex: currentStaffId ? 1 : undefined,
                            }
                        ]}
                        onPress={handleAssign}
                        disabled={!selectedStaffId || isAssigning}
                    >
                        {isAssigning ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.assignText}>
                                    Assign
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: DESIGN_TOKENS.spacing.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.md,
        paddingVertical: DESIGN_TOKENS.spacing.sm,
        borderRadius: DESIGN_TOKENS.radius.md,
        gap: DESIGN_TOKENS.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: DESIGN_TOKENS.spacing.xs,
    },
    listContent: {
        padding: DESIGN_TOKENS.spacing.md,
        gap: DESIGN_TOKENS.spacing.sm,
    },
    staffItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        borderWidth: 2,
        gap: DESIGN_TOKENS.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    staffInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    staffRole: {
        fontSize: 14,
    },
    currentBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: DESIGN_TOKENS.spacing.sm,
        paddingVertical: 2,
        borderRadius: DESIGN_TOKENS.radius.sm,
        marginTop: DESIGN_TOKENS.spacing.xs,
    },
    currentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    radioContainer: {
        padding: DESIGN_TOKENS.spacing.xs,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: DESIGN_TOKENS.spacing.md,
    },
    loadingText: {
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: DESIGN_TOKENS.spacing.md,
    },
    emptyText: {
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        padding: DESIGN_TOKENS.spacing.md,
        borderTopWidth: 1,
        gap: DESIGN_TOKENS.spacing.md,
    },
    unassignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        borderRadius: DESIGN_TOKENS.radius.md,
        borderWidth: 1,
        gap: DESIGN_TOKENS.spacing.sm,
    },
    unassignText: {
        fontSize: 16,
        fontWeight: '600',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.xl,
        borderRadius: DESIGN_TOKENS.radius.md,
        gap: DESIGN_TOKENS.spacing.sm,
    },
    assignText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

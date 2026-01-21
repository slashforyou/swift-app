/**
 * XP History Screen - Historique des gains d'XP
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTranslation } from '../localization';
import { fetchXpHistory, formatXpAction } from '../services/gamification';

interface XpEntry {
    id: number;
    action: string;
    xpEarned: number;
    jobId?: number;
    createdAt: string;
}

const XpHistoryScreen: React.FC = () => {
    console.log('\n⚡ ═══════════════════════════════════════');
    console.log('⚡ [XP HISTORY] Screen mounted');
    console.log('⚡ ═══════════════════════════════════════\n');
    
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [history, setHistory] = useState<XpEntry[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const LIMIT = 20;

    const loadHistory = useCallback(async (reset: boolean = false) => {
        console.log('⚡ [XP HISTORY] Loading...', reset ? '(reset)' : `(offset: ${offset})`);
        try {
            setError(null);
            const currentOffset = reset ? 0 : offset;
            const data = await fetchXpHistory(LIMIT, currentOffset);
            console.log('⚡ [XP HISTORY] ✅ Loaded:', data.history.length, 'entries, total:', data.total);
            
            if (reset) {
                setHistory(data.history);
                setOffset(LIMIT);
            } else {
                setHistory(prev => [...prev, ...data.history]);
                setOffset(prev => prev + LIMIT);
            }
            setTotalEntries(data.total);
        } catch (err) {
            console.error('Failed to load XP history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load history');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [offset]);

    useEffect(() => {
        loadHistory(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadHistory(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onLoadMore = useCallback(() => {
        if (!isLoadingMore && history.length < totalEntries) {
            setIsLoadingMore(true);
            loadHistory(false);
        }
    }, [isLoadingMore, history.length, totalEntries, loadHistory]);

    const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            job_completed: 'checkmark-circle',
            five_star_rating: 'star',
            first_job_of_day: 'sunny',
            no_incident: 'shield-checkmark',
            photo_added: 'camera',
            note_added: 'document-text',
            signature_collected: 'create',
            streak_bonus_7: 'flame',
            streak_bonus_30: 'flame',
            streak_bonus_100: 'flame',
            referral_bonus: 'people',
            training_completed: 'school',
            profile_completed: 'person-circle',
            verification_completed: 'checkmark-done',
        };
        return icons[action] || 'add-circle';
    };

    const getActionColor = (action: string): string => {
        const colors: Record<string, string> = {
            job_completed: '#27AE60',
            five_star_rating: '#F1C40F',
            first_job_of_day: '#E67E22',
            no_incident: '#3498DB',
            photo_added: '#9B59B6',
            note_added: '#1ABC9C',
            signature_collected: '#2980B9',
            streak_bonus_7: '#E74C3C',
            streak_bonus_30: '#E74C3C',
            streak_bonus_100: '#E74C3C',
            referral_bonus: '#8E44AD',
            training_completed: '#2ECC71',
            profile_completed: '#3498DB',
            verification_completed: '#27AE60',
        };
        return colors[action] || Colors.light.primary;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('xpHistory.justNow');
        if (diffMins < 60) return t('xpHistory.minutesAgo', { count: diffMins });
        if (diffHours < 24) return t('xpHistory.hoursAgo', { count: diffHours });
        if (diffDays < 7) return t('xpHistory.daysAgo', { count: diffDays });
        
        return date.toLocaleDateString();
    };

    const renderItem = ({ item }: { item: XpEntry }) => (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.light.background,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: Colors.light.border,
            }}
        >
            {/* Icon */}
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: getActionColor(item.action) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: DESIGN_TOKENS.spacing.md,
                }}
            >
                <Ionicons
                    name={getActionIcon(item.action)}
                    size={22}
                    color={getActionColor(item.action)}
                />
            </View>

            {/* Details */}
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: Colors.light.text,
                        marginBottom: 2,
                    }}
                >
                    {formatXpAction(item.action)}
                </Text>
                <Text
                    style={{
                        fontSize: 13,
                        color: Colors.light.textMuted,
                    }}
                >
                    {formatDate(item.createdAt)}
                    {item.jobId && ` • Job #${item.jobId}`}
                </Text>
            </View>

            {/* XP Amount */}
            <View
                style={{
                    backgroundColor: getActionColor(item.action),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: DESIGN_TOKENS.radius.full,
                }}
            >
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: 'white',
                    }}
                >
                    +{item.xpEarned} XP
                </Text>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={{ marginTop: 16, color: Colors.light.textSecondary }}>
                    {t('xpHistory.loading')}
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background, padding: 20 }}>
                <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
                <Text style={{ marginTop: 16, color: Colors.light.error, textAlign: 'center' }}>
                    {error}
                </Text>
                <Pressable
                    onPress={() => {
                        setIsLoading(true);
                        loadHistory(true);
                    }}
                    style={{
                        marginTop: 16,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        backgroundColor: Colors.light.primary,
                        borderRadius: DESIGN_TOKENS.radius.md,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        {t('common.retry')}
                    </Text>
                </Pressable>
            </View>
        );
    }

    // Calculate total XP from history
    const totalXp = history.reduce((sum, entry) => sum + entry.xpEarned, 0);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingTop: DESIGN_TOKENS.spacing.xl,
                    paddingBottom: DESIGN_TOKENS.spacing.md,
                    backgroundColor: Colors.light.background,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.light.border,
                }}
            >
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => ({
                        padding: 8,
                        marginRight: 12,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.light.text }}>
                        {t('xpHistory.title')}
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.light.textSecondary }}>
                        {history.length} / {totalEntries} {t('xpHistory.entries')}
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: '#27AE60',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: DESIGN_TOKENS.radius.full,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                        ⚡ {totalXp.toLocaleString()} XP
                    </Text>
                </View>
            </View>

            {/* History List */}
            <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                        <Ionicons name="time-outline" size={64} color={Colors.light.textMuted} />
                        <Text
                            style={{
                                fontSize: 16,
                                color: Colors.light.textSecondary,
                                marginTop: 16,
                                textAlign: 'center',
                            }}
                        >
                            {t('xpHistory.empty')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: Colors.light.textMuted,
                                marginTop: 8,
                                textAlign: 'center',
                            }}
                        >
                            {t('xpHistory.emptyDescription')}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default XpHistoryScreen;

/**
 * LeaderboardScreen - Écran de classement des utilisateurs
 * Affiche le top des utilisateurs avec leur niveau, XP et rang
 * Filtres par période : semaine, mois, année
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/primitives/Screen';
import { HStack, VStack } from '../components/primitives/Stack';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useGamification } from '../hooks/useGamification';
import { useTranslation } from '../localization';
import {
    fetchLeaderboard,
    getRankFromLevel,
    LeaderboardEntry,
    LeaderboardPeriod
} from '../services/gamification';

interface LeaderboardScreenProps {
    navigation: any;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
    console.log('\n🏆 ═══════════════════════════════════════');
    console.log('🏆 [LEADERBOARD] Screen mounted');
    console.log('🏆 ═══════════════════════════════════════\n');
    
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { data: myData } = useGamification();
    
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('week');

    const loadLeaderboard = useCallback(async (showRefresh = false, period: LeaderboardPeriod = selectedPeriod) => {
        console.log('🏆 [LEADERBOARD] Loading data...', showRefresh ? '(refresh)' : '(initial)', 'period:', period);
        try {
            if (showRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);
            
            const response = await fetchLeaderboard(50, period);
            const leaderboardData = response?.leaderboard || [];
            console.log('🏆 [LEADERBOARD] ✅ Data loaded:', leaderboardData.length, 'drivers, userRank:', response?.userRank);
            setLeaderboard(leaderboardData);
            setUserRank(response?.userRank ?? null);
        } catch (err) {
            console.error('❌ Error loading leaderboard:', err);
            setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    // Changer la période et recharger
    const handlePeriodChange = (period: LeaderboardPeriod) => {
        setSelectedPeriod(period);
        loadLeaderboard(false, period);
    };

    // Obtenir le label de la période
    const getPeriodLabel = (period: LeaderboardPeriod): string => {
        const labels: Record<LeaderboardPeriod, string> = {
            week: t('leaderboard.thisWeek'),
            month: t('leaderboard.thisMonth'),
            year: t('leaderboard.thisYear'),
            all: t('leaderboard.allTime'),
        };
        return labels[period];
    };

    // Obtenir l'icône de la période
    const getPeriodIcon = (period: LeaderboardPeriod): keyof typeof Ionicons.glyphMap => {
        const icons: Record<LeaderboardPeriod, keyof typeof Ionicons.glyphMap> = {
            week: 'calendar-outline',
            month: 'calendar',
            year: 'ribbon',
            all: 'trophy',
        };
        return icons[period];
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return { bg: '#FFD700', icon: '🥇' };
        if (rank === 2) return { bg: '#C0C0C0', icon: '🥈' };
        if (rank === 3) return { bg: '#CD7F32', icon: '🥉' };
        return { bg: colors.backgroundTertiary, icon: null };
    };

    const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const rankStyle = getRankStyle(item.rank);
        const levelRank = getRankFromLevel(item.level);
        const isCurrentUser = userRank === item.rank;

        return (
            <Pressable
                style={({ pressed }) => ({
                    backgroundColor: isCurrentUser 
                        ? colors.primary + '20' 
                        : pressed 
                            ? colors.backgroundTertiary 
                            : colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.sm,
                    borderWidth: isCurrentUser ? 2 : 1,
                    borderColor: isCurrentUser ? colors.primary : colors.border,
                })}
            >
                <HStack gap="md" align="center">
                    {/* Rank Badge */}
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            backgroundColor: rankStyle.bg,
                            borderRadius: 22,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {rankStyle.icon ? (
                            <Text style={{ fontSize: 20 }}>{rankStyle.icon}</Text>
                        ) : (
                            <Text style={{ 
                                fontSize: 16, 
                                fontWeight: '700',
                                color: colors.text,
                            }}>
                                {item.rank}
                            </Text>
                        )}
                    </View>

                    {/* User Info */}
                    <VStack gap="xs" style={{ flex: 1 }}>
                        <HStack gap="sm" align="center">
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.text,
                            }}>
                                {item.firstName} {item.lastName?.charAt(0)}.
                            </Text>
                            {isCurrentUser && (
                                <View style={{
                                    backgroundColor: colors.primary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 10,
                                }}>
                                    <Text style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        color: colors.buttonPrimaryText,
                                    }}>
                                        {t('leaderboard.you')}
                                    </Text>
                                </View>
                            )}
                        </HStack>
                        <HStack gap="sm" align="center">
                            <Text style={{
                                fontSize: 13,
                                color: levelRank.color,
                                fontWeight: '500',
                            }}>
                                {levelRank.emoji} {item.title}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: colors.textMuted,
                            }}>
                                •
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                            }}>
                                {item.completedJobs} {t('leaderboard.jobs')}
                            </Text>
                        </HStack>
                    </VStack>

                    {/* Level & XP */}
                    <VStack gap="xs" align="flex-end">
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: colors.primary,
                        }}>
                            Lv.{item.level}
                        </Text>
                        <Text style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                        }}>
                            {item.experience.toLocaleString()} XP
                        </Text>
                    </VStack>
                </HStack>
            </Pressable>
        );
    };

    const renderHeader = () => (
        <VStack gap="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            {/* Period Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    gap: 8,
                    paddingVertical: 4,
                }}
            >
                {(['week', 'month', 'year', 'all'] as LeaderboardPeriod[]).map((period) => (
                    <Pressable
                        key={period}
                        onPress={() => handlePeriodChange(period)}
                        style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: DESIGN_TOKENS.radius.full,
                            backgroundColor: selectedPeriod === period 
                                ? colors.primary 
                                : pressed 
                                    ? colors.backgroundTertiary 
                                    : colors.backgroundSecondary,
                            gap: 6,
                            borderWidth: 1,
                            borderColor: selectedPeriod === period ? colors.primary : colors.border,
                        })}
                    >
                        <Ionicons
                            name={getPeriodIcon(period)}
                            size={16}
                            color={selectedPeriod === period ? 'white' : colors.textSecondary}
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: selectedPeriod === period ? 'white' : colors.textSecondary,
                            }}
                        >
                            {getPeriodLabel(period)}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* My Rank Card */}
            {userRank && myData && (
                <View style={{
                    backgroundColor: colors.primary + '15',
                    borderRadius: DESIGN_TOKENS.radius.xl,
                    padding: DESIGN_TOKENS.spacing.lg,
                    borderWidth: 2,
                    borderColor: colors.primary + '30',
                }}>
                    <HStack gap="md" align="center">
                        <View style={{
                            width: 60,
                            height: 60,
                            backgroundColor: colors.primary,
                            borderRadius: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Text style={{
                                fontSize: 24,
                                fontWeight: '700',
                                color: colors.buttonPrimaryText,
                            }}>
                                #{userRank}
                            </Text>
                        </View>
                        <VStack gap="xs" style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                            }}>
                                {t('leaderboard.yourRank')}
                            </Text>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: colors.text,
                            }}>
                                {myData.rank?.emoji} {myData.title}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                            }}>
                                Level {myData.level} • {myData.xp?.toLocaleString()} XP
                            </Text>
                        </VStack>
                    </HStack>
                </View>
            )}

            {/* Leaderboard Title */}
            <HStack gap="sm" align="center">
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text,
                }}>
                    🏆 {t('leaderboard.topDrivers')}
                </Text>
            </HStack>
        </VStack>
    );

    if (isLoading) {
        return (
            <Screen>
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{
                        marginTop: DESIGN_TOKENS.spacing.md,
                        color: colors.textSecondary,
                    }}>
                        {t('leaderboard.loading')}
                    </Text>
                </View>
            </Screen>
        );
    }

    if (error) {
        return (
            <Screen>
                <VStack gap="md" align="center" justify="center" style={{ flex: 1, padding: DESIGN_TOKENS.spacing.xl }}>
                    <Ionicons name="alert-circle" size={48} color={colors.error} />
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        textAlign: 'center',
                    }}>
                        {error}
                    </Text>
                    <Pressable
                        onPress={() => loadLeaderboard()}
                        style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                            paddingVertical: DESIGN_TOKENS.spacing.md,
                            borderRadius: DESIGN_TOKENS.radius.md,
                        }}
                    >
                        <Text style={{
                            color: colors.buttonPrimaryText,
                            fontWeight: '600',
                        }}>
                            {t('common.retry')}
                        </Text>
                    </Pressable>
                </VStack>
            </Screen>
        );
    }

    return (
        <Screen>
            {/* Header */}
            <View style={{
                paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingBottom: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            }}>
                <HStack gap="md" align="center">
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        })}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={{
                        flex: 1,
                        fontSize: 20,
                        fontWeight: '700',
                        color: colors.text,
                    }}>
                        {t('leaderboard.title')}
                    </Text>
                    <Pressable
                        onPress={() => loadLeaderboard(true)}
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                        })}
                    >
                        <Ionicons name="refresh" size={20} color={colors.text} />
                    </Pressable>
                </HStack>
            </View>

            {/* Leaderboard List */}
            <FlatList
                data={leaderboard}
                renderItem={renderLeaderboardItem}
                keyExtractor={(item) => item.userId.toString()}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{
                    padding: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadLeaderboard(true)}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={() => (
                    <VStack gap="md" align="center" style={{ paddingVertical: DESIGN_TOKENS.spacing.xxl }}>
                        <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
                        <Text style={{
                            fontSize: 16,
                            color: colors.textSecondary,
                            textAlign: 'center',
                        }}>
                            {t('leaderboard.empty')}
                        </Text>
                    </VStack>
                )}
            />
        </Screen>
    );
};

export default LeaderboardScreen;

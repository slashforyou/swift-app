/**
 * Badges Screen - Affiche les badges gagnés et disponibles
 * Supporte les modes Light et Dark
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useTranslation } from '../localization';
import {
    BadgeDetailed,
    fetchGamification,
    getBadgesByCategory
} from '../services/gamification';

type BadgeCategory = 'driver' | 'offsider' | 'business' | 'rating' | 'streak' | 'level' | 'special';

interface CategoryInfo {
    key: BadgeCategory;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const CATEGORIES: CategoryInfo[] = [
    { key: 'driver', icon: 'car', color: '#4A90D9' },
    { key: 'offsider', icon: 'people', color: '#9B59B6' },
    { key: 'business', icon: 'business', color: '#27AE60' },
    { key: 'rating', icon: 'star', color: '#F1C40F' },
    { key: 'streak', icon: 'flame', color: '#E74C3C' },
    { key: 'level', icon: 'trending-up', color: '#3498DB' },
    { key: 'special', icon: 'diamond', color: '#9B59B6' },
];

const BadgesScreen: React.FC = () => {
    console.log('\n🎖️ ═══════════════════════════════════════');
    console.log('🎖️ [BADGES] Screen mounted');
    console.log('🎖️ ═══════════════════════════════════════\n');
    
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState<BadgeDetailed[]>([]);
    const [availableBadges, setAvailableBadges] = useState<BadgeDetailed[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
    const [error, setError] = useState<string | null>(null);

    const loadBadges = useCallback(async () => {
        console.log('🎖️ [BADGES] Loading badges...');
        try {
            setError(null);
            const data = await fetchGamification();
            
            // Badges gagnés
            const earned = data.badgesDetailed?.filter(b => b.earned || b.earnedAt) || [];
            console.log('🎖️ [BADGES] ✅ Earned badges:', earned.length);
            setEarnedBadges(earned);
            
            // Badges disponibles (non gagnés)
            const available = data.availableBadges?.filter(b => !b.earned && !b.earnedAt) || [];
            console.log('🎖️ [BADGES] ✅ Available badges:', available.length);
            setAvailableBadges(available);
        } catch (err) {
            console.error('Failed to load badges:', err);
            setError(err instanceof Error ? err.message : 'Failed to load badges');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadBadges();
    }, [loadBadges]);

    // Filtrer les badges par catégorie
    const getFilteredBadges = (badges: BadgeDetailed[]): BadgeDetailed[] => {
        if (selectedCategory === 'all') return badges;
        return getBadgesByCategory(badges, selectedCategory);
    };

    const filteredEarned = getFilteredBadges(earnedBadges);
    const filteredAvailable = getFilteredBadges(availableBadges);

    const getCategoryLabel = (key: BadgeCategory | 'all'): string => {
        const labels: Record<string, string> = {
            all: t('badges.categories.all'),
            driver: t('badges.categories.driver'),
            offsider: t('badges.categories.offsider'),
            business: t('badges.categories.business'),
            rating: t('badges.categories.rating'),
            streak: t('badges.categories.streak'),
            level: t('badges.categories.level'),
            special: t('badges.categories.special'),
        };
        return labels[key] || key;
    };

    const renderBadgeItem = ({ item, earned }: { item: BadgeDetailed; earned: boolean }) => {
        const categoryInfo = CATEGORIES.find(c => c.key === item.category) || CATEGORIES[0];
        
        return (
            <View
                style={{
                    width: '48%',
                    backgroundColor: earned ? colors.background : colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.md,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderWidth: earned ? 2 : 1,
                    borderColor: earned ? categoryInfo.color : colors.border,
                    opacity: earned ? 1 : 0.7,
                    shadowColor: earned ? categoryInfo.color : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: earned ? 0.2 : 0,
                    shadowRadius: 4,
                    elevation: earned ? 3 : 0,
                }}
            >
                {/* Badge Icon */}
                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: earned ? categoryInfo.color : colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        marginBottom: DESIGN_TOKENS.spacing.sm,
                    }}
                >
                    <Ionicons
                        name={earned ? categoryInfo.icon : 'lock-closed'}
                        size={28}
                        color={earned ? 'white' : colors.textMuted}
                    />
                </View>

                {/* Badge Name */}
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: earned ? colors.text : colors.textSecondary,
                        textAlign: 'center',
                        marginBottom: 4,
                    }}
                    numberOfLines={2}
                >
                    {item.name}
                </Text>

                {/* Badge Description */}
                <Text
                    style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: 'center',
                        lineHeight: 16,
                    }}
                    numberOfLines={3}
                >
                    {item.description}
                </Text>

                {/* Earned Date */}
                {earned && item.earnedAt && (
                    <Text
                        style={{
                            fontSize: 10,
                            color: categoryInfo.color,
                            textAlign: 'center',
                            marginTop: DESIGN_TOKENS.spacing.xs,
                            fontWeight: '600',
                        }}
                    >
                        ✓ {new Date(item.earnedAt).toLocaleDateString()}
                    </Text>
                )}

                {/* Requirement */}
                {!earned && item.requirementValue && (
                    <Text
                        style={{
                            fontSize: 10,
                            color: colors.textMuted,
                            textAlign: 'center',
                            marginTop: DESIGN_TOKENS.spacing.xs,
                        }}
                    >
                        {item.requirementType}: {item.requirementValue}
                    </Text>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>
                    {t('badges.loading')}
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
                <Ionicons name="alert-circle" size={48} color={colors.error} />
                <Text style={{ marginTop: 16, color: colors.error, textAlign: 'center' }}>
                    {error}
                </Text>
                <Pressable
                    onPress={loadBadges}
                    style={{
                        marginTop: 16,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        backgroundColor: colors.primary,
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingTop: DESIGN_TOKENS.spacing.xl,
                    paddingBottom: DESIGN_TOKENS.spacing.md,
                    backgroundColor: colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
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
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                        {t('badges.title')}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {earnedBadges.length} / {earnedBadges.length + availableBadges.length} {t('badges.earned')}
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: DESIGN_TOKENS.radius.full,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                        🏆 {earnedBadges.length}
                    </Text>
                </View>
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                    maxHeight: 50,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
                contentContainerStyle={{
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    gap: 8,
                }}
            >
                {/* All filter */}
                <Pressable
                    onPress={() => setSelectedCategory('all')}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: DESIGN_TOKENS.radius.full,
                        backgroundColor: selectedCategory === 'all' ? colors.primary : colors.backgroundSecondary,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: selectedCategory === 'all' ? 'white' : colors.textSecondary,
                        }}
                    >
                        {getCategoryLabel('all')}
                    </Text>
                </Pressable>

                {/* Category filters */}
                {CATEGORIES.map((cat) => (
                    <Pressable
                        key={cat.key}
                        onPress={() => setSelectedCategory(cat.key)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: DESIGN_TOKENS.radius.full,
                            backgroundColor: selectedCategory === cat.key ? cat.color : colors.backgroundSecondary,
                            gap: 6,
                        }}
                    >
                        <Ionicons
                            name={cat.icon}
                            size={14}
                            color={selectedCategory === cat.key ? 'white' : cat.color}
                        />
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: selectedCategory === cat.key ? 'white' : colors.textSecondary,
                            }}
                        >
                            {getCategoryLabel(cat.key)}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {/* Earned Badges Section */}
                {filteredEarned.length > 0 && (
                    <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: colors.text,
                                marginBottom: DESIGN_TOKENS.spacing.md,
                            }}
                        >
                            ✅ {t('badges.earnedBadges')} ({filteredEarned.length})
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                            }}
                        >
                            {filteredEarned.map((badge) => (
                                <React.Fragment key={badge.code}>
                                    {renderBadgeItem({ item: badge, earned: true })}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                )}

                {/* Available Badges Section */}
                {filteredAvailable.length > 0 && (
                    <View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: colors.text,
                                marginBottom: DESIGN_TOKENS.spacing.md,
                            }}
                        >
                            🔒 {t('badges.availableBadges')} ({filteredAvailable.length})
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                            }}
                        >
                            {filteredAvailable.map((badge) => (
                                <React.Fragment key={badge.code}>
                                    {renderBadgeItem({ item: badge, earned: false })}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty State */}
                {filteredEarned.length === 0 && filteredAvailable.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <Ionicons name="ribbon-outline" size={64} color={colors.textMuted} />
                        <Text
                            style={{
                                fontSize: 16,
                                color: colors.textSecondary,
                                marginTop: 16,
                                textAlign: 'center',
                            }}
                        >
                            {t('badges.empty')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default BadgesScreen;

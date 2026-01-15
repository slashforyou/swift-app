/**
 * SkeletonLoader - Composant réutilisable pour les états de chargement
 * 
 * Affiche des placeholders animés pendant le chargement des données.
 * Améliore l'UX en donnant un feedback visuel immédiat.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface SkeletonProps {
    /** Largeur du skeleton (nombre ou pourcentage) */
    width?: number | string;
    /** Hauteur du skeleton */
    height?: number;
    /** Border radius */
    borderRadius?: number;
    /** Style personnalisé */
    style?: ViewStyle;
    /** Animation activée */
    animated?: boolean;
}

/**
 * Skeleton de base avec animation pulse
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 16,
    borderRadius = DESIGN_TOKENS.radius.sm,
    style,
    animated = true,
}) => {
    const { isDark } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!animated) return;

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [animated, animatedValue]);

    const opacity = animated
        ? animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7],
          })
        : 0.5;

    const backgroundColor = isDark ? '#374151' : '#E5E7EB';

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor,
                    opacity,
                },
                style,
            ]}
        />
    );
};

/**
 * Skeleton pour une ligne de texte
 */
export const SkeletonText: React.FC<{ 
    lines?: number; 
    lastLineWidth?: string | number;
    spacing?: number;
    style?: ViewStyle;
}> = ({ 
    lines = 1, 
    lastLineWidth = '60%',
    spacing = DESIGN_TOKENS.spacing.xs,
    style,
}) => {
    return (
        <View style={style}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
                    height={14}
                    style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
                />
            ))}
        </View>
    );
};

/**
 * Skeleton pour un avatar circulaire
 */
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => {
    return (
        <Skeleton
            width={size}
            height={size}
            borderRadius={size / 2}
        />
    );
};

/**
 * Skeleton pour une carte (Card)
 */
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.card,
                { 
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                },
                style,
            ]}
        >
            <View style={styles.cardHeader}>
                <SkeletonAvatar size={40} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
                </View>
            </View>
            <SkeletonText lines={2} style={{ marginTop: DESIGN_TOKENS.spacing.md }} />
        </View>
    );
};

/**
 * Skeleton pour un item de liste
 */
export const SkeletonListItem: React.FC<{ 
    showAvatar?: boolean;
    style?: ViewStyle;
}> = ({ 
    showAvatar = true,
    style,
}) => {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.listItem,
                { 
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.md,
                },
                style,
            ]}
        >
            {showAvatar && (
                <SkeletonAvatar size={44} />
            )}
            <View style={styles.listItemContent}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
            </View>
            <Skeleton width={24} height={24} borderRadius={12} />
        </View>
    );
};

/**
 * Skeleton pour une liste complète
 */
export const SkeletonList: React.FC<{ 
    count?: number;
    showAvatar?: boolean;
    style?: ViewStyle;
}> = ({ 
    count = 5,
    showAvatar = true,
    style,
}) => {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonListItem
                    key={index}
                    showAvatar={showAvatar}
                    style={{ marginBottom: index < count - 1 ? DESIGN_TOKENS.spacing.sm : 0 }}
                />
            ))}
        </View>
    );
};

/**
 * Skeleton pour un job card (spécifique à SwiftApp)
 */
export const SkeletonJobCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.jobCard,
                { 
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                },
                style,
            ]}
        >
            {/* Header with time and status */}
            <View style={styles.jobCardHeader}>
                <Skeleton width={80} height={20} borderRadius={DESIGN_TOKENS.radius.full} />
                <Skeleton width={70} height={24} borderRadius={DESIGN_TOKENS.radius.sm} />
            </View>
            
            {/* Client info */}
            <View style={styles.jobCardClient}>
                <SkeletonAvatar size={36} />
                <View style={{ flex: 1, marginLeft: DESIGN_TOKENS.spacing.sm }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
                </View>
            </View>
            
            {/* Address */}
            <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
                <Skeleton width="90%" height={14} />
            </View>
        </View>
    );
};

/**
 * Skeleton pour plusieurs job cards
 */
export const SkeletonJobList: React.FC<{ 
    count?: number;
    style?: ViewStyle;
}> = ({ 
    count = 3,
    style,
}) => {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonJobCard
                    key={index}
                    style={{ marginBottom: index < count - 1 ? DESIGN_TOKENS.spacing.md : 0 }}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: DESIGN_TOKENS.spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.md,
    },
    listItemContent: {
        flex: 1,
        marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    jobCard: {
        padding: DESIGN_TOKENS.spacing.md,
    },
    jobCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    jobCardClient: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: DESIGN_TOKENS.spacing.md,
    },
});

export default {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonListItem,
    SkeletonList,
    SkeletonJobCard,
    SkeletonJobList,
};

/**
 * EmptyState - Composant réutilisable pour les états vides
 * 
 * Utilisé quand une liste est vide ou qu'il n'y a pas de données à afficher.
 * Fournit un feedback visuel clair avec icône, titre, description et action optionnelle.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

interface EmptyStateProps {
    /** Nom de l'icône Ionicons à afficher */
    icon?: keyof typeof Ionicons.glyphMap;
    /** Émoji à afficher (alternative à l'icône) */
    emoji?: string;
    /** Titre principal */
    title: string;
    /** Description ou message secondaire */
    description?: string;
    /** Texte du bouton d'action */
    actionLabel?: string;
    /** Callback quand le bouton d'action est pressé */
    onAction?: () => void;
    /** Style personnalisé pour le conteneur */
    style?: ViewStyle;
    /** Variante de taille */
    size?: 'small' | 'medium' | 'large';
    /** ID pour les tests */
    testID?: string;
}

/**
 * Composant EmptyState
 * 
 * @example
 * // Simple avec emoji
 * <EmptyState
 *     emoji="📋"
 *     title="Aucun job"
 *     description="Créez votre premier job pour commencer"
 * />
 * 
 * @example
 * // Avec action
 * <EmptyState
 *     icon="add-circle-outline"
 *     title="Aucun véhicule"
 *     description="Ajoutez vos véhicules pour les suivre"
 *     actionLabel="Ajouter un véhicule"
 *     onAction={() => setShowAddModal(true)}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    emoji,
    title,
    description,
    actionLabel,
    onAction,
    style,
    size = 'medium',
    testID = 'empty-state',
}) => {
    const { colors } = useTheme();

    const sizeConfig = {
        small: {
            iconSize: 40,
            emojiSize: 36,
            titleSize: 16,
            descriptionSize: 13,
            padding: DESIGN_TOKENS.spacing.lg,
        },
        medium: {
            iconSize: 56,
            emojiSize: 48,
            titleSize: 18,
            descriptionSize: 14,
            padding: DESIGN_TOKENS.spacing.xl,
        },
        large: {
            iconSize: 72,
            emojiSize: 64,
            titleSize: 20,
            descriptionSize: 15,
            padding: DESIGN_TOKENS.spacing.xxl,
        },
    };

    const config = sizeConfig[size];

    return (
        <View 
            testID={testID}
            style={[
                styles.container, 
                { 
                    padding: config.padding,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                },
                style
            ]}
        >
            {/* Icon or Emoji */}
            {emoji ? (
                <Text 
                    testID={`${testID}-emoji`}
                    style={[styles.emoji, { fontSize: config.emojiSize }]}
                >
                    {emoji}
                </Text>
            ) : icon ? (
                <View 
                    style={[
                        styles.iconContainer,
                        { 
                            backgroundColor: `${colors.primary}15`,
                            width: config.iconSize + 24,
                            height: config.iconSize + 24,
                            borderRadius: (config.iconSize + 24) / 2,
                        }
                    ]}
                >
                    <Ionicons 
                        name={icon} 
                        size={config.iconSize} 
                        color={colors.primary} 
                    />
                </View>
            ) : null}

            {/* Title */}
            <Text 
                testID={`${testID}-title`}
                style={[
                    styles.title, 
                    { 
                        color: colors.text,
                        fontSize: config.titleSize,
                    }
                ]}
            >
                {title}
            </Text>

            {/* Description */}
            {description && (
                <Text 
                    testID={`${testID}-description`}
                    style={[
                        styles.description, 
                        { 
                            color: colors.textSecondary,
                            fontSize: config.descriptionSize,
                        }
                    ]}
                >
                    {description}
                </Text>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <TouchableOpacity
                    testID={`${testID}-action`}
                    style={[
                        styles.actionButton,
                        { backgroundColor: colors.primary }
                    ]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionLabel}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DESIGN_TOKENS.spacing.md,
    },
    emoji: {
        marginBottom: DESIGN_TOKENS.spacing.md,
    },
    title: {
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    description: {
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
    actionButton: {
        marginTop: DESIGN_TOKENS.spacing.lg,
        paddingVertical: DESIGN_TOKENS.spacing.sm,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        borderRadius: DESIGN_TOKENS.radius.full,
    },
    actionLabel: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default EmptyState;

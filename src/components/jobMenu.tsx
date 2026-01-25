import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import { HStack } from './primitives/Stack';

interface JobMenuProps {
    jobPanel: number;
    setJobPanel: (panelIndex: number) => void;
    unreadNotesCount?: number;
}

interface TabItemProps {
    icon: string;
    isActive: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    badge?: number;
}

const TabItem: React.FC<TabItemProps> = ({ icon, isActive, onPress, accessibilityLabel, badge }) => {
    const { colors } = useCommonThemedStyles();
    
    return (
        <Pressable
            onPress={onPress}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={({ pressed }) => ({
                flex: 1,
                paddingVertical: DESIGN_TOKENS.spacing.lg, // 16pt = 32pt total touch target
                paddingHorizontal: DESIGN_TOKENS.spacing.sm, // 8pt
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed 
                    ? colors.backgroundSecondary
                    : 'transparent',
                borderRadius: DESIGN_TOKENS.radius.sm,
                minHeight: DESIGN_TOKENS.touch.minSize, // 44pt minimum
            })}
            accessibilityRole="tab"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isActive }}
        >
            <View style={{ position: 'relative' }}>
                <Ionicons 
                    name={icon as any}
                    size={24}
                    color={isActive 
                        ? colors.tint 
                        : colors.textMuted
                    }
                    style={{
                        marginBottom: DESIGN_TOKENS.spacing.xs, // 4pt spacing between icon and potential label
                    }}
                />
                {badge !== undefined && badge > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -8,
                            backgroundColor: colors.error,
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            paddingHorizontal: 4,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: colors.background,
                        }}
                    >
                        <Text
                            style={{
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: '700',
                                textAlign: 'center',
                            }}
                        >
                            {badge > 9 ? '9+' : badge}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const JobMenu: React.FC<JobMenuProps> = ({ jobPanel, setJobPanel, unreadNotesCount }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useCommonThemedStyles();
    
    const switchJobPanel = (panelIndex: number) => {
        if (jobPanel !== panelIndex) {
            setJobPanel(panelIndex);
        }
    };

    const tabs = [
        { icon: 'bookmark', label: 'Favoris', index: 0, badge: undefined },
        { icon: 'construct', label: 'Travaux', index: 1, badge: undefined },
        { icon: 'person', label: 'Client', index: 2, badge: undefined },
        { icon: 'chatbubble', label: 'Notes', index: 3, badge: unreadNotesCount },
        { icon: 'card', label: 'Paiement', index: 4, badge: undefined },
    ];

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                // Safe area padding - plus important sur Android
                paddingBottom: Math.max(insets.bottom, DESIGN_TOKENS.spacing.sm),
                paddingTop: DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
                zIndex: 1000, // S'assurer qu'il est au-dessus du contenu mais en-dessous des overlays
            }}
            accessibilityRole="tablist"
            accessibilityLabel="Menu de navigation des sections du travail"
        >
            <HStack gap={0} style={{ flex: 1 }}>
                {tabs.map((tab) => (
                    <TabItem
                        key={tab.index}
                        icon={tab.icon}
                        isActive={jobPanel === tab.index}
                        onPress={() => switchJobPanel(tab.index)}
                        accessibilityLabel={tab.label}
                        badge={tab.badge}
                    />
                ))}
            </HStack>
        </View>
    );
}

export default JobMenu;

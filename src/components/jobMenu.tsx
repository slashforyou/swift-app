import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HStack, VStack } from './primitives/Stack';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import Ionicons from '@react-native-vector-icons/ionicons';

interface JobMenuProps {
    jobPanel: number;
    setJobPanel: (panelIndex: number) => void;
}

interface TabItemProps {
    icon: string;
    isActive: boolean;
    onPress: () => void;
    accessibilityLabel: string;
}

const TabItem: React.FC<TabItemProps> = ({ icon, isActive, onPress, accessibilityLabel }) => {
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
        </Pressable>
    );
};

const JobMenu: React.FC<JobMenuProps> = ({ jobPanel, setJobPanel }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useCommonThemedStyles();
    
    const switchJobPanel = (panelIndex: number) => {
        if (jobPanel !== panelIndex) {
            setJobPanel(panelIndex);
        }
    };

    const tabs = [
        { icon: 'bookmark', label: 'Favoris', index: 0 },
        { icon: 'construct', label: 'Travaux', index: 1 },
        { icon: 'person', label: 'Client', index: 2 },
        { icon: 'chatbubble', label: 'Notes', index: 3 },
        { icon: 'card', label: 'Paiement', index: 4 },
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
                shadowColor: '#020617',
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
                    />
                ))}
            </HStack>
        </View>
    );
}

export default JobMenu;

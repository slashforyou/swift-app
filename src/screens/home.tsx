/**
 * Home - Écran d'accueil moderne avec design system
 * Architecture moderne avec Safe Areas, TopMenu et navigation cohérente
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VStack, HStack } from '../components/primitives/Stack';
import { Screen } from '../components/primitives/Screen';
import ServerConnectionTest from '@/tests/server/connectionTest';
import { useAuthCheck } from '../utils/checkAuth';
import { DESIGN_TOKENS } from '../constants/Styles';
import { Colors } from '../constants/Colors';

// Types et interfaces
interface HomeScreenProps {
    navigation: any;
}

interface MenuItemProps {
    title: string;
    icon: string;
    description: string;
    onPress: () => void;
    color?: string;
}

// Composant MenuItem moderne
const MenuItem: React.FC<MenuItemProps> = ({ title, icon, description, onPress, color = Colors.light.primary }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.light.backgroundTertiary : Colors.light.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.md,
            shadowColor: Colors.light.shadow,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: Colors.light.border,
            minHeight: DESIGN_TOKENS.touch.minSize + 20, // Touch target + extra space
        })}
    >
        <HStack gap="md" align="center">
            {/* Icône avec fond coloré */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    backgroundColor: color,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons name={icon as any} size={24} color="white" />
            </View>
            
            {/* Textes */}
            <VStack gap="xs" style={{ flex: 1 }}>
                <Text
                    style={{
                        color: Colors.light.text,
                        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                        fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                    }}
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: Colors.light.textSecondary,
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                        fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                    }}
                >
                    {description}
                </Text>
            </VStack>
            
            {/* Chevron */}
            <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors.light.textMuted} 
            />
        </HStack>
    </Pressable>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);

    if (isLoading) return LoadingComponent;

    return (
        <Screen>
            {/* Main Content */}
            <VStack 
                gap="lg" 
                style={{
                    flex: 1,
                    paddingTop: insets.top + DESIGN_TOKENS.spacing.xl,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
                }}
            >
                {/* Header with logo and title */}
                <VStack gap="md" align="center">
                    {/* Modern logo */}
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            backgroundColor: Colors.light.primary,
                            borderRadius: DESIGN_TOKENS.radius.lg,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: Colors.light.shadow,
                            shadowOffset: {
                                width: 0,
                                height: 4,
                            },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Ionicons name="briefcase" size={36} color="white" />
                    </View>
                    
                    {/* Title and subtitle */}
                    <VStack gap="xs" align="center">
                        <Text
                            style={{
                                color: Colors.light.text,
                                fontSize: DESIGN_TOKENS.typography.title.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.title.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
                                textAlign: 'center',
                            }}
                        >
                            Swift App
                        </Text>
                        <Text
                            style={{
                                color: Colors.light.textSecondary,
                                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                                textAlign: 'center',
                            }}
                        >
                            Professional Task Management
                        </Text>
                    </VStack>
                </VStack>

                {/* Navigation menu */}
                <VStack gap="sm" style={{ flex: 1 }}>
                    <MenuItem
                        title="Calendar"
                        icon="calendar"
                        description="View and manage your scheduled tasks"
                        onPress={() => navigation.navigate('Calendar')}
                        color={Colors.light.primary}
                    />
                    
                    <MenuItem
                        title="Profile"
                        icon="person"
                        description="Manage your personal information"
                        onPress={() => navigation.navigate('Profile')}
                        color={Colors.light.info}
                    />
                    
                    <MenuItem
                        title="Settings"
                        icon="settings"
                        description="Configure application preferences"
                        onPress={() => navigation.navigate('Parameters')}
                        color={Colors.light.warning}
                    />
                </VStack>

                {/* Development connection test */}
                {__DEV__ && (
                    <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
                        <ServerConnectionTest />
                    </View>
                )}
            </VStack>
        </Screen>
    );
};

export default HomeScreen;
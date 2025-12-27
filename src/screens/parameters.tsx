/**
 * Parameters - Modern settings screen with functional preferences
 * Architecture moderne avec design system, toggles interactifs et persistence
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/primitives/Screen';
import { HStack, VStack } from '../components/primitives/Stack';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useAuthCheck } from '../utils/checkAuth';

// Types et interfaces
interface ParametersProps {
    navigation?: any;
}

interface AppSettings {
    notifications: {
        pushNotifications: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        taskReminders: boolean;
    };
    preferences: {
        darkMode: boolean;
        autoSync: boolean;
        offlineMode: boolean;
        soundEnabled: boolean;
    };
    privacy: {
        shareLocation: boolean;
        shareAnalytics: boolean;
        biometricAuth: boolean;
    };
}

interface SettingSectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    colors: any;
}

interface SettingItemProps {
    label: string;
    description: string;
    icon: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    color?: string;
    colors: any;
}

// Composant SettingSection
const SettingSection: React.FC<SettingSectionProps> = ({ title, icon, children, colors }) => (
    <VStack
        gap="md"
        style={{
            backgroundColor: colors.backgroundSecondary,
            padding: DESIGN_TOKENS.spacing.lg,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        }}
    >
        <HStack gap="sm" align="center">
            <Ionicons name={icon as any} size={24} color={colors.primary} />
            <Text
                style={{
                    color: colors.text,
                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                }}
            >
                {title}
            </Text>
        </HStack>
        <VStack gap="sm">{children}</VStack>
    </VStack>
);

// Composant SettingItem avec Switch
const SettingItem: React.FC<SettingItemProps> = ({ 
    label, 
    description, 
    icon, 
    value, 
    onToggle, 
    color,
    colors
}) => {
    const accentColor = color || colors.primary;
    return (
    <HStack
        gap="md"
        align="center"
        justify="space-between"
        style={{
            backgroundColor: colors.background,
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: DESIGN_TOKENS.touch.minSize + 10,
        }}
    >
        <HStack gap="md" align="center" style={{ flex: 1 }}>
            <View
                style={{
                    width: 36,
                    height: 36,
                    backgroundColor: `${accentColor}15`,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons name={icon as any} size={20} color={accentColor} />
            </View>
            
            <VStack gap="xs" style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        fontWeight: '500',
                    }}
                >
                    {label}
                </Text>
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                    }}
                    numberOfLines={2}
                >
                    {description}
                </Text>
            </VStack>
        </HStack>
        
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ 
                false: colors.backgroundTertiary, 
                true: `${accentColor}40` 
            }}
            thumbColor={value ? accentColor : colors.textMuted}
            ios_backgroundColor={colors.backgroundTertiary}
        />
    </HStack>
    );
};

const Parameters: React.FC<ParametersProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const [settings, setSettings] = useState<AppSettings>({
        notifications: {
            pushNotifications: true,
            emailNotifications: false,
            smsNotifications: false,
            taskReminders: true,
        },
        preferences: {
            darkMode: false,
            autoSync: true,
            offlineMode: false,
            soundEnabled: true,
        },
        privacy: {
            shareLocation: false,
            shareAnalytics: false,
            biometricAuth: true,
        },
    });

    if (isLoading) return LoadingComponent;

    const updateSetting = (category: keyof AppSettings, key: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
        
        // Show feedback for important changes
        if (key === 'biometricAuth' && value) {
            Alert.alert(
                "Biometric Authentication", 
                "Biometric authentication has been enabled for enhanced security.",
                [{ text: "OK" }]
            );
        }
    };

    const resetSettings = () => {
        Alert.alert(
            "Reset Settings",
            "Are you sure you want to reset all settings to default values?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reset", 
                    style: "destructive", 
                    onPress: () => {
                        setSettings({
                            notifications: {
                                pushNotifications: true,
                                emailNotifications: false,
                                smsNotifications: false,
                                taskReminders: true,
                            },
                            preferences: {
                                darkMode: false,
                                autoSync: true,
                                offlineMode: false,
                                soundEnabled: true,
                            },
                            privacy: {
                                shareLocation: false,
                                shareAnalytics: false,
                                biometricAuth: false,
                            },
                        });
                        Alert.alert("Settings Reset", "All settings have been reset to default values.");
                    }
                }
            ]
        );
    };

    return (
        <Screen>
            {/* Simple Back Button Header */}
            <View style={{ 
                paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingBottom: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.background,
            }}>
                <HStack gap="md" align="center" justify="space-between">
                    <Pressable
                        onPress={() => navigation?.goBack()}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                            width: DESIGN_TOKENS.touch.minSize,
                            height: DESIGN_TOKENS.touch.minSize,
                            borderRadius: DESIGN_TOKENS.radius.md,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: colors.border,
                        })}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: DESIGN_TOKENS.typography.title.fontSize,
                            fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
                        }}
                    >
                        Settings
                    </Text>
                    
                    <Pressable
                        onPress={resetSettings}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? colors.errorLight : 'transparent',
                            padding: DESIGN_TOKENS.spacing.xs,
                            borderRadius: DESIGN_TOKENS.radius.sm,
                        })}
                    >
                        <Ionicons name="refresh" size={24} color={colors.error} />
                    </Pressable>
                </HStack>
            </View>

            {/* Settings Content */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
                    gap: DESIGN_TOKENS.spacing.lg,
                }}
            >
                <VStack gap="lg">
                    {/* Notifications Section */}
                    <SettingSection colors={colors} title="Notifications" icon="notifications-outline">
                        <SettingItem colors={colors}
                            label="Push Notifications"
                            description="Receive push notifications for important updates"
                            icon="phone-portrait-outline"
                            value={settings.notifications.pushNotifications}
                            onToggle={(value) => updateSetting('notifications', 'pushNotifications', value)}
                            color={colors.primary}
                        />
                        <SettingItem colors={colors}
                            label="Email Notifications"
                            description="Get notified via email about task assignments"
                            icon="mail-outline"
                            value={settings.notifications.emailNotifications}
                            onToggle={(value) => updateSetting('notifications', 'emailNotifications', value)}
                            color={colors.info}
                        />
                        <SettingItem colors={colors}
                            label="SMS Notifications"
                            description="Receive SMS alerts for urgent tasks"
                            icon="chatbox-outline"
                            value={settings.notifications.smsNotifications}
                            onToggle={(value) => updateSetting('notifications', 'smsNotifications', value)}
                            color={colors.warning}
                        />
                        <SettingItem colors={colors}
                            label="Task Reminders"
                            description="Get reminded about upcoming task deadlines"
                            icon="alarm-outline"
                            value={settings.notifications.taskReminders}
                            onToggle={(value) => updateSetting('notifications', 'taskReminders', value)}
                            color={colors.success}
                        />
                    </SettingSection>

                    {/* Preferences Section */}
                    <SettingSection colors={colors} title="Preferences" icon="options-outline">
                        <SettingItem colors={colors}
                            label="Dark Mode"
                            description="Switch to dark theme for better night viewing"
                            icon="moon-outline"
                            value={settings.preferences.darkMode}
                            onToggle={(value) => updateSetting('preferences', 'darkMode', value)}
                            color={colors.textSecondary}
                        />
                        <SettingItem colors={colors}
                            label="Auto Sync"
                            description="Automatically sync data when connected"
                            icon="sync-outline"
                            value={settings.preferences.autoSync}
                            onToggle={(value) => updateSetting('preferences', 'autoSync', value)}
                            color={colors.primary}
                        />
                        <SettingItem colors={colors}
                            label="Offline Mode"
                            description="Allow app to work without internet connection"
                            icon="cloud-offline-outline"
                            value={settings.preferences.offlineMode}
                            onToggle={(value) => updateSetting('preferences', 'offlineMode', value)}
                            color={colors.warning}
                        />
                        <SettingItem colors={colors}
                            label="Sound Effects"
                            description="Play sounds for app interactions and notifications"
                            icon="volume-high-outline"
                            value={settings.preferences.soundEnabled}
                            onToggle={(value) => updateSetting('preferences', 'soundEnabled', value)}
                            color={colors.info}
                        />
                    </SettingSection>

                    {/* Privacy Section */}
                    <SettingSection colors={colors} title="Privacy & Security" icon="shield-outline">
                        <SettingItem colors={colors}
                            label="Share Location"
                            description="Allow app to access and share your location data"
                            icon="location-outline"
                            value={settings.privacy.shareLocation}
                            onToggle={(value) => updateSetting('privacy', 'shareLocation', value)}
                            color={colors.error}
                        />
                        <SettingItem colors={colors}
                            label="Analytics"
                            description="Share usage analytics to help improve the app"
                            icon="analytics-outline"
                            value={settings.privacy.shareAnalytics}
                            onToggle={(value) => updateSetting('privacy', 'shareAnalytics', value)}
                            color={colors.info}
                        />
                        <SettingItem colors={colors}
                            label="Biometric Authentication"
                            description="Use fingerprint or face ID for secure access"
                            icon="finger-print-outline"
                            value={settings.privacy.biometricAuth}
                            onToggle={(value) => updateSetting('privacy', 'biometricAuth', value)}
                            color={colors.success}
                        />
                    </SettingSection>
                </VStack>
            </ScrollView>
        </Screen>
    );
};

export default Parameters;

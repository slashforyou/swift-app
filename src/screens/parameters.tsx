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
import { useTranslation } from '../localization/useLocalization';
import { clearSession } from '../utils/auth';
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
    const { t } = useTranslation();
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
                t('settings.alerts.biometricEnabled.title'), 
                t('settings.alerts.biometricEnabled.message'),
                [{ text: t('common.ok') }]
            );
        }
    };

    const resetSettings = () => {
        Alert.alert(
            t('settings.alerts.resetSettings.title'),
            t('settings.alerts.resetSettings.message'),
            [
                { text: t('settings.alerts.resetSettings.cancel'), style: "cancel" },
                { 
                    text: t('settings.alerts.resetSettings.confirm'), 
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
                        Alert.alert(t('settings.alerts.resetSuccess.title'), t('settings.alerts.resetSuccess.message'));
                    }
                }
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings.alerts.logout.title'),
            t('settings.alerts.logout.message'),
            [
                { text: t('settings.alerts.logout.cancel'), style: "cancel" },
                { 
                    text: t('settings.alerts.logout.confirm'), 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await clearSession();
                            // Navigate to login screen and reset navigation stack
                            navigation?.reset({
                                index: 0,
                                routes: [{ name: 'Connection' }],
                            });
                        } catch (error) {
                            console.error('[Logout] Error:', error);
                            Alert.alert(
                                t('common.error'),
                                t('settings.alerts.logout.error')
                            );
                        }
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
                        {t('settings.title')}
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
                    <SettingSection colors={colors} title={t('settings.sections.notifications')} icon="notifications-outline">
                        <SettingItem colors={colors}
                            label={t('settings.items.pushNotifications')}
                            description={t('settings.items.pushDescription')}
                            icon="phone-portrait-outline"
                            value={settings.notifications.pushNotifications}
                            onToggle={(value) => updateSetting('notifications', 'pushNotifications', value)}
                            color={colors.primary}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.emailNotifications')}
                            description={t('settings.items.emailDescription')}
                            icon="mail-outline"
                            value={settings.notifications.emailNotifications}
                            onToggle={(value) => updateSetting('notifications', 'emailNotifications', value)}
                            color={colors.info}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.smsNotifications')}
                            description={t('settings.items.smsDescription')}
                            icon="chatbox-outline"
                            value={settings.notifications.smsNotifications}
                            onToggle={(value) => updateSetting('notifications', 'smsNotifications', value)}
                            color={colors.warning}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.taskReminders')}
                            description={t('settings.items.taskRemindersDescription')}
                            icon="alarm-outline"
                            value={settings.notifications.taskReminders}
                            onToggle={(value) => updateSetting('notifications', 'taskReminders', value)}
                            color={colors.success}
                        />
                    </SettingSection>

                    {/* Preferences Section */}
                    <SettingSection colors={colors} title={t('settings.sections.preferences')} icon="options-outline">
                        <SettingItem colors={colors}
                            label={t('settings.items.darkMode')}
                            description={t('settings.items.darkModeDescription')}
                            icon="moon-outline"
                            value={settings.preferences.darkMode}
                            onToggle={(value) => updateSetting('preferences', 'darkMode', value)}
                            color={colors.textSecondary}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.autoSync')}
                            description={t('settings.items.autoSyncDescription')}
                            icon="sync-outline"
                            value={settings.preferences.autoSync}
                            onToggle={(value) => updateSetting('preferences', 'autoSync', value)}
                            color={colors.primary}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.offlineMode')}
                            description={t('settings.items.offlineModeDescription')}
                            icon="cloud-offline-outline"
                            value={settings.preferences.offlineMode}
                            onToggle={(value) => updateSetting('preferences', 'offlineMode', value)}
                            color={colors.warning}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.soundEnabled')}
                            description={t('settings.items.soundDescription')}
                            icon="volume-high-outline"
                            value={settings.preferences.soundEnabled}
                            onToggle={(value) => updateSetting('preferences', 'soundEnabled', value)}
                            color={colors.info}
                        />
                    </SettingSection>

                    {/* Privacy Section */}
                    <SettingSection colors={colors} title={t('settings.sections.privacy')} icon="shield-outline">
                        <SettingItem colors={colors}
                            label={t('settings.items.shareLocation')}
                            description={t('settings.items.shareLocationDescription')}
                            icon="location-outline"
                            value={settings.privacy.shareLocation}
                            onToggle={(value) => updateSetting('privacy', 'shareLocation', value)}
                            color={colors.error}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.analytics')}
                            description={t('settings.items.analyticsDescription')}
                            icon="analytics-outline"
                            value={settings.privacy.shareAnalytics}
                            onToggle={(value) => updateSetting('privacy', 'shareAnalytics', value)}
                            color={colors.info}
                        />
                        <SettingItem colors={colors}
                            label={t('settings.items.biometricEnabled')}
                            description={t('settings.items.biometricDescription')}
                            icon="finger-print-outline"
                            value={settings.privacy.biometricAuth}
                            onToggle={(value) => updateSetting('privacy', 'biometricAuth', value)}
                            color={colors.success}
                        />
                    </SettingSection>

                    {/* Account Section with Logout */}
                    <SettingSection colors={colors} title={t('settings.sections.account')} icon="person-outline">
                        <Pressable
                            onPress={handleLogout}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.errorLight : 'transparent',
                                borderRadius: DESIGN_TOKENS.radius.md,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                            })}
                        >
                            <HStack gap={DESIGN_TOKENS.spacing.md} align="center">
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: `${colors.error}15`,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Ionicons 
                                        name="log-out-outline" 
                                        size={22} 
                                        color={colors.error} 
                                    />
                                </View>
                                <VStack gap={2} style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                        fontWeight: '600',
                                        color: colors.error
                                    }}>
                                        {t('settings.items.logout')}
                                    </Text>
                                    <Text style={{
                                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                        color: colors.textSecondary
                                    }}>
                                        {t('settings.items.logoutDescription')}
                                    </Text>
                                </VStack>
                                <Ionicons 
                                    name="chevron-forward" 
                                    size={20} 
                                    color={colors.textSecondary} 
                                />
                            </HStack>
                        </Pressable>
                    </SettingSection>
                </VStack>
            </ScrollView>
        </Screen>
    );
};

export default Parameters;

/**
 * Parameters - Modern settings screen with design system centralisé
 * Architecture moderne avec toggles interactifs et persistence
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Switch, View } from 'react-native';

// Design System centralisé
import {
    Body,
    Button,
    Caption,
    Card,
    DESIGN_TOKENS,
    Screen,
    Title,
    useTheme
} from '../design-system/components';

// Hooks et utilitaires
import { useAuthCheck } from '../utils/checkAuth';

interface ParametersProps {
    navigation?: any;
}

interface AppSettings {
    notifications: {
        pushNotifications: boolean;
        emailNotifications: boolean;
        taskReminders: boolean;
        soundNotifications: boolean;
    };
    appearance: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        currency: string;
        fontSize: 'small' | 'medium' | 'large';
    };
    sound: {
        enabled: boolean;
        volume: number;
        vibration: boolean;
        notificationSound: string;
    };
    advanced: {
        autoBackup: boolean;
        dataUsage: boolean;
        sessionTimeout: number;
        developerMode: boolean;
    };
}

interface SettingSectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
}

interface SettingItemProps {
    label: string;
    description: string;
    icon: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    color?: string;
}

interface SettingPickerProps {
    label: string;
    description: string;
    icon: string;
    options: { label: string; value: string }[];
    selectedValue: string;
    onValueChange: (value: string) => void;
    color?: string;
}

const Parameters: React.FC<ParametersProps> = ({ navigation }) => {
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const { colors } = useTheme();
    
    const [settings, setSettings] = useState<AppSettings>({
        notifications: {
            pushNotifications: true,
            emailNotifications: false,
            taskReminders: true,
            soundNotifications: true,
        },
        appearance: {
            theme: 'auto',
            language: 'fr',
            currency: 'AUD',
            fontSize: 'medium',
        },
        sound: {
            enabled: true,
            volume: 75,
            vibration: true,
            notificationSound: 'default',
        },
        advanced: {
            autoBackup: true,
            dataUsage: false,
            sessionTimeout: 60,
            developerMode: false,
        },
    });

    const [showPickerModal, setShowPickerModal] = useState(false);
    const [pickerData, setPickerData] = useState<{
        title: string;
        options: { label: string; value: string }[];
        selectedValue: string;
        onSelect: (value: string) => void;
    } | null>(null);

    if (isLoading) {
        return LoadingComponent;
    }

    // Section Component
    const SettingSection: React.FC<SettingSectionProps> = ({ title, icon, children }) => (
        <Card variant="default" padding={DESIGN_TOKENS.spacing.lg} style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                marginBottom: DESIGN_TOKENS.spacing.md 
            }}>
                <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: DESIGN_TOKENS.spacing.md,
                }}>
                    <Ionicons name={icon as any} size={24} color={colors.primary} />
                </View>
                <Title>{title}</Title>
            </View>
            {children}
        </Card>
    );

    // Setting Item Component
    const SettingItem: React.FC<SettingItemProps> = ({ 
        label, 
        description, 
        icon, 
        value, 
        onToggle,
        color = colors.text
    }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        }}>
            <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${color}15`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: DESIGN_TOKENS.spacing.md,
            }}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            
            <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>
                    {label}
                </Body>
                <Caption style={{ color: colors.textSecondary }}>
                    {description}
                </Caption>
            </View>
            
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                thumbColor={value ? colors.primary : colors.textSecondary}
                ios_backgroundColor={colors.border}
            />
        </View>
    );

    // Setting Picker Component
    const SettingPicker: React.FC<SettingPickerProps> = ({ 
        label, 
        description, 
        icon, 
        options,
        selectedValue,
        onValueChange,
        color = colors.text
    }) => {
        const selectedOption = options.find(opt => opt.value === selectedValue);
        
        return (
            <Pressable
                onPress={() => {
                    setPickerData({
                        title: label,
                        options,
                        selectedValue,
                        onSelect: onValueChange,
                    });
                    setShowPickerModal(true);
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
            >
                <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${color}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: DESIGN_TOKENS.spacing.md,
                }}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                
                <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '600' }}>
                        {label}
                    </Body>
                    <Caption style={{ color: colors.textSecondary }}>
                        {description}
                    </Caption>
                    <Caption style={{ color: colors.primary, marginTop: 2 }}>
                        {selectedOption?.label}
                    </Caption>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
        );
    };

    // Options pour les pickers
    const themeOptions = [
        { label: 'Clair', value: 'light' },
        { label: 'Sombre', value: 'dark' },
        { label: 'Automatique', value: 'auto' },
    ];

    const languageOptions = [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
        { label: 'Deutsch', value: 'de' },
    ];

    const currencyOptions = [
        { label: 'Dollar Australien (AUD)', value: 'AUD' },
        { label: 'Euro (EUR)', value: 'EUR' },
        { label: 'Dollar Américain (USD)', value: 'USD' },
        { label: 'Livre Sterling (GBP)', value: 'GBP' },
    ];

    const fontSizeOptions = [
        { label: 'Petite', value: 'small' },
        { label: 'Normale', value: 'medium' },
        { label: 'Grande', value: 'large' },
    ];

    const notificationSoundOptions = [
        { label: 'Par défaut', value: 'default' },
        { label: 'Classique', value: 'classic' },
        { label: 'Moderne', value: 'modern' },
        { label: 'Discret', value: 'subtle' },
    ];

    const updateSetting = (category: keyof AppSettings, key: string, value: boolean | string | number) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const resetSettings = () => {
        Alert.alert(
            'Réinitialiser les paramètres',
            'Êtes-vous sûr de vouloir remettre tous les paramètres à leur valeur par défaut ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Réinitialiser', 
                    style: 'destructive',
                    onPress: () => {
                        setSettings({
                            notifications: {
                                pushNotifications: true,
                                emailNotifications: false,
                                taskReminders: true,
                                soundNotifications: true,
                            },
                            appearance: {
                                theme: 'auto',
                                language: 'fr',
                                currency: 'AUD',
                                fontSize: 'medium',
                            },
                            sound: {
                                enabled: true,
                                volume: 75,
                                vibration: true,
                                notificationSound: 'default',
                            },
                            advanced: {
                                autoBackup: true,
                                dataUsage: false,
                                sessionTimeout: 60,
                                developerMode: false,
                            },
                        });
                        Alert.alert('Succès', 'Les paramètres ont été réinitialisés');
                    }
                },
            ]
        );
    };

    return (
        <Screen variant="scroll" style={{ backgroundColor: colors.background }}>
            {/* Header avec bouton back */}
            <View style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.backgroundSecondary
            }}>
                <Pressable
                    onPress={() => navigation?.goBack()}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? colors.backgroundTertiary : 'transparent',
                        width: DESIGN_TOKENS.touch.minSize,
                        height: DESIGN_TOKENS.touch.minSize,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginRight: DESIGN_TOKENS.spacing.md,
                    })}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                
                <Title style={{ flex: 1 }}>
                    Paramètres
                </Title>
                
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
            </View>

            <View style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                {/* Section Notifications */}
                <SettingSection title="Notifications" icon="notifications">
                    <SettingItem
                        label="Notifications push"
                        description="Recevoir les notifications sur l'appareil"
                        icon="phone-portrait"
                        value={settings.notifications.pushNotifications}
                        onToggle={(value) => updateSetting('notifications', 'pushNotifications', value)}
                        color={colors.primary}
                    />
                    <SettingItem
                        label="Notifications email"
                        description="Recevoir les notifications par email"
                        icon="mail"
                        value={settings.notifications.emailNotifications}
                        onToggle={(value) => updateSetting('notifications', 'emailNotifications', value)}
                        color={colors.info}
                    />
                    <SettingItem
                        label="Rappels de tâches"
                        description="Notifications pour les échéances"
                        icon="alarm"
                        value={settings.notifications.taskReminders}
                        onToggle={(value) => updateSetting('notifications', 'taskReminders', value)}
                        color={colors.warning}
                    />
                    <SettingItem
                        label="Sons de notification"
                        description="Activer les sons pour les notifications"
                        icon="volume-high"
                        value={settings.notifications.soundNotifications}
                        onToggle={(value) => updateSetting('notifications', 'soundNotifications', value)}
                        color={colors.success}
                    />
                </SettingSection>

                {/* Section Apparence */}
                <SettingSection title="Apparence" icon="color-palette">
                    <SettingPicker
                        label="Thème"
                        description="Choisir l'apparence de l'application"
                        icon="contrast"
                        options={themeOptions}
                        selectedValue={settings.appearance.theme}
                        onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                        color={colors.primary}
                    />
                    <SettingPicker
                        label="Langue"
                        description="Langue de l'interface"
                        icon="language"
                        options={languageOptions}
                        selectedValue={settings.appearance.language}
                        onValueChange={(value) => updateSetting('appearance', 'language', value)}
                        color={colors.info}
                    />
                    <SettingPicker
                        label="Devise"
                        description="Devise par défaut pour les prix"
                        icon="card"
                        options={currencyOptions}
                        selectedValue={settings.appearance.currency}
                        onValueChange={(value) => updateSetting('appearance', 'currency', value)}
                        color={colors.success}
                    />
                    <SettingPicker
                        label="Taille du texte"
                        description="Ajuster la taille des textes"
                        icon="text"
                        options={fontSizeOptions}
                        selectedValue={settings.appearance.fontSize}
                        onValueChange={(value) => updateSetting('appearance', 'fontSize', value)}
                        color={colors.warning}
                    />
                </SettingSection>

                {/* Section Son & Vibration */}
                <SettingSection title="Son & Vibration" icon="musical-notes">
                    <SettingItem
                        label="Son activé"
                        description="Activer les sons dans l'application"
                        icon="volume-high"
                        value={settings.sound.enabled}
                        onToggle={(value) => updateSetting('sound', 'enabled', value)}
                        color={colors.primary}
                    />
                    <SettingItem
                        label="Vibration"
                        description="Feedback haptique lors des interactions"
                        icon="phone-portrait"
                        value={settings.sound.vibration}
                        onToggle={(value) => updateSetting('sound', 'vibration', value)}
                        color={colors.info}
                    />
                    <SettingPicker
                        label="Son de notification"
                        description="Choisir le son des notifications"
                        icon="musical-note"
                        options={notificationSoundOptions}
                        selectedValue={settings.sound.notificationSound}
                        onValueChange={(value) => updateSetting('sound', 'notificationSound', value)}
                        color={colors.success}
                    />
                </SettingSection>

                {/* Section Paramètres avancés */}
                <SettingSection title="Paramètres avancés" icon="settings">
                    <SettingItem
                        label="Sauvegarde automatique"
                        description="Sauvegarder les données automatiquement"
                        icon="cloud-upload"
                        value={settings.advanced.autoBackup}
                        onToggle={(value) => updateSetting('advanced', 'autoBackup', value)}
                        color={colors.primary}
                    />
                    <SettingItem
                        label="Suivi des données"
                        description="Autoriser la collecte de données d'usage"
                        icon="analytics"
                        value={settings.advanced.dataUsage}
                        onToggle={(value) => updateSetting('advanced', 'dataUsage', value)}
                        color={colors.warning}
                    />
                    <SettingItem
                        label="Mode développeur"
                        description="Afficher les options de débogage"
                        icon="code"
                        value={settings.advanced.developerMode}
                        onToggle={(value) => updateSetting('advanced', 'developerMode', value)}
                        color={colors.error}
                    />
                </SettingSection>
            </View>

            {/* Modal pour les pickers */}
            <Modal
                visible={showPickerModal}
                transparent
                animationType="slide"
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: colors.background,
                        borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
                        borderTopRightRadius: DESIGN_TOKENS.radius.xl,
                        padding: DESIGN_TOKENS.spacing.lg,
                        maxHeight: '70%',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: DESIGN_TOKENS.spacing.lg,
                        }}>
                            <Title>{pickerData?.title}</Title>
                            <Button
                                title="Fermer"
                                variant="ghost"
                                size="sm"
                                onPress={() => setShowPickerModal(false)}
                            />
                        </View>
                        
                        {pickerData?.options.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => {
                                    pickerData.onSelect(option.value);
                                    setShowPickerModal(false);
                                }}
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? colors.backgroundTertiary : 'transparent',
                                    padding: DESIGN_TOKENS.spacing.md,
                                    borderRadius: DESIGN_TOKENS.radius.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                })}
                            >
                                <Body>{option.label}</Body>
                                {pickerData.selectedValue === option.value && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

export default Parameters;
/**
 * Profile - Modern user profile screen with edit capabilities
 * Architecture moderne avec design system, Safe Areas et interface interactive
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VStack, HStack } from '../components/primitives/Stack';
import { Screen } from '../components/primitives/Screen';
import { useAuthCheck } from '../utils/checkAuth';
import { DESIGN_TOKENS } from '../constants/Styles';
import { Colors } from '../constants/Colors';

// Types et interfaces
interface ProfileProps {
    navigation?: any;
}

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    joinDate: string;
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: string;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (newValue: string) => void;
    onCancel: () => void;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

// Composant ProfileField moderne avec édition inline
const ProfileField: React.FC<ProfileFieldProps> = ({ 
    label, 
    value, 
    icon, 
    isEditing, 
    onEdit, 
    onSave, 
    onCancel,
    keyboardType = 'default'
}) => {
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditValue(value);
    }, [value, isEditing]);

    const handleSave = () => {
        if (editValue.trim()) {
            onSave(editValue.trim());
        } else {
            onCancel();
        }
    };

    return (
        <VStack
            gap="sm"
            style={{
                backgroundColor: Colors.light.backgroundSecondary,
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: isEditing ? Colors.light.primary : Colors.light.border,
            }}
        >
            <HStack gap="sm" align="center" justify="space-between">
                <HStack gap="sm" align="center" style={{ flex: 1 }}>
                    <Ionicons name={icon as any} size={20} color={Colors.light.primary} />
                    <Text
                        style={{
                            color: Colors.light.textSecondary,
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                        }}
                    >
                        {label}
                    </Text>
                </HStack>
                
                {!isEditing ? (
                    <Pressable
                        onPress={onEdit}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? Colors.light.primaryLight : 'transparent',
                            padding: DESIGN_TOKENS.spacing.xs,
                            borderRadius: DESIGN_TOKENS.radius.sm,
                        })}
                    >
                        <Ionicons name="pencil" size={16} color={Colors.light.primary} />
                    </Pressable>
                ) : (
                    <HStack gap="xs">
                        <Pressable
                            onPress={onCancel}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? Colors.light.errorLight : 'transparent',
                                padding: DESIGN_TOKENS.spacing.xs,
                                borderRadius: DESIGN_TOKENS.radius.sm,
                            })}
                        >
                            <Ionicons name="close" size={16} color={Colors.light.error} />
                        </Pressable>
                        <Pressable
                            onPress={handleSave}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? Colors.light.successLight : 'transparent',
                                padding: DESIGN_TOKENS.spacing.xs,
                                borderRadius: DESIGN_TOKENS.radius.sm,
                            })}
                        >
                            <Ionicons name="checkmark" size={16} color={Colors.light.success} />
                        </Pressable>
                    </HStack>
                )}
            </HStack>
            
            {isEditing ? (
                <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType={keyboardType}
                    autoFocus
                    style={{
                        backgroundColor: Colors.light.background,
                        borderWidth: 1,
                        borderColor: Colors.light.border,
                        borderRadius: DESIGN_TOKENS.radius.sm,
                        padding: DESIGN_TOKENS.spacing.sm,
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        color: Colors.light.text,
                        minHeight: DESIGN_TOKENS.touch.minSize,
                    }}
                    onSubmitEditing={handleSave}
                />
            ) : (
                <Text
                    style={{
                        color: Colors.light.text,
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                        fontWeight: '500',
                    }}
                >
                    {value}
                </Text>
            )}
        </VStack>
    );
};

const Profile: React.FC<ProfileProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isLoading, LoadingComponent } = useAuthCheck(navigation);
    const [user, setUser] = useState<UserProfile>({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        role: "Field Technician",
        joinDate: "January 2023"
    });
    const [editingField, setEditingField] = useState<string | null>(null);

    if (isLoading) return LoadingComponent;

    const handleEdit = (field: string) => {
        setEditingField(field);
    };

    const handleSave = (field: keyof UserProfile, value: string) => {
        setUser(prev => ({ ...prev, [field]: value }));
        setEditingField(null);
        
        // Show success message
        Alert.alert(
            "Profile Updated", 
            `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated successfully.`,
            [{ text: "OK" }]
        );
    };

    const handleCancel = () => {
        setEditingField(null);
    };

    return (
        <Screen>
            {/* Simple Back Button Header */}
            <View style={{ 
                paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingBottom: DESIGN_TOKENS.spacing.sm,
                backgroundColor: Colors.light.background,
            }}>
                <Pressable
                    onPress={() => navigation?.goBack()}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? Colors.light.backgroundTertiary : Colors.light.backgroundSecondary,
                        width: DESIGN_TOKENS.touch.minSize,
                        height: DESIGN_TOKENS.touch.minSize,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: Colors.light.border,
                    })}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </Pressable>
            </View>

            {/* Contenu principal */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: DESIGN_TOKENS.spacing.lg,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
                }}
            >
                <VStack gap="xl">
                    {/* Profile Header */}
                    <VStack
                        gap="lg"
                        align="center"
                        style={{
                            backgroundColor: Colors.light.primary,
                            padding: DESIGN_TOKENS.spacing.xl,
                            borderRadius: DESIGN_TOKENS.radius.lg,
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
                        {/* Avatar */}
                        <View
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 3,
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <Ionicons name="person" size={40} color="white" />
                        </View>
                        
                        {/* Name and Role */}
                        <VStack gap="xs" align="center">
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: DESIGN_TOKENS.typography.title.fontSize,
                                    lineHeight: DESIGN_TOKENS.typography.title.lineHeight,
                                    fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
                                    textAlign: 'center',
                                }}
                            >
                                {user.firstName} {user.lastName}
                            </Text>
                            <Text
                                style={{
                                    color: "rgba(255, 255, 255, 0.8)",
                                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                    textAlign: 'center',
                                }}
                            >
                                {user.role}
                            </Text>
                            <HStack gap="xs" align="center">
                                <Ionicons name="calendar" size={14} color="rgba(255, 255, 255, 0.7)" />
                                <Text
                                    style={{
                                        color: "rgba(255, 255, 255, 0.7)",
                                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                                    }}
                                >
                                    Joined {user.joinDate}
                                </Text>
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Profile Information */}
                    <VStack gap="md">
                        <Text
                            style={{
                                color: Colors.light.text,
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            Personal Information
                        </Text>

                        <ProfileField
                            label="First Name"
                            value={user.firstName}
                            icon="person-outline"
                            isEditing={editingField === 'firstName'}
                            onEdit={() => handleEdit('firstName')}
                            onSave={(value) => handleSave('firstName', value)}
                            onCancel={handleCancel}
                        />

                        <ProfileField
                            label="Last Name"
                            value={user.lastName}
                            icon="person-outline"
                            isEditing={editingField === 'lastName'}
                            onEdit={() => handleEdit('lastName')}
                            onSave={(value) => handleSave('lastName', value)}
                            onCancel={handleCancel}
                        />

                        <ProfileField
                            label="Email Address"
                            value={user.email}
                            icon="mail-outline"
                            isEditing={editingField === 'email'}
                            onEdit={() => handleEdit('email')}
                            onSave={(value) => handleSave('email', value)}
                            onCancel={handleCancel}
                            keyboardType="email-address"
                        />

                        <ProfileField
                            label="Phone Number"
                            value={user.phone}
                            icon="call-outline"
                            isEditing={editingField === 'phone'}
                            onEdit={() => handleEdit('phone')}
                            onSave={(value) => handleSave('phone', value)}
                            onCancel={handleCancel}
                            keyboardType="phone-pad"
                        />

                        <ProfileField
                            label="Role"
                            value={user.role}
                            icon="briefcase-outline"
                            isEditing={editingField === 'role'}
                            onEdit={() => handleEdit('role')}
                            onSave={(value) => handleSave('role', value)}
                            onCancel={handleCancel}
                        />
                    </VStack>

                    {/* Actions */}
                    <VStack gap="sm">
                        <Pressable
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? Colors.light.errorLight : Colors.light.error,
                                paddingVertical: DESIGN_TOKENS.spacing.md,
                                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                minHeight: DESIGN_TOKENS.touch.minSize,
                            })}
                            onPress={() => {
                                Alert.alert(
                                    "Sign Out",
                                    "Are you sure you want to sign out?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Sign Out", style: "destructive", onPress: () => navigation?.navigate('Connection') }
                                    ]
                                );
                            }}
                        >
                            <HStack gap="sm" align="center" justify="center">
                                <Ionicons name="log-out-outline" size={20} color="white" />
                                <Text
                                    style={{
                                        color: "white",
                                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                                        fontWeight: '600',
                                    }}
                                >
                                    Sign Out
                                </Text>
                            </HStack>
                        </Pressable>
                    </VStack>
                </VStack>
            </ScrollView>
        </Screen>
    );
};

export default Profile;

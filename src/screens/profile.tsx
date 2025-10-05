// The profile screen displays user profile information and allows editing.
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopMenu from '../components/top_menu/top_menu';
import { ensureSession } from '../utils/session';
import { useThemedStyles, useThemeColors } from '../../hooks/useThemeColor';
import { Colors } from '../constants/Colors';

const Profile = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
    });

    // Use themed styles
    const styles = useThemedStyles(createStyles);
    const colors = useThemeColors();

    useEffect(() => {
            const checkSession = async () => {
                const userLoggedIn = await ensureSession();
                if (!userLoggedIn || userLoggedIn.authenticated === false) {
                    (navigation as any).navigate('Connection');
                }
            };
            checkSession();
    }, [navigation]);

    return (
        <View style={styles.profileContainer}>
            <TopMenu navigation={navigation} />
            <ScrollView style={styles.profileContainerScroll} contentContainerStyle={styles.profileContainerScrollContent}>
                <View style={styles.profilePicture}>
                    <Text style={styles.profilePictureTitle}>Profile</Text>
                    <View style={styles.profilePictureImage}>
                        <Text style={styles.placeholderText}>Image Placeholder</Text>
                    </View>
                    <Text style={styles.profileName}>
                        {user.firstName} {user.lastName}
                    </Text>
                    {/* TODO : Progress bar with level of the employee/worker */}
                </View>
                <View style={styles.profileDetails}>
                    <View style={styles.profileDetailsItem}>
                        <Text style={styles.profileDetailsItemText}>First Name:</Text>
                        <Text style={styles.profileDetailsItemValue}>{user.firstName}</Text>
                        <Pressable style={styles.profileDetailsItemButton}>
                            <Text style={styles.profileDetailsItemButtonText}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={styles.profileDetailsItem}>
                        <Text style={styles.profileDetailsItemText}>Last Name:</Text>
                        <Text style={styles.profileDetailsItemValue}>{user.lastName}</Text>
                        <Pressable style={styles.profileDetailsItemButton}>
                            <Text style={styles.profileDetailsItemButtonText}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={styles.profileDetailsItem}>
                        <Text style={styles.profileDetailsItemText}>Email:</Text>
                        <Text style={styles.profileDetailsItemValue}>{user.email}</Text>
                        <Pressable style={styles.profileDetailsItemButton}>
                            <Text style={styles.profileDetailsItemButtonText}>Edit</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// Themed styles function
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    profileContainer: {
        flex: 1,
        backgroundColor: colors.background,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    profileContainerScroll: {
        width: '100%',
        flex: 1,
        marginTop: 80,
    },
    profileContainerScrollContent: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    profilePicture: {
        width: '100%',
        padding: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    profilePictureTitle: {
        fontSize: 20,
        color: colors.buttonPrimaryText,
        marginBottom: 10,
        width: '100%',
        textAlign: 'left',
    },
    profilePictureImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    placeholderText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.buttonPrimaryText,
        marginBottom: 10,
        letterSpacing: 1,
        textAlign: 'center',
        width: '100%',
    },
    profileDetails: {
        width: '95%',
        padding: 20,
        backgroundColor: colors.inputBackground,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 10,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
        marginTop: 20,
    },
    profileDetailsItem: {
        width: '100%',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileDetailsItemText: {
        fontSize: 16,
        color: colors.text,
        flex: 1,
    },
    profileDetailsItemValue: {
        fontSize: 16,
        color: colors.textSecondary,
        flex: 2,
    },
    profileDetailsItemButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: colors.buttonPrimary,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileDetailsItemButtonText: {
        color: colors.buttonPrimaryText,
        fontSize: 14,
    },
});

export default Profile;

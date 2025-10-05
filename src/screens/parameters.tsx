// The parameters screen allows users to view and edit their settings.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import TopMenu from '../components/top_menu/top_menu';
import { useNavigation } from '@react-navigation/native';
import { ensureSession } from '../utils/session';
import { useThemedStyles, useThemeColors } from '../../hooks/useThemeColor';
import { Colors } from '../constants/Colors';

const Parameters = () => {
    const navigation = useNavigation();
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
        <View style={styles.parametersContainer}>
            <TopMenu navigation={navigation} />
            <ScrollView style={styles.parametersContainerScroll} contentContainerStyle={styles.parametersContainerScrollContent}>
                <Text style={styles.parametersTitle}>Settings</Text>
                <View style={styles.parametersItem}>
                    <Text style={styles.itemText}>Notification Settings</Text>
                    {/* Add notification settings options here */}
                </View>
                <View style={styles.parametersItem}>
                    <Text style={styles.itemText}>Privacy Settings</Text>
                    {/* Add privacy settings options here */}
                </View>
                <View style={styles.parametersItem}>
                    <Text style={styles.itemText}>Account Settings</Text>
                    {/* Add account settings options here */}
                </View>
                <Pressable onPress={() => navigation.goBack()} style={styles.parametersBackButton}>
                    <Text style={styles.parametersBackButtonText}>Go Back</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

// Themed styles function
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    parametersContainer: {
        flex: 1,
        backgroundColor: colors.background,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    parametersContainerScroll: {
        width: '100%',
        flex: 1,
        marginTop: 80,
    },
    parametersContainerScrollContent: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    parametersTitle: {
        fontSize: 20,
        color: colors.text,
        marginBottom: 10,
        width: '100%',
        textAlign: 'left',
        paddingHorizontal: 20,
        fontWeight: 'bold',
    },
    parametersItem: {
        width: '95%',
        padding: 20,
        backgroundColor: colors.inputBackground,
        borderRadius: 10,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    parametersBackButton: {
        backgroundColor: colors.buttonPrimary,
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        width: '95%',
        alignItems: 'center',
    },
    parametersBackButtonText: {
        color: colors.buttonPrimaryText,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Parameters;

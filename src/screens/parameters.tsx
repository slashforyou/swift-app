// The parameters screen allows users to view and edit their settings.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import TopMenu from '../components/top_menu/top_menu';
import { useNavigation } from '@react-navigation/native';
import { ensureSession } from '../utils/session';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';

const Parameters = () => {
    const navigation = useNavigation();
    const { colors, styles } = useCommonThemedStyles();

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
        <SafeAreaView style={styles.container}>
            <TopMenu navigation={navigation} />
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.padding16}>
                <Text style={[styles.h2, styles.marginBottom]}>Settings</Text>
                
                <View style={[styles.card, styles.marginBottom]}>
                    <View style={styles.listItem}>
                        <Text style={styles.listItemTitle}>Notification Settings</Text>
                        {/* Add notification settings options here */}
                    </View>
                    
                    <View style={styles.listItem}>
                        <Text style={styles.listItemTitle}>Privacy Settings</Text>
                        {/* Add privacy settings options here */}
                    </View>
                    
                    <View style={styles.listItem}>
                        <Text style={styles.listItemTitle}>Account Settings</Text>
                        {/* Add account settings options here */}
                    </View>
                </View>
                
                <Pressable onPress={() => navigation.goBack()} style={styles.buttonPrimary}>
                    <Text style={styles.buttonPrimaryText}>Go Back</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

// Parameters migré vers le système de styles communs

export default Parameters;

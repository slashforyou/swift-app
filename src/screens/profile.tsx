// The profile screen displays user profile information and allows editing.
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopMenu from '../components/top_menu/top_menu';
import { ensureSession } from '../utils/session';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';

const Profile = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
    });

    // Use common themed styles
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
                {/* Profile Header */}
                <View style={[styles.card, styles.itemsCenter, styles.marginBottom, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.h2, { color: colors.backgroundTertiary }]}>Profile</Text>
                    <View style={[
                        { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginVertical: 16 }
                    ]}>
                        <Text style={[styles.body, { color: colors.textMuted }]}>Image Placeholder</Text>
                    </View>
                    <Text style={[styles.h3, { color: colors.backgroundTertiary }]}>
                        {user.firstName} {user.lastName}
                    </Text>
                </View>
                
                {/* Profile Details */}
                <View style={styles.card}>
                    <View style={[styles.listItem, styles.marginBottom]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listItemTitle}>First Name:</Text>
                            <Text style={styles.listItemSubtitle}>{user.firstName}</Text>
                        </View>
                        <Pressable style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.body, { color: colors.primary }]}>Edit</Text>
                        </Pressable>
                    </View>
                    
                    <View style={[styles.listItem, styles.marginBottom]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listItemTitle}>Last Name:</Text>
                            <Text style={styles.listItemSubtitle}>{user.lastName}</Text>
                        </View>
                        <Pressable style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.body, { color: colors.primary }]}>Edit</Text>
                        </Pressable>
                    </View>
                    
                    <View style={styles.listItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listItemTitle}>Email:</Text>
                            <Text style={styles.listItemSubtitle}>{user.email}</Text>
                        </View>
                        <Pressable style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}>
                            <Text style={[styles.body, { color: colors.primary }]}>Edit</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Profile migré vers le système de styles communs

export default Profile;
